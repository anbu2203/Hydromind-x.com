import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plug, Terminal, Copy, Check, Send, ShieldCheck, ShieldAlert, Droplets,
  Activity, ArrowRight, Braces,
} from "lucide-react";
import { toast } from "sonner";
import { useScenario } from "../context/ScenarioContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const DEMO_KEY = "hmx_demo_key";

const TIER_COLOR = { Critical: "#FF5C6C", Important: "#FFD700", Flexible: "#B48BFF" };
const TIERS = ["auto", "Critical", "Important", "Flexible"];

const CodeBlock = ({ code, testid }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };
  return (
    <div className="relative group">
      <pre
        className="overflow-x-auto rounded-lg border border-white/10 bg-hydro-void/80 p-4 pr-12 font-mono text-[11px] leading-relaxed text-white/80"
        data-testid={testid}
      >
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2.5 right-2.5 p-2 rounded-md border border-white/10 text-white/50 hover:text-hydro-cyan hover:border-hydro-cyan/40 transition-colors"
        data-testid={`${testid}-copy`}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};

const Stat = ({ label, value, color, testid }) => (
  <div className="hx-panel rounded-xl px-4 py-3" data-testid={testid}>
    <div className="font-mono text-[10px] uppercase tracking-widest text-white/45">{label}</div>
    <div className="font-display font-black text-2xl mt-0.5" style={{ color: color || "#fff" }}>
      {value}
    </div>
  </div>
);

export default function Gateway() {
  const { wai, decision } = useScenario();
  const [prompt, setPrompt] = useState("Summarise our Q3 churn drivers in three bullets");
  const [tier, setTier] = useState("auto");
  const [lang, setLang] = useState("curl");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/gateway/v1/stats`);
      setStats(await res.json());
    } catch {
      /* stats are decorative */
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const body = useMemo(
    () => ({ prompt, ...(tier !== "auto" ? { tier } : {}), wai }),
    [prompt, tier, wai]
  );

  const snippets = useMemo(() => {
    const json = JSON.stringify(body, null, 2);
    return {
      curl: `curl -X POST ${API}/gateway/v1/complete \\
  -H "Content-Type: application/json" \\
  -H "X-HydroMind-Key: ${DEMO_KEY}" \\
  -d '${JSON.stringify(body)}'`,
      python: `import requests

r = requests.post(
    "${API}/gateway/v1/complete",
    headers={"X-HydroMind-Key": "${DEMO_KEY}"},
    json=${json.replace(/\n/g, "\n    ")},
)
gate = r.json()
if gate["decision"] == "allow":
    print(gate["completion"])
else:
    print("deferred until WAI >=", gate["retry_when_wai_gte"])`,
      javascript: `const res = await fetch("${API}/gateway/v1/complete", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-HydroMind-Key": "${DEMO_KEY}",
  },
  body: JSON.stringify(${json.replace(/\n/g, "\n  ")}),
});
const gate = await res.json();
gate.decision === "allow" ? render(gate.completion) : retryLater(gate.retry_when_wai_gte);`,
    };
  }, [body]);

  const sendRequest = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/gateway/v1/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-HydroMind-Key": DEMO_KEY },
        body: JSON.stringify(body),
      });
      setResult(await res.json());
      loadStats();
    } catch (e) {
      setResult({ error: "network_error", message: "Could not reach the gateway." });
    } finally {
      setBusy(false);
    }
  };

  const allowed = result?.decision === "allow";

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-10 relative z-10" data-testid="gateway-page">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8 flex-wrap">
        <div className="p-3 rounded-xl border border-hydro-cyan/40 bg-hydro-cyan/10 hx-glow-cyan">
          <Plug className="w-7 h-7 text-hydro-cyan" />
        </div>
        <div className="flex-1 min-w-[280px]">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan/70 mb-1">
            Water gateway · v1
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter uppercase leading-none">
            Drop it in front<br />of your AI traffic
          </h1>
          <p className="text-white/70 text-base mt-4 max-w-2xl leading-relaxed">
            HydroMind-X is not a dashboard you have to watch — it is one line in front of your
            model calls. Point your existing completion request at the gateway and every prompt is
            classified, priced against live water availability, and either served or deferred.
            No SDK rewrite, no new model contracts.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 font-mono text-[10px] uppercase tracking-widest"
          data-testid="gateway-wai-chip"
        >
          <Droplets className="w-3.5 h-3.5 text-hydro-cyan" />
          Live telemetry · WAI {wai}
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
            style={{ background: decision?.color, boxShadow: `0 0 8px ${decision?.color}` }}
          />
          <span className="text-white/50">{decision?.band}</span>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" data-testid="gateway-stats">
          <Stat label="Requests gated" value={stats.total_requests} testid="gateway-stat-total" />
          <Stat label="Served" value={stats.allowed} color="#2BFF88" testid="gateway-stat-allowed" />
          <Stat label="Deferred" value={stats.deferred} color="#FF5C00" testid="gateway-stat-deferred" />
          <Stat
            label="Water saved"
            value={`${(stats.water_saved_ml / 1000).toFixed(2)} L`}
            color="#00F0FF"
            testid="gateway-stat-saved"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playground */}
        <div className="hx-glass rounded-2xl p-5 sm:p-6 space-y-4" data-testid="gateway-playground">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-hydro-cyan" />
            <h2 className="font-display font-bold text-lg tracking-tight uppercase">
              Try a live request
            </h2>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full bg-hydro-void/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-hydro-cyan/50 transition-colors resize-none"
            placeholder="Any prompt your product would send to an LLM…"
            data-testid="gateway-prompt-input"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/45 mr-1">
              Tier
            </span>
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className="px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest border transition-colors"
                style={
                  tier === t
                    ? {
                        color: TIER_COLOR[t] || "#00F0FF",
                        borderColor: (TIER_COLOR[t] || "#00F0FF") + "66",
                        background: (TIER_COLOR[t] || "#00F0FF") + "14",
                      }
                    : { color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.12)" }
                }
                data-testid={`gateway-tier-${t.toLowerCase()}`}
              >
                {t === "auto" ? "Auto-classify" : t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={sendRequest}
            disabled={busy || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-hydro-cyan text-hydro-void font-mono text-xs uppercase tracking-widest disabled:opacity-40 hover:hx-glow-cyan transition-shadow"
            data-testid="gateway-send-btn"
          >
            <Send className="w-4 h-4" />
            {busy ? "Gating request…" : "Send through gateway"}
          </button>

          {result && !result.error && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
              data-testid="gateway-result"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-widest ${
                    allowed
                      ? "border-hydro-green/50 bg-hydro-green/10 text-hydro-green"
                      : "border-hydro-orange/50 bg-hydro-orange/10 text-hydro-orange"
                  }`}
                  data-testid="gateway-decision"
                >
                  {allowed ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {result.decision === "allow" ? "200 · Allow" : "429 · Defer"}
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded border"
                  style={{
                    color: TIER_COLOR[result.tier],
                    borderColor: TIER_COLOR[result.tier] + "55",
                    background: TIER_COLOR[result.tier] + "12",
                  }}
                  data-testid="gateway-tier-badge"
                >
                  {result.tier} · min WAI {result.min_wai}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                  {result.latency_ms} ms · {result.model}
                </span>
              </div>

              <div className="rounded-lg border border-white/10 bg-hydro-void/60 p-4 text-sm text-white/85 whitespace-pre-wrap leading-relaxed">
                {allowed ? result.completion : result.reason}
              </div>

              {!allowed && (
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-hydro-cyan">
                  <Droplets className="w-3.5 h-3.5" />
                  {result.water_saved_ml} ml of cooling water not drawn
                </div>
              )}

              <details className="group">
                <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/70 flex items-center gap-2">
                  <Braces className="w-3.5 h-3.5" /> Raw JSON response
                </summary>
                <pre
                  className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-hydro-void/80 p-4 font-mono text-[11px] leading-relaxed text-white/70"
                  data-testid="gateway-raw-json"
                >
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </motion.div>
          )}

          {result?.error && (
            <div className="rounded-lg border border-hydro-orange/40 bg-hydro-orange/10 p-4 text-sm text-white/85">
              {result.message || result.error}
            </div>
          )}
        </div>

        {/* Snippets */}
        <div className="hx-glass rounded-2xl p-5 sm:p-6 space-y-4" data-testid="gateway-snippets">
          <div className="flex items-center gap-2 flex-wrap">
            <Activity className="w-4 h-4 text-hydro-cyan" />
            <h2 className="font-display font-bold text-lg tracking-tight uppercase">
              Three lines to integrate
            </h2>
            <div className="ml-auto flex items-center gap-1">
              {["curl", "python", "javascript"].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    lang === l
                      ? "bg-hydro-cyan/15 text-hydro-cyan border border-hydro-cyan/40"
                      : "text-white/45 border border-transparent hover:text-white/80"
                  }`}
                  data-testid={`gateway-lang-${l}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <CodeBlock code={snippets[lang]} testid="gateway-code" />

          <div className="space-y-3 pt-2">
            {[
              {
                t: "1 · Classify",
                d: "Send the prompt you already send. The gateway tiers it Critical, Important or Flexible — or you declare the tier yourself.",
              },
              {
                t: "2 · Price it in water",
                d: "The tier is compared against live WAI from your cooling telemetry. Life-safety traffic always clears; discretionary traffic yields during stress.",
              },
              {
                t: "3 · Serve or defer",
                d: "You get a completion, or a 'defer' with the exact WAI to retry at — so your client can queue instead of failing.",
              },
            ].map((s) => (
              <div key={s.t} className="flex gap-3">
                <ArrowRight className="w-3.5 h-3.5 text-hydro-cyan mt-1 shrink-0" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-hydro-cyan/90">
                    {s.t}
                  </div>
                  <p className="text-white/65 text-sm leading-relaxed mt-0.5">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-xs text-white/45 leading-relaxed">
            Demo key <span className="font-mono text-hydro-cyan">{DEMO_KEY}</span> is open for
            judges. Change the WAI on the{" "}
            <Link to="/" className="text-hydro-cyan hover:underline">
              Dashboard
            </Link>{" "}
            sliders, or watch the gate in a full conversation in{" "}
            <Link to="/proto/universal" className="text-hydro-cyan hover:underline">
              protoV1
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
