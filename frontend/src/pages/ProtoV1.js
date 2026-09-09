import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Cpu, HeartPulse, Landmark, Sparkles, Bot, User, Send, ShieldCheck, ShieldAlert,
  Droplets, Zap, Clock, ArrowRight, Brain, CloudRain, RotateCcw, Hourglass,
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

  const [sessionId, setSessionId] = useState(() => `${mode}-${genId()}`);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [engine, setEngine] = useState(
    () => localStorage.getItem("hmx-proto-engine") || "gemini"
  );
  const [queue, setQueue] = useState([]);
  const streamingRef = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("hmx-proto-engine", engine);
  }, [engine]);

  // Reset session when mode changes
  useEffect(() => {
    setSessionId(`${mode}-${genId()}`);
    setMessages([]);
    setInput("");
    setQueue([]);
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
          body: JSON.stringify({ session_id: sessionId, message: q, mode, wai, engine }),
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
    [sessionId, mode, wai, cfg, replaceLast, engine]
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
        <div className="flex items-center gap-2 ml-auto">
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
