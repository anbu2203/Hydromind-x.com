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

Answer clearly, confidently and concisely (2-5 short paragraphs or tight bullet points). You are pitching to investors (Shark Tank style) and answering technical judges, so be persuasive but accurate. You may answer questions about HydroMind-X AND related topics in water sustainability, data-center cooling, AI infrastructure, and climate action. Politely decline unrelated topics.

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
