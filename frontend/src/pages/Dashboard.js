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
import { ForecastCard } from "../components/ForecastCard";

const HERO_BG =
  "https://images.unsplash.com/photo-1782155789425-65fb6d8cc8ac?crop=entropy&cs=srgb&fm=jpg&q=70&w=1600";

const RISE = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };
const RISE_0 = { ...RISE, transition: { duration: 0.5 } };
const RISE_1 = { ...RISE, transition: { duration: 0.5, delay: 0.1 } };
const RISE_2 = { ...RISE, transition: { duration: 0.5, delay: 0.2 } };
const RISE_3 = { ...RISE, transition: { duration: 0.5, delay: 0.3 } };

export default function Dashboard() {
  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6 space-y-10 relative z-10">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden border border-hydro-cyan/15" data-testid="hero">
        <div className="absolute inset-0">
          <img
            src={HERO_BG}
            alt="HydroMind-X AI water intelligence dashboard monitoring a sustainable data center cooling system"
            className="w-full h-full object-cover opacity-40"
            fetchPriority="high"
            decoding="async"
            width="1600"
            height="900"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-hydro-void via-hydro-void/85 to-hydro-void/30" />
          <div className="absolute inset-0 hx-scanlines opacity-40" />
        </div>
        <div className="relative px-6 sm:px-10 py-14 sm:py-20 max-w-3xl">
          <motion.div
            {...RISE_0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hydro-cyan/30 bg-hydro-cyan/10 font-mono text-[10px] uppercase tracking-widest text-hydro-cyan mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI-Driven Water Intelligence
          </motion.div>
          <motion.h1
            {...RISE_1}
            className="font-display font-black text-4xl sm:text-5xl lg:text-6xl tracking-tighter uppercase leading-[0.95]"
          >
            Making AI <br />
            <span className="text-hydro-cyan text-glow-cyan">Think Before</span>
            <br /> It Drinks.
          </motion.h1>
          <motion.p
            {...RISE_2}
            className="mt-5 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed"
          >
            HydroMind-X continuously audits water, computes a live Water Availability Index, and
            steers data-center cooling &amp; AI workloads toward sustainability.
          </motion.p>
          <motion.div
            {...RISE_3}
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

      <section className="max-w-4xl" data-testid="home-intro">
        <h2 className="font-display font-bold text-2xl tracking-tight uppercase mb-3">
          Intelligent Water Management for AI Infrastructure
        </h2>
        <p className="text-white/70 leading-relaxed">
          HydroMind-X is a smart water intelligence and continuous-auditing platform for sustainable data
          centers. It fuses live IoT sensor readings — temperature, humidity, water level, water flow and
          reservoir status — with weather forecasts to compute a single, easy-to-read Water Availability Index
          (WAI) from 0 to 100. Adjust the sliders above to simulate any environmental scenario and watch the
          index and the AI recommendations update instantly. As water becomes scarce, HydroMind-X
          automatically selects a more conservative cooling strategy, prioritizes critical workloads such as
          hospitals and emergency services, delays flexible tasks like model training, and maximizes recycled
          water use — then captures the whole decision as a downloadable audit report.
        </p>
        <p className="text-white/70 leading-relaxed mt-4">
          HydroMind-X was founded by <strong className="text-white">Anbumathi Chezhian</strong>, who leads the
          project as its Software Technical Designer. The platform is built by{" "}
          <strong className="text-white">team AquaNova Trinity</strong>, whose members are Anbumathi Chezhian
          (Founder, Software Technical Designer), <strong className="text-white">Shrenik</strong> (Co-Founder,
          Researcher) and <strong className="text-white">Thamseel Ahmed</strong> (Co-Founder, Media File
          Manager).
        </p>
      </section>

      <section className="max-w-4xl" data-testid="home-faq">
        <h2 className="font-display font-bold text-xl tracking-tight uppercase mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <div className="hx-panel rounded-lg p-4">
            <h3 className="font-semibold text-white text-sm mb-1">Who is the founder of HydroMind-X?</h3>
            <p className="text-white/65 text-sm leading-relaxed">
              HydroMind-X was founded by Anbumathi Chezhian, who serves as its Software Technical Designer.
            </p>
          </div>
          <div className="hx-panel rounded-lg p-4">
            <h3 className="font-semibold text-white text-sm mb-1">Who created HydroMind-X and who is on team AquaNova Trinity?</h3>
            <p className="text-white/65 text-sm leading-relaxed">
              HydroMind-X was created by team AquaNova Trinity: Anbumathi Chezhian (Founder, Software Technical
              Designer), Shrenik (Co-Founder, Researcher) and Thamseel Ahmed (Co-Founder, Media File Manager).
            </p>
          </div>
          <div className="hx-panel rounded-lg p-4">
            <h3 className="font-semibold text-white text-sm mb-1">What is HydroMind-X?</h3>
            <p className="text-white/65 text-sm leading-relaxed">
              HydroMind-X is an AI-driven water intelligence and continuous-auditing platform that helps data
              centers cool sustainably by computing a live Water Availability Index and adapting cooling
              strategies and AI workloads to conserve freshwater.
            </p>
          </div>
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
      <ForecastCard />
      <AuditReport />
      <SDGBadges />

      <footer className="pt-10 pb-6 border-t border-white/10 mt-4" data-testid="team-footer">
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-lg tracking-tight uppercase text-white/80">
            Team AquaNova Trinity
          </h2>
          <p className="font-mono text-[10px] tracking-widest uppercase text-white/30 mt-1">
            The people behind HydroMind-X
          </p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto" data-testid="team-members">
          {[
            { name: "Anbumathi Chezhian", role: "Founder · Software Technical Designer" },
            { name: "Shrenik", role: "Co-Founder · Researcher" },
            { name: "Thamseel Ahmed", role: "Co-Founder · Media File Manager" },
          ].map((m) => (
            <li key={m.name} className="hx-panel rounded-lg p-4 text-center" data-testid={`team-member-${m.name.split(" ")[0].toLowerCase()}`}>
              <div className="font-display font-semibold text-sm text-white">{m.name}</div>
              <div className="font-mono text-[10px] tracking-wider uppercase text-hydro-cyan/70 mt-1">{m.role}</div>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center font-mono text-[10px] tracking-widest uppercase text-white/30 space-y-2">
          <div>HydroMind-X · Team AquaNova Trinity · "Every AI decision should consider every drop of water."</div>
          <div>
            Created by Anbumathi Chezhian ·{" "}
            <a
              href="https://v0-anbumathi-chezhian-2203.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-hydro-cyan/80 hover:text-hydro-cyan underline underline-offset-2 transition-colors"
              data-testid="founder-portfolio-link-bottom"
            >
              Founder Portfolio ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
