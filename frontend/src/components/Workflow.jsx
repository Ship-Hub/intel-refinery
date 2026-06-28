import React from "react";
import { workflowSteps } from "../data/siteData";
import WorkflowStep from "./WorkflowStep";

export default function Workflow() {
  return (
    <section id="workflow" className="section-shell">
      <p className="section-kicker">
        API Workflow
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase text-white sm:text-4xl">
        Three steps from evidence to intelligence
      </h2>
      <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
        <div className="connector-line hidden lg:block" />
        {workflowSteps.map((step, index) => (
          <WorkflowStep key={step.title} {...step} index={index} />
        ))}
      </div>
    </section>
  );
}
