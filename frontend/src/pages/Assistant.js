import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Droplets, Mic, Square, Volume2, VolumeX } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SUGGESTIONS = [
  "What is HydroMind-X in one sentence?",
  "How does the Water Availability Index work?",
  "What happens to AI workloads during a drought?",
  "Which SDGs does this support and why?",
  "Why should investors care about data-center water use?",
];

const genId = () => Math.random().toString(36).slice(2);

export default function Assistant() {
  const [sessionId] = useState(genId);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm HYDRA — the AI assistant for HydroMind-X. Ask me anything about our water intelligence system, the WAI, cooling strategies, or why sustainable AI matters.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOut, setVoiceOut] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceOutRef = useRef(false);

  useEffect(() => {
    voiceOutRef.current = voiceOut;
    if (!voiceOut && typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [voiceOut]);

  const speechSupported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  const speak = (text) => {
    if (!voiceOutRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    const clean = text.replace(/[*#_`>]/g, "").replace(/\s+/g, " ").trim();
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 1.03;
    u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /female|samantha|google us english|zira/i.test(v.name)) || voices.find((v) => v.lang?.startsWith("en"));
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  };

  const toggleListen = () => {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      setInput(finalText || interim);
    };
    rec.onend = () => {
      setListening(false);
      const q = (finalText || "").trim();
      if (q) send(q);
    };
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message: q }),
      });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.delta) {
            assistantText += payload.delta;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                role: "assistant",
                content: copy[copy.length - 1].content + payload.delta,
              };
              return copy;
            });
          } else if (payload.error) {
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: "⚠️ " + payload.error };
              return copy;
            });
          }
        }
      }
      speak(assistantText);
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Connection error. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 relative z-10" data-testid="assistant-page">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 rounded-lg bg-hydro-cyan/10 border border-hydro-cyan/30">
          <Droplets className="w-6 h-6 text-hydro-cyan text-glow-cyan" />
        </div>
        <div className="flex-1">
          <h1 className="font-display font-black text-3xl tracking-tighter uppercase">HYDRA Assistant</h1>
          <p className="font-mono text-[10px] tracking-widest uppercase text-hydro-cyan/60">
            Powered by Gemini · knows everything about HydroMind-X
          </p>
        </div>
        <button
          onClick={() => setVoiceOut((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-[11px] uppercase tracking-wider transition-colors ${
            voiceOut
              ? "border-hydro-cyan/50 text-hydro-cyan bg-hydro-cyan/10"
              : "border-white/10 text-white/50 hover:text-white"
          }`}
          data-testid="voice-output-toggle"
          title="Speak HYDRA's answers aloud"
        >
          {voiceOut ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden sm:inline">Voice {voiceOut ? "On" : "Off"}</span>
        </button>
      </div>

      <div className="hx-glass rounded-2xl overflow-hidden flex flex-col" style={{ height: "62vh", minHeight: 420 }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5" data-testid="chat-messages">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              data-testid={`chat-msg-${m.role}`}
            >
              <div
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
                  m.role === "user"
                    ? "bg-white/5 border-white/15"
                    : "bg-hydro-cyan/10 border-hydro-cyan/30"
                }`}
              >
                {m.role === "user" ? (
                  <User className="w-4 h-4 text-white/70" />
                ) : (
                  <Bot className="w-4 h-4 text-hydro-cyan" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-hydro-cyan/15 border border-hydro-cyan/25 text-white"
                    : "hx-panel text-white/85"
                }`}
              >
                {m.content ||
                  (streaming && i === messages.length - 1 ? (
                    <span className="font-mono text-hydro-cyan animate-pulse-glow">HYDRA is thinking…</span>
                  ) : (
                    ""
                  ))}
              </div>
            </motion.div>
          ))}
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2" data-testid="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-hydro-cyan hover:border-hydro-cyan/40 text-xs transition-colors"
                data-testid="chat-suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-4 border-t border-white/10 flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "Ask HYDRA about HydroMind-X…"}
            className="flex-1 bg-hydro-void/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-hydro-cyan/50 transition-colors"
            data-testid="chat-input"
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleListen}
              className={`p-3 rounded-lg border transition-colors ${
                listening
                  ? "bg-hydro-orange/20 border-hydro-orange/50 text-hydro-orange animate-pulse-glow"
                  : "hx-panel text-white/60 hover:text-hydro-cyan"
              }`}
              data-testid="voice-input-btn"
              title="Ask by voice"
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="p-3 rounded-lg bg-hydro-cyan text-hydro-void disabled:opacity-40 hover:hx-glow-cyan transition-shadow"
            data-testid="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
