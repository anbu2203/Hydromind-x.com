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
