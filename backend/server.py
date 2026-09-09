from fastapi import FastAPI, APIRouter
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

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
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
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
        return {"advisory": f"Forecast advisory unavailable: {e}"}
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


class ProtoChatRequest(BaseModel):
    session_id: str
    message: str
    mode: str  # universal | hospital | bank | chatbot
    wai: int


async def _classify_universal(text: str) -> str:
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
    ).with_model("gemini", "gemini-3-flash-preview")
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

    async def event_generator():
        # 1) Determine tier
        if mode_cfg["tier"] is None:
            tier = await _classify_universal(req.message)
        else:
            tier = mode_cfg["tier"]
        yield f"data: {json.dumps({'tier': tier})}\n\n"

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
                "wai": req.wai, "gated": True, "role": "assistant", "content": reason,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
            yield f"data: {json.dumps({'done': True})}\n\n"
            return

        # 3) Persist user turn
        await db.proto_messages.insert_one({
            "session_id": req.session_id, "mode": req.mode, "tier": tier,
            "wai": req.wai, "gated": False, "role": "user", "content": req.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        # 4) Stream persona response
        chat_client = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=req.session_id,
            system_message=mode_cfg["system"],
        ).with_model("gemini", "gemini-3-flash-preview")
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
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        await db.proto_messages.insert_one({
            "session_id": req.session_id, "mode": req.mode, "tier": tier,
            "wai": req.wai, "gated": False, "role": "assistant", "content": full,
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
