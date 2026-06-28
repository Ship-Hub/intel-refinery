import React from "react";
import { ArrowUpRight } from "lucide-react";

const waveformBars = [26, 42, 68, 84, 58, 76, 44, 62, 34];

export default function FeatureCard({ icon: Icon, title, description, visual }) {
  return (
    <article className="hud-card group">
      <div className="mb-6 flex items-center justify-between">
        <div className="grid h-12 w-12 place-items-center border border-neon/40 bg-neon/5 text-neon">
          <Icon className="h-6 w-6" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-neon transition group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <h3 className="font-display text-xl uppercase text-white">{title}</h3>
      <p className="mt-3 font-body text-lg leading-8 text-chrome">{description}</p>
      {visual === "waveform" && (
        <div className="feature-waveform" aria-hidden="true">
          {waveformBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              style={{ "--wave-height": `${height}%`, "--wave-delay": `${index * 120}ms` }}
            />
          ))}
        </div>
      )}
    </article>
  );
}
