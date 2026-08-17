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

      <article className="hx-panel rounded-xl p-6 sm:p-8 space-y-5 max-w-4xl" data-testid="cooling-article">
        <h2 className="font-display font-bold text-2xl tracking-tight uppercase">
          Water-Aware Cooling, Explained
        </h2>
        <p className="text-white/70 leading-relaxed">
          Every large AI data center faces the same physics problem: the more calculations its servers
          perform, the more heat they release. Left unmanaged, that heat throttles performance and shortens
          hardware life, so operators pump the excess energy outside using cooling systems. The most common
          approach — evaporative and liquid cooling — is extremely effective but thirsty, evaporating
          thousands of litres of clean freshwater every hour. HydroMind-X exists to make that water use
          intelligent instead of automatic, matching the cooling method to how much water is actually
          available at any given moment.
        </p>
        <h3 className="font-display font-semibold text-lg tracking-tight text-hydro-cyan">
          The five cooling modes
        </h3>
        <p className="text-white/70 leading-relaxed">
          <strong className="text-white">Normal Liquid Cooling</strong> runs a coolant loop through cold
          plates mounted directly on the hottest chips, carrying heat to an evaporative cooling tower. It
          delivers the best thermal performance and is chosen only when the Water Availability Index is
          excellent. As water tightens, <strong className="text-white">Optimized Cooling</strong> keeps the
          same loop but tunes pump and fan speeds and begins recycling condensate and greywater to shrink
          freshwater intake.
        </p>
        <p className="text-white/70 leading-relaxed">
          When conditions turn moderate, <strong className="text-white">Hybrid Cooling</strong> blends liquid
          loops with air-side and dry coolers, cutting evaporative losses while HydroMind-X postpones flexible
          workloads to lower the total heat load. In a low-water state,{" "}
          <strong className="text-white">Dry/Hybrid Cooling</strong> shifts almost entirely to air cooling
          with a minimal liquid trim, maximizing recycled water and reserving capacity for critical services.
          Finally, <strong className="text-white">Emergency Cooling</strong> suspends freshwater draw
          altogether, running a closed dry loop that keeps only emergency-services workloads alive so that
          every remaining drop is conserved for the community.
        </p>
        <h3 className="font-display font-semibold text-lg tracking-tight text-hydro-cyan">
          Why it matters for sustainability
        </h3>
        <p className="text-white/70 leading-relaxed">
          By continuously auditing water and adapting cooling in real time, HydroMind-X reduces unnecessary
          freshwater consumption during droughts, improves transparency for regulators and communities, and
          keeps essential digital infrastructure online even under stress. This directly supports UN
          Sustainable Development Goals for clean water, resilient infrastructure, responsible consumption and
          climate action — proving that high-performance AI and careful resource stewardship can coexist.
        </p>
      </article>
    </div>
  );
}

