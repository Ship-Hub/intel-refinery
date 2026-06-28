import React from "react";
import logoMark from "../assets/intel-refinery-icon-512.png";

export default function Logo({ compact = false }) {
  return (
    <a
      href="/"
      aria-label="Intel Refinery home"
      className="inline-flex items-center gap-3 no-underline"
    >
      <img
        src={logoMark}
        alt=""
        className={compact ? "h-8 w-8 object-contain" : "h-10 w-10 object-contain sm:h-11 sm:w-11"}
      />
      <span className={compact ? "text-base font-semibold tracking-tight text-white" : "text-lg font-semibold tracking-tight text-white"}>
        Intel <span className="text-cyan">Refinery</span>
      </span>
    </a>
  );
}
