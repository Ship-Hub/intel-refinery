import React from "react";
import { ArrowRight } from "lucide-react";

export default function CTA() {
  return (
    <section id="cta" className="section-shell pb-24">
      <div className="hud-panel px-6 py-10 text-center sm:px-10">
        <p className="section-kicker">
          System Online
        </p>
        <h2 className="mt-4 font-display text-3xl uppercase text-white sm:text-4xl">
          Build Smarter Conversation Intelligence
        </h2>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="https://app.intelrefinery.site/signup" className="hud-button">
            Get API Key
            <ArrowRight className="h-4 w-4" />
          </a>
          <a href="/docs" className="hud-button-secondary">
            Read Docs
          </a>
        </div>
      </div>
    </section>
  );
}
