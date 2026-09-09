import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2, CloudSun } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";
import { projectTomorrow } from "../lib/hydro";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ForecastCard = () => {
  const { inputs } = useScenario();
  const forecast = useMemo(() => projectTomorrow(inputs), [inputs]);
  const [advisory, setAdvisory] = useState("");
  const [loading, setLoading] = useState(false);

  const { tomorrowWai, todayWai, decision, points, delta } = forecast;
  const TrendIcon = delta < -1 ? TrendingDown : delta > 1 ? TrendingUp : Minus;
  const trendColor = delta < -1 ? "#FF5C00" : delta > 1 ? "#2BFF88" : "#A0A0B0";

  const getAdvisory = async () => {
    setLoading(true);
    setAdvisory("");
    try {
      const res = await fetch(`${API}/forecast/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          today_wai: todayWai,
          tomorrow_wai: tomorrowWai,
          tomorrow_band: decision.band,
          weather: inputs.weather,
        }),
      });
      const data = await res.json();
      setAdvisory(data.advisory);
    } catch (e) {
      setAdvisory("Advisory unavailable — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-panel rounded-xl p-6 relative overflow-hidden" data-testid="forecast-card">
      <div className="absolute inset-0 hx-scanlines opacity-25 pointer-events-none" />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h3 className="font-display font-bold text-xl tracking-tight uppercase">Predictive Water-Risk Forecast</h3>
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/40">
          <CloudSun className="w-4 h-4 text-hydro-cyan" /> {inputs.weather} · 24h outlook
        </div>
      </div>
      <p className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-5">
        HYDRA projects tomorrow's WAI from the weather trend
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
        <div className="lg:col-span-3 h-[180px]" data-testid="forecast-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
            <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="waiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={decision.color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={decision.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: "#66667a", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#66667a", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0D0D14", border: "1px solid rgba(0,240,255,0.3)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                labelStyle={{ color: "#00F0FF" }}
                formatter={(v) => [`${v}`, "WAI"]}
              />
              <ReferenceLine y={40} stroke="#FF5C00" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="wai" stroke={decision.color} strokeWidth={2.5} fill="url(#waiGrad)" dot={{ r: 3, fill: decision.color }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-end gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Now</div>
              <div className="font-mono font-bold text-3xl">{todayWai}</div>
            </div>
            <TrendIcon className="w-6 h-6 mb-2" style={{ color: trendColor }} />
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/40">Tomorrow</div>
              <motion.div key={tomorrowWai} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                className="font-mono font-bold text-3xl" style={{ color: decision.color }} data-testid="forecast-tomorrow-wai">
                {tomorrowWai}
              </motion.div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-mono text-[11px] uppercase tracking-wider"
            style={{ color: decision.color, borderColor: `${decision.color}55`, background: `${decision.color}12` }}
            data-testid="forecast-risk-badge">
            Predicted: {decision.band} risk ({delta >= 0 ? "+" : ""}{delta} WAI)
          </div>

          <button
            onClick={getAdvisory}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-hydro-cyan/15 border border-hydro-cyan/40 text-hydro-cyan font-mono text-xs uppercase tracking-wider hover:bg-hydro-cyan/25 transition-colors disabled:opacity-50"
            data-testid="forecast-advisory-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Get HYDRA pre-warning
          </button>
        </div>
      </div>

      {advisory && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex gap-3 p-4 rounded-lg border"
          style={{ borderColor: `${decision.color}44`, background: `${decision.color}0D` }}
          data-testid="forecast-advisory-text"
        >
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: decision.color }} />
          <p className="text-sm leading-relaxed text-white/85">{advisory}</p>
        </motion.div>
      )}
    </div>
  );
};
