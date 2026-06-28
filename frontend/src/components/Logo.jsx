import React from "react";
import logoMark from "../assets/intel-refinery-icon-512.png";
import logoWordmark from "../assets/intel-refinery-wordmark.png";

export default function Logo({ compact = false }) {
  return (
    <a
      href="/"
      aria-label="Intel Refinery home"
      className={
        compact
          ? "inline-flex items-center gap-2"
          : "inline-flex items-center gap-2.5"
      }
    >
      <img
        src={logoMark}
        alt=""
        className={compact ? "h-10 w-10 object-contain" : "h-14 w-14 object-contain sm:h-16 sm:w-16"}
      />
      <img
        src={logoWordmark}
        alt="Intel Refinery"
        className={
          compact
            ? "h-8 w-auto max-w-[150px] object-contain object-left"
            : "h-10 w-auto max-w-[210px] object-contain object-left sm:h-12"
        }
      />
    </a>
  );
}
