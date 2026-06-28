import React from "react";
import HudPanel from "./HudPanel";

const jsonOutput = `{
  "summary": "Conversation escalated after repeated accusations.",
  "conflictLevel": "High",
  "fudAssessment": "Possible panic amplification",
  "contextClarity": "78%",
  "recommendation": "Review full thread before taking action."
}`;

export default function IntelligenceOutput() {
  return (
    <section className="section-shell">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="section-kicker">
            Intelligence Output
          </p>
          <h2 className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">
            Structured results, ready for systems
          </h2>
          <p className="mt-4 font-body text-lg leading-8 text-chrome">
            Responses are designed for downstream workflows, not just human
            readability. Feed them into review tools, dashboards, or automated
            case routing.
          </p>
        </div>
        <HudPanel className="overflow-hidden">
          <div className="scan-line" />
          <div className="mb-5 flex items-center justify-between font-mono text-sm uppercase tracking-[0.2em] text-glow">
            <span>intel_engine.output.json</span>
            <span className="terminal-cursor">analysis ready</span>
          </div>
          <pre className="overflow-x-auto font-mono text-base leading-8 text-chrome">
            <code>{jsonOutput}</code>
          </pre>
        </HudPanel>
      </div>
    </section>
  );
}
