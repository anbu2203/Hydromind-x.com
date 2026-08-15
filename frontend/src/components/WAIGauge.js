import React from "react";
import { motion } from "framer-motion";
import { useScenario } from "../context/ScenarioContext";

// Custom SVG radial gauge with animated stroke.
export const WAIGauge = () => {
  const { wai, decision } = useScenario();
  const size = 240;
  const stroke = 16;
  const r = (size - stroke) / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  // 270deg arc
  const startAngle = 135;
  const sweep = 270;
  const circumference = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circumference;
  const progress = (wai / 100) * arcLen;

  const polar = (angle) => {
    const a = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const p0 = polar(startAngle);
  const p1 = polar(startAngle + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  const trackPath = `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`;

  return (
    <div
      className="hx-panel rounded-xl p-6 relative overflow-hidden flex flex-col items-center"
      data-testid="wai-gauge"
    >
      <div className="absolute inset-0 hx-scanlines opacity-40 pointer-events-none" />
      <div
        className="absolute -inset-1 rounded-xl pointer-events-none animate-pulse-glow"
        style={{ boxShadow: `inset 0 0 60px ${decision.color}22` }}
      />
      <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan/70 mb-2 self-start">
        Water Availability Index
      </div>

      <div className="relative" style={{ width: size, height: size * 0.86 }}>
        <svg width={size} height={size} className="overflow-visible">
          <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} strokeLinecap="round" />
          <motion.path
            d={trackPath}
            fill="none"
            stroke={decision.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circumference}`}
            initial={false}
            animate={{ strokeDashoffset: arcLen - progress }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
            style={{ filter: `drop-shadow(0 0 8px ${decision.color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <motion.div
            key={wai}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-mono font-bold text-6xl leading-none"
            style={{ color: decision.color, textShadow: `0 0 20px ${decision.color}88` }}
            data-testid="wai-value"
          >
            {wai}
          </motion.div>
          <div className="font-mono text-[10px] tracking-widest text-white/40 mt-1">/ 100</div>
          <div
            className="mt-3 px-3 py-1 rounded-full font-mono text-xs uppercase tracking-wider border"
            style={{ color: decision.color, borderColor: `${decision.color}55`, background: `${decision.color}12` }}
            data-testid="wai-band"
          >
            {decision.band} · {decision.range}
          </div>
        </div>
      </div>
    </div>
  );
};
