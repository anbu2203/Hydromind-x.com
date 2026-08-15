import React from "react";
import { Thermometer, Droplet, Waves, Gauge, Database, Cpu, RotateCcw } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";
import { WEATHER_OPTIONS } from "../lib/hydro";

const Slider = ({ icon: Icon, label, value, unit, min, max, step = 1, onChange, warn, testid }) => (
  <div className="hx-panel rounded-lg p-4" data-testid={`slider-wrap-${testid}`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${warn ? "text-hydro-orange" : "text-hydro-cyan"}`} />
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/70">{label}</span>
      </div>
      <span
        className="font-mono font-bold text-sm"
        style={{ color: warn ? "#FF5C00" : "#00F0FF" }}
        data-testid={`slider-value-${testid}`}
      >
        {value}
        <span className="text-white/40 text-[10px] ml-0.5">{unit}</span>
      </span>
    </div>
    <input
      type="range"
      className={`hx-range ${warn ? "warn" : ""}`}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      data-testid={`slider-${testid}`}
    />
  </div>
);

export const ScenarioSimulator = () => {
  const { inputs, setInput, reset } = useScenario();
  return (
    <div className="space-y-4" data-testid="scenario-simulator">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-xl tracking-tight uppercase">Scenario Simulator</h3>
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mt-1">
            Adjust live IoT inputs · instant WAI recompute
          </p>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md hx-panel text-white/60 hover:text-hydro-cyan transition-colors font-mono text-[11px] uppercase"
          data-testid="simulator-reset"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Slider icon={Thermometer} label="Temperature" unit="°C" min={18} max={45} value={inputs.temperature}
          onChange={(v) => setInput("temperature", v)} warn={inputs.temperature > 34} testid="temperature" />
        <Slider icon={Droplet} label="Humidity" unit="%" min={10} max={95} value={inputs.humidity}
          onChange={(v) => setInput("humidity", v)} testid="humidity" />
        <Slider icon={Waves} label="Water Level" unit="%" min={0} max={100} value={inputs.waterLevel}
          onChange={(v) => setInput("waterLevel", v)} warn={inputs.waterLevel < 35} testid="waterLevel" />
        <Slider icon={Gauge} label="Water Flow" unit="L/min" min={0} max={240} value={inputs.waterFlow}
          onChange={(v) => setInput("waterFlow", v)} warn={inputs.waterFlow < 60} testid="waterFlow" />
        <Slider icon={Database} label="Reservoir" unit="%" min={0} max={100} value={inputs.reservoir}
          onChange={(v) => setInput("reservoir", v)} warn={inputs.reservoir < 35} testid="reservoir" />
        <Slider icon={Cpu} label="Cooling Demand" unit="%" min={0} max={100} value={inputs.coolingDemand}
          onChange={(v) => setInput("coolingDemand", v)} warn={inputs.coolingDemand > 70} testid="coolingDemand" />
      </div>

      <div className="hx-panel rounded-lg p-4" data-testid="weather-selector">
        <div className="font-mono text-[11px] uppercase tracking-wider text-white/70 mb-3">Weather Forecast</div>
        <div className="flex flex-wrap gap-2">
          {WEATHER_OPTIONS.map((w) => {
            const active = inputs.weather === w.key;
            return (
              <button
                key={w.key}
                onClick={() => setInput("weather", w.key)}
                data-testid={`weather-${w.key.replace(/[^a-zA-Z]/g, "")}`}
                className={`px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider border transition-colors ${
                  active
                    ? "border-hydro-cyan text-hydro-cyan bg-hydro-cyan/10"
                    : "border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
