import React from "react";
import { motion } from "framer-motion";
import { HeartPulse, Landmark, FlaskConical } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";
import { WORKLOADS } from "../lib/hydro";

const TIERS = [
  { key: "Critical", icon: HeartPulse, note: "Always allowed" },
  { key: "Important", icon: Landmark, note: "Allowed unless severe scarcity" },
  { key: "Flexible", icon: FlaskConical, note: "Delayed during water stress" },
];

export const WorkloadBoard = () => {
  const { decision } = useScenario();
  return (
    <div data-testid="workload-board">
      <h3 className="font-display font-bold text-xl tracking-tight uppercase mb-1">Workload Orchestration</h3>
      <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-4">
        Live run / delay status by priority tier
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const active = decision.allowedTiers.includes(tier.key);
          return (
            <div
              key={tier.key}
              className="hx-panel rounded-xl p-5"
              style={{ borderColor: active ? "rgba(43,255,136,0.25)" : "rgba(255,92,0,0.25)" }}
              data-testid={`workload-tier-${tier.key}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <tier.icon className={`w-4 h-4 ${active ? "text-hydro-green" : "text-hydro-orange"}`} />
                  <span className="font-display font-bold text-sm uppercase tracking-wide">{tier.key}</span>
                </div>
                <span
                  className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  style={{
                    color: active ? "#2BFF88" : "#FF5C00",
                    borderColor: active ? "#2BFF8855" : "#FF5C0055",
                    background: active ? "#2BFF8812" : "#FF5C0012",
                  }}
                >
                  {active ? "Running" : "Delayed"}
                </span>
              </div>
              <p className="font-mono text-[10px] text-white/40 mb-3">{tier.note}</p>
              <div className="space-y-2">
                {WORKLOADS[tier.key].map((w) => (
                  <div key={w} className="flex items-center gap-2 text-sm">
                    <motion.span
                      animate={{ opacity: active ? [1, 0.4, 1] : 1 }}
                      transition={{ repeat: active ? Infinity : 0, duration: 2 }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: active ? "#2BFF88" : "#FF5C00" }}
                    />
                    <span className={active ? "text-white/85" : "text-white/40 line-through"}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
