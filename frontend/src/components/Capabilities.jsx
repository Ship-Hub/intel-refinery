import React from "react";
import FeatureCard from "./FeatureCard";
import { capabilities } from "../data/siteData";

export default function Capabilities() {
  return (
    <section id="capabilities" className="section-shell">
      <SectionHeading
        eyebrow="Core Systems"
        title="Conversation intelligence modules"
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map((capability) => (
          <FeatureCard key={capability.title} {...capability} />
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title }) {
  return (
    <div>
      <p className="section-kicker">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
