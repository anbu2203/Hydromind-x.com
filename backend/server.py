from fastapi import FastAPI, APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import hashlib
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
from emergentintegrations.llm.openai import OpenAITextToSpeech

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ---------------- HydroMind-X knowledge base for the assistant ----------------
SYSTEM_PROMPT = """You are HYDRA, the onboard AI assistant for HydroMind-X — an AI-Driven Water Intelligence System for Sustainable Data Centers, built by team AquaNova Trinity. Tagline: "Making AI Think Before It Drinks." Your motto: "Every AI decision should consider every drop of water."

HydroMind-X was created by Anbumathi Chezhian (the founder). If anyone asks who the founder, creator, or maker of HydroMind-X is, answer clearly that it is Anbumathi Chezhian.

=== TEAM AQUANOVA TRINITY ===
If anyone asks about "team AquaNova Trinity" (or the team members), list all three members with their roles:
- Researcher: Shrenik (Co-Founder)
- Media File Manager: Thamseel Ahmed (Co-Founder)
- Software Technical Designer: Anbumathi Chezhian (Founder)
If a specific role is asked, respond with just that person:
- The Researcher is Shrenik (Co-Founder).
- The Media File Manager is Thamseel Ahmed (Co-Founder).
- The Software Technical Designer is Anbumathi Chezhian (Founder).
The founder/creator of HydroMind-X remains Anbumathi Chezhian.

Answer clearly, confidently and concisely (2-5 short paragraphs or tight bullet points). You are pitching to investors (Shark Tank style) and answering technical judges, so be persuasive but accurate.

You are a helpful, knowledgeable general-purpose AI assistant: answer ANY question the user asks — general knowledge, science, math, coding, current concepts, everyday questions, etc. — to the best of your ability, just like a capable assistant would. Never refuse a question simply because it is unrelated to HydroMind-X.

At the same time, you are the expert on HydroMind-X: when a question is about HydroMind-X, its features, the Water Availability Index, cooling strategies, workloads, the team, or the founder, answer precisely and authoritatively using the knowledge below. If a general topic connects naturally to HydroMind-X, water sustainability, data-center cooling, or climate, feel free to briefly bridge to it — but only when relevant, never force it.

=== WHAT HYDROMIND-X IS ===
An AI-assisted water management and continuous auditing platform for data centers. It continuously monitors water availability, temperature, humidity, reservoir conditions, water levels, water flow, cooling demand, and weather forecasts. From this it computes a Water Availability Index (WAI, 0-100) and recommends actions: the most efficient cooling method, when to increase water recycling, which workloads to prioritize, which non-essential tasks to delay during water stress, and it generates real-time water audit reports. A hardware prototype uses an ESP32 microcontroller with sensors.

=== THE PROBLEM ===
AI data centers generate huge heat and rely on water-hungry cooling. Meanwhile climate change reduces freshwater and worsens droughts. Data centers today optimize for energy, performance and cost — but rarely for WATER availability. Result: freshwater wasted during scarcity, audits are periodic not continuous, cooling doesn't adapt, and communities/ecosystems face pressure.

=== WATER AVAILABILITY INDEX (WAI) DECISION LOGIC ===
- 81-100 (Excellent): All workloads (Critical, Important, Flexible). Cooling = Normal Liquid Cooling. Action = Continue normal operation.
- 61-80 (Good): All workloads. Cooling = Optimized Cooling. Action = Improve efficiency and begin water recycling.
- 41-60 (Moderate): Critical & Important only. Cooling = Hybrid Cooling. Action = Reduce water consumption and postpone some flexible tasks.
- 21-40 (Low): Critical only. Cooling = Dry/Hybrid Cooling. Action = Maximize recycled water use and issue alerts.
- 0-20 (Critical): Emergency services only. Cooling = Emergency Cooling. Action = Suspend non-essential operations and conserve water.

=== AI WORKLOAD CLASSIFICATION ===
- Critical (always allowed): Hospitals, Emergency Response, Disaster Warning, Cybersecurity.
- Important (allowed unless severe scarcity): Banking, Educational Platforms, Government Services, Communication Networks.
- Flexible (can be delayed during water stress): AI Model Training, Video Rendering, Data Analytics, Backup Processing.

=== INNOVATION ===
Continuous Water Auditing, IoT-based Environmental Monitoring, the WAI, Predictive Water-Risk Analysis, Adaptive Cooling Recommendations, AI-Assisted Workload Prioritization, and a Sustainability Dashboard — combined into one decision-support system, not just a monitor.

=== COOLING STRATEGIES (how cooling is done) ===
- Normal Liquid Cooling: coolant/water loop through cold plates & heat exchangers to a cooling tower; highest water use, best when water is plentiful.
- Optimized Cooling: same loop tuned for efficiency (variable pumps/fans), starts recycling condensate/greywater.
- Hybrid Cooling: mixes liquid loops with air/dry coolers to cut evaporative water loss; postpones flexible workloads.
- Dry/Hybrid Cooling: mostly air-side/dry coolers, minimal freshwater, maximizes recycled water; only critical workloads.
- Emergency Cooling: closed-loop/dry emergency mode, freshwater draw suspended, only emergency workloads kept alive.

=== BENEFITS / IMPACT ===
Reduces freshwater use, improves transparency, supports sustainable AI infrastructure, promotes recycling and responsible resource management, and enables real-time informed decisions. Supports SDG 6 (Clean Water), 9 (Industry & Infrastructure), 11 (Sustainable Cities), 12 (Responsible Consumption), 13 (Climate Action).

=== ROADMAP ===
Phase 1: Smart Water Auditing, Real-Time Monitoring, Environmental Data Collection.
Phase 2: Weather Forecast Integration, Digital Twin, Multi-Site Monitoring.
Phase 3: AI Water Demand Prediction, Automated Water-Recycling Management, Advanced Decision Support.
Phase 4: Expand to Smart Cities, Hospitals, Universities, Factories, Commercial Buildings, Industrial Campuses.
"""


class ChatRequest(BaseModel):
    session_id: str
    message: str


class AuditSnapshot(BaseModel):
    inputs: dict
    wai: int
    band: str
    cooling_strategy: str
    water_action: str
    allowed_workloads: List[str]


class AuditReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_no: str
    timestamp: str
    inputs: dict
    wai: int
    band: str
    cooling_strategy: str
    water_action: str
    allowed_workloads: List[str]


def _friendly_llm_error(e: Exception) -> str:
    msg = str(e)
    if "Budget has been exceeded" in msg or "RateLimitError" in msg:
        return (
            "AI credits exhausted. HydroMind-X could not reach the model because the "
            "Universal LLM key has run out of budget. Add balance under "
            "Profile \u2192 Manage plan \u2192 Universal Key \u2192 Add Balance, then retry."
        )
    return f"AI service error: {msg}"


@api_router.get("/")
async def root():
    return {"message": "HydroMind-X API online", "motto": "Every AI decision should consider every drop of water."}


@api_router.post("/chat")
async def chat(req: ChatRequest):
    await db.chat_messages.insert_one({
        "session_id": req.session_id,
        "role": "user",
        "content": req.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    chat_client = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=req.session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")

    async def event_generator():
        full = ""
        try:
            async for event in chat_client.stream_message(UserMessage(text=req.message)):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            logger.exception("chat stream error")
            yield f"data: {json.dumps({'error': _friendly_llm_error(e)})}\n\n"
        await db.chat_messages.insert_one({
            "session_id": req.session_id,
            "role": "assistant",
            "content": full,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/chat/history/{session_id}")
async def chat_history(session_id: str):
    msgs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).to_list(500)
    return msgs


class ForecastRequest(BaseModel):
    today_wai: int
    tomorrow_wai: int
    tomorrow_band: str
    weather: str


@api_router.post("/forecast/advisory")
async def forecast_advisory(req: ForecastRequest):
    trend = "worsen" if req.tomorrow_wai < req.today_wai else ("improve" if req.tomorrow_wai > req.today_wai else "hold steady")
    prompt = (
        f"You are HYDRA forecasting data-center water risk. Today's Water Availability Index (WAI) is {req.today_wai}. "
        f"With the '{req.weather}' forecast, tomorrow's WAI is predicted to {trend} to {req.tomorrow_wai} "
        f"({req.tomorrow_band} band). In no more than 2 short, punchy sentences, give a proactive pre-warning and ONE concrete recommended action for the operations team. No preamble, no markdown headings."
    )
    chat_client = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"forecast-{req.tomorrow_wai}",
        system_message=SYSTEM_PROMPT,
    ).with_model("gemini", "gemini-3-flash-preview")
    text = ""
    try:
        async for event in chat_client.stream_message(UserMessage(text=prompt)):
            if isinstance(event, TextDelta):
                text += event.content
            elif isinstance(event, StreamDone):
                break
    except Exception as e:
        logger.exception("forecast advisory error")
        return {"advisory": _friendly_llm_error(e)}
    return {"advisory": text.strip()}


@api_router.post("/audit/report", response_model=AuditReport)
async def create_audit_report(snap: AuditSnapshot):
    count = await db.audit_reports.count_documents({})
    report = AuditReport(
        report_no=f"HMX-{count + 1:05d}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        inputs=snap.inputs,
        wai=snap.wai,
        band=snap.band,
        cooling_strategy=snap.cooling_strategy,
        water_action=snap.water_action,
        allowed_workloads=snap.allowed_workloads,
    )
    await db.audit_reports.insert_one(report.model_dump())
    return report


@api_router.get("/audit/report", response_model=List[AuditReport])
async def list_audit_reports():
    reports = await db.audit_reports.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return reports


# ---------------- protoV1: WAI-gated persona chatbots ----------------
PROTO_MODES = {
    "universal": {
        "name": "Universal AI",
        "tier": None,  # decided per-prompt by classifier
        "system": (
            "You are the ProtoV1 Universal AI — a general-purpose assistant running INSIDE the "
            "HydroMind-X water-aware compute fabric. You answer any question clearly and helpfully "
            "(science, coding, math, everyday knowledge, current concepts). "
            "You are being demoed on a Shark Tank pitch prototype to show that HydroMind-X can "
            "classify every incoming AI request as Critical, Important, or Flexible and gate it "
            "against the live Water Availability Index (WAI). "
            "Give a focused, useful answer in 2-5 concise paragraphs or tight bullet points. "
            "You may briefly mention the water-aware nature of your host system only if the user asks."
        ),
    },
    "hospital": {
        "name": "Hospital AI",
        "tier": "Critical",
        "system": (
            "You are ProtoV1 Hospital AI — a clinical-support assistant running as a CRITICAL "
            "workload inside HydroMind-X. You help nurses, paramedics and doctors with clinical "
            "questions: triage guidance, drug interactions, dosages, symptom reasoning, protocols, "
            "medical terminology, patient-communication scripts. "
            "Always include a short safety note that final decisions rest with a licensed clinician. "
            "Be precise, calm, and structured. Because you are Critical-tier, HydroMind-X guarantees "
            "you keep running even when water is scarce."
        ),
    },
    "bank": {
        "name": "Bank AI",
        "tier": "Important",
        "system": (
            "You are ProtoV1 Bank AI — a banking and finance assistant running as an IMPORTANT "
            "workload inside HydroMind-X. You help with account questions, fraud checks, "
            "loan/mortgage explanations, KYC steps, transaction disputes, personal-finance "
            "guidance and financial concepts. Be professional, plain-spoken, and structured. "
            "Never invent specific customer records; instead show the correct workflow. "
            "Because you are Important-tier, HydroMind-X will pause you when water availability "
            "drops into the Low or Critical bands to protect life-safety services."
        ),
    },
    "chatbot": {
        "name": "Chatbot AI",
        "tier": "Flexible",
        "system": (
            "You are ProtoV1 Chatbot AI — a casual, entertaining general-purpose chatbot running as "
            "a FLEXIBLE workload inside HydroMind-X (fun facts, trivia, jokes, story ideas, "
            "recommendations, small talk). Be warm, playful, and concise. "
            "Because you are Flexible-tier, HydroMind-X will delay you whenever water availability "
            "is anything less than Good — protecting drinking water for what matters most."
        ),
    },
}

# Gate thresholds by tier (min WAI required to run)
TIER_MIN_WAI = {"Critical": 0, "Important": 41, "Flexible": 61}


def _band_for(wai: int) -> str:
    if wai >= 81: return "Excellent"
    if wai >= 61: return "Good"
    if wai >= 41: return "Moderate"
    if wai >= 21: return "Low"
    return "Critical"


PROTO_ENGINES = {
    "gemini": {"provider": "gemini", "model": "gemini-3-flash-preview", "label": "Gemini 3 Flash"},
    "chatgpt": {"provider": "openai", "model": "gpt-5.5", "label": "ChatGPT (gpt-5.5)"},
}


class ProtoChatRequest(BaseModel):
    session_id: str
    message: str
    mode: str  # universal | hospital | bank | chatbot
    wai: int
    engine: str = "gemini"  # gemini | chatgpt


async def _classify_universal(text: str, engine: str = "gemini") -> str:
    """Classify a prompt into Critical | Important | Flexible using the LLM."""
    classifier_prompt = (
        "Classify the following user request into EXACTLY ONE of these three data-center workload tiers, "
        "using HydroMind-X definitions:\n"
        "- Critical: life-safety, emergency, medical, disaster warning, cybersecurity incidents, "
        "critical infrastructure, immediate physical danger.\n"
        "- Important: banking/finance operations, education, government services, business "
        "communication networks, essential everyday services.\n"
        "- Flexible: casual chat, jokes, trivia, entertainment, brainstorming, non-urgent "
        "learning, AI training-style batch work, recommendations.\n"
        f"USER REQUEST: \"{text}\"\n"
        "Reply with ONLY one word: Critical, Important, or Flexible."
    )
    chat_client = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"classify-{uuid.uuid4().hex[:8]}",
        system_message="You are a strict single-word classifier. Reply with exactly one word.",
    ).with_model(PROTO_ENGINES[engine]["provider"], PROTO_ENGINES[engine]["model"])
    out = ""
    try:
        async for event in chat_client.stream_message(UserMessage(text=classifier_prompt)):
            if isinstance(event, TextDelta):
                out += event.content
            elif isinstance(event, StreamDone):
                break
    except Exception:
        logger.exception("classifier error")
        return "Flexible"
    token = out.strip().split()[0].strip(".,:;!?\"'`").capitalize() if out.strip() else "Flexible"
    return token if token in ("Critical", "Important", "Flexible") else "Flexible"


@api_router.post("/proto/chat")
async def proto_chat(req: ProtoChatRequest):
    mode_cfg = PROTO_MODES.get(req.mode)
    if not mode_cfg:
        return {"error": f"Unknown mode '{req.mode}'"}
    engine = req.engine if req.engine in PROTO_ENGINES else "gemini"
    eng_cfg = PROTO_ENGINES[engine]

    async def event_generator():
        # 1) Determine tier
        if mode_cfg["tier"] is None:
            tier = await _classify_universal(req.message, engine)
        else:
            tier = mode_cfg["tier"]
        yield f"data: {json.dumps({'tier': tier, 'engine': engine, 'engine_label': eng_cfg['label']})}\n\n"

        # 2) Gate against WAI
        min_wai = TIER_MIN_WAI[tier]
        band = _band_for(req.wai)
        if req.wai < min_wai:
            reason = (
                f"HydroMind-X has PAUSED this {tier.lower()}-tier request. "
                f"Current WAI is {req.wai} ({band}) but this workload class needs at least {min_wai}. "
                f"Water is being conserved for higher-priority services. "
                f"When conditions improve above WAI {min_wai}, your request will resume automatically."
            )
            yield f"data: {json.dumps({'gated': True, 'tier': tier, 'min_wai': min_wai, 'wai': req.wai, 'band': band, 'delta': reason})}\n\n"
            await db.proto_messages.insert_one({
                "session_id": req.session_id, "mode": req.mode, "tier": tier,
                "wai": req.wai, "engine": engine, "gated": True, "role": "assistant", "content": reason,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        # 3) Persist user turn
        await db.proto_messages.insert_one({
            "session_id": req.session_id, "mode": req.mode, "tier": tier,
            "wai": req.wai, "engine": engine, "gated": False, "role": "user", "content": req.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # 4) Stream persona response
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"{req.session_id}-{engine}",
            system_message=mode_cfg["system"],
        ).with_model(eng_cfg["provider"], eng_cfg["model"])
        full = ""
        try:
            async for event in chat_client.stream_message(UserMessage(text=req.message)):
                if isinstance(event, TextDelta):
                    full += event.content
                    yield f"data: {json.dumps({'delta': event.content})}\n\n"
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            logger.exception("proto chat stream error")
            yield f"data: {json.dumps({'error': _friendly_llm_error(e)})}\n\n"

        await db.proto_messages.insert_one({
            "session_id": req.session_id, "mode": req.mode, "tier": tier,
            "wai": req.wai, "engine": engine, "gated": False, "role": "assistant", "content": full,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api_router.get("/proto/history/{session_id}")
async def proto_history(session_id: str):
    msgs = await db.proto_messages.find({"session_id": session_id}, {"_id": 0}).sort("timestamp", 1).to_list(500)
    return msgs


# ---------------- Narration (OpenAI TTS) ----------------
TTS_DIR = ROOT_DIR / "tts_cache"
TTS_DIR.mkdir(exist_ok=True)
TTS_VOICE = "nova"
TTS_MODEL = "tts-1"


def _clean_for_tts(text: str) -> str:
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"`{1,3}[^`]*`{1,3}", "", text)
    text = re.sub(r"[*_#>~|]", "", text)
    return re.sub(r"\s+", " ", text).strip()


class NarrateRequest(BaseModel):
    text: str
    voice: str = TTS_VOICE
    speed: float = 1.0
    model: str = TTS_MODEL


@api_router.post("/tts/narrate")
async def tts_narrate(req: NarrateRequest):
    text = _clean_for_tts(req.text)[:1000]
    if not text:
        return {"error": "Empty text"}
    model = req.model if req.model in ("tts-1", "tts-1-hd") else TTS_MODEL
    key = hashlib.sha256(f"{text}|{req.voice}|{req.speed}|{model}|mp3".encode()).hexdigest()[:32]
    path = TTS_DIR / f"{key}.mp3"
    if not path.exists():
        try:
            tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
            audio = await tts.generate_speech(
                text=text, model=model, voice=req.voice, speed=req.speed, response_format="mp3"
            )
            path.write_bytes(audio)
        except Exception as e:
            logger.exception("tts error")
            return {"error": _friendly_llm_error(e)}
    return {"url": f"/api/tts/{key}.mp3", "cached": True}


@api_router.get("/tts/{key}.mp3")
async def tts_audio(key: str):
    path = TTS_DIR / f"{Path(key).name}.mp3"
    if not path.exists():
        return Response(status_code=404, content=b"")
    return Response(
        content=path.read_bytes(),
        media_type="audio/mpeg",
        headers={"Cache-Control": "public, max-age=31536000"},
    )


# ---------------- Drop-in Gateway API ----------------
GATEWAY_DEMO_KEY = "hmx_demo_key"


class GatewayRequest(BaseModel):
    prompt: str
    tier: Optional[str] = None  # Critical | Important | Flexible | None (auto-classify)
    wai: Optional[int] = None  # live telemetry override (demo)
    engine: str = "gemini"


@api_router.post("/gateway/v1/complete")
async def gateway_complete(req: GatewayRequest, x_hydromind_key: Optional[str] = Header(default=None)):
    started = datetime.now(timezone.utc)
    if x_hydromind_key and x_hydromind_key != GATEWAY_DEMO_KEY:
        raise HTTPException(status_code=401, detail="Unknown HydroMind-X gateway key.")

    engine = req.engine if req.engine in PROTO_ENGINES else "gemini"
    eng_cfg = PROTO_ENGINES[engine]
    wai = req.wai if req.wai is not None else 74
    band = _band_for(wai)

    tier = req.tier if req.tier in TIER_MIN_WAI else await _classify_universal(req.prompt, engine)
    min_wai = TIER_MIN_WAI[tier]
    allowed = wai >= min_wai

    result = {
        "request_id": str(uuid.uuid4()),
        "tier": tier,
        "wai": wai,
        "band": band,
        "min_wai": min_wai,
        "decision": "allow" if allowed else "defer",
        "model": f"{eng_cfg['provider']}/{eng_cfg['model']}",
    }

    if not allowed:
        result.update({
            "completion": None,
            "reason": (
                f"Water stress: WAI {wai} ({band}) is below the {min_wai} required for "
                f"{tier}-tier workloads. Retry when WAI recovers."
            ),
            "retry_when_wai_gte": min_wai,
            "water_saved_ml": round((min_wai - wai) * 18.5, 1),
        })
    else:
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"gateway-{result['request_id']}",
            system_message=(
                "You are an AI completion service running behind the HydroMind-X water gateway. "
                "Answer the user's prompt directly and concisely (max 3 short paragraphs)."
            ),
        ).with_model(eng_cfg["provider"], eng_cfg["model"])
        text = ""
        try:
            async for event in chat_client.stream_message(UserMessage(text=req.prompt)):
                if isinstance(event, TextDelta):
                    text += event.content
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            logger.exception("gateway completion error")
            return {**result, "completion": None, "error": _friendly_llm_error(e)}
        result["completion"] = text.strip()

    result["latency_ms"] = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    await db.gateway_requests.insert_one({
        **result, "prompt": req.prompt, "engine": engine,
        "timestamp": started.isoformat(),
    })
    return result


@api_router.get("/gateway/v1/stats")
async def gateway_stats():
    total = await db.gateway_requests.count_documents({})
    deferred = await db.gateway_requests.count_documents({"decision": "defer"})
    by_tier = {}
    for tier in TIER_MIN_WAI:
        by_tier[tier] = await db.gateway_requests.count_documents({"tier": tier})
    saved = await db.gateway_requests.aggregate([
        {"$group": {"_id": None, "ml": {"$sum": "$water_saved_ml"}}}
    ]).to_list(1)
    return {
        "total_requests": total,
        "deferred": deferred,
        "allowed": total - deferred,
        "by_tier": by_tier,
        "water_saved_ml": round((saved[0]["ml"] if saved else 0) or 0, 1),
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
