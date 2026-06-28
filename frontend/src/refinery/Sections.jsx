import { useCallback, useEffect, useRef, useState } from 'react';
import { useReveal } from './hooks/useReveal';
import KnowledgeGraph from './KnowledgeGraph';
import ProblemVisual from './ProblemVisual';
import FlowGraph from './FlowGraph';
import { Glyph, Logo } from './Icons';
import {
  NAV_LINKS, SOURCES, STEPS, INPUTS, SOON, OUTPUTS_TOP, OUTPUTS_BOT, STRUCTURES,
  USE_CASES, COMPARISON_ROWS, PLANS, CAPABILITIES,
} from './data';

const Eyebrow = ({ children }) => (
  <div className="mb-[22px] font-mono text-[12px] uppercase tracking-[0.24em] text-cyan">{children}</div>
);

/* 1 --------------------------------------------------------------- Nav */
export function Nav() {
  const ref = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const onScroll = () => el.classList.toggle('nav-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const href = (l) => {
    const map = {
      'Product': '#model', 'How It Works': '#how', 'Use Cases': '#cases',
      'Developers': '#developers', 'Pricing': '#pricing',
    };
    return map[l] || '#';
  };
  return (
    <nav ref={ref} className="nav fixed inset-x-0 top-0 z-[100] flex items-center gap-6 px-6 py-5 md:px-10">
      <a href="#top" className="no-underline shrink-0"><Logo /></a>
      <div className="hidden md:flex flex-1 justify-center gap-[38px]">
        {NAV_LINKS.map((l) => (
          <a key={l} href={href(l)} className="text-[14.5px] text-sub no-underline transition-colors hover:text-cyan">{l}</a>
        ))}
      </div>
      <div className="hidden md:flex items-center gap-4">
        <a href="https://app.intelrefinery.site/login" className="text-[14.5px] text-sub no-underline transition-colors hover:text-cyan">Sign In</a>
        <a href="https://app.intelrefinery.site/signup" className="btn-primary !px-[18px] !py-[10px] !text-[14px]">Start Refining</a>
      </div>
      <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden ml-auto text-sub p-2" aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      {menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[72px] z-[99] bg-ink border-t border-white/5 px-6 py-6 flex flex-col gap-4">
          {NAV_LINKS.map((l) => (
            <a key={l} href={href(l)} className="text-[15px] text-sub no-underline" onClick={() => setMenuOpen(false)}>{l}</a>
          ))}
          <hr className="border-white/5" />
          <a href="https://app.intelrefinery.site/login" className="text-[15px] text-sub no-underline" onClick={() => setMenuOpen(false)}>Sign In</a>
          <a href="https://app.intelrefinery.site/signup" className="btn-primary !px-[18px] !py-[10px] !text-[14px] text-center" onClick={() => setMenuOpen(false)}>Start Refining</a>
        </div>
      )}
    </nav>
  );
}

/* 2 --------------------------------------------------------------- Hero is in Hero.jsx */

/* 3 ------------------------------------------------------- ProblemSection */
export function ProblemSection() {
  const a = useReveal(), b = useReveal(120), c = useReveal(200), d = useReveal(280);
  return (
    <section className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 pb-[40px] pt-[80px] md:px-10 md:pb-[50px] md:pt-[110px] lg:grid-cols-[0.78fr_1.22fr]">
        <div ref={a} className="reveal">
          <Eyebrow>THE PROBLEM</Eyebrow>
          <h2 className="m-0 mb-[18px] text-[clamp(24px,3vw,40px)] font-semibold leading-[1.15] tracking-[-0.02em]">
            Having more information does not mean understanding more.
          </h2>
          <p className="m-0 text-[15px] md:text-[15px] md:text-[15.5px] leading-[1.7] text-sub max-w-[480px]">
            Documents sit in different folders. Useful details are buried in long reports. Notes lose their context. Links are forgotten. Important relationships remain invisible.
          </p>
          <p className="mt-4 text-[15px] md:text-[15px] md:text-[15.5px] leading-[1.7] text-sub max-w-[480px]">
            You may have all the information you need and still not know what it means, how it connects or what to do next.
          </p>
        </div>
        <div ref={b} className="reveal">
          <ProblemVisual />
        </div>
      </div>
      <p ref={c} className="reveal mx-auto max-w-[1280px] px-6 pb-[40px] md:px-10 md:pb-[50px] text-[14px] md:text-[15px] leading-[1.6] text-[#b6c0cd]">
        Intel Refinery does the difficult work between collecting information and actually understanding it.
      </p>
      <div ref={d} className="reveal mx-auto grid max-w-[1280px] grid-cols-3 gap-4 px-6 pb-[70px] md:px-10 sm:grid-cols-5 md:pb-[100px]">
        {SOURCES.map(([name, icon]) => (
          <div key={name} className="flex flex-col items-center gap-[9px] text-center text-muted transition-colors hover:text-cyan">
            <span className="text-sub"><Glyph name={icon} /></span>
            <span className="text-[12px] md:text-[12.5px]">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* 4 --------------------------------------------------------- HowItWorks */
export function HowItWorks() {
  const head = useReveal(), sub = useReveal(80);
  return (
    <section id="how" className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:px-10 md:py-[80px] md:py-[110px]">
        <div ref={head} className="reveal mb-4"><Eyebrow>HOW REFINERY WORKS</Eyebrow></div>
        <h2 ref={sub} className="reveal m-0 mb-[18px] text-[clamp(22px,2.7vw,38px)] font-semibold leading-[1.15] tracking-[-0.02em]">
          From scattered sources to structured understanding.
        </h2>
        <p className="reveal m-0 mb-10 max-w-[540px] text-[15px] md:text-[15px] md:text-[15.5px] leading-[1.6] text-sub" ref={useReveal(140)}>
          Add the information you already have. Refinery discovers its natural structure, connects what belongs together and turns it into something you can explore and use.
        </p>
        <div className="grid grid-cols-1 gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, body], i) => <StepCard key={title} title={title} body={body} i={i} />)}
        </div>
      </div>
    </section>
  );
}
function StepCard({ title, body, i }) {
  const r = useReveal(i * 80);
  return (
    <div ref={r} className="reveal">
      <div className="mb-[18px] flex items-center gap-[14px]">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-cyan/40 font-mono text-[14px] text-cyan">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="m-0 text-[19px] font-semibold">{title}</h3>
      </div>
      <p className="m-0 mb-[26px] text-[14px] md:text-[15px] leading-[1.6] text-sub">{body}</p>
      <div className="relative h-[130px]">
        {i === 0 && <UploadGlyph />}
        {i === 1 && <KnowledgeGraph variant="cluster" edgeCycle />}
        {i === 2 && <KnowledgeGraph variant="understand" />}
        {i === 3 && <KnowledgeGraph variant="living" />}
      </div>
    </div>
  );
}
function UploadGlyph() {
  return (
    <div className="relative flex h-[130px] items-center justify-center">
      <div className="absolute h-[90px] w-[90px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(87,216,255,0.18),transparent 70%)' }} />
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="float-soft">
        <path d="M20 40a10 10 0 01-1-19.9A14 14 0 0146 24a9 9 0 01-1 18" stroke="#57D8FF" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M32 44V28M26 33l6-6 6 6" stroke="#57D8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* 5 ------------------------------------------------------ LiveRefinement */
export function LiveRefinement() {
  const a = useReveal(), b = useReveal(120), c = useReveal(200);
  const [logs, setLogs] = useState([]);
  const clock = useRef(9 * 60 + 11);
  const idx = useRef(0);

  const onLog = useCallback((text, color) => {
    clock.current += 1; idx.current += 1;
    const hh = String(Math.floor(clock.current / 60)).padStart(2, '0');
    const mm = String(clock.current % 60).padStart(2, '0');
    const entry = { id: `${Date.now()}-${idx.current}`, time: `${hh}:${mm}`, text, color };
    setLogs((s) => [entry, ...s].slice(0, 7));
  }, []);

  return (
    <section className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-10 px-6 py-[80px] md:px-10 md:py-[80px] md:py-[110px] lg:grid-cols-[0.82fr_1.18fr]">
        <div ref={a} className="reveal">
          <Eyebrow>WATCH UNDERSTANDING EMERGE</Eyebrow>
          <h2 className="m-0 mb-[18px] text-[clamp(22px,2.7vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]">
            No more waiting on a spinner.<br />Watch Refinery build understanding in real time.
          </h2>
          <p className="m-0 mb-[18px] text-[15px] md:text-[15px] md:text-[15.5px] leading-[1.6] text-sub">
            See meaningful progress as Refinery reads, connects, reconsiders and reorganises your information.
          </p>
          <a href="#" className="btn-ghost mb-[30px]">See It in Action <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 2.5l8 4.5-8 4.5z" fill="#57D8FF" /></svg></a>
          <div className="rounded-[14px] border border-white/[0.07] bg-card p-[18px_18px_8px]">
            <div className="mb-[14px] flex items-center justify-between">
              <span className="font-mono text-[13px] font-semibold tracking-[0.04em] text-[#cdd6e2]">Refinement Log</span>
              <span className="flex items-center gap-[6px] font-mono text-[11px] text-cyan">
                <span className="live-dot h-[7px] w-[7px] rounded-full bg-cyan" />Live
              </span>
            </div>
            <div className="flex min-h-[188px] flex-col">
              {logs.map((log) => (
                <div key={log.id} className="log-row flex items-center gap-3 border-b border-white/[0.04] py-[9px]">
                  <span className="min-w-[34px] font-mono text-[11.5px] text-muted">{log.time}</span>
                  <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: log.color, boxShadow: `0 0 8px ${log.color}` }} />
                  <span className="text-[13.5px] text-[#b6c0cd]">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div ref={b} className="reveal relative h-[320px] md:h-[480px]">
          <FlowGraph onLog={onLog} />
        </div>
      </div>
    </section>
  );
}

/* 6 ----------------------------------------------- RefineryModelSection */
export function RefineryModelSection() {
  const a = useReveal(), b = useReveal(140), c = useReveal(240);
  return (
    <section id="model" className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={a} className="reveal mb-4"><Eyebrow>THE REFINERY MODEL</Eyebrow></div>
        <h2 className="reveal m-0 mb-[18px] text-[clamp(22px,2.7vw,38px)] font-semibold leading-[1.15] tracking-[-0.02em]" ref={useReveal(60)}>
          The report is only one view.<br />The model is the real product.
        </h2>
        <p className="reveal m-0 mb-12 max-w-[600px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub" ref={useReveal(120)}>
          Intel Refinery does not flatten your information into one disposable answer. It builds a persistent, connected model of the subject containing important findings, their sources, relationships, conflicting information, open questions and the structure that emerged from the material.
        </p>
        <div ref={b} className="reveal relative h-[220px] sm:h-[380px] mb-12">
          <KnowledgeGraph variant="living" color="#57D8FF" edgeCycle evolve />
        </div>
        <div ref={c} className="reveal grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['Findings', 'Sources', 'Relationships', 'Subjects', 'Conflicting Information', 'Open Questions', 'Confidence', 'Model Versions'].map((label) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-card px-4 py-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-cyan" />
              <span className="text-[13px] text-[#b6c0cd]">{label}</span>
            </div>
          ))}
        </div>
        <p className="reveal mt-10 max-w-[600px] text-[15px] leading-[1.6] text-sub" ref={useReveal(300)}>
          Because the understanding is stored as a model, it can be explored, queried, updated and transformed without starting the research again.
        </p>
      </div>
    </section>
  );
}

/* 7 ----------------------------------------------- AdaptiveStructure */
export function AdaptiveStructure() {
  const head = useReveal(), sub = useReveal(80);
  return (
    <section id="cases" className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={head} className="reveal mb-4"><Eyebrow>ADAPTIVE BY DESIGN</Eyebrow></div>
        <h2 ref={sub} className="reveal m-0 mb-[18px] text-[clamp(22px,2.7vw,38px)] font-semibold leading-[1.15] tracking-[-0.02em]">
          Your information decides the structure.
        </h2>
        <p className="reveal m-0 mb-[50px] max-w-[540px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub" ref={useReveal(140)}>
          Intel Refinery does not force every project into the same template. Useful subjects, relationships, sections and views emerge from the information itself. Irrelevant categories disappear. New ones appear when the material requires them.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STRUCTURES.map(([title, variant, color], i) => <StructCard key={title} title={title} variant={variant} color={color} i={i} />)}
        </div>
      </div>
    </section>
  );
}
function StructCard({ title, variant, color, i }) {
  const r = useReveal(i * 100);
  return (
    <div ref={r} className="reveal rounded-[16px] border border-white/[0.07] bg-card p-5">
      <div className="mb-2 text-center text-[14px] font-semibold text-[#cdd6e2]">{title}</div>
      <div className="relative h-[180px] sm:h-[210px]"><KnowledgeGraph variant={variant} color={color} edgeCycle /></div>
    </div>
  );
}

/* 8 ----------------------------------------------- ComparisonSection */
export function ComparisonSection() {
  const a = useReveal(), b = useReveal(120);
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={a} className="reveal mb-4"><Eyebrow>MORE THAN A PROMPT</Eyebrow></div>
        <h2 className="reveal m-0 mb-[50px] text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]" ref={useReveal(60)}>
          A regular LLM answers your prompt.<br />Intel Refinery builds an understanding you can keep using.
        </h2>
        <div ref={b} className="reveal">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-[14px] border border-white/[0.07]">
            <table className="w-full border-collapse text-[13px] md:text-[14px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-4 text-left font-semibold text-[#cdd6e2] w-1/2">Regular LLM</th>
                  <th className="px-5 py-4 text-left font-semibold text-cyan w-1/2">Intel Refinery</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map(([llm, refinery], i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-4 align-top text-sub">{llm}</td>
                    <td className="px-5 py-4 align-top text-[#b6c0cd]">{refinery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile stacked cards */}
          <div className="sm:hidden flex flex-col gap-3">
            {COMPARISON_ROWS.map(([llm, refinery], i) => (
              <div key={i} className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
                <div className="px-4 py-3 bg-white/[0.03] border-b border-white/[0.04]">
                  <div className="text-[11px] font-mono tracking-wider text-muted mb-1">REGULAR LLM</div>
                  <div className="text-[13px] text-sub">{llm}</div>
                </div>
                <div className="px-4 py-3">
                  <div className="text-[11px] font-mono tracking-wider text-cyan mb-1">INTEL REFINERY</div>
                  <div className="text-[13px] text-[#b6c0cd]">{refinery}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="reveal mt-8 text-[15px] leading-[1.6] text-sub" ref={useReveal(180)}>
          A regular LLM responds to your information. Intel Refinery turns it into something useful.
        </p>
      </div>
    </section>
  );
}

/* 9 ----------------------------------------------- SourceTraceSection */
export function SourceTraceSection() {
  const a = useReveal(), b = useReveal(120), c = useReveal(200);
  return (
    <section className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={a} className="reveal mb-4"><Eyebrow>KNOW WHERE IT CAME FROM</Eyebrow></div>
        <h2 className="reveal m-0 mb-[18px] text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.15] tracking-[-0.02em]" ref={useReveal(60)}>
          Every important finding can be traced back to its source.
        </h2>
        <p className="reveal m-0 mb-10 max-w-[500px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub" ref={useReveal(100)}>
          Open a finding to see the information that contributed to it, where different sources agree, where they conflict and how confident the current understanding is.
        </p>
        <div ref={b} className="reveal grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[14px] border border-white/[0.07] bg-card p-6">
            <div className="mb-3 font-mono text-[11px] tracking-[0.08em] text-cyan">FINDING</div>
            <div className="text-[16px] font-medium leading-snug text-[#cdd6e2]">
              Customer onboarding is the largest source of early-stage churn.
            </div>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-card p-6">
            <div className="grid grid-cols-2 gap-4">
              {[['Related Sources', '12'], ['Supporting Information', '8 sources'], ['Conflicting Information', '2 sources'], ['Connected Findings', '5'], ['Confidence', 'High'], ['Last Updated', 'Model v4']].map(([k, v]) => (
                <div key={k}>
                  <div className="mb-1 text-[11px] font-medium tracking-[0.06em] text-muted">{k}</div>
                  <div className="text-[15px] text-[#b6c0cd]">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="reveal mt-10 max-w-[500px] text-[15px] leading-[1.6] text-sub" ref={useReveal(240)}>
          You should never have to wonder where an important conclusion came from.
        </p>
      </div>
    </section>
  );
}

/* 10 ---------------------------------------- IncrementalRefinement */
export function IncrementalRefinementSection() {
  const a = useReveal(), b = useReveal(120), c = useReveal(200);
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={a} className="reveal mb-4"><Eyebrow>UNDERSTANDING THAT EVOLVES</Eyebrow></div>
        <h2 className="reveal m-0 mb-[18px] text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.15] tracking-[-0.02em]" ref={useReveal(60)}>
          Add new information without starting over.
        </h2>
        <p className="reveal m-0 mb-10 max-w-[500px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub" ref={useReveal(100)}>
          When new material is added, Intel Refinery reviews it against the existing model and updates only what needs to change.
        </p>
        <div ref={b} className="reveal grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr_1fr] items-center">
          <div className="rounded-[14px] border border-white/[0.07] bg-card p-6 text-center">
            <div className="text-[36px] font-semibold text-[#cdd6e2]">42</div>
            <div className="text-[13px] text-muted">existing sources</div>
            <div className="mt-4 text-[28px] font-semibold text-cyan">+3</div>
            <div className="text-[13px] text-muted">new sources added</div>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-card p-6">
            {[
              ['4 findings strengthened', '#57D8FF'],
              ['2 findings revised', '#D7C38A'],
              ['1 new conflict discovered', '#E8A24A'],
              ['5 new connections created', '#57D8FF'],
              ['18 findings unchanged', '#5C6878'],
            ].map(([text, color]) => (
              <div key={text} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <span className="h-[6px] w-[6px] shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-[14px] text-[#b6c0cd]">{text}</span>
              </div>
            ))}
          </div>
          <div className="rounded-[14px] border border-cyan/20 bg-card p-6 text-center">
            <div className="mb-2 font-mono text-[11px] tracking-[0.08em] text-cyan">REFINERY MODEL</div>
            <div className="text-[16px] text-muted">v4</div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto my-2"><path d="M4 10h12M11 6l5 4-5 4" stroke="#57D8FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div className="text-[24px] font-semibold text-cyan">v5</div>
          </div>
        </div>
        <p className="reveal mt-10 max-w-[520px] text-[15px] leading-[1.6] text-sub" ref={useReveal(240)}>
          Your project becomes a living body of understanding rather than a collection of disconnected reports.
        </p>
      </div>
    </section>
  );
}

/* 11 ------------------------------------------------------ InputOutput */
export function InputOutput() {
  const a = useReveal(), b = useReveal(120);
  const [active, setActive] = useState(0);
  const total = OUTPUTS_TOP.length + OUTPUTS_BOT.length;
  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % total), 1300);
    return () => clearInterval(t);
  }, [total]);
  const tile = (idxBase) => ([name, icon], i) => {
    const on = active === idxBase + i;
    return (
      <div key={name}
        className="flex flex-col items-center gap-[9px] rounded-[12px] border bg-card p-[16px_6px] transition-all duration-300"
        style={{
          borderColor: on ? 'rgba(87,216,255,0.6)' : 'rgba(255,255,255,0.07)',
          boxShadow: on ? '0 0 30px rgba(87,216,255,0.22)' : 'none',
          transform: on ? 'translateY(-4px) scale(1.03)' : 'none',
        }}>
        <span style={{ color: on ? '#57D8FF' : '#9AA7B8', transition: 'color .3s' }}><Glyph name={icon} /></span>
        <span className="text-center text-[11px] leading-[1.25] text-[#b6c0cd]">{name}</span>
      </div>
    );
  };
  return (
    <section id="product" className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <p className="mb-12 max-w-[600px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub">
          Bring your information together once. Transform the resulting understanding for different people, purposes and tools.
        </p>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div ref={a} className="reveal">
            <Eyebrow>ADD ALMOST ANYTHING</Eyebrow>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {INPUTS.map(([name, icon]) => (
                <div key={name} className="flex flex-col items-center gap-[10px] rounded-[12px] border border-white/[0.07] bg-card p-[18px_10px] transition-all duration-300 hover:-translate-y-1 hover:border-cyan/40 hover:shadow-[0_0_26px_rgba(87,216,255,0.16)]">
                  <span className="text-sub"><Glyph name={icon} /></span>
                  <span className="text-[12px] text-[#b6c0cd]">{name}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SOON.map(([name, icon]) => (
                <div key={name} className="flex flex-col items-center gap-[10px] rounded-[12px] border border-dashed border-white/[0.08] bg-white/[0.015] p-[18px_10px]">
                  <span className="text-[#4a5564]"><Glyph name={icon} /></span>
                  <span className="text-[12px] text-muted">{name}</span>
                </div>
              ))}
              <div className="flex items-center justify-center rounded-[12px] border border-dashed border-white/[0.05]">
                <span className="font-mono text-[12px] tracking-[0.06em] text-[#46505e]">Coming Soon</span>
              </div>
            </div>
          </div>
          <div ref={b} className="reveal">
            <Eyebrow>ONE MODEL. MANY USEFUL FORMS.</Eyebrow>
            <div className="flex flex-wrap gap-[6px] mb-5">{OUTPUTS_TOP.map(tile(0))}</div>
            <div className="flex flex-wrap gap-[6px]">{OUTPUTS_BOT.map(tile(OUTPUTS_TOP.length))}</div>
            <p className="mt-[26px] text-[14.5px] leading-[1.6] text-muted">
              One understanding. Every format. Watch it transform from raw insight into whatever shape your work needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 12 ---------------------------------------------------- UseCasesSection */
export function UseCasesSection() {
  const head = useReveal(), sub = useReveal(80);
  return (
    <section className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={head} className="reveal mb-4"><Eyebrow>BUILT FOR REAL INFORMATION WORK</Eyebrow></div>
        <h2 ref={sub} className="reveal m-0 mb-[50px] max-w-[600px] text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]">
          Use Intel Refinery anywhere information has become difficult to understand.
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(([title, desc], i) => (
            <UseCaseCard key={title} title={title} desc={desc} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
function UseCaseCard({ title, desc, i }) {
  const r = useReveal(i * 80);
  return (
    <div ref={r} className="reveal rounded-[14px] border border-white/[0.07] bg-card p-6">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-cyan/20 bg-cyan/[0.06]">
        <span className="font-mono text-[12px] font-semibold text-cyan">{i + 1}</span>
      </div>
      <div className="mb-2 text-[16px] font-semibold text-[#cdd6e2]">{title}</div>
      <p className="m-0 text-[14px] leading-[1.6] text-sub">{desc}</p>
    </div>
  );
}

/* 13 ----------------------------------------------- DeveloperSection */
export function DeveloperSection() {
  const a = useReveal(), b = useReveal(120);
  return (
    <section id="developers" className="border-t border-white/5 bg-[#0B0E14]">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_1fr]">
          <div ref={a} className="reveal">
            <Eyebrow>FOR DEVELOPERS</Eyebrow>
            <h2 className="m-0 mb-[22px] text-[clamp(24px,2.5vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em]">
              Build with the Refinery engine.
            </h2>
            <p className="mb-6 max-w-[440px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub">
              Add multi-source understanding, persistent knowledge models and traceable findings to your own product through one API.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {CAPABILITIES.map((cap) => (
                <div key={cap} className="flex items-center gap-3">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0"><path d="M3.5 7.5l2.5 2.5 5-5.5" stroke="#57D8FF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-[14px] text-[#b6c0cd]">{cap}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="https://api.intelrefinery.site/docs" className="btn-primary">Explore the API</a>
              <a href="https://api.intelrefinery.site/docs" className="btn-ghost">Read Documentation</a>
            </div>
          </div>
          <div ref={b} className="reveal flex flex-col gap-4">
            <div className="rounded-[12px] border border-white/[0.07] bg-card p-5">
              <div className="mb-3 font-mono text-[11px] font-semibold text-muted">Request</div>
              <pre className="m-0 overflow-x-auto text-[13px] leading-[1.6] text-[#b6c0cd]">{`{
  "project": "customer-research",
  "sources": [
    "interviews.pdf",
    "support-tickets.csv",
    "reviews.json"
  ],
  "goal": "Find recurring problems and unmet needs"
}`}</pre>
            </div>
            <div className="rounded-[12px] border border-white/[0.07] bg-card p-5">
              <div className="mb-3 font-mono text-[11px] font-semibold text-cyan">Response</div>
              <pre className="m-0 overflow-x-auto text-[13px] leading-[1.6] text-[#b6c0cd]">{`{
  "findings": [],
  "connections": [],
  "conflicts": [],
  "questions": [],
  "model_version": 3
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* 14 -------------------------------------------- PricingPreviewSection */
export function PricingPreviewSection() {
  const a = useReveal();
  return (
    <section id="pricing" className="border-t border-white/5">
      <div className="mx-auto max-w-[1280px] px-6 py-[80px] md:py-[110px] md:px-10">
        <div ref={a} className="reveal mb-4"><Eyebrow>START SMALL. REFINE MORE AS YOU GROW.</Eyebrow></div>
        <h2 className="reveal m-0 mb-[50px] text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]" ref={useReveal(60)}>
          Choose the capacity that fits your work.
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} i={i} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="#" className="text-[14px] text-cyan no-underline transition-colors hover:text-cyan-bright">View Full Pricing</a>
        </div>
      </div>
    </section>
  );
}
function PricingCard({ plan, i }) {
  const r = useReveal(i * 80);
  return (
    <div ref={r} className={`reveal rounded-[16px] border p-6 ${plan.recommended ? 'border-cyan/40 bg-cyan/[0.04]' : 'border-white/[0.07] bg-card'}`}>
      {plan.recommended && <div className="mb-3 font-mono text-[10px] font-semibold tracking-[0.14em] text-cyan">RECOMMENDED</div>}
      <div className="mb-1 text-[20px] font-semibold text-[#cdd6e2]">{plan.name}</div>
      <div className="mb-4 text-[28px] font-bold text-ink-text">{plan.price}</div>
      <p className="mb-5 text-[13px] leading-[1.5] text-sub">{plan.desc}</p>
      <ul className="m-0 mb-6 list-none p-0 flex flex-col gap-2">
        {plan.items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[13px] text-[#b6c0cd]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0"><path d="M3 6l2 2 4-4" stroke="#57D8FF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {item}
          </li>
        ))}
      </ul>
      <a href="#" className={`block w-full rounded-[10px] py-3 text-center text-[13px] font-medium no-underline transition-all ${plan.recommended ? 'bg-cyan text-[#06222C] hover:bg-cyan-bright' : 'border border-white/[0.12] text-[#b6c0cd] hover:border-cyan/40'}`}>
        {plan.cta}
      </a>
    </div>
  );
}

/* 15 -------------------------------------------------------- FinalCTA */
export function FinalCTA() {
  const reveal = useReveal();
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas.getContext('2d');
    let raf = 0, parts = [], W = 0, H = 0, active = true;
    const resize = () => {
      const r = canvas.getBoundingClientRect(); if (r.width < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.06, vy: -0.04 - Math.random() * 0.07, a: 0.08 + Math.random() * 0.22, ph: Math.random() * 6.28 }));
    };
    const tick = (now) => {
      if (active && W) {
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -5) p.y = H + 5; if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
          ctx.globalAlpha = p.a * (0.5 + 0.5 * Math.sin(now * 0.001 + p.ph));
          ctx.fillStyle = '#57D8FF'; ctx.shadowColor = '#57D8FF'; ctx.shadowBlur = 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver((e) => { active = e[0].isIntersecting; }, { threshold: 0.01 }); io.observe(canvas);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);
  return (
    <section className="relative overflow-hidden border-t border-white/5">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" style={{ contain: 'layout paint size', willChange: 'transform' }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(ellipse,rgba(87,216,255,0.1),transparent 65%)' }} />
      <div ref={reveal} className="reveal relative mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-8 px-6 py-[130px] md:flex-row md:items-center md:px-10">
        <div>
          <h2 className="m-0 mb-[14px] text-[clamp(22px,3vw,40px)] font-semibold leading-[1.2] tracking-[-0.02em]">
            Your information already contains value.<br /><span className="text-sub">Refine it.</span>
          </h2>
          <p className="m-0 max-w-[440px] text-[15px] md:text-[15.5px] leading-[1.6] text-sub">
            Bring your documents, links, notes, images and recordings together and discover what they actually mean.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <a href="https://app.intelrefinery.site/signup" className="btn-primary !px-7 !py-[15px] !text-[16px] shadow-[0_0_30px_rgba(87,216,255,0.3)]">Start Refining <Glyph name="arrow" size={16} stroke={1.6} /></a>
          <a href="#" className="flex items-center gap-[7px] text-[13px] text-muted no-underline transition-colors hover:text-cyan">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2.5l8 4.5-8 4.5z" fill="#57D8FF" /></svg>
            Explore a Demo
          </a>
        </div>
      </div>
    </section>
  );
}

/* 16 ----------------------------------------------------------- Footer */
const FOOTER = {
  Product: ['How It Works', 'Use Cases', 'Pricing', 'Developers'],
  Resources: ['Documentation', 'API Reference', 'Demo Projects', 'Changelog'],
  Company: ['About', 'Contact', 'Privacy', 'Terms', 'Security'],
};
export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-10 px-6 pb-10 pt-[70px] md:grid-cols-5 md:px-10">
        <div className="col-span-2 md:col-span-1">
          <div className="mb-[14px]"><Logo size={24} /></div>
          <p className="m-0 text-[13px] leading-[1.5] text-muted">Intel Refinery turns scattered information into structured understanding.</p>
        </div>
        {Object.entries(FOOTER).map(([head, links]) => (
          <div key={head}>
            <div className="mb-4 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{head}</div>
            <div className="flex flex-col gap-[11px]">
              {links.map((l) => <a key={l} href="#" className="text-[14px] text-sub no-underline transition-colors hover:text-cyan">{l}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 border-t border-white/[0.04] px-6 pb-10 pt-6 md:flex-row md:px-10">
        <span className="text-[12.5px] text-[#46505e]">&copy; {new Date().getFullYear()} Intel Refinery. All rights reserved.</span>
        <div className="flex gap-[14px]">
          {['Privacy', 'Terms', 'Security'].map((l) => <a key={l} href="#" className="text-[12.5px] text-muted no-underline transition-colors hover:text-sub">{l}</a>)}
        </div>
      </div>
    </footer>
  );
}
