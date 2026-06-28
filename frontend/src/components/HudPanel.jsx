import React from "react";

export default function HudPanel({ children, className = "" }) {
  return <div className={`hud-panel ${className}`}>{children}</div>;
}
