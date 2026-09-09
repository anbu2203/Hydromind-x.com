# HydroMind-X — Product Requirements Document

## Original Problem Statement
HydroMind-X: AI-Driven Water Intelligence System for Sustainable Data Centers (team AquaNova Trinity, tagline "Making AI Think Before It Drinks"). A Shark Tank pitch prototype web app that (1) acts as an AI chatbot answering any question about the HydroMind system, (2) shows how data-center cooling is done, (3) provides sliders for environmental factors to demonstrate scenarios, and (4) generates downloadable water audit reports. Free of cost.

## Architecture
- **Frontend**: React 19 + Tailwind + Framer Motion + Recharts + lucide-react + sonner. Dark futuristic "control-room" theme (Void Black / Electric Cyan / Alert Orange). Fonts: Unbounded, Chivo, JetBrains Mono.
- **Backend**: FastAPI + Motor (MongoDB). SSE chat streaming via emergentintegrations LlmChat (Gemini `gemini-3-flash-preview`, EMERGENT_LLM_KEY).
- **Shared decision engine**: `frontend/src/lib/hydro.js` — computeWAI() + decide() implement the WAI decision-logic table (single source of truth). State via `ScenarioContext`.

## User Personas
- Startup founder pitching investors (needs a live, impressive demo).
- Technical judges asking system questions (needs an accurate grounded chatbot).

## Core Requirements (static)
- WAI (0-100) computed live from Temperature, Humidity, Water Level, Water Flow, Reservoir, Cooling Demand, Weather.
- Decision-logic table mapping WAI bands → cooling strategy + workload priority + water action.
- Workload classification (Critical / Important / Flexible) with run/delay status.
- AI chatbot grounded to HydroMind-X + related water/AI/climate topics.
- Animated cooling schematic that adapts to the active strategy.
- Downloadable/printable Water Audit Report.
- SDG badges (6, 9, 11, 12, 13).

## Implemented (2026-08-13)
- Dashboard: hero, Scenario Simulator (6 sliders + weather), WAI radial gauge, AI Decision panel, Workload board, Audit Report, SDG badges.
- Cooling page: animated SVG schematic (flow pipes, nodes), cooling-mix bars, adaptive blurb, 4-step "how it works".
- AI Assistant page: HYDRA chatbot with SSE streaming (Gemini 3 Flash), suggestion chips, session-based history persisted to MongoDB.
- Backend APIs: `/api/chat` (SSE), `/api/chat/history/{id}`, `/api/audit/report` (create/list). All tested & passing.

## Implemented (2026-06-09) — protoV1 + ChatGPT engine switcher
- `protoV1` feature: 4 gated persona chatbots (Universal auto-classify, Hospital=Critical, Bank=Important, Flexible=Chatbot) at `/proto/:mode`, nav dropdown in `Nav.js`, UI in `pages/ProtoV1.js`.
- Backend `POST /api/proto/chat` (SSE): classifies tier (Universal), gates against live WAI (Critical≥0, Important≥41, Flexible≥61), else streams persona reply. History in `proto_messages`.
- **ChatGPT integration**: engine switcher in protoV1 header toggles Gemini 3 Flash ↔ ChatGPT `gpt-5.5` live (via emergentintegrations + EMERGENT_LLM_KEY). Choice persists in localStorage; request sends `engine`; each assistant bubble is badged with the engine that produced it; engine stored per message. Classifier also runs on the selected engine.
- Friendly LLM error mapping (`_friendly_llm_error`) — budget/rate-limit errors now show "AI credits exhausted… Profile → Manage plan → Universal Key → Add Balance" instead of a raw litellm trace.
- Mobile fix: nav bar now horizontally scrollable (no overflow at 390px).
- Verified: curl SSE for gpt-5.5 (hospital stream, universal classify+gate) and browser test of switcher on `/proto/chatbot` (desktop + mobile).

## Backlog / Remaining
- P1: Live WAI mini-slider overlay on protoV1 pages (test gating mid-conversation).
- P1: Auto-retry gated requests when WAI rises above the tier threshold.
- P2: Hospital "Drought Scenario" preset button (drops WAI to 25).
- P2: Tier distribution chart (% of protoV1 traffic by tier today).

## Backlog / Remaining (P2)
- P2: Multi-site monitoring view (Phase 2 roadmap).
- P2: Predictive water-demand forecast chart (Phase 3).
- P2: Live auto IoT feed toggle (user opted out for now).
- P2: Digital-twin 3D visualization.
