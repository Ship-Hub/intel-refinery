import { useEffect, useRef } from 'react';

/**
 * useReveal — one-shot scroll reveal via IntersectionObserver.
 * Animates ONLY opacity + transform (GPU-composited, no layout, no shake).
 *
 * Usage:
 *   const ref = useReveal();
 *   <div ref={ref} className="reveal">…</div>
 *
 * Pair with this CSS (see index.css / INTEGRATION.md):
 *   .reveal      { opacity:0; transform:translateY(24px);
 *                  transition:opacity .6s cubic-bezier(.22,.61,.36,1),
 *                             transform .6s cubic-bezier(.22,.61,.36,1); will-change:opacity,transform; }
 *   .reveal.in   { opacity:1; transform:none; }
 *
 * @param {number} delayMs optional stagger delay
 */
export function useReveal(delayMs = 0) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (delayMs) el.style.transitionDelay = `${delayMs}ms`;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          el.classList.add('in');
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delayMs]);
  return ref;
}
