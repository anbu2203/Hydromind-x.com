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

## Implemented (2026-06-09b) — Auto Resume + Drought demo
- **Auto Resume**: gated protoV1 requests are queued client-side with their tier threshold. A queue banner (`proto-queue-banner`) shows the count + required WAI, the gated bubble is badged "Queued · resumes at WAI ≥ N", and the moment WAI recovers the request auto re-sends and the new answer is badged "Auto-resumed". Queue clears on mode change or via "Clear queue".
- **Drought Scenario button** on every protoV1 page: `DROUGHT_INPUTS` preset in `lib/hydro.js` lands WAI at exactly 25 (Low band) via new `applyPreset()` in ScenarioContext; "Restore water" resets to 74. Proves Hospital (Critical) keeps answering while Bank/Chatbot pause.
- **Bug fixed**: protoV1 nav dropdown was dead — caused by an `overflow-x-auto` class added to `<nav>` (clipped the absolute menu). Reverted; mobile width solved instead via tighter paddings + hidden logo tagline. Menu now `z-50` with solid `bg-hydro-panel/95` backdrop.
- Also silenced Recharts width/height(-1) warning (minHeight on ForecastCard ResponsiveContainer).
- Verified by testing agent (`/app/test_reports/iteration_4.json`): 100% of 6 frontend flows pass (dropdown desktop+mobile, drought, auto-resume on chatbot & bank, engine switcher persistence, dashboard/assistant regression).

## Implemented (2026-06-09c) — Pitch Mode
- **Pitch Mode**: one-tap 7-step guided demo on `/proto/universal` (`runPitch()` in ProtoV1.js). Auto-plays: healthy WAI 74 → critical prompt answered → drought crashes WAI to 25 → flexible prompt PAUSED + queued → a critical prompt still answers during the drought → water restored → the queued prompt auto-resumes itself → closing line. Narration panel with step progress dots + "End demo" stop control.
- Launchable from the "Pitch mode" button on the Universal page or the "Pitch Mode" entry in the protoV1 nav dropdown (`/proto/universal?pitch=1`, param auto-cleaned).
- Fixed: React StrictMode double-invoked the autostart effect and ran the script twice concurrently — guarded with a run token in `pitchRef` plus an `ask()` helper that waits for the stream to clear.
- Fixed: `send()` captured a stale WAI in its closure (would have skipped gating right after the drought preset) — now reads `waiRef.current`.
- Verified by testing agent (`/app/test_reports/iteration_5.json`): 8/8 scenarios pass, 100% frontend, exactly one run, stop control works, all prior features regression-clean.

## Backlog / Remaining
- P1: Live WAI mini-slider overlay on protoV1 pages (throttle gating mid-conversation without leaving the page).
- P2: Side-by-side Gemini vs ChatGPT answer comparison for one prompt.
- P2: Tier distribution chart (% of protoV1 traffic by tier today).

## Backlog / Remaining (P2)
- P2: Multi-site monitoring view (Phase 2 roadmap).
- P2: Predictive water-demand forecast chart (Phase 3).
- P2: Live auto IoT feed toggle (user opted out for now).
- P2: Digital-twin 3D visualization.
