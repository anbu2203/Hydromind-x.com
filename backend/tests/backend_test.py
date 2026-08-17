"""HydroMind-X backend API tests."""
import os
import json
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback: read frontend/.env
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = ln.split("=", 1)[1].strip()
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


# ---- Root ----
def test_root_online():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "online" in data.get("message", "").lower()
    assert "motto" in data


# ---- Chat SSE streaming ----
def test_chat_sse_streaming_and_history():
    session_id = f"TEST_{uuid.uuid4().hex[:8]}"
    payload = {"session_id": session_id, "message": "What is HydroMind-X in one sentence?"}
    r = requests.post(f"{API}/chat", json=payload, stream=True, timeout=90)
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")

    deltas = []
    done = False
    err = None
    for raw in r.iter_lines(decode_unicode=True):
        if not raw:
            continue
        if not raw.startswith("data: "):
            continue
        payload_obj = json.loads(raw[6:])
        if "delta" in payload_obj:
            deltas.append(payload_obj["delta"])
        elif payload_obj.get("done"):
            done = True
            break
        elif "error" in payload_obj:
            err = payload_obj["error"]
            break
    assert err is None, f"Stream returned error: {err}"
    assert done, "Stream did not emit done:true"
    full = "".join(deltas)
    assert len(full) > 20, f"Response too short: {full!r}"
    # Grounded-ish: expect it to mention hydromind or water
    low = full.lower()
    assert ("hydromind" in low) or ("water" in low), f"Response not grounded: {full!r}"

    # History
    time.sleep(1)
    hr = requests.get(f"{API}/chat/history/{session_id}", timeout=15)
    assert hr.status_code == 200
    msgs = hr.json()
    roles = [m["role"] for m in msgs]
    assert "user" in roles and "assistant" in roles
    assert any(m["content"] == payload["message"] for m in msgs if m["role"] == "user")
    assistant_msgs = [m for m in msgs if m["role"] == "assistant" and m["content"]]
    assert assistant_msgs, "No assistant message persisted"


# ---- Audit report ----
def _snapshot():
    return {
        "inputs": {
            "temperature": 26, "humidity": 60, "waterLevel": 70,
            "waterFlow": 120, "reservoir": 75, "coolingDemand": 45,
            "weather": "Clear",
        },
        "wai": 72,
        "band": "Good",
        "cooling_strategy": "Optimized Cooling",
        "water_action": "Improve efficiency and begin water recycling",
        "allowed_workloads": ["Hospitals", "Banking Systems"],
    }


def test_audit_report_create_and_list_increment():
    r1 = requests.post(f"{API}/audit/report", json=_snapshot(), timeout=20)
    assert r1.status_code == 200, r1.text
    d1 = r1.json()
    assert d1["report_no"].startswith("HMX-") and len(d1["report_no"]) == 9
    assert "timestamp" in d1
    n1 = int(d1["report_no"].split("-")[1])

    r2 = requests.post(f"{API}/audit/report", json=_snapshot(), timeout=20)
    assert r2.status_code == 200
    d2 = r2.json()
    n2 = int(d2["report_no"].split("-")[1])
    assert n2 == n1 + 1, f"report_no did not increment: {d1['report_no']} -> {d2['report_no']}"

    # List newest first
    lst = requests.get(f"{API}/audit/report", timeout=20)
    assert lst.status_code == 200
    arr = lst.json()
    assert isinstance(arr, list) and len(arr) >= 2
    ts = [x["timestamp"] for x in arr]
    assert ts == sorted(ts, reverse=True), "reports are not sorted newest first"
    # newest report id matches d2
    assert arr[0]["report_no"] == d2["report_no"]
    # no _id leaks
    assert "_id" not in arr[0]


# ---- Forecast advisory ----
def test_forecast_advisory_returns_text():
    payload = {"today_wai": 72, "tomorrow_wai": 45, "tomorrow_band": "Moderate", "weather": "Hot & Dry"}
    r = requests.post(f"{API}/forecast/advisory", json=payload, timeout=60)
    assert r.status_code == 200
    data = r.json()
    assert "advisory" in data
    assert isinstance(data["advisory"], str) and len(data["advisory"]) > 20
    assert "unavailable" not in data["advisory"].lower()


# ---- Chat grounding: founder ----
def _run_chat(msg, session_id=None):
    session_id = session_id or f"TEST_{uuid.uuid4().hex[:8]}"
    r = requests.post(f"{API}/chat", json={"session_id": session_id, "message": msg}, stream=True, timeout=90)
    assert r.status_code == 200
    text = ""
    for raw in r.iter_lines(decode_unicode=True):
        if not raw or not raw.startswith("data: "):
            continue
        obj = json.loads(raw[6:])
        if "delta" in obj:
            text += obj["delta"]
        elif obj.get("done"):
            break
        elif "error" in obj:
            pytest.fail(f"stream error: {obj['error']}")
    return text


def test_chat_grounding_founder():
    text = _run_chat("Who is the founder of HydroMind-X?")
    assert "Anbumathi" in text, f"founder answer missing name: {text!r}"


def test_chat_grounding_team_roster():
    text = _run_chat("Who is team AquaNova Trinity? List all members.")
    low = text.lower()
    assert "anbumathi" in low
    assert "shrenik" in low
    assert "thamseel" in low


def test_chat_grounding_researcher():
    text = _run_chat("Who is the researcher on the team?")
    assert "Shrenik" in text, f"researcher answer wrong: {text!r}"
