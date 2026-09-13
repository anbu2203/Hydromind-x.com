import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Navigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cpu, HeartPulse, Landmark, Sparkles, Bot, User, Send, ShieldCheck, ShieldAlert,
  Droplets, Zap, Clock, ArrowRight, Brain, CloudRain, RotateCcw, Hourglass, Play, Square,
  Volume2, VolumeX, Languages,
} from "lucide-react";
import { useScenario } from "../context/ScenarioContext";
import { DROUGHT_INPUTS } from "../lib/hydro";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// --------- Persona registry (matches backend PROTO_MODES) ---------
export const PROTO_MODES = {
  universal: {
    key: "universal",
    name: "Universal AI",
    tagline: "General intelligence · classifies every prompt",
    tier: null, // dynamic
    icon: Cpu,
    accent: "#00F0FF",
    minWai: 0,
    suggestions: [
      "Explain quantum entanglement like I'm 12",
      "URGENT: someone is unconscious and not breathing, what do I do first?",
      "Write a haiku about the ocean",
      "How do I file my income tax return?",
    ],
    intro:
      "A general-purpose AI. Ask anything. Every prompt is classified by HydroMind-X into Critical, Important or Flexible, then gated against the live Water Availability Index.",
  },
  hospital: {
    key: "hospital",
    name: "Hospital AI",
    tagline: "Clinical support · Critical tier",
    tier: "Critical",
    icon: HeartPulse,
    accent: "#FF5C6C",
    minWai: 0,
    suggestions: [
      "Adult CPR compression rate and depth?",
      "Signs of anaphylaxis and first-line treatment",
      "Common drug interactions with warfarin",
      "How to triage a chest-pain patient in ER",
    ],
    intro:
      "A critical-tier medical assistant. HydroMind-X keeps this alive even in drought conditions — it protects life-safety AI first.",
  },
  bank: {
    key: "bank",
    name: "Bank AI",
    tagline: "Finance & banking · Important tier",
    tier: "Important",
    icon: Landmark,
    accent: "#FFD700",
    minWai: 41,
    suggestions: [
      "Explain the difference between fixed and floating home-loan rates",
      "How does UPI fraud typically happen and how do I avoid it?",
      "Walk me through KYC for opening a new savings account",
      "What is compound interest with a simple example?",
    ],
    intro:
      "An important-tier finance assistant. HydroMind-X pauses this when water availability falls below WAI 41 to protect life-safety services.",
  },
  chatbot: {
    key: "chatbot",
    name: "Chatbot AI",
    tagline: "Fun & casual · Flexible tier",
    tier: "Flexible",
    icon: Sparkles,
    accent: "#B48BFF",
    minWai: 61,
    suggestions: [
      "Tell me a nerdy joke about databases",
      "Give me 3 weekend hobby ideas",
      "Invent a superhero whose power is compiling code",
      "Recommend a sci-fi book like Project Hail Mary",
    ],
    intro:
      "A flexible-tier casual chatbot. HydroMind-X delays this whenever water availability is anything less than Good (WAI 61+).",
  },
};

const TIER_COLOR = {
  Critical: "#FF5C6C",
  Important: "#FFD700",
  Flexible: "#B48BFF",
};

const genId = () => Math.random().toString(36).slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PITCH_LINES = {
  en: {
    1: "Water is healthy — WAI 74. Universal AI is running every request, no restrictions.",
    2: "A life-or-death request arrives. Watch HydroMind-X classify it as Critical.",
    3: "Now a drought hits the region. Reservoirs fall, cooling demand spikes.",
    4: "WAI has crashed to 25. Only life-safety AI may drink. A casual request now arrives.",
    5: "Paused and queued — not a single drop wasted on a joke during a drought.",
    6: "But the emergency lane never closes. Same drought, a critical request still runs.",
    7: "The rain returns. WAI recovers — and the queued request answers itself.",
    8: "Auto-resumed with zero human intervention. That is HydroMind-X: AI that thinks before it drinks.",
  },
  ta: {
    1: "நீர் நிலை சிறப்பாக உள்ளது. WAI எழுபத்து நான்கு. யுனிவர்சல் AI எல்லா கோரிக்கைகளையும் இயக்குகிறது, எந்த தடையும் இல்லை.",
    2: "உயிர் காக்கும் அவசர கோரிக்கை வருகிறது. ஹைட்ரோமைண்ட் எக்ஸ் அதை க்ரிட்டிகல் என வகைப்படுத்துவதைப் பாருங்கள்.",
    3: "இப்போது பெரும் வறட்சி தாக்குகிறது. நீர்த்தேக்கங்கள் குறைகின்றன, குளிரூட்டல் தேவை உயர்கிறது.",
    4: "WAI இருபத்து ஐந்துக்கு சரிந்துவிட்டது. உயிர் காக்கும் AI மட்டுமே தண்ணீர் பெறும். இப்போது ஒரு சாதாரண கோரிக்கை வருகிறது.",
    5: "நிறுத்தப்பட்டு வரிசையில் வைக்கப்பட்டது. வறட்சியின் போது ஒரு நகைச்சுவைக்காக ஒரு துளி தண்ணீரும் வீணாகவில்லை.",
    6: "ஆனால் அவசர பாதை எப்போதும் மூடப்படுவதில்லை. அதே வறட்சியில் க்ரிட்டிகல் கோரிக்கை இயங்குகிறது.",
    7: "மழை திரும்பியது. WAI மீண்டு எழுகிறது. வரிசையில் இருந்த கோரிக்கை தானாகவே பதிலளிக்கிறது.",
    8: "மனித தலையீடு இல்லாமல் தானாகவே தொடர்ந்தது. இதுவே ஹைட்ரோமைண்ட் எக்ஸ் — குடிப்பதற்கு முன் சிந்திக்கும் AI.",
  },
};
const PITCH_LANGS = {
  en: { key: "en", label: "English", short: "EN" },
  ta: { key: "ta", label: "தமிழ்", short: "தமிழ்" },
};
const NARRATION_VOICE = "nova"; // bold, energetic female
const VOICE_CFG = {
  en: { voice: NARRATION_VOICE, model: "tts-1", speed: 1.0 },
  ta: { voice: NARRATION_VOICE, model: "tts-1-hd", speed: 0.92 },
};
const PITCH_TOTAL = 8;

export const ENGINES = {
  gemini: { key: "gemini", label: "Gemini 3 Flash", short: "Gemini", accent: "#00F0FF" },
  chatgpt: { key: "chatgpt", label: "ChatGPT · gpt-5.5", short: "ChatGPT", accent: "#4ADE80" },
};

const EngineSwitcher = ({ value, onChange, disabled }) => (
  <div
    className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-hydro-void/60"
    data-testid="proto-engine-switcher"
  >
    <Brain className="w-3.5 h-3.5 text-white/40 ml-2 mr-0.5" />
    {Object.values(ENGINES).map((e) => {
      const active = e.key === value;
      return (
        <button
          key={e.key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(e.key)}
          className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors disabled:opacity-40"
          style={
            active
              ? { color: e.accent, background: e.accent + "1A", border: `1px solid ${e.accent}55` }
              : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
          }
          data-testid={`proto-engine-${e.key}`}
        >
          {e.short}
        </button>
      );
    })}
  </div>
);

// --------- Small components ---------
const StatusPill = ({ allowed, wai, minWai, band, decisionColor }) => (
  <div
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-widest ${
      allowed
        ? "border-hydro-cyan/40 bg-hydro-cyan/10 text-hydro-cyan"
        : "border-hydro-orange/50 bg-hydro-orange/10 text-hydro-orange"
    }`}
    data-testid="proto-gate-status"
  >
    {allowed ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
    <span>{allowed ? "Allowed" : "Delayed"}</span>
    <span className="text-white/30">·</span>
    <span>WAI {wai}</span>
    <span className="text-white/30">/</span>
    <span>needs ≥ {minWai}</span>
    <span
      className="w-1.5 h-1.5 rounded-full ml-1 animate-pulse-glow"
      style={{ background: decisionColor, boxShadow: `0 0 8px ${decisionColor}` }}
    />
    <span className="text-white/50">{band}</span>
  </div>
);

const TierBadge = ({ tier }) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest border"
    style={{
      color: TIER_COLOR[tier] || "#00F0FF",
      borderColor: (TIER_COLOR[tier] || "#00F0FF") + "55",
      background: (TIER_COLOR[tier] || "#00F0FF") + "12",
    }}
  >
    <Zap className="w-2.5 h-2.5" />
    {tier}
  </span>
);

const Bubble = ({ m, streamingLast }) => {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`} data-testid={`proto-msg-${m.role}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
          isUser ? "bg-white/5 border-white/15" : "bg-hydro-cyan/10 border-hydro-cyan/30"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-white/70" /> : <Bot className="w-4 h-4 text-hydro-cyan" />}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-hydro-cyan/15 border border-hydro-cyan/25 text-white"
            : m.gated
              ? "border border-hydro-orange/40 bg-hydro-orange/10 text-white/90"
              : "hx-panel text-white/85"
        }`}
      >
        {(m.tier || m.engineLabel) && (
          <div className="mb-1.5 flex items-center gap-2 flex-wrap">
            {m.tier && <TierBadge tier={m.tier} />}
            {m.engineLabel && !isUser && (
              <span
                className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border"
                style={{
                  color: m.engineAccent,
                  borderColor: m.engineAccent + "55",
                  background: m.engineAccent + "12",
                }}
                data-testid="proto-msg-engine"
              >
                {m.engineLabel}
              </span>
            )}
            {m.gated && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-hydro-orange flex items-center gap-1">
                <Clock className="w-3 h-3" /> {m.resolved ? "Resumed" : "Delayed"}
              </span>
            )}
            {m.gated && !m.resolved && m.queuedMinWai != null && (
              <span
                className="font-mono text-[9px] uppercase tracking-widest text-hydro-cyan flex items-center gap-1"
                data-testid="proto-msg-queued"
              >
                <Hourglass className="w-3 h-3" /> Queued · resumes at WAI ≥ {m.queuedMinWai}
              </span>
            )}
            {m.resumed && (
              <span
                className="font-mono text-[9px] uppercase tracking-widest text-hydro-green flex items-center gap-1"
                data-testid="proto-msg-resumed"
              >
                <RotateCcw className="w-3 h-3" /> Auto-resumed
              </span>
            )}
          </div>
        )}
        {m.content ||
          (streamingLast ? (
            <span className="font-mono text-hydro-cyan animate-pulse-glow">Thinking…</span>
          ) : (
            ""
          ))}
      </div>
    </div>
  );
};

// --------- Main page ---------
export default function ProtoV1() {
  const { mode = "universal" } = useParams();
  const cfg = PROTO_MODES[mode];
  const { wai, decision, applyPreset, reset } = useScenario();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessionId, setSessionId] = useState(() => `${mode}-${genId()}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [engine, setEngine] = useState(
    () => localStorage.getItem("hmx-proto-engine") || "gemini"
  );
  const [queue, setQueue] = useState([]);
  const [pitch, setPitch] = useState({ active: false, step: 0, caption: "" });
  const [voiceOn, setVoiceOn] = useState(
    () => localStorage.getItem("hmx-pitch-voice") !== "off"
  );
  const [lang, setLang] = useState(() => localStorage.getItem("hmx-pitch-lang") || "en");
  const streamingRef = useRef(false);
  const pitchRef = useRef(null);
  const audioRef = useRef(null);
  const voiceRef = useRef(voiceOn);
  const langRef = useRef(lang);
  const queueRef = useRef([]);
  const waiRef = useRef(wai);
  const scrollRef = useRef(null);

  useEffect(() => {
    waiRef.current = wai;
  }, [wai]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    localStorage.setItem("hmx-pitch-lang", lang);
    langRef.current = lang;
    setPitch((p) => (p.active ? { ...p, caption: PITCH_LINES[lang][p.step] || p.caption } : p));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("hmx-pitch-voice", voiceOn ? "on" : "off");
    voiceRef.current = voiceOn;
    if (!voiceOn && audioRef.current) audioRef.current.pause();
  }, [voiceOn]);

  useEffect(() => {
    localStorage.setItem("hmx-proto-engine", engine);
  }, [engine]);

  // Reset session when mode changes
  useEffect(() => {
    setSessionId(`${mode}-${genId()}`);
    setMessages([]);
    setInput("");
    setQueue([]);
    pitchRef.current = false;
    setPitch({ active: false, step: 0, caption: "" });
  }, [mode]);

  const allowed = useMemo(() => (cfg ? wai >= cfg.minWai : true), [wai, cfg]);
  const band = decision?.band || "-";

  const replaceLast = useCallback((patch) => {
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { ...copy[copy.length - 1], ...patch };
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text, opts = {}) => {
      const q = text.trim();
      if (!q || streamingRef.current || !cfg) return;
      setInput("");
      const assistantId = genId();
      setMessages((m) => [
        ...m,
        ...(opts.resume ? [] : [{ id: genId(), role: "user", content: q }]),
        { id: assistantId, role: "assistant", content: "", tier: null, gated: false, resumed: !!opts.resume },
      ]);
      streamingRef.current = true;
      setStreaming(true);

      let assistantText = "";
      let currentTier = null;
      try {
        const res = await fetch(`${API}/proto/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, message: q, mode, wai: waiRef.current, engine }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = JSON.parse(line.slice(6));
            if (payload.tier && !payload.delta && !payload.gated) {
              currentTier = payload.tier;
              replaceLast({
                tier: currentTier,
                engineLabel: payload.engine_label || ENGINES[engine].label,
                engineAccent: ENGINES[payload.engine || engine]?.accent || "#00F0FF",
              });
            } else if (payload.gated) {
              currentTier = payload.tier;
              assistantText = payload.delta || "";
              replaceLast({
                tier: currentTier,
                gated: true,
                content: assistantText,
                engineLabel: null,
                queuedMinWai: payload.min_wai,
              });
              setQueue((qs) => [
                ...qs,
                { id: genId(), text: q, tier: payload.tier, minWai: payload.min_wai, bubbleId: assistantId },
              ]);
            } else if (payload.delta) {
              assistantText += payload.delta;
              replaceLast({ content: assistantText });
            } else if (payload.error) {
              replaceLast({ content: "⚠️ " + payload.error });
            }
          }
        }
      } catch (e) {
        replaceLast({ content: "⚠️ Connection error. Please try again." });
      } finally {
        streamingRef.current = false;
        setStreaming(false);
      }
    },
    [sessionId, mode, cfg, replaceLast, engine]
  );

  // Auto-resume: the moment WAI recovers above a queued request's tier threshold, re-send it.
  useEffect(() => {
    if (streaming || queue.length === 0) return;
    const next = queue.find((i) => wai >= i.minWai);
    if (!next) return;
    setQueue((qs) => qs.filter((i) => i.id !== next.id));
    setMessages((ms) => ms.map((m) => (m.id === next.bubbleId ? { ...m, resolved: true } : m)));
    send(next.text, { resume: true });
  }, [wai, streaming, queue, send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const stopPitch = useCallback(() => {
    pitchRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPitch({ active: false, step: 0, caption: "" });
  }, []);

  // Narrate a line with OpenAI TTS; resolves when playback ends (or immediately if muted/blocked).
  const narrate = useCallback(async (text) => {
    if (!voiceRef.current) return;
    try {
      const res = await fetch(`${API}/tts/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...VOICE_CFG[langRef.current] }),
      });
      const data = await res.json();
      if (!data.url || !voiceRef.current) return;
      const audio = audioRef.current || (audioRef.current = new Audio());
      audio.src = `${BACKEND_URL}${data.url}`;
      await audio.play();
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
      });
    } catch (e) {
      /* muted, blocked by autoplay policy, or TTS unavailable — demo continues silently */
    }
  }, []);

  // One-tap guided demo: healthy water -> drought -> pause & queue -> life-safety survives -> auto-resume
  const runPitch = useCallback(async () => {
    const token = genId();
    pitchRef.current = token;
    const alive = () => pitchRef.current === token;
    const beat = async (step, ms) => {
      const line = PITCH_LINES[langRef.current][step];
      setPitch({ active: true, step, caption: line });
      await Promise.all([narrate(line), sleep(ms)]);
    };
    const ask = async (text) => {
      while (alive() && streamingRef.current) await sleep(300);
      if (!alive()) return;
      await send(text);
    };

    setSessionId(`${mode}-${genId()}`);
    setMessages([]);
    setQueue([]);
    reset();
    // warm the narration cache so later lines play instantly
    Object.values(PITCH_LINES[langRef.current]).forEach((line) => {
      fetch(`${API}/tts/narrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: line, ...VOICE_CFG[langRef.current] }),
      }).catch(() => {});
    });

    await beat(1, 3200);
    if (!alive()) return;

    await beat(2, 1600);
    if (!alive()) return;
    await ask("URGENT: someone is unconscious and not breathing, what do I do first?");
    if (!alive()) return;

    await beat(3, 1400);
    if (!alive()) return;
    applyPreset(DROUGHT_INPUTS);
    await sleep(2200);
    if (!alive()) return;

    await beat(4, 2000);
    if (!alive()) return;
    await ask("Tell me a nerdy joke about databases");
    if (!alive()) return;

    await beat(5, 2600);
    if (!alive()) return;

    await beat(6, 1600);
    if (!alive()) return;
    await ask("What is the first aid for severe bleeding?");
    if (!alive()) return;

    await beat(7, 1600);
    if (!alive()) return;
    reset();

    const deadline = Date.now() + 40000;
    await sleep(1200);
    while (alive() && Date.now() < deadline && (queueRef.current.length > 0 || streamingRef.current)) {
      await sleep(400);
    }
    if (!alive()) return;
    await beat(PITCH_TOTAL, 600);
    pitchRef.current = null;
  }, [mode, send, applyPreset, reset, narrate]);

  useEffect(() => stopPitch, [stopPitch]);

  useEffect(() => {
    if (searchParams.get("pitch") === "1" && mode === "universal" && !pitchRef.current) {
      setSearchParams({}, { replace: true });
      runPitch();
    }
  }, [searchParams, setSearchParams, mode, runPitch]);

  if (!cfg) return <Navigate to="/proto/universal" replace />;

  const Icon = cfg.icon;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8 relative z-10" data-testid={`proto-page-${mode}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-5 flex-wrap">
        <div
          className="p-3 rounded-xl border"
          style={{
            borderColor: cfg.accent + "55",
            background: cfg.accent + "18",
            boxShadow: `0 0 24px ${cfg.accent}22`,
          }}
        >
          <Icon className="w-7 h-7" style={{ color: cfg.accent, filter: `drop-shadow(0 0 6px ${cfg.accent})` }} />
        </div>
        <div className="flex-1 min-w-[260px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan/70">
              protoV1 ·
            </span>
            {cfg.tier ? (
              <TierBadge tier={cfg.tier} />
            ) : (
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/50 border border-white/15 px-2 py-0.5 rounded">
                Auto-classify
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-3xl tracking-tighter uppercase leading-none">
            {cfg.name}
          </h1>
          <p className="font-mono text-[11px] tracking-widest uppercase text-white/50 mt-1">
            {cfg.tagline}
          </p>
        </div>
        <StatusPill
          allowed={allowed}
          wai={wai}
          minWai={cfg.minWai}
          band={band}
          decisionColor={decision?.color || "#00F0FF"}
        />
      </div>

      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <EngineSwitcher value={engine} onChange={setEngine} disabled={streaming} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Engine · {ENGINES[engine].label}
        </span>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto sm:ml-auto">
          {mode === "universal" && (
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-hydro-void/60"
              data-testid="proto-lang-switcher"
            >
              <Languages className="w-3.5 h-3.5 text-white/40 ml-1.5" />
              {Object.values(PITCH_LANGS).map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLang(l.key)}
                  className={`px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border ${
                    lang === l.key
                      ? "border-hydro-cyan/55 bg-hydro-cyan/15 text-hydro-cyan"
                      : "border-transparent text-white/45 hover:text-white/80"
                  }`}
                  data-testid={`proto-lang-${l.key}`}
                >
                  {l.short}
                </button>
              ))}
            </div>
          )}
          {mode === "universal" && (
            <button
              type="button"
              onClick={() => setVoiceOn((v) => !v)}
              title={voiceOn ? "Narration on" : "Narration muted"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border ${
                voiceOn
                  ? "border-hydro-cyan/40 bg-hydro-cyan/10 text-hydro-cyan"
                  : "border-white/15 text-white/45 hover:text-white/80"
              }`}
              data-testid="proto-voice-toggle"
            >
              {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {voiceOn ? "Voice on" : "Muted"}
            </button>
          )}
          {mode === "universal" && (
            <button
              type="button"
              onClick={pitch.active ? stopPitch : runPitch}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors border border-hydro-cyan/50 bg-hydro-cyan/15 text-hydro-cyan hover:bg-hydro-cyan/25"
              data-testid="proto-pitch-btn"
            >
              {pitch.active ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {pitch.active ? "End pitch mode" : "Pitch mode"}
            </button>
          )}
          <button
            type="button"
            onClick={() => applyPreset(DROUGHT_INPUTS)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-hydro-orange/50 bg-hydro-orange/10 text-hydro-orange font-mono text-[10px] uppercase tracking-widest hover:bg-hydro-orange/20 transition-colors"
            data-testid="proto-drought-btn"
          >
            <CloudRain className="w-3.5 h-3.5" />
            Drought scenario
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 text-white/55 font-mono text-[10px] uppercase tracking-widest hover:text-hydro-cyan hover:border-hydro-cyan/40 transition-colors"
            data-testid="proto-restore-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore water
          </button>
        </div>
      </div>

      {queue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-hydro-cyan/30 bg-hydro-cyan/5 px-4 py-3 flex items-center gap-3 flex-wrap"
          data-testid="proto-queue-banner"
        >
          <Hourglass className="w-4 h-4 text-hydro-cyan animate-pulse-glow shrink-0" />
          <span className="text-sm text-white/80">
            <span className="font-mono text-hydro-cyan" data-testid="proto-queue-count">
              {queue.length}
            </span>{" "}
            request{queue.length > 1 ? "s" : ""} queued — HydroMind-X will answer automatically once
            WAI reaches{" "}
            <span className="font-mono text-hydro-cyan">
              {Math.min(...queue.map((i) => i.minWai))}
            </span>
            .
          </span>
          <button
            type="button"
            onClick={() => setQueue([])}
            className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
            data-testid="proto-queue-clear-btn"
          >
            Clear queue
          </button>
        </motion.div>
      )}

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="hx-panel rounded-xl px-4 py-3 mb-5 flex items-start gap-3"
      >
        <Droplets className="w-4 h-4 text-hydro-cyan mt-0.5 shrink-0" />
        <p className="text-white/70 text-sm leading-relaxed">{cfg.intro}</p>
      </motion.div>

      {pitch.active && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-xl border border-hydro-cyan/40 bg-hydro-cyan/[0.07] px-4 py-4 relative overflow-hidden"
          data-testid="proto-pitch-narration"
        >
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan">
              Pitch mode
            </span>
            <div className="flex items-center gap-1.5" data-testid="proto-pitch-progress">
              {Array.from({ length: PITCH_TOTAL }, (_, i) => (
                <span
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i + 1 === pitch.step ? 22 : 8,
                    background: i < pitch.step ? "#00F0FF" : "rgba(255,255,255,0.18)",
                    boxShadow: i + 1 === pitch.step ? "0 0 10px #00F0FF" : "none",
                  }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              Step {pitch.step}/{PITCH_TOTAL}
            </span>
            <button
              type="button"
              onClick={stopPitch}
              className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/80 transition-colors"
              data-testid="proto-pitch-stop-btn"
            >
              End demo
            </button>
          </div>
          <motion.p
            key={pitch.caption}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-white/90 text-base md:text-lg leading-snug"
            data-testid="proto-pitch-caption"
          >
            {pitch.caption}
          </motion.p>
        </motion.div>
      )}

      {/* Chat window */}
      <div
        className="hx-glass rounded-2xl overflow-hidden flex flex-col"
        style={{ height: "60vh", minHeight: 440 }}
      >
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5" data-testid="proto-messages">
          {messages.length === 0 && (
            <div className="text-center text-white/40 font-mono text-xs uppercase tracking-widest pt-12">
              Start a conversation with {cfg.name}
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Bubble m={m} streamingLast={streaming && i === messages.length - 1} />
            </motion.div>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2" data-testid="proto-suggestions">
            {cfg.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-hydro-cyan hover:border-hydro-cyan/40 text-xs transition-colors"
                data-testid="proto-suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-4 border-t border-white/10 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${cfg.name}…`}
            className="flex-1 bg-hydro-void/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-hydro-cyan/50 transition-colors"
            data-testid="proto-input"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="p-3 rounded-lg bg-hydro-cyan text-hydro-void disabled:opacity-40 hover:hx-glow-cyan transition-shadow"
            data-testid="proto-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Explainer card */}
      <div className="mt-8 hx-panel rounded-xl p-6 sm:p-8 space-y-4" data-testid="proto-explainer">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-xl tracking-tight uppercase">
            How HydroMind-X gates this AI
          </h2>
        </div>
        <p className="text-white/70 leading-relaxed text-sm">
          Every request that arrives at <span className="text-hydro-cyan">{cfg.name}</span> is
          classified into one of three workload tiers. HydroMind-X then compares the live Water
          Availability Index against the minimum WAI required for that tier. If water is scarce,
          lower-priority AI is paused so life-safety systems keep running.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { tier: "Critical", min: 0, note: "Hospitals, emergency, cyber-incidents. Always runs." },
            { tier: "Important", min: 41, note: "Banking, gov, education, comms. Pauses below WAI 41." },
            { tier: "Flexible", min: 61, note: "Chatbots, training, rendering. Pauses below WAI 61." },
          ].map((row) => (
            <div
              key={row.tier}
              className="rounded-lg border p-4"
              style={{ borderColor: TIER_COLOR[row.tier] + "44", background: TIER_COLOR[row.tier] + "10" }}
            >
              <div className="flex items-center justify-between mb-2">
                <TierBadge tier={row.tier} />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                  min WAI {row.min}
                </span>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">{row.note}</p>
            </div>
          ))}
        </div>
        <div className="pt-2 flex items-center gap-3 text-xs text-white/50">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>
            Change the WAI on the{" "}
            <Link to="/" className="text-hydro-cyan hover:underline">Dashboard</Link>{" "}
            sliders and watch each protoV1 chatbot allow, delay, or classify requests live.
          </span>
        </div>
      </div>
    </div>
  );
}
