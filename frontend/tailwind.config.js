/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Landing page tokens (kept for backward compat)
        void: "#050509",
        panel: "#0d0d14",
        neon: "#ff0f6d",
        wine: "#7a0035",
        glow: "#ff4f93",
        chrome: "#b8bbc4",
        sub: "#9AA7B8",
        muted: "#5C6878",
        // Workspace tokens (shared with landing where they overlap)
        bg: "#0A0D12",
        ink: "#0A0D12",
        // Workspace text ramp (ink-N are not used by landing page — safe)
        "ink-text": "#F2F4F7",
        "ink-2": "#D4D8E0",
        "ink-3": "#9CA3AF",
        "ink-4": "#5A6472",
        "ink-5": "#3D4755",
        surface: "#121720",
        elevated: "#181F2A",
        rail: "#0C0F16",
        line: "rgba(255,255,255,0.055)",
        cyan: "#57D8FF",
        "cyan-bright": "#78DEFF",
        gold: "#D7C38A",
        ok: "#4ADE80",
        card: "#121720",
      },
      fontFamily: {
        // Landing fonts
        sans: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
        display: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["DM Sans", "Rajdhani", "Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(255,15,109,0.28), 0 0 24px rgba(255,15,109,0.18)",
        "neon-strong": "0 0 0 1px rgba(255,15,109,0.44), 0 0 36px rgba(255,15,109,0.28)",
      },
      backgroundImage: {
        "radial-grid": "radial-gradient(circle at 50% 0%, rgba(255,15,109,0.12), transparent 32%), radial-gradient(circle at 80% 20%, rgba(255,79,147,0.09), transparent 22%)",
      },
      keyframes: {
        logIn: { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% center" }, "100%": { backgroundPosition: "200% center" } },
        livePulse: { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
        discoveryIn: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        completeIn: { from: { opacity: 0, transform: "scale(0.92)" }, to: { opacity: 1, transform: "scale(1)" } },
      },
      animation: {
        logIn: "logIn 0.42s ease both",
        shimmer: "shimmer 2.4s linear infinite",
        livePulse: "livePulse 2s infinite",
        discoveryIn: "discoveryIn 0.35s ease",
        completeIn: "completeIn 0.7s ease 0.15s both",
      },
    },
  },
  plugins: [],
};
