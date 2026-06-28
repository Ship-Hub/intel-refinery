import { useEffect, useRef } from 'react';
import { GraphController } from '../lib/graphEngine';

export function useCanvasGraph(cfgFactory) {
  const canvasRef = useRef(null);
  const cfgRef = useRef(cfgFactory);
  cfgRef.current = cfgFactory;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctrl = new GraphController(canvas, cfgRef.current());
    let raf = 0;
    let active = true;

    const loop = (now) => {
      if (active) ctrl.tick(now);
      raf = requestAnimationFrame(loop);
    };

    ctrl.resize();
    const ro = new ResizeObserver(() => ctrl.resize());
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => { active = entries[0].isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      ctrl.destroy();
    };
  }, []);

  return canvasRef;
}

export function useCanvasController(factory) {
  const canvasRef = useRef(null);
  const facRef = useRef(factory);
  facRef.current = factory;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctrl = facRef.current(canvas);
    let raf = 0;
    let active = true;

    const loop = (now) => {
      if (active) ctrl.tick(now);
      raf = requestAnimationFrame(loop);
    };

    ctrl.resize();
    const ro = new ResizeObserver(() => ctrl.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (entries) => { active = entries[0].isIntersecting; },
      { threshold: 0.01 }
    );
    io.observe(canvas);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      ctrl.destroy && ctrl.destroy();
    };
  }, []);

  return canvasRef;
}
