import { useCanvasGraph } from './hooks/useCanvasGraph';
import { layouts, HERO_FILES, HERO_CORE } from './lib/graphEngine';
import { FileGlyph, Glyph } from './Icons';

export default function Hero() {
  const canvasRef = useCanvasGraph(() => ({
    color: '#57D8FF',
    edgeCycle: true,
    decor: 'hero',
    files: HERO_FILES,
    core: HERO_CORE,
    build: layouts.hero,
  }));

  return (
    <section className="mx-auto grid min-h-[88vh] max-w-[1280px] grid-cols-1 items-center gap-8 px-6 pb-[70px] pt-[130px] md:px-10 md:pb-[90px] md:pt-[150px] lg:grid-cols-[0.92fr_1.08fr]">
      <div>
        <div className="hero-rise mb-5 font-mono text-[11px] md:text-[12px] uppercase tracking-[0.24em] text-cyan" style={{ animationDelay: '.05s' }}>
          TURN INFORMATION INTO UNDERSTANDING
        </div>
        <h1 className="m-0 mb-[22px] text-[clamp(34px,5.2vw,78px)] font-semibold leading-[1.02] tracking-[-0.025em]">
          <span className="hero-rise inline-block" style={{ animationDelay: '0.12s' }}>They say data is the new oil.</span>
          <br />
          <span className="hero-rise inline-block text-cyan" style={{ animationDelay: '.4s' }}>
            We refine it into understanding.
          </span>
        </h1>
        <p className="hero-rise m-0 mb-[28px] max-w-[460px] text-[15px] md:text-[17px] leading-[1.6] md:leading-[1.65] text-sub" style={{ animationDelay: '.56s' }}>
          Your information is not valuable simply because you have it. Intel Refinery connects documents, links, notes, images and recordings to reveal what matters, what relates, what conflicts and what deserves your attention.
        </p>
        <div className="hero-rise flex flex-col sm:flex-row gap-3" style={{ animationDelay: '.68s' }}>
          <a href="https://app.intelrefinery.site/signup" className="btn-primary justify-center">Start Refining <Glyph name="arrow" size={15} stroke={1.6} /></a>
          <a href="#" className="btn-ghost justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2.5l8 4.5-8 4.5z" fill="#57D8FF" /></svg>
            Explore a Demo
          </a>
        </div>
        <div className="hero-rise mt-[30px] md:mt-[38px] text-[13px] md:text-[13.5px] leading-[1.4] text-muted" style={{ animationDelay: '.82s' }}>
          Documents, links, notes, images, audio and more.
        </div>
      </div>

      <div className="hero-rise relative h-[380px] md:h-[560px]" style={{ contain: 'layout paint', animationDelay: '.35s' }}>
        <canvas ref={canvasRef} className="absolute inset-0 z-[1] block h-full w-full" style={{ willChange: 'transform' }} />
        {HERO_FILES.map((f) => (
          <div
            key={f.key}
            className="absolute z-[2] -ml-[26px] -mt-[26px] flex h-[52px] w-[52px] items-center justify-center rounded-[13px]"
            style={{ left: `${f.nx * 100}%`, top: `${f.ny * 100}%`, background: f.bg, border: `1px solid ${f.border}`, boxShadow: '0 10px 26px rgba(0,0,0,0.55)' }}
          >
            <FileGlyph name={f.key} />
          </div>
        ))}
      </div>
    </section>
  );
}
