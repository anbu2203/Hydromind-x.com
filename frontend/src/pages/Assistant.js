import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Droplets } from "lucide-react";

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
  const scrollRef = useRef(null);

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
        <div>
          <h1 className="font-display font-black text-3xl tracking-tighter uppercase">HYDRA Assistant</h1>
          <p className="font-mono text-[10px] tracking-widest uppercase text-hydro-cyan/60">
            Powered by Gemini · knows everything about HydroMind-X
          </p>
        </div>
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
            placeholder="Ask HYDRA about HydroMind-X…"
            className="flex-1 bg-hydro-void/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-hydro-cyan/50 transition-colors"
            data-testid="chat-input"
          />
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
