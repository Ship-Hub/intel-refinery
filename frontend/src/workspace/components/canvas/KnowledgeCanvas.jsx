import { useEffect, useRef } from "react";

const CYAN = [120, 222, 255];

function makeRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildSatellites(node, rng) {
  const count = node.satellites ?? (node.isCenter ? 0 : 6);
  return Array.from({ length: count }, (_, k) => ({
    angle: (k / count) * Math.PI * 2 + rng() * 0.9,
    dist: node.radius * (1.55 + rng() * 1.4),
    size: 1.0 + rng() * 2.2,
    appearAt: (node.appearAt ?? 1) + 0.5 + rng() * 1.9,
    twSpeed: 0.7 + rng() * 1.9,
    twPhase: rng() * Math.PI * 2,
    dir: rng() > 0.5 ? 1 : -1,
  }));
}

export default function KnowledgeCanvas({
  nodes = [],
  links = [],
  progress = 0,
  settling = false,
  onNodeHover,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const startRef = useRef(0);

  const sceneRef = useRef({ nodes, links, progress, settling });
  sceneRef.current = { nodes, links, progress, settling };

  const derivedRef = useRef({ key: "", amb: [], sats: {}, timings: {} });
  useEffect(() => {
    const key = nodes.map((n) => n.id).join("|");
    if (derivedRef.current.key === key) return;
    const rng = makeRng(91);
    const sats = {};
    const timings = {};
    nodes.forEach((n, i) => {
      timings[n.id] = n.appearAt ?? 1 + i * 0.9;
      sats[n.id] = buildSatellites({ ...n, appearAt: timings[n.id] }, rng);
    });
    const ambRng = makeRng(7);
    const amb = Array.from({ length: 54 }, () => ({
      x: ambRng(),
      y: ambRng(),
      r: 0.4 + ambRng() * 1.5,
      sp: 0.25 + ambRng() * 1.1,
      ph: ambRng() * Math.PI * 2,
      warm: ambRng() > 0.62,
    }));
    derivedRef.current = { key, amb, sats, timings };
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    runningRef.current = true;
    startRef.current = performance.now();

    const draw = (t) => {
      const { nodes, links, progress, settling } = sceneRef.current;
      const { amb, sats, timings } = derivedRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      if (!W || !H) return;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const motion = settling ? Math.max(0, 1 - (t - (settling.startedAt || 0))) : 1;

      const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
      const liveOpacity = (n) => {
        const at = timings[n.id] ?? 1;
        return Math.min(1, Math.max(0, (t - at) / 0.85));
      };
      const driftX = (n, i) => (settling ? 0 : Math.sin(t * 0.27 + i * 1.4) * 0.013);
      const driftY = (n, i) => (settling ? 0 : Math.cos(t * 0.21 + i * 1.1) * 0.011);
      const PX = (n, i) => (n.x + driftX(n, i)) * W;
      const PY = (n, i) => (n.y + driftY(n, i)) * H;
      const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));

      // 1) Cluster nebula atmosphere
      ctx.globalCompositeOperation = "lighter";
      nodes.forEach((n, i) => {
        const op = liveOpacity(n);
        if (op <= 0.01) return;
        const x = PX(n, i), y = PY(n, i);
        const rad = n.radius * (n.isCenter ? 6.8 : 5.2);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, `rgba(${n.color},${(n.isCenter ? 0.075 : 0.05) * op})`);
        g.addColorStop(1, `rgba(${n.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2) Ambient drifting dust
      for (const p of amb) {
        const ax = (p.x + Math.sin(t * 0.05 + p.ph) * 0.01) * W;
        const ay = (p.y + Math.cos(t * 0.04 + p.ph) * 0.01) * H;
        const tw = 0.5 + 0.5 * Math.sin(t * p.sp + p.ph);
        ctx.beginPath();
        ctx.arc(ax, ay, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.warm ? "222,200,150" : "120,205,255"},${0.012 + tw * 0.05})`;
        ctx.fill();
      }

      // 3) Links (with draw-in + travelling pulses)
      links.forEach((lk, li) => {
        const fn = byId[lk.from], tn = byId[lk.to];
        if (!fn || !tn) return;
        const at = lk.appearAt ?? 3 + li * 0.5;
        const drawn = Math.min(1, Math.max(0, (t - at) / 1.4));
        if (drawn <= 0) return;
        const fi = idx[lk.from], ti = idx[lk.to];
        const fx = PX(fn, fi), fy = PY(fn, fi);
        const tx = PX(tn, ti), ty = PY(tn, ti);
        const ex = fx + (tx - fx) * drawn;
        const ey = fy + (ty - fy) * drawn;
        const op = Math.min(liveOpacity(fn), liveOpacity(tn));
        const lg = ctx.createLinearGradient(fx, fy, ex, ey);
        lg.addColorStop(0, `rgba(${fn.color},${0.16 * op})`);
        lg.addColorStop(1, `rgba(${tn.color},${0.11 * op})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 2.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = `rgba(${tn.color},${0.42 * op})`; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.lineCap = "butt";
        if (drawn >= 1 && !settling) {
          for (let k = 0; k < 2; k++) {
            const pt = ((t * 0.3) + li * 0.23 + k * 0.5) % 1;
            const dx = fx + (tx - fx) * pt, dy = fy + (ty - fy) * pt;
            const pg = ctx.createRadialGradient(dx, dy, 0, dx, dy, 4.5);
            pg.addColorStop(0, `rgba(${tn.color},${0.85 * op})`);
            pg.addColorStop(1, `rgba(${tn.color},0)`);
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.arc(dx, dy, 4.5, 0, Math.PI * 2); ctx.fill();
          }
        }
      });

      // 4) Satellites
      nodes.forEach((n, i) => {
        if (n.isCenter) return;
        const op = liveOpacity(n);
        if (op <= 0.01) return;
        const x = PX(n, i), y = PY(n, i);
        for (const sp of sats[n.id] || []) {
          if (t < sp.appearAt) continue;
          const sop = Math.min(1, (t - sp.appearAt) / 0.8) * op;
          const breathe = 0.95 + 0.05 * Math.sin(t * 0.45 + sp.twPhase);
          const ang = sp.angle + (settling ? 0 : t * 0.035 * sp.dir);
          const sx = x + Math.cos(ang) * sp.dist * breathe;
          const sy = y + Math.sin(ang) * sp.dist * breathe;
          const tw = Math.pow(0.5 + 0.5 * Math.sin(t * sp.twSpeed + sp.twPhase), 1.5);
          ctx.strokeStyle = `rgba(${n.color},${0.06 * sop})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(sx, sy); ctx.stroke();
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sp.size * 3.2);
          sg.addColorStop(0, `rgba(${n.color},${0.45 * sop * tw})`);
          sg.addColorStop(1, `rgba(${n.color},0)`);
          ctx.fillStyle = sg;
          ctx.beginPath(); ctx.arc(sx, sy, sp.size * 3.2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgba(236,246,255,${0.55 * sop * tw})`;
          ctx.beginPath(); ctx.arc(sx, sy, sp.size * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      });

      // 5) Nodes
      nodes.forEach((n, i) => {
        const op = liveOpacity(n);
        if (op <= 0.01) return;
        const x = PX(n, i), y = PY(n, i);
        const scale = 0.82 + 0.18 * Math.min(1, (t - (timings[n.id] ?? 1)) / 0.65);
        const r = n.radius * scale;
        const pulse = 1 + Math.sin(t * 1.3 + i * 1.2) * (settling ? 0.02 : 0.06);

        ctx.globalCompositeOperation = "lighter";
        const halo = ctx.createRadialGradient(x, y, r * 0.25, x, y, r * 3 * pulse);
        halo.addColorStop(0, `rgba(${n.color},${(n.isCenter ? 0.3 : 0.2) * op})`);
        halo.addColorStop(0.55, `rgba(${n.color},${0.05 * op})`);
        halo.addColorStop(1, `rgba(${n.color},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(x, y, r * 3 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        const body = ctx.createRadialGradient(x, y - r * 0.35, r * 0.2, x, y, r);
        body.addColorStop(0, `rgba(24,30,42,${0.97 * op})`);
        body.addColorStop(1, `rgba(11,15,23,${0.98 * op})`);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = body; ctx.fill();

        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${n.color},${(n.isCenter ? 0.9 : 0.62) * op})`;
        ctx.lineWidth = n.isCenter ? 1.6 : 1.1; ctx.stroke();
        if (n.isCenter) {
          ctx.beginPath(); ctx.arc(x, y, r * 0.74, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${n.color},${0.22 * op})`; ctx.lineWidth = 0.7; ctx.stroke();
        }

        if (op > 0.2) {
          ctx.save();
          ctx.globalAlpha = op;
          ctx.fillStyle = n.isCenter ? "#ECF7FF" : "#DCE2EC";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const fs = n.isCenter ? 13 : r > 26 ? 11 : 10;
          ctx.font = `${n.isCenter ? 500 : 400} ${fs}px 'DM Sans', system-ui, sans-serif`;
          const lines = String(n.label).split("\n");
          const lh = fs + 2.5;
          const y0 = y - ((lines.length - 1) * lh) / 2;
          lines.forEach((ln, k) => ctx.fillText(ln, x, y0 + k * lh));
          ctx.restore();
        }
      });

      // 6) Progress ring on the central node
      const center = nodes.find((n) => n.isCenter);
      if (center) {
        const ci = idx[center.id];
        const op = liveOpacity(center);
        if (op > 0.4) {
          const x = PX(center, ci), y = PY(center, ci);
          const rr = center.radius * 0.82 + 9;
          ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(120,222,255,${0.1 * op})`; ctx.lineWidth = 2; ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, rr, -Math.PI / 2, -Math.PI / 2 + (progress / 100) * Math.PI * 2);
          ctx.strokeStyle = `rgba(140,228,255,${0.75 * op})`;
          ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
          ctx.lineCap = "butt";
        }
      }

      ctx.globalCompositeOperation = "source-over";
    };

    const loop = () => {
      if (!runningRef.current) return;
      const t = (performance.now() - startRef.current) / 1000;
      try { draw(t); } catch (e) { console.error(e); }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0A0D12]">
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}

export { CYAN };
