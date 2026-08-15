import React from "react";
import { NavLink, Link } from "react-router-dom";
import { Droplets, LayoutDashboard, Snowflake, MessageSquareText } from "lucide-react";
import { useScenario } from "../context/ScenarioContext";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, testid: "nav-dashboard" },
  { to: "/cooling", label: "Cooling", icon: Snowflake, testid: "nav-cooling" },
  { to: "/assistant", label: "AI Assistant", icon: MessageSquareText, testid: "nav-assistant" },
];

export const Nav = () => {
  const { wai, decision } = useScenario();
  return (
    <header className="sticky top-0 z-50 hx-glass border-b border-white/10">
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
