import React from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

const MSG_ANIM = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

const Avatar = ({ role }) => (
  <div
    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border ${
      role === "user" ? "bg-white/5 border-white/15" : "bg-hydro-cyan/10 border-hydro-cyan/30"
    }`}
  >
    {role === "user" ? (
      <User className="w-4 h-4 text-white/70" />
    ) : (
      <Bot className="w-4 h-4 text-hydro-cyan" />
    )}
  </div>
);

const Bubble = ({ role, content, showThinking }) => (
  <div
    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
      role === "user"
        ? "bg-hydro-cyan/15 border border-hydro-cyan/25 text-white"
        : "hx-panel text-white/85"
    }`}
  >
    {content ||
      (showThinking ? (
        <span className="font-mono text-hydro-cyan animate-pulse-glow">HYDRA is thinking…</span>
      ) : (
        ""
      ))}
  </div>
);

export const MessageList = React.forwardRef(({ messages, streaming }, ref) => (
  <div ref={ref} className="flex-1 overflow-y-auto p-5 space-y-5" data-testid="chat-messages">
    {messages.map((m, i) => (
      <motion.div
        key={m.id}
        {...MSG_ANIM}
        className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
        data-testid={`chat-msg-${m.role}`}
      >
        <Avatar role={m.role} />
        <Bubble
          role={m.role}
          content={m.content}
          showThinking={streaming && i === messages.length - 1}
        />
      </motion.div>
    ))}
  </div>
));

MessageList.displayName = "MessageList";
