import React, { useCallback, useEffect, useRef, useState } from "react";
import { Droplets, Volume2, VolumeX } from "lucide-react";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { useVoiceChat } from "../hooks/useVoiceChat";

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

const GREETING = {
  id: "greeting",
  role: "assistant",
  content:
    "Hi, I'm HYDRA — the AI assistant for HydroMind-X. Ask me anything about our water intelligence system, the WAI, cooling strategies, or why sustainable AI matters.",
};

export default function Assistant() {
  const [sessionId] = useState(genId);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const streamingRef = useRef(false);

  const replaceLast = useCallback((content) => {
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { ...copy[copy.length - 1], content };
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text) => {
      const q = text.trim();
      if (!q || streamingRef.current) return;
      setInput("");
      const assistantId = genId();
      setMessages((m) => [
        ...m,
        { id: genId(), role: "user", content: q },
        { id: assistantId, role: "assistant", content: "" },
      ]);
      streamingRef.current = true;
      setStreaming(true);

      let assistantText = "";
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
              assistantText += payload.delta;
              replaceLast(assistantText);
            } else if (payload.error) {
              replaceLast("⚠️ " + payload.error);
            }
          }
        }
        speak(assistantText);
      } catch (e) {
        replaceLast("⚠️ Connection error. Please try again.");
      } finally {
        streamingRef.current = false;
        setStreaming(false);
      }
    },
    // speak is stable (useCallback in hook); replaceLast is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionId, replaceLast]
  );

  const { listening, voiceOut, setVoiceOut, speak, toggleListen, speechSupported } = useVoiceChat({
    onTranscript: setInput,
    onFinalTranscript: send,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, scrollRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
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
        <MessageList ref={scrollRef} messages={messages} streaming={streaming} />

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

        <ChatInput
          input={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          streaming={streaming}
          listening={listening}
          speechSupported={speechSupported}
          onToggleListen={toggleListen}
        />
      </div>

      <article className="mt-8 hx-panel rounded-xl p-6 sm:p-8 space-y-5" data-testid="assistant-article">
        <h2 className="font-display font-bold text-2xl tracking-tight uppercase">Meet HYDRA</h2>
        <p className="text-white/70 leading-relaxed">
          HYDRA is the conversational intelligence behind HydroMind-X — an AI-driven water intelligence system
          for sustainable data centers built by team AquaNova Trinity. Ask it anything about how the platform
          works and it responds in plain language, whether you are an investor sizing up the opportunity, a
          judge probing the technology, or an operator planning a deployment. HYDRA is grounded in the full
          HydroMind-X knowledge base and can also discuss the wider context of water sustainability,
          data-center cooling, and climate action.
        </p>
        <h3 className="font-display font-semibold text-lg tracking-tight text-hydro-cyan">
          What you can ask
        </h3>
        <p className="text-white/70 leading-relaxed">
          Try questions like “How is the Water Availability Index calculated?”, “What happens to AI workloads
          during a drought?”, “Which cooling strategy runs when water is scarce?”, or “Which Sustainable
          Development Goals does HydroMind-X advance and why?”. HYDRA can explain the difference between
          critical, important and flexible workloads, walk through the decision-logic table that maps the WAI
          to a cooling mode, and describe how continuous auditing replaces slow, periodic water reports with
          live, transparent monitoring.
        </p>
        <h3 className="font-display font-semibold text-lg tracking-tight text-hydro-cyan">
          Why it matters
        </h3>
        <p className="text-white/70 leading-relaxed">
          Modern AI data centers consume enormous amounts of freshwater to stay cool, yet water availability
          is rarely part of their operational decisions. HydroMind-X changes that by treating every drop as a
          resource to be measured, recycled and protected. HYDRA makes this vision accessible: instead of
          reading dashboards, you simply have a conversation, and the assistant translates live sensor data,
          weather forecasts and risk predictions into clear recommendations. Turn on Voice mode to ask
          questions out loud and hear spoken answers — ideal for a hands-free demo or presentation.
        </p>
      </article>
    </div>
  );
}
