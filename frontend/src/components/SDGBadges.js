import React from "react";

const SDGS = [
  { n: 6, label: "Clean Water & Sanitation", color: "#26BDE2" },
  { n: 9, label: "Industry, Innovation & Infrastructure", color: "#FD6925" },
  { n: 11, label: "Sustainable Cities & Communities", color: "#FD9D24" },
  { n: 12, label: "Responsible Consumption", color: "#BF8B2E" },
  { n: 13, label: "Climate Action", color: "#3F7E44" },
];

export const SDGBadges = () => (
  <div data-testid="sdg-badges">
    <h3 className="font-display font-bold text-xl tracking-tight uppercase mb-1">UN Sustainable Goals</h3>
    <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-4">
      HydroMind-X advances five global goals
    </p>
    <div className="flex flex-wrap gap-3">
      {SDGS.map((s) => (
        <div
          key={s.n}
          className="hx-panel rounded-lg p-4 flex items-center gap-3 min-w-[150px] flex-1 hover:-translate-y-1 transition-transform"
          data-testid={`sdg-${s.n}`}
        >
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center font-display font-black text-lg shrink-0"
            style={{ background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}55` }}
          >
            {s.n}
          </div>
          <span className="text-xs text-white/70 leading-tight">{s.label}</span>
        </div>
      ))}
    </div>
  </div>
);
