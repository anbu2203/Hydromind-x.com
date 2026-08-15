import React, { useState } from "react";
import { FileText, Download, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useScenario } from "../context/ScenarioContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuditReport = () => {
  const { inputs, wai, decision, allowed } = useScenario();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/audit/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs,
          wai,
          band: decision.band,
          cooling_strategy: decision.cooling,
          water_action: decision.action,
          allowed_workloads: allowed,
        }),
      });
      const data = await res.json();
      setReport(data);
      toast.success(`Audit report ${data.report_no} generated`);
    } catch (e) {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hx-panel rounded-xl p-6" data-testid="audit-report">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-hydro-cyan" />
          <h3 className="font-display font-bold text-xl tracking-tight uppercase">Water Audit Report</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-hydro-cyan/15 border border-hydro-cyan/40 text-hydro-cyan font-mono text-xs uppercase tracking-wider hover:bg-hydro-cyan/25 transition-colors disabled:opacity-50"
            data-testid="generate-report-btn"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Generate
          </button>
          {report && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-md hx-panel text-white/70 hover:text-hydro-cyan font-mono text-xs uppercase tracking-wider transition-colors"
              data-testid="print-report-btn"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          )}
        </div>
      </div>

      {!report && (
        <p className="font-mono text-xs text-white/40" data-testid="audit-empty">
          Capture the current scenario as a timestamped, printable water audit certificate for your pitch.
        </p>
      )}

      {report && (
        <div id="print-report" className="bg-white text-black rounded-lg p-8" data-testid="report-preview">
          <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4">
            <div>
              <div className="font-black text-2xl tracking-tight">HYDROMIND-X</div>
              <div className="text-xs tracking-widest uppercase text-gray-500">Continuous Water Audit Certificate</div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="font-bold text-base">{report.report_no}</div>
              <div className="text-gray-500">{new Date(report.timestamp).toLocaleString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Sensor Inputs</div>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["Temperature", `${report.inputs.temperature} °C`],
                    ["Humidity", `${report.inputs.humidity} %`],
                    ["Water Level", `${report.inputs.waterLevel} %`],
                    ["Water Flow", `${report.inputs.waterFlow} L/min`],
                    ["Reservoir", `${report.inputs.reservoir} %`],
                    ["Cooling Demand", `${report.inputs.coolingDemand} %`],
                    ["Weather", report.inputs.weather],
                  ].map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-200">
                      <td className="py-1 text-gray-600">{k}</td>
                      <td className="py-1 text-right font-mono font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">AI Assessment</div>
              <div className="border-2 border-black rounded-lg p-4 text-center mb-3">
                <div className="text-5xl font-black">{report.wai}</div>
                <div className="text-xs uppercase tracking-widest">WAI · {report.band}</div>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-200"><td className="py-1 text-gray-600">Cooling Strategy</td><td className="py-1 text-right font-medium">{report.cooling_strategy}</td></tr>
                  <tr><td className="py-1 text-gray-600 align-top">Water Action</td><td className="py-1 text-right font-medium">{report.water_action}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 font-bold">Approved Workloads ({report.allowed_workloads.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {report.allowed_workloads.map((w) => (
                <span key={w} className="text-xs border border-gray-400 rounded px-2 py-0.5">{w}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-300 text-[10px] text-gray-500 italic text-center">
            "Every AI decision should consider every drop of water." — Generated by HydroMind-X · AquaNova Trinity
          </div>
        </div>
      )}
    </div>
  );
};
