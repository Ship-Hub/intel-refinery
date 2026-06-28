import React, { useState } from "react";
import { ArrowRight, ScanLine } from "lucide-react";
import HudPanel from "./HudPanel";
import LiveIntelligenceFeed from "./LiveIntelligenceFeed";
import { analysisStats, heroStatuses, pricingPlans } from "../data/siteData";
import heroImage from "../assets/hero-android.png";

export default function Hero() {
  return (
    <section className="relative px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.24em] text-glow sm:text-base">
            <ScanLine className="h-4 w-4" />
            AI-Powered Conversation Intelligence API
          </div>
          <p className="mb-4 font-mono text-base uppercase tracking-[0.34em] text-chrome sm:text-lg">
            Intel Refinery
          </p>
          <h1 className="max-w-3xl font-display text-4xl uppercase leading-tight text-white sm:text-5xl lg:text-6xl">
            <span className="block text-chrome">Understand Conversations.</span>
            <span className="block text-neon">Detect Truth.</span>
            <span className="block">Unlock Intel.</span>
          </h1>
          <p className="mt-6 max-w-2xl font-body text-xl leading-8 text-chrome">
            Intel Refinery analyzes conversations, detects escalation, identifies
            manipulation, audits support interactions, and delivers real context
            across text, images, and audio.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="https://app.intelrefinery.site/signup" className="hud-button">
              Get API Key
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="/docs" className="hud-button-secondary">
              View Documentation
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3 font-mono text-sm uppercase tracking-[0.2em] text-glow">
            <span className="inline-block h-2 w-2 animate-pulse bg-neon" />
            <TypingStatus />
          </div>
          <AgentStatusRail />

          <div className="mt-8 max-w-md">
            <HudPanel className="overflow-hidden">
              <div className="scan-line" />
              <div className="mb-5 flex items-center justify-between font-mono text-sm uppercase tracking-[0.2em] text-glow">
                <span>Analysis Output</span>
                <span>Ready</span>
              </div>
              <div className="space-y-4">
                {analysisStats.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-base uppercase"
                  >
                    <span className="text-chrome">{label}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
          <LiveIntelligenceFeed />
        </div>

        <div className="relative mt-8 min-h-[920px] lg:-mt-10 lg:min-h-[900px]">
          <div
            className="hero-visual-shell absolute inset-x-0 top-0 h-[520px]"
          >
            <div className="hero-hud-ring hero-hud-ring-outer" />
            <div className="hero-hud-ring hero-hud-ring-inner" />
            <div className="hero-light-bloom" />
            <div className="hero-floor-grid" />
            <div className="hero-core-pulse" />
            <div className="hero-robot-scan" />
            <div className="hero-eye-glow" />
            <div className="hero-data-streams">
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} style={{ left: `${16 + index * 16}%` }} />
              ))}
            </div>
            <img
              src={heroImage}
              alt="Cybernetic intelligence android"
              className="hero-android h-full w-full object-cover object-center"
            />
          </div>
          <div className="mt-[540px] lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-10">
            <PricingComparison />
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingComparison() {
  return (
    <HudPanel className="overflow-hidden">
      <div className="scan-line" />
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-base uppercase tracking-[0.2em] text-glow">
            Plan Comparison
          </div>
          <div className="mt-2 font-body text-lg text-chrome">
            Scale from sandbox testing to production traffic.
          </div>
        </div>
        <div className="hidden font-mono text-sm uppercase tracking-[0.18em] text-chrome sm:block">
          Monthly billing
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {pricingPlans.map((plan, index) => (
          <PricingPlan key={plan.code} plan={plan} index={index} />
        ))}
      </div>
    </HudPanel>
  );
}

function PricingPlan({ plan, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`pricing-plan ${index === 2 ? "is-highlighted" : ""}`}>
      <div className="font-mono text-sm uppercase tracking-[0.18em] text-glow">
        {plan.name}
      </div>
      <div className="mt-3 font-display text-2xl text-white">
        {plan.price}
        <span className="ml-1 font-body text-base text-chrome">/mo</span>
      </div>
      <div className="mt-4 space-y-2 font-body text-base text-chrome">
        <div>{plan.credits}</div>
        <div>{plan.rateLimit}</div>
      </div>
      <p className="mt-4 font-body text-base leading-6 text-chrome">
        {plan.description}
      </p>
      <button
        type="button"
        className="pricing-read-more"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? "Show less" : "Read more"}
      </button>
      {expanded && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {plan.perks.map((perk) => (
            <div key={perk} className="pricing-perk">
              {perk}
            </div>
          ))}
        </div>
      )}
      <button type="button" className="pricing-button">
        Start plan
      </button>
    </div>
  );
}

function TypingStatus() {
  return (
    <span className="typing-status inline-block overflow-hidden whitespace-nowrap align-bottom">
      SYSTEM ONLINE / ANALYSIS READY / PROCESSING
    </span>
  );
}

function AgentStatusRail() {
  return (
    <div className="agent-status-rail mt-5">
      {heroStatuses.map((status) => (
        <div key={status} className="agent-status-pill">
          <span className="agent-status-dot" />
          <span>{status}</span>
          <i />
        </div>
      ))}
    </div>
  );
}
