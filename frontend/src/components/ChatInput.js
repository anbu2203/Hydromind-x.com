import React from "react";
import { Send, Mic, Square } from "lucide-react";

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  streaming,
  listening,
  speechSupported,
  onToggleListen,
}) => (
  <form
    onSubmit={onSubmit}
    className="p-4 border-t border-white/10 flex items-center gap-3"
  >
    <input
      value={input}
      onChange={(e) => onChange(e.target.value)}
      placeholder={listening ? "Listening…" : "Ask HYDRA about HydroMind-X…"}
      className="flex-1 bg-hydro-void/60 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-hydro-cyan/50 transition-colors"
      data-testid="chat-input"
    />
    {speechSupported && (
      <button
        type="button"
        onClick={onToggleListen}
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
);
