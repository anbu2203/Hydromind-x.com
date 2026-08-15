import React from "react";
import { CoolingVisualization } from "../components/CoolingVisualization";
import { ScenarioSimulator } from "../components/ScenarioSimulator";
import { WAIGauge } from "../components/WAIGauge";

const STEPS = [
  { t: "1 · Sense", d: "IoT sensors on the ESP32 read temperature, humidity, water level, flow and reservoir state." },
  { t: "2 · Compute WAI", d: "HydroMind-X fuses sensors + weather into the Water Availability Index (0–100)." },
  { t: "3 · Select Cooling", d: "The AI picks Liquid → Optimized → Hybrid → Dry → Emergency cooling as water tightens." },
  { t: "4 · Recycle & Conserve", d: "Condensate and greywater are looped back, freshwater draw drops with scarcity." },
];

export default function Cooling() {
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-8 space-y-8 relative z-10" data-testid="cooling-page">
      <div>
        <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tighter uppercase">
          How <span className="text-hydro-cyan text-glow-cyan">Cooling</span> Works
        </h1>
        <p className="mt-3 text-white/60 max-w-2xl leading-relaxed">
          Move the sliders and watch the schematic reconfigure. As the Water Availability Index falls,
          HydroMind-X shifts from water-hungry liquid cooling toward dry, recycled and emergency modes.
        </p>
      </div>

      <CoolingVisualization />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScenarioSimulator />
        </div>
        <WAIGauge />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="cooling-steps">
        {STEPS.map((s) => (
          <div key={s.t} className="hx-panel rounded-xl p-5">
            <div className="font-mono text-hydro-cyan text-sm uppercase tracking-wider mb-2">{s.t}</div>
            <p className="text-sm text-white/65 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
