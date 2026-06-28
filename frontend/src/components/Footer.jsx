import React from "react";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-neon/15 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex flex-col gap-3">
          <Logo compact />
          <div className="footer-status">
            <span />
            System Status: Operational
          </div>
        </div>
        <div className="footer-telemetry">
          <span>Provider Stack: Local + Cloud</span>
          <span>Async Architecture</span>
          <span>API Version: v1</span>
        </div>
        <div className="footer-links">
          <a href="/docs">Docs</a>
          <a href="https://app.intelrefinery.site">Contact / API Access</a>
        </div>
      </div>
    </footer>
  );
}
