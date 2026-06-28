import React from "react";
import Logo from "./Logo";

const links = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Workflow", href: "#workflow" },
  { label: "Docs", href: "/docs" },
];

export default function Navbar() {
  return (
    <header className="relative z-20 border-b border-neon/15 bg-void/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-mono text-sm uppercase tracking-[0.2em] text-chrome transition hover:text-neon"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a href="https://app.intelrefinery.site" className="hud-button hidden sm:inline-flex">
          Create Key
        </a>
      </div>
    </header>
  );
}
