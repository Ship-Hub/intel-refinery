import React from "react";

export default function WorkflowStep({ icon: Icon, title, description, index }) {
  return (
    <article className="relative hud-card">
      <div className="mb-6 flex items-center gap-4">
        <div className="font-mono text-sm uppercase tracking-[0.24em] text-glow">
          0{index + 1}
        </div>
        <div className="grid h-12 w-12 place-items-center border border-neon/40 bg-neon/5 text-neon">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <h3 className="font-display text-xl uppercase text-white">{title}</h3>
      <p className="mt-3 font-body text-lg leading-8 text-chrome">{description}</p>
    </article>
  );
}
