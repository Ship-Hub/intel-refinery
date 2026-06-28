import React from "react";

export default function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-radial-grid" />
      <div className="ambient-fog absolute inset-0" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="ambient-scanlines absolute inset-0" />
      <div className="ambient-node-field absolute inset-0" />
      <div className="ambient-data-field absolute inset-0" />
      <div className="ambient-static-beam absolute left-0 top-[22%] h-px w-full bg-gradient-to-r from-transparent via-neon/35 to-transparent" />
      <div className="ambient-static-beam absolute left-0 top-[68%] h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}
