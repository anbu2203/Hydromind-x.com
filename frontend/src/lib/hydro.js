// HydroMind-X shared decision engine — single source of truth for WAI + AI decisions.

export const WEATHER_OPTIONS = [
  { key: "Rainy", label: "Rainy", adj: 12 },
  { key: "Cloudy", label: "Cloudy", adj: 4 },
  { key: "Clear", label: "Clear", adj: 0 },
  { key: "Hot & Dry", label: "Hot & Dry", adj: -8 },
  { key: "Drought", label: "Drought", adj: -16 },
];

export const DEFAULT_INPUTS = {
  temperature: 24, // °C  (18-45)
  humidity: 55, // %      (10-95)
  waterLevel: 78, // %    (0-100)
  waterFlow: 120, // L/min (0-240)
  reservoir: 82, // %     (0-100)
  coolingDemand: 45, // % (0-100)
  weather: "Clear",
};

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function computeWAI(inp) {
  const tempScore = clamp(100 - (inp.temperature - 18) * 3.2);
  const humidityScore = clamp(100 - Math.abs(inp.humidity - 55) * 1.1);
  const waterLevelScore = clamp(inp.waterLevel);
  const reservoirScore = clamp(inp.reservoir);
  const flowScore = clamp((inp.waterFlow / 240) * 100);
  const coolingScore = clamp(100 - inp.coolingDemand);
  const weatherAdj = (WEATHER_OPTIONS.find((w) => w.key === inp.weather) || {}).adj || 0;

  const wai =
    0.27 * waterLevelScore +
    0.21 * reservoirScore +
    0.18 * coolingScore +
    0.14 * tempScore +
    0.1 * flowScore +
    0.1 * humidityScore +
    weatherAdj;

  return Math.round(clamp(wai));
}

export const WORKLOADS = {
  Critical: ["Hospitals", "Emergency Response", "Disaster Warning", "Cybersecurity"],
  Important: ["Banking Systems", "Educational Platforms", "Government Services", "Communication Networks"],
  Flexible: ["AI Model Training", "Video Rendering", "Data Analytics", "Backup Processing"],
};

export function decide(wai) {
  if (wai >= 81)
    return {
      band: "Excellent",
      range: "81–100",
      color: "#2BFF88",
      cooling: "Normal Liquid Cooling",
      action: "Continue normal operation",
      allowedTiers: ["Critical", "Important", "Flexible"],
      priorityNote: "Critical, Important & Flexible",
    };
  if (wai >= 61)
    return {
      band: "Good",
      range: "61–80",
      color: "#00F0FF",
      cooling: "Optimized Cooling",
      action: "Improve efficiency and begin water recycling",
      allowedTiers: ["Critical", "Important", "Flexible"],
      priorityNote: "All workloads",
    };
  if (wai >= 41)
    return {
      band: "Moderate",
      range: "41–60",
      color: "#FFD700",
      cooling: "Hybrid Cooling",
      action: "Reduce water consumption and postpone some flexible tasks",
      allowedTiers: ["Critical", "Important"],
      priorityNote: "Critical & Important",
    };
  if (wai >= 21)
    return {
      band: "Low",
      range: "21–40",
      color: "#FF5C00",
      cooling: "Dry/Hybrid Cooling",
      action: "Maximize recycled water use and issue alerts",
      allowedTiers: ["Critical"],
      priorityNote: "Critical only",
    };
  return {
    band: "Critical",
    range: "0–20",
    color: "#FF2E2E",
    cooling: "Emergency Cooling",
    action: "Suspend non-essential operations and conserve water",
    allowedTiers: ["Critical"],
    priorityNote: "Emergency services only",
  };
}

export function allowedWorkloadNames(decision) {
  return decision.allowedTiers.flatMap((t) => WORKLOADS[t]);
}

// ---- Predictive Water-Risk Forecast ----
// Projects tomorrow's sensor state from today's, driven by the weather trend.
const WEATHER_TREND = {
  Rainy: { temperature: -3, humidity: 12, waterLevel: 9, reservoir: 7, waterFlow: 22, coolingDemand: -5 },
  Cloudy: { temperature: -1, humidity: 4, waterLevel: 2, reservoir: 1, waterFlow: 4, coolingDemand: -1 },
  Clear: { temperature: 1, humidity: -2, waterLevel: -3, reservoir: -2, waterFlow: -4, coolingDemand: 2 },
  "Hot & Dry": { temperature: 4, humidity: -10, waterLevel: -9, reservoir: -7, waterFlow: -22, coolingDemand: 8 },
  Drought: { temperature: 6, humidity: -14, waterLevel: -14, reservoir: -12, waterFlow: -32, coolingDemand: 10 },
};

const RANGES = {
  temperature: [18, 45],
  humidity: [10, 95],
  waterLevel: [0, 100],
  waterFlow: [0, 240],
  reservoir: [0, 100],
  coolingDemand: [0, 100],
};

export function projectTomorrow(inputs) {
  const trend = WEATHER_TREND[inputs.weather] || WEATHER_TREND.Clear;
  const next = { ...inputs };
  for (const key of Object.keys(trend)) {
    const [lo, hi] = RANGES[key];
    next[key] = Math.round(Math.max(lo, Math.min(hi, inputs[key] + trend[key])));
  }
  const tomorrowWai = computeWAI(next);
  const todayWai = computeWAI(inputs);
  // 24h trajectory (7 points) interpolated today -> tomorrow with slight curve
  const points = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    const eased = t * t * (3 - 2 * t);
    return {
      label: i === 0 ? "Now" : `+${i * 4}h`,
      wai: Math.round(todayWai + (tomorrowWai - todayWai) * eased),
    };
  });
  return { next, tomorrowWai, todayWai, decision: decide(tomorrowWai), points, delta: tomorrowWai - todayWai };
}
