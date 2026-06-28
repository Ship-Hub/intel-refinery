import React, { useState } from "react";
import { platformIntegrations } from "../data/siteData";
import HudPanel from "./HudPanel";

export default function PlatformIntegrations() {
  const [active, setActive] = useState(0);
  const current = platformIntegrations[active];

  return (
    <section className="section-shell">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="section-kicker">Integrations</p>
          <h2 className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">
            Plug in anywhere
          </h2>
          <p className="mt-4 font-body text-lg leading-8 text-chrome">
            Intel Refinery is a platform-agnostic API. The same intelligence
            layer works inside Telegram groups, customer support desks, AI
            agent systems, marketplace dispute queues, and any custom
            integration you build.
          </p>

          {/* platform selector */}
          <div className="mt-6 flex flex-wrap gap-2">
            {platformIntegrations.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setActive(i)}
                className={`border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] transition ${
                  active === i
                    ? "border-neon bg-neon/15 text-white"
                    : "border-white/15 text-chrome hover:border-neon/40 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <HudPanel>
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-glow">
            {current.label} - what Intel Refinery does
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {current.abilities.map((ability) => (
              <div
                key={ability}
                className="border border-white/10 bg-white/[0.02] px-4 py-4 font-body text-lg text-chrome"
              >
                {ability}
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 font-mono text-xs text-chrome/60">
            All platforms share the same API key and endpoint structure.
          </div>
        </HudPanel>
      </div>
    </section>
  );
}
