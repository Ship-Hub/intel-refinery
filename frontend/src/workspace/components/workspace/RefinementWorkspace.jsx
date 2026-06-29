import { useEffect, useRef } from "react";
import KnowledgeCanvas from "../canvas/KnowledgeCanvas";

export default function RefinementWorkspace({
  project,
  progress,
  status,
  log,
  graph,
  focus,
  discovery,
  onPause,
  onBack,
}) {
  const logRef = useRef(null);
  const pinnedRef = useRef(true);

  useEffect(() => {
    const el = logRef.current;
    if (el && pinnedRef.current) el.scrollTop = el.scrollHeight;
  }, [log]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    pinnedRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex h-[50px] min-h-[50px] shrink-0 items-center gap-[14px] border-b border-line bg-rail px-[18px]">
        <button onClick={onBack} className="rounded p-1 text-ink-5 hover:text-ink-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        </button>
        <span className="text-[13.5px] font-medium text-ink-2">{project?.name}</span>
        <span className="flex items-center gap-[5px] rounded-full border border-cyan/20 bg-cyan/[0.07] px-[9px] py-[3px]">
          <span className="h-[5px] w-[5px] animate-livePulse rounded-full bg-cyan" />
          <span className="text-[10.5px] font-medium tracking-wide text-cyan">LIVE</span>
        </span>
        <div className="flex-1" />
        <span className="text-[12.5px] tabular-nums text-ink-3">{Math.round(progress)}%</span>
        <div className="relative h-[2.5px] w-[150px] shrink-0 overflow-hidden rounded-sm bg-[#141C28]">
          <div className="rf-progress-fill h-full rounded-sm" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={onPause} className="flex shrink-0 items-center gap-[5px] rounded-[7px] border border-line bg-elevated px-[11px] py-[5px] text-[11.5px] text-ink-3">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x="1" y="1" width="2.5" height="7" rx=".8" fill="#7A8394"/><rect x="5.5" y="1" width="2.5" height="7" rx=".8" fill="#7A8394"/></svg>
          Pause
        </button>
      </div>

      {/* 3 columns */}
      <div className="grid min-h-0 flex-1 overflow-hidden" style={{ gridTemplateColumns: "288px 1fr 268px" }}>
        {/* LEFT — Refinement Log */}
        <section className="flex flex-col overflow-hidden border-r border-line bg-rail">
          <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-[14px]">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-5">REFINEMENT LOG</span>
            <span className="flex items-center gap-1 text-[10px] tracking-wide text-cyan"><span className="h-1 w-1 animate-livePulse rounded-full bg-cyan" />LIVE</span>
          </header>
          <div ref={logRef} onScroll={onScroll} className="rf-scroll flex flex-1 flex-col gap-[5px] overflow-y-auto p-2.5">
            {log.map((e) => <LogItem key={e.id} entry={e} />)}
          </div>
        </section>

        {/* CENTER — Living Knowledge Canvas */}
        <KnowledgeCanvas nodes={graph?.nodes ?? []} links={graph?.links ?? []} progress={progress} settling={status !== "refining"} />

        {/* RIGHT — Current Focus */}
        <aside className="flex flex-col overflow-hidden border-l border-line bg-rail">
          <header className="shrink-0 border-b border-line px-4 py-[14px]">
            <span className="text-[10px] font-semibold tracking-[0.1em] text-ink-5">CURRENT FOCUS</span>
          </header>
          <div className="rf-scroll flex-1 overflow-y-auto px-4 py-[18px]">
            {focus ? <FocusPanel focus={focus} /> : <Empty>Refinery hasn't settled on a focus yet.</Empty>}
          </div>
        </aside>
      </div>

      {/* Discovery toast */}
      {discovery && (
        <div className="fixed bottom-[22px] right-[22px] z-50 max-w-[264px] animate-discoveryIn rounded-[11px] border border-cyan/20 bg-elevated px-4 py-[13px] shadow-2xl">
          <div className="mb-[5px] text-[9.5px] font-medium tracking-[0.1em] text-cyan">NEW DISCOVERY</div>
          <div className="text-[12.5px] leading-snug text-[#B8BFC9]">{discovery.text}</div>
        </div>
      )}
    </div>
  );
}

function LogItem({ entry }) {
  return (
    <div
      className="rounded-lg border p-3 transition-[box-shadow,border-color] duration-[900ms]"
      style={{
        background: "linear-gradient(180deg, rgba(20,28,40,0.98), rgba(15,21,31,0.98))",
        borderColor: entry.glowing ? "rgba(87,216,255,0.28)" : "rgba(255,255,255,0.05)",
        boxShadow: entry.glowing ? "0 0 12px rgba(87,216,255,0.18)" : "none",
        animation: "logIn 0.42s ease",
      }}
    >
      <div className="mb-1.5 font-mono text-[9.5px] tracking-wide text-[#7F8DA3]">{entry.ts}</div>
      <div className="text-[12.5px] leading-snug text-[#D8E4F2]">{entry.text}</div>
      {entry.items?.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {entry.items.slice(0, 3).map((item, i) => (
            <div key={`${item.label}-${i}`} className="rounded-[6px] border border-white/[0.06] bg-black/20 px-2 py-1.5">
              <div className="text-[11.5px] font-medium leading-snug text-[#E6F3FF]">{item.label}</div>
              {item.detail && <div className="mt-0.5 text-[10.5px] leading-snug text-[#8EA0B8]">{item.detail}</div>}
            </div>
          ))}
        </div>
      )}
      {entry.detail && (
        <div className="mt-2 border-t border-line pt-1.5 text-[11px] leading-relaxed text-[#9FB0C8]">{entry.detail}</div>
      )}
    </div>
  );
}

function FocusPanel({ focus }) {
  return (
    <>
      <div className="mb-6">
        <div className="mb-2.5 text-[16px] font-semibold text-ink-2">{focus.title}</div>
        {focus.status && <Row k="Status" v={focus.status} />}
        {focus.evidence && <Row k="Evidence" v={focus.evidence} tone="ok" />}
      </div>

      {focus.connected?.length > 0 && (
        <Block heading="RECENTLY CONNECTED">
          {focus.connected.map((c, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full" style={{ background: c.color || "#57D8FF" }} />
              <span className="min-w-0">
                <span className="block text-[12.5px] leading-snug text-[#D7E4F2]">{c.label}</span>
                {c.detail && <span className="mt-0.5 block text-[11px] leading-snug text-[#8EA0B8]">{c.detail}</span>}
              </span>
            </div>
          ))}
        </Block>
      )}

      {focus.sections?.map((s, i) => (
        <Block key={i} heading={s.heading}>
          {s.items.map((it, j) => (
            <div key={j} className={`text-[12.5px] leading-snug ${it.tone === "muted" ? "text-[#8EA0B8]" : "text-[#C9D6E7]"}`}>{it.label}</div>
          ))}
        </Block>
      ))}
    </>
  );
}

const Row = ({ k, v, tone }) => (
  <div className="flex items-baseline gap-2 mb-1.5">
    <span className="min-w-[52px] text-[10.5px] text-ink-5">{k}</span>
    <span className={`text-[12px] ${tone === "ok" ? "font-medium text-ok" : "text-ink-3"}`}>{v}</span>
  </div>
);
const Block = ({ heading, children }) => (
  <div className="mb-6">
    <div className="mb-3 text-[10px] font-medium tracking-[0.09em] text-ink-5">{heading}</div>
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);
const Empty = ({ children }) => <div className="text-[12.5px] leading-relaxed text-ink-5">{children}</div>;
