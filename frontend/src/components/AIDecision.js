import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, Recycle, ListChecks, AlertTriangle } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";

export const AIDecision = () => {
  const { decision, wai } = useScenario();
  const critical = wai <= 40;

  const rows = [
    { icon: Snowflake, label: "Cooling Strategy", value: decision.cooling, testid: "decision-cooling" },
    { icon: ListChecks, label: "Workload Priority", value: decision.priorityNote, testid: "decision-priority" },
    { icon: Recycle, label: "Water Action", value: decision.action, testid: "decision-action" },
  ];

  return (
    <div className="hx-panel rounded-xl p-6 relative overflow-hidden" data-testid="ai-decision">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: decision.color, boxShadow: `0 0 10px ${decision.color}` }} />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan/70">
          HYDRA · AI Decision Engine
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={decision.band}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3" data-testid={r.testid}>
              <div
                className="mt-0.5 p-2 rounded-md border"
                style={{ borderColor: `${decision.color}44`, background: `${decision.color}10` }}
              >
                <r.icon className="w-4 h-4" style={{ color: decision.color }} />
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[10px] tracking-widest uppercase text-white/40">{r.label}</div>
                <div className="font-semibold text-sm leading-snug" style={{ color: r.label === "Cooling Strategy" ? decision.color : "#fff" }}>
                  {r.value}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {critical && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md border border-hydro-orange/40 bg-hydro-orange/10"
          data-testid="decision-alert"
        >
          <AlertTriangle className="w-4 h-4 text-hydro-orange animate-pulse-glow" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-hydro-orange">
            Water stress alert — conservation protocol active
          </span>
        </motion.div>
      )}
    </div>
  );
};
