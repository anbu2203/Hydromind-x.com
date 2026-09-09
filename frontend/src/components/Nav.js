import React, { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Droplets, LayoutDashboard, Snowflake, MessageSquareText,
  FlaskConical, Cpu, HeartPulse, Landmark, Sparkles, ChevronDown,
} from "lucide-react";
import { useScenario } from "../context/ScenarioContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/cooling", label: "Cooling", icon: Snowflake, testid: "nav-cooling" },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquareText, testid: "nav-assistant" },
];

const protoLinks = [
  { to: "/proto/universal", label: "Universal AI", icon: Cpu, tier: "Auto", testid: "nav-proto-universal", desc: "Classifies every prompt" },
  { to: "/proto/hospital", label: "Hospital AI", icon: HeartPulse, tier: "Critical", testid: "nav-proto-hospital", desc: "Always allowed" },
  { to: "/proto/bank", label: "Bank AI", icon: Landmark, tier: "Important", testid: "nav-proto-bank", desc: "Needs WAI ≥ 41" },
  { to: "/proto/chatbot", label: "Chatbot AI", icon: Sparkles, tier: "Flexible", testid: "nav-proto-chatbot", desc: "Needs WAI ≥ 61" },
];

const TIER_COLOR = {
  Critical: "#FF5C6C",
  Important: "#FFD700",
  Flexible: "#B48BFF",
  Auto: "#00F0FF",
};

export const Nav = () => {
  const { wai, decision } = useScenario();
  const [protoOpen, setProtoOpen] = useState(false);
  const menuRef = useRef(null);
  const location = useLocation();
  const isProtoActive = location.pathname.startsWith("/proto");

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProtoOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setProtoOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setProtoOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 hx-glass border-b border-white/10">
      <div
        className="w-full text-center py-1 border-b border-hydro-cyan/10 font-mono text-[10px] tracking-[0.25em] uppercase text-white/50 flex items-center justify-center gap-2 flex-wrap px-3"
        data-testid="created-by-banner"
      >
        <span>Created by <span className="text-hydro-cyan">Anbumathi Chezhian</span></span>
        <span className="text-white/20">·</span>
        <a
          href="https://v0-anbumathi-chezhian-2203.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-hydro-cyan/80 hover:text-hydro-cyan underline underline-offset-2 transition-colors"
          data-testid="founder-portfolio-link-top"
        >
          Founder Portfolio ↗
        </a>
      </div>
      <div className="max-w-[1400px] mx-auto px-5 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="brand-logo">
          <div className="relative">
            <Droplets className="w-7 h-7 text-hydro-cyan text-glow-cyan" strokeWidth={2.2} />
            <span className="absolute inset-0 animate-pulse-glow" />
          </div>
          <div className="leading-none">
            <div className="font-display font-black text-lg tracking-tighter uppercase">
              Hydro<span className="text-hydro-cyan">Mind</span>-X
            </div>
            <div className="font-mono text-[9px] tracking-[0.25em] text-hydro-cyan/70 uppercase">
              AquaNova Trinity
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={l.testid}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${
                  isActive
                    ? "bg-hydro-cyan/10 text-hydro-cyan border border-hydro-cyan/30"
                    : "text-white/60 hover:text-white border border-transparent"
                }`
              }
            >
              <l.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{l.label}</span>
            </NavLink>
          ))}

          {/* protoV1 dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setProtoOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={protoOpen}
              data-testid="nav-proto-trigger"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md font-mono text-xs uppercase tracking-wider transition-colors ${
                isProtoActive || protoOpen
                  ? "bg-hydro-cyan/10 text-hydro-cyan border border-hydro-cyan/30"
                  : "text-white/60 hover:text-white border border-transparent"
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span className="hidden sm:inline">protoV1</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${protoOpen ? "rotate-180" : ""}`}
              />
            </button>

            {protoOpen && (
              <div
                role="menu"
                data-testid="nav-proto-menu"
                className="absolute right-0 mt-2 w-72 hx-glass border border-hydro-cyan/25 rounded-xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,240,255,0.35)]"
              >
                <div className="px-4 py-3 border-b border-white/10 bg-hydro-cyan/5">
                  <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-hydro-cyan/80">
                    protoV1 · WAI-gated AI demos
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    Live WAI {wai} · {decision?.band}
                  </div>
                </div>
                <ul className="py-1">
                  {protoLinks.map((p) => (
                    <li key={p.to}>
                      <NavLink
                        to={p.to}
                        data-testid={p.testid}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            isActive
                              ? "bg-hydro-cyan/10 text-hydro-cyan"
                              : "text-white/75 hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center border shrink-0"
                          style={{
                            borderColor: (TIER_COLOR[p.tier] || "#00F0FF") + "55",
                            background: (TIER_COLOR[p.tier] || "#00F0FF") + "12",
                          }}
                        >
                          <p.icon
                            className="w-4 h-4"
                            style={{ color: TIER_COLOR[p.tier] || "#00F0FF" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{p.label}</span>
                            <span
                              className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border"
                              style={{
                                color: TIER_COLOR[p.tier] || "#00F0FF",
                                borderColor: (TIER_COLOR[p.tier] || "#00F0FF") + "55",
                              }}
                            >
                              {p.tier}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/50 truncate">{p.desc}</div>
                        </div>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-md hx-panel" data-testid="nav-wai-chip">
          <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">WAI</span>
          <span className="font-mono font-bold text-lg" style={{ color: decision.color }}>
            {wai}
          </span>
          <span
            className="w-2 h-2 rounded-full animate-pulse-glow"
            style={{ background: decision.color, boxShadow: `0 0 10px ${decision.color}` }}
          />
        </div>
      </div>
    </header>
  );
};
