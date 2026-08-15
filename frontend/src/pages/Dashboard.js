import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { ScenarioSimulator } from "../components/ScenarioSimulator";
import { WAIGauge } from "../components/WAIGauge";
import { AIDecision } from "../components/AIDecision";
import { WorkloadBoard } from "../components/WorkloadBoard";
import { SDGBadges } from "../components/SDGBadges";
import { AuditReport } from "../components/AuditReport";

const HERO_BG =
  "https://images.unsplash.com/photo-1782155789425-65fb6d8cc8ac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600";

export default function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6 space-y-10 relative z-10">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden border border-hydro-cyan/15" data-testid="hero">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Futuristic data center" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-hydro-void via-hydro-void/85 to-hydro-void/30" />
          <div className="absolute inset-0 hx-scanlines opacity-40" />
        </div>
        <div className="relative px-6 sm:px-10 py-14 sm:py-20 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hydro-cyan/30 bg-hydro-cyan/10 font-mono text-[10px] uppercase tracking-widest text-hydro-cyan mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI-Driven Water Intelligence
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter uppercase leading-[0.95]"
          >
            Making AI <br />
            <span className="text-hydro-cyan text-glow-cyan">Think Before</span>
            <br /> It Drinks.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed"
          >
            HydroMind-X continuously audits water, computes a live Water Availability Index, and
            steers data-center cooling &amp; AI workloads toward sustainability.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link
              to="/assistant"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-hydro-cyan text-hydro-void font-mono text-xs uppercase tracking-widest font-bold hover:hx-glow-cyan transition-shadow"
              data-testid="hero-ask-btn"
            >
              <MessageSquareText className="w-4 h-4" /> Ask HYDRA
            </Link>
            <Link
              to="/cooling"
              className="flex items-center gap-2 px-5 py-3 rounded-lg border border-white/15 text-white font-mono text-xs uppercase tracking-widest hover:border-hydro-cyan/50 transition-colors"
              data-testid="hero-cooling-btn"
            >
              See Cooling <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Simulator + WAI + Decision */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="control-room">
        <div className="lg:col-span-2">
          <ScenarioSimulator />
        </div>
        <div className="space-y-6">
          <WAIGauge />
          <AIDecision />
        </div>
      </section>

      <WorkloadBoard />
      <AuditReport />
      <SDGBadges />

      <footer className="pt-6 pb-4 text-center font-mono text-[10px] tracking-widest uppercase text-white/30">
        HydroMind-X · Team AquaNova Trinity · "Every AI decision should consider every drop of water."
      </footer>
    </div>
  );
}
