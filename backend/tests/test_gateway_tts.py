"""Backend tests for HydroMind-X Drop-in Gateway + OpenAI TTS narration."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://repo-viewer-83.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
DEMO_KEY = "hmx_demo_key"


@pytest.fixture(scope="module")
def sess():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Gateway API ----------------

class TestGateway:
    def test_allow_at_high_wai(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": DEMO_KEY},
                      json={"prompt": "What is 2+2?", "wai": 90}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert d["decision"] == "allow"
        assert d["band"] == "Excellent"
        assert d["completion"] and len(d["completion"]) > 0
        assert d["tier"] in ("Critical", "Important", "Flexible")
        assert isinstance(d["min_wai"], int)
        assert "model" in d and "latency_ms" in d

    def test_defer_flexible_at_low_wai(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": DEMO_KEY},
                      json={"prompt": "Tell me a joke", "tier": "Flexible", "wai": 25}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert d["decision"] == "defer"
        assert d["completion"] is None
        assert d["retry_when_wai_gte"] == 61
        assert d["water_saved_ml"] > 0

    def test_critical_never_defers(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": DEMO_KEY},
                      json={"prompt": "Patient not breathing, what now?", "tier": "Critical", "wai": 10}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert d["decision"] == "allow"
        assert d["completion"]

    def test_auto_classify_emergency_is_critical(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": DEMO_KEY},
                      json={"prompt": "Hospital ER: patient collapsed with no pulse, immediate CPR guidance needed", "wai": 15}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert d["tier"] == "Critical", f"Expected Critical, got {d['tier']}"
        assert d["decision"] == "allow"

    def test_invalid_key(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": "bogus"},
                      json={"prompt": "hi", "wai": 90}, timeout=30)
        assert r.status_code == 401, f"Expected 401 for bogus key, got {r.status_code}: {r.text[:200]}"

    def test_no_key_still_works(self, sess):
        r = sess.post(f"{API}/gateway/v1/complete",
                      json={"prompt": "What is water?", "wai": 90}, timeout=90)
        assert r.status_code == 200
        d = r.json()
        assert "decision" in d
        assert d.get("error") != "invalid_key"

    def test_stats_increments(self, sess):
        before = sess.get(f"{API}/gateway/v1/stats", timeout=30).json()
        r = sess.post(f"{API}/gateway/v1/complete",
                      headers={"X-HydroMind-Key": DEMO_KEY},
                      json={"prompt": "Tell me a joke about oceans", "tier": "Flexible", "wai": 25}, timeout=60)
        assert r.status_code == 200
        after = sess.get(f"{API}/gateway/v1/stats", timeout=30).json()
        for k in ("total_requests", "allowed", "deferred", "by_tier", "water_saved_ml"):
            assert k in after
        assert after["total_requests"] >= before["total_requests"] + 1
        assert after["deferred"] >= before["deferred"] + 1


# ---------------- TTS narration ----------------

class TestTTS:
    def test_narrate_and_cache(self, sess):
        text = "Water is healthy."
        t0 = time.time()
        r1 = sess.post(f"{API}/tts/narrate", json={"text": text}, timeout=60)
        t1 = time.time() - t0
        assert r1.status_code == 200
        d1 = r1.json()
        assert "url" in d1 and d1["url"].startswith("/api/tts/") and d1["url"].endswith(".mp3")

        # fetch mp3
        audio = sess.get(f"{BASE_URL}{d1['url']}", timeout=30)
        assert audio.status_code == 200
        assert "audio/mpeg" in audio.headers.get("Content-Type", "")
        assert len(audio.content) > 5000, f"audio too small: {len(audio.content)} bytes"

        # cache hit - same URL, fast
        t0 = time.time()
        r2 = sess.post(f"{API}/tts/narrate", json={"text": text}, timeout=30)
        t2 = time.time() - t0
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["url"] == d1["url"]
        print(f"first={t1:.2f}s cached={t2:.2f}s")

    def test_404_missing_audio(self, sess):
        r = sess.get(f"{API}/tts/deadbeefdeadbeefdeadbeef.mp3", timeout=30)
        assert r.status_code == 404

    def test_nova_voice_model_cache_key(self, sess):
        """Same text, different model -> different cache URL. Both fetch OK."""
        text = "Nova voice test for HydroMind-X."
        r_std = sess.post(f"{API}/tts/narrate",
                          json={"text": text, "voice": "nova", "model": "tts-1"}, timeout=60)
        assert r_std.status_code == 200
        url_std = r_std.json()["url"]

        r_hd = sess.post(f"{API}/tts/narrate",
                         json={"text": text, "voice": "nova", "model": "tts-1-hd"}, timeout=60)
        assert r_hd.status_code == 200
        url_hd = r_hd.json()["url"]

        assert url_std != url_hd, f"model must be part of cache key: {url_std} vs {url_hd}"

        for u in (url_std, url_hd):
            a = sess.get(f"{BASE_URL}{u}", timeout=30)
            assert a.status_code == 200
            assert "audio/mpeg" in a.headers.get("Content-Type", "")
            assert len(a.content) > 5000

    def test_invalid_model_falls_back(self, sess):
        """model='tts-9' must NOT error - should fall back to tts-1."""
        text = "Fallback model check."
        r_bad = sess.post(f"{API}/tts/narrate",
                          json={"text": text, "voice": "nova", "model": "tts-9"}, timeout=60)
        assert r_bad.status_code == 200, r_bad.text[:200]
        url_bad = r_bad.json()["url"]

        r_good = sess.post(f"{API}/tts/narrate",
                           json={"text": text, "voice": "nova", "model": "tts-1"}, timeout=60)
        assert r_good.status_code == 200
        # fallback should produce identical cache key to tts-1
        assert url_bad == r_good.json()["url"]

    def test_tamil_script_narration(self, sess):
        """Tamil text with model tts-1-hd must be accepted and return >5KB mp3."""
        tamil = "வணக்கம் நடுவர்களே, ஹைட்ரோமைண்ட்-எக்ஸ் தண்ணீரை சேமிக்கிறது."
        r = sess.post(f"{API}/tts/narrate",
                      json={"text": tamil, "voice": "nova", "model": "tts-1-hd"}, timeout=90)
        assert r.status_code == 200, r.text[:300]
        url = r.json()["url"]
        a = sess.get(f"{BASE_URL}{url}", timeout=30)
        assert a.status_code == 200
        assert "audio/mpeg" in a.headers.get("Content-Type", "")
        assert len(a.content) > 5000
