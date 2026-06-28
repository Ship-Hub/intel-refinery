import React, { useEffect, useMemo, useState } from "react";
import HudPanel from "./HudPanel";
import { liveIntelEvents } from "../data/siteData";

const FEED_INTERVAL_MS = 2400;

export default function LiveIntelligenceFeed() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % liveIntelEvents.length);
    }, FEED_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const visibleEvents = useMemo(
    () =>
      Array.from({ length: 3 }, (_, offset) => {
        const index = (activeIndex + offset) % liveIntelEvents.length;
        return {
          id: `${index}-${liveIntelEvents[index]}`,
          label: liveIntelEvents[index],
        };
      }),
    [activeIndex],
  );

  return (
    <HudPanel className="live-feed-panel mt-4 max-w-md overflow-hidden">
      <div className="scan-line" />
      <div className="mb-4 flex items-center justify-between gap-3 font-mono text-sm uppercase tracking-[0.2em] text-glow">
        <span>Live Intelligence Feed</span>
        <span className="terminal-cursor">provider active</span>
      </div>

      <div key={visibleEvents[0].id} className="live-feed-primary">
        <span className="live-feed-dot" />
        {visibleEvents[0].label}
      </div>

      <div className="mt-3 grid gap-2">
        {visibleEvents.slice(1).map((event) => (
          <div key={event.id} className="live-feed-row">
            <span className="live-feed-dot" />
            {event.label}
          </div>
        ))}
      </div>
    </HudPanel>
  );
}
