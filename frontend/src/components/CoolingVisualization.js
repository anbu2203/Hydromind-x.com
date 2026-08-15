import React from "react";
import { motion } from "framer-motion";
import { Server, Fan, Recycle, Droplets, Wind, ThermometerSun } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";

// Explains HOW cooling is done, adapting the animated schematic to the active strategy.
const STRATEGY_META = {
  "Normal Liquid Cooling": {
    flow: "cyan", speed: 0.9, liquidPct: 100, recyclePct: 10, dryPct: 0,
    blurb: "Coolant is pumped through cold plates on every rack, absorbing heat, then dumped to an evaporative cooling tower. Maximum thermal performance, highest freshwater draw — used only when water is abundant.",
  },
  "Optimized Cooling": {
    flow: "cyan", speed: 1.1, liquidPct: 85, recyclePct: 35, dryPct: 15,
    blurb: "Same liquid loop, but variable-speed pumps and fans trim waste, and condensate + greywater recycling begins feeding the tower to reduce fresh intake.",
  },
  "Hybrid Cooling": {
    flow: "yellow", speed: 1.4, liquidPct: 55, recyclePct: 60, dryPct: 45,
    blurb: "Liquid loops blend with air-side / dry coolers to cut evaporative loss. Flexible workloads are postponed to lower heat load while recycled water carries most of the duty.",
  },
  "Dry/Hybrid Cooling": {
    flow: "orange", speed: 1.9, liquidPct: 25, recyclePct: 85, dryPct: 75,
    blurb: "Mostly dry air-cooling with a minimal liquid trim. Freshwater is nearly cut off, recycled water is maximized, and only critical workloads keep running.",
  },
  "Emergency Cooling": {
    flow: "orange", speed: 2.4, liquidPct: 10, recyclePct: 100, dryPct: 95,
    blurb: "Closed-loop emergency mode: freshwater draw is suspended entirely, dry coolers run at max, and only emergency-services workloads are kept alive to conserve every drop.",
  },
};

const COLORS = { cyan: "#00F0FF", yellow: "#FFD700", orange: "#FF5C00" };

const Bar = ({ label, pct, color }) => (
  <div>
    <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-white/50 mb-1">
      <span>{label}</span>
      <span style={{ color }}>{pct}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
    </div>
  </div>
);

const Node = ({ x, y, w, h, icon: Icon, title, sub, color }) => (
  <div
    className="absolute hx-panel rounded-lg flex flex-col items-center justify-center text-center px-2"
    style={{ left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, borderColor: `${color}44` }}
  >
    <Icon className="w-6 h-6 mb-1" style={{ color }} />
    <div className="font-mono text-[10px] uppercase tracking-wider text-white/85 leading-tight">{title}</div>
    {sub && <div className="font-mono text-[9px] text-white/40">{sub}</div>}
  </div>
);

export const CoolingVisualization = () => {
  const { decision, inputs, wai } = useScenario();
  const meta = STRATEGY_META[decision.cooling];
  const color = COLORS[meta.flow];

  // Flowing pipe: cold plates -> heat exchanger -> cooling tower -> recycle back
  const pipe = "M 150 90 L 340 90 L 340 200 L 150 200 Z";

  return (
    <div className="hx-panel rounded-xl p-6 relative overflow-hidden" data-testid="cooling-visualization">
      <div className="absolute inset-0 hx-scanlines opacity-30 pointer-events-none" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display font-bold text-2xl tracking-tight uppercase">Cooling System</h3>
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mt-1">
            Live schematic · adapts to AI strategy
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg border font-mono text-sm uppercase tracking-wider"
          style={{ color, borderColor: `${color}55`, background: `${color}12` }} data-testid="cooling-active-strategy">
          {decision.cooling}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Schematic */}
        <div className="lg:col-span-3 relative rounded-lg bg-hydro-void/60 border border-white/5" style={{ height: 300 }}>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="xMidYMid meet">
            <path d={pipe} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
            <motion.path
              d={pipe} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
              strokeDasharray="14 20"
              animate={{ strokeDashoffset: [0, -68] }}
              transition={{ repeat: Infinity, ease: "linear", duration: meta.speed }}
              style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            />
            {/* heat glow near racks */}
            <motion.circle cx={150} cy={90} r={8} fill={color}
              animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.6 }} />
          </svg>

          <Node x="20" y="55" w="120" h="70" icon={Server} title="AI Racks" sub={`Load ${inputs.coolingDemand}%`} color={color} />
          <Node x="290" y="55" w="110" h="70" icon={ThermometerSun} title="Heat Exchanger" color={color} />
          <Node x="290" y="170" w="110" h="70" icon={meta.dryPct > 60 ? Wind : Fan} title={meta.dryPct > 60 ? "Dry Cooler" : "Cooling Tower"} color={color} />
          <Node x="20" y="170" w="120" h="70" icon={Recycle} title="Recycle Loop" sub={`${meta.recyclePct}%`} color={color} />
        </div>

        {/* Explanation + mix */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-sm text-white/70 leading-relaxed" data-testid="cooling-blurb">{meta.blurb}</p>
          <div className="space-y-3">
            <Bar label="Liquid Cooling" pct={meta.liquidPct} color={COLORS.cyan} />
            <Bar label="Dry / Air Cooling" pct={meta.dryPct} color={COLORS.orange} />
            <Bar label="Recycled Water" pct={meta.recyclePct} color={COLORS.yellow} />
          </div>
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] text-white/50">
            <Droplets className="w-4 h-4 text-hydro-cyan" />
            WAI <span style={{ color: decision.color }}>{wai}</span> drives this configuration in real time.
          </div>
        </div>
      </div>
    </div>
  );
};
