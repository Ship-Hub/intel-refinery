/* graphEngine.js — framework-agnostic canvas knowledge-graph engine.
 *
 * ANTI-SHAKE CONTRACT (read INTEGRATION.md):
 *  - This engine ONLY ever paints into a <canvas>. It never touches DOM layout,
 *    never reads scroll, never animates width/height/top/left/margin on real DOM.
 *  - The host React hook (useCanvasGraph) sizes the canvas ONCE per resize (DPR aware)
 *    and pauses tick() when the canvas is off-screen. The rAF loop is fully decoupled
 *    from scrolling, so the page can never judder because of these animations.
 */

export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const qbez = (a, b, c, t) => { const u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; };
const cubicPt = (p0, p1, p2, p3, t) => {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
};

export function rgba(hex, a) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function autoConnect(nodes, k) {
  const edges = [], seen = new Set();
  for (let i = 0; i < nodes.length; i++) {
    const d = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const dx = nodes[i].hx - nodes[j].hx, dy = nodes[i].hy - nodes[j].hy;
      d.push([dx * dx + dy * dy, j]);
    }
    d.sort((a, b) => a[0] - b[0]);
    for (let n = 0; n < Math.min(k, d.length); n++) {
      const j = d[n][1], key = Math.min(i, j) + '-' + Math.max(i, j);
      if (!seen.has(key)) { seen.add(key); edges.push({ a: i, b: j }); }
    }
  }
  return edges;
}

export const CYAN = '#57D8FF';
export const GOLD = '#D7C38A';
const CONFLICT = '#E8A24A'; // conflicting-edge highlight (flow graph)

export class GraphController {
  /** @param {HTMLCanvasElement} canvas @param {object} cfg */
  constructor(canvas, cfg) {
    this.canvas = canvas;
    this.cfg = cfg; // { color, build(W,H), evolve, edgeCycle, decor:'hero'|'scatter'|null, files, core }
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0; this.dpr = 1;
    this.nodes = []; this.edges = [];
    this.mouse = { x: -999, y: -999, on: false };
    this.hot = -1;
    this._onMove = (e) => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.on = true; };
    this._onLeave = () => { this.mouse.on = false; this.mouse.x = -999; this.mouse.y = -999; };
    canvas.addEventListener('mousemove', this._onMove);
    canvas.addEventListener('mouseleave', this._onLeave);
  }

  destroy() {
    this.canvas.removeEventListener('mousemove', this._onMove);
    this.canvas.removeEventListener('mouseleave', this._onLeave);
  }

  /** Size the backing store to CSS box * DPR exactly once; rebuild layout. */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width; this.H = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.build();
  }

  build() {
    const { cfg, W, H } = this;
    if (!W) return;
    const data = cfg.build(W, H);
    this.nodes = data.nodes.map((n) => ({
      hx: n.x, hy: n.y, cx: n.x, cy: n.y,
      r: n.r || 3.4, phase: Math.random() * 6.28, df: 0.5 + Math.random() * 0.7,
      amp: n.amp != null ? n.amp : 2 + Math.random() * 3,
      gold: !!n.gold, label: n.label || null,
      alpha: 1, av: 1, pop: 0, dead: false, dying: false, merge: null,
      nx: (Math.random() - 0.5) * 0.25, ny: (Math.random() - 0.5) * 0.25,
    }));
    const edges = data.edges || autoConnect(this.nodes, cfg.k || 2);
    this.edges = edges.map((e) => ({ a: e.a, b: e.b, draw: 0, dr: 1, al: 1, gold: !!e.gold, dead: false }));
    if (cfg.decor === 'scatter') this._cards = makeCards();
    const now = performance.now();
    this.nextSpawn = now + 1600; this.nextConnect = now + 2400; this.nextMerge = now + 6000;
    this.nextRemove = now + 8000; this.nextCycle = now + 1400;
  }

  tick(now) {
    const { ctx, W, H, cfg } = this;
    if (!W) return;
    const nodes = this.nodes, edges = this.edges;
    const baseCol = cfg.color || CYAN;

    if (cfg.evolve) this._evolve(now);
    if (cfg.edgeCycle && now > this.nextCycle) {
      const live = edges.filter((e) => !e.dead);
      if (live.length) live[(Math.random() * live.length) | 0].draw = 0;
      this.nextCycle = now + 1500 + Math.random() * 1800;
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]; if (n.dead) continue;
      n.alpha += (n.av - n.alpha) * 0.06;
      if (n.pop) n.pop *= 0.9;
      if (cfg.evolve) {
        if (n.merge != null) {
          const t = nodes[n.merge];
          if (t && !t.dead) {
            n.cx += (t.cx - n.cx) * 0.05; n.cy += (t.cy - n.cy) * 0.05;
            if (Math.hypot(t.cx - n.cx, t.cy - n.cy) < 6) {
              const ni = i;
              edges.forEach((e) => { if (!e.dead) { if (e.a === ni) e.a = n.merge; if (e.b === ni) e.b = n.merge; if (e.a === e.b) e.dr = 0; } });
              t.pop = 0.5; n.merge = null; n.dying = true; n.av = 0;
            }
          } else n.merge = null;
        } else {
          const pad = 30;
          n.hx += n.nx; n.hy += n.ny;
          if (n.hx < pad) n.nx += 0.02; if (n.hx > W - pad) n.nx -= 0.02;
          if (n.hy < pad) n.ny += 0.02; if (n.hy > H - pad) n.ny -= 0.02;
          n.nx += (Math.random() - 0.5) * 0.03; n.ny += (Math.random() - 0.5) * 0.03;
          n.nx *= 0.97; n.ny *= 0.97;
          n.cx += (n.hx - n.cx) * 0.05; n.cy += (n.hy - n.cy) * 0.05;
        }
        if (n.dying && n.alpha < 0.04) n.dead = true;
      } else {
        n.cx = n.hx + Math.sin(now * 0.0006 * n.df + n.phase) * n.amp;
        n.cy = n.hy + Math.cos(now * 0.0005 * n.df + n.phase * 1.3) * n.amp;
      }
    }

    let hot = -1, hd = 64;
    if (this.mouse.on) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]; if (n.dead) continue;
        const d = Math.hypot(this.mouse.x - n.cx, this.mouse.y - n.cy);
        if (d < hd) { hd = d; hot = i; }
      }
    }
    this.hot = hot;

    ctx.clearRect(0, 0, W, H);
    if (cfg.decor === 'hero') this._drawHero(now);
    else if (cfg.decor === 'scatter') this._drawScatter(now);

    // edges
    ctx.lineCap = 'round';
    for (let k = 0; k < edges.length; k++) {
      const e = edges[k]; if (e.dead) continue;
      const a = nodes[e.a], b = nodes[e.b];
      if (!a || !b || a.dead || b.dead) { if (e.draw < 0.03) e.dead = true; continue; }
      const target = e.dr != null ? e.dr : 1;
      e.draw += (target - e.draw) * 0.05;
      if (target === 0 && e.draw < 0.03) { e.dead = true; continue; }
      const pr = Math.max(0, Math.min(1, e.draw));
      let al = 0.16 * a.alpha * b.alpha;
      const near = hot >= 0 && (e.a === hot || e.b === hot);
      if (near) al = Math.min(0.62, al * 3.4);
      ctx.globalAlpha = al;
      ctx.strokeStyle = e.gold ? GOLD : baseCol;
      ctx.lineWidth = e.gold ? 1.3 : 1;
      ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = near ? 12 : 5;
      ctx.beginPath(); ctx.moveTo(a.cx, a.cy);
      ctx.lineTo(a.cx + (b.cx - a.cx) * pr, a.cy + (b.cy - a.cy) * pr); ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    // nodes
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]; if (n.dead || n.alpha < 0.02) continue;
      const col = n.gold ? GOLD : baseCol;
      const pulse = 1 + 0.12 * Math.sin(now * 0.0022 + n.phase) + (n.pop || 0);
      const r = n.r * pulse * Math.max(0.1, n.alpha);
      const hov = i === hot;
      const g = ctx.createRadialGradient(n.cx, n.cy, 0, n.cx, n.cy, r * 6.5);
      g.addColorStop(0, rgba(col, 0.5 * n.alpha));
      g.addColorStop(0.4, rgba(col, 0.12 * n.alpha));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 6.5, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = n.alpha; ctx.fillStyle = rgba(col, 0.95);
      ctx.shadowColor = col; ctx.shadowBlur = hov ? 18 : 9;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.85 * n.alpha); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 0.42, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
      if (n.label) this._label(n, col);
    }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  _label(n, col) {
    const ctx = this.ctx;
    ctx.font = "500 11px 'Geist Mono', monospace";
    const tw = ctx.measureText(n.label).width, pw = tw + 18, ph = 22;
    let lx = n.cx + 12, ly = n.cy - 11;
    if (lx + pw > this.W - 4) lx = n.cx - 12 - pw;
    ctx.globalAlpha = Math.min(1, n.alpha);
    ctx.fillStyle = 'rgba(18,23,32,0.92)';
    ctx.strokeStyle = rgba(col, 0.4); ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, pw, ph, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.textBaseline = 'middle';
    ctx.fillText(n.label, lx + 9, ly + ph / 2 + 0.5);
    ctx.globalAlpha = 1;
  }

  _evolve(now) {
    const nodes = this.nodes, edges = this.edges, W = this.W, H = this.H, pad = 34;
    const alive = nodes.filter((n) => !n.dead && !n.dying);
    const freeNode = () => { const d = nodes.find((n) => n.dead); if (d) return d; const n = {}; nodes.push(n); return n; };
    const freeEdge = () => { const d = edges.find((e) => e.dead); if (d) return d; const e = {}; edges.push(e); return e; };
    if (now > this.nextSpawn && alive.length < 13) {
      const base = alive[(Math.random() * alive.length) | 0] || { cx: W / 2, cy: H / 2 };
      const n = freeNode();
      n.hx = Math.max(pad, Math.min(W - pad, base.cx + (Math.random() - 0.5) * 90));
      n.hy = Math.max(pad, Math.min(H - pad, base.cy + (Math.random() - 0.5) * 90));
      n.cx = n.hx; n.cy = n.hy; n.r = 2.8 + Math.random() * 1.8; n.phase = Math.random() * 6.28;
      n.df = 0.5 + Math.random() * 0.7; n.amp = 0; n.gold = Math.random() < 0.16; n.label = null;
      n.alpha = 0; n.av = 1; n.pop = 0.7; n.dead = false; n.dying = false; n.merge = null;
      n.nx = (Math.random() - 0.5) * 0.3; n.ny = (Math.random() - 0.5) * 0.3;
      const ni = nodes.indexOf(n);
      const targets = alive.slice().sort((a, b) => {
        const da = (a.cx - n.cx) ** 2 + (a.cy - n.cy) ** 2, db = (b.cx - n.cx) ** 2 + (b.cy - n.cy) ** 2; return da - db;
      }).slice(0, 1 + (Math.random() < 0.5 ? 1 : 0));
      targets.forEach((t) => { const e = freeEdge(); e.a = ni; e.b = nodes.indexOf(t); e.draw = 0; e.dr = 1; e.al = 1; e.gold = n.gold; e.dead = false; });
      this.nextSpawn = now + 2400 + Math.random() * 2200;
    }
    if (now > this.nextConnect && alive.length > 3) {
      for (let tries = 0; tries < 8; tries++) {
        const a = alive[(Math.random() * alive.length) | 0], b = alive[(Math.random() * alive.length) | 0];
        if (a === b) continue;
        const ia = nodes.indexOf(a), ib = nodes.indexOf(b), dist = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        if (dist > 60 && dist < 170) {
          const exists = edges.some((e) => !e.dead && ((e.a === ia && e.b === ib) || (e.a === ib && e.b === ia)));
          if (!exists) { const e = freeEdge(); e.a = ia; e.b = ib; e.draw = 0; e.dr = 1; e.al = 1; e.gold = false; e.dead = false; break; }
        }
      }
      this.nextConnect = now + 2600 + Math.random() * 1800;
    }
    if (now > this.nextMerge && alive.length > 8) {
      const cand = edges.filter((e) => !e.dead && nodes[e.a] && nodes[e.b] && !nodes[e.a].dying && !nodes[e.b].dying && nodes[e.a].alpha > 0.85 && nodes[e.b].alpha > 0.85 && nodes[e.a].merge == null && nodes[e.b].merge == null);
      if (cand.length) { const e = cand[(Math.random() * cand.length) | 0]; nodes[e.b].merge = e.a; }
      this.nextMerge = now + 6500 + Math.random() * 4000;
    }
    if (now > this.nextRemove && alive.length > 9) {
      const cand = alive.filter((n) => n.merge == null && !n.label);
      if (cand.length) {
        const n = cand[(Math.random() * cand.length) | 0]; n.dying = true; n.av = 0;
        const ni = nodes.indexOf(n);
        edges.forEach((e) => { if (!e.dead && (e.a === ni || e.b === ni)) e.dr = 0; });
      }
      this.nextRemove = now + 7000 + Math.random() * 4000;
    }
  }

  _drawHero(now) {
    const ctx = this.ctx, W = this.W, H = this.H, cfg = this.cfg;
    const core = { x: cfg.core.nx * W, y: cfg.core.ny * H };
    (cfg.files || []).forEach((f, fi) => {
      const a = { x: f.nx * W, y: f.ny * H };
      const c1 = { x: (a.x + core.x) / 2 + 18, y: a.y };
      const c2 = { x: (a.x + core.x) / 2, y: core.y };
      const col = f.amber ? GOLD : CYAN;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, core.x, core.y);
      ctx.strokeStyle = rgba(col, 0.16); ctx.lineWidth = 1; ctx.stroke();
      for (let s = 0; s < 2; s++) {
        const tt = (now * 0.00016 + fi * 0.12 + s * 0.5) % 1, ex = easeInOutCubic(tt);
        const p = cubicPt(a, c1, c2, core, ex);
        ctx.globalAlpha = Math.sin(tt * Math.PI) * 0.75; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 7;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    });
    for (let s = 0; s < 6; s++) {
      const tt = (now * 0.00022 + s * 0.16) % 1, ex = easeInOutCubic(tt);
      const tx = core.x + (0.74 * W - core.x) * ex, ty = core.y + Math.sin(s * 1.7) * 44 * ex;
      ctx.globalAlpha = Math.sin(tt * Math.PI) * 0.4; ctx.fillStyle = CYAN; ctx.shadowColor = CYAN; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.arc(tx, ty, 1.4, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    this._drawCore(core.x, core.y, now);
  }

  _drawCore(x, y, now) {
    const ctx = this.ctx;
    const pulse = 1 + 0.06 * Math.sin(now * 0.002), R = 36 * pulse;
    let g = ctx.createRadialGradient(x, y, 0, x, y, R * 3.2);
    g.addColorStop(0, rgba(CYAN, 0.5)); g.addColorStop(0.35, rgba(CYAN, 0.14)); g.addColorStop(1, rgba(CYAN, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 3.2, 0, 6.2832); ctx.fill();
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R]); }
    const gg = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
    gg.addColorStop(0, '#a7ecff'); gg.addColorStop(0.5, '#2bb6ee'); gg.addColorStop(1, '#0a6f9e');
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = gg; ctx.shadowColor = CYAN; ctx.shadowBlur = 30; ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = rgba('#ffffff', 0.34); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x, y + R);
    ctx.moveTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[4][0], pts[4][1]);
    ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[5][0], pts[5][1]); ctx.stroke();
    ctx.strokeStyle = rgba(CYAN, 0.95); ctx.lineWidth = 1.5; ctx.shadowColor = CYAN; ctx.shadowBlur = 14;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = rgba('#ffffff', 0.92);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
  }

  _drawScatter(now) {
    const ctx = this.ctx, W = this.W, H = this.H;
    (this._cards || []).forEach((c) => {
      const x = c.nx * W + Math.sin(now * c.sp + c.phase) * 6;
      const y = c.ny * H + Math.cos(now * c.sp * 1.2 + c.phase) * 6;
      ctx.save(); ctx.translate(x, y); ctx.rotate(c.rot + Math.sin(now * 0.0002 + c.phase) * 0.05);
      ctx.fillStyle = 'rgba(22,28,38,0.9)'; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
      roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-c.w / 2 + 8, -c.h / 2 + 9); ctx.lineTo(c.w / 2 - 8, -c.h / 2 + 9);
      ctx.moveTo(-c.w / 2 + 8, 0); ctx.lineTo(c.w / 2 - 8, 0);
      ctx.moveTo(-c.w / 2 + 8, c.h / 2 - 9); ctx.lineTo(c.w / 2 - 16, c.h / 2 - 9); ctx.stroke();
      ctx.restore();
    });
    const ax = 0.5 * W, ay = 0.5 * H;
    ctx.strokeStyle = rgba(CYAN, 0.8); ctx.lineWidth = 1.6; ctx.shadowColor = CYAN; ctx.shadowBlur = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax - 14, ay); ctx.lineTo(ax + 14, ay);
    ctx.moveTo(ax + 6, ay - 8); ctx.lineTo(ax + 14, ay); ctx.lineTo(ax + 6, ay + 8); ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function makeCards() {
  return Array.from({ length: 10 }, () => ({
    nx: 0.02 + Math.random() * 0.32, ny: 0.08 + Math.random() * 0.82,
    w: 46 + Math.random() * 26, h: 32 + Math.random() * 14,
    rot: (Math.random() - 0.5) * 0.5, phase: Math.random() * 6.28, sp: 0.0003 + Math.random() * 0.0003,
  }));
}

/* ---- Layout builders: each returns { nodes:[{x,y,r,label?,gold?}], edges?:[{a,b,gold?}] } ---- */
export const layouts = {
  hero: (W, H) => {
    const P = (nx, ny, r, label, gold) => ({ x: nx * W, y: ny * H, r, label, gold, amp: 3 + Math.random() * 2 });
    const nodes = [
      P(0.70, 0.46, 6, null, false),
      P(0.80, 0.15, 4, 'Key Concepts', false), P(0.95, 0.30, 4, 'Relationships', false),
      P(0.96, 0.56, 4, 'Patterns', true), P(0.80, 0.86, 4, 'Insights', true), P(0.94, 0.82, 4, 'Questions', false),
      P(0.66, 0.28, 3), P(0.86, 0.46, 3.4), P(0.74, 0.66, 3), P(0.68, 0.72, 3),
      P(0.88, 0.68, 3), P(0.72, 0.38, 2.6), P(0.84, 0.30, 2.6), P(0.78, 0.60, 2.6, null, true),
    ];
    return { nodes, edges: autoConnect(nodes.map((n) => ({ hx: n.x, hy: n.y })), 2) };
  },
  problem: (W, H) => {
    const P = (nx, ny, r, gold) => ({ x: (0.56 + nx * 0.42) * W, y: (0.06 + ny * 0.88) * H, r, gold });
    const nodes = [P(0.5, 0.5, 6, false), P(0.2, 0.2, 3.6), P(0.78, 0.16, 3.4), P(0.9, 0.5, 3.6, true), P(0.74, 0.84, 3.4), P(0.2, 0.8, 3.4), P(0.05, 0.5, 3, true), P(0.5, 0.1, 3), P(0.5, 0.9, 3), P(0.35, 0.35, 2.8), P(0.66, 0.62, 2.8)];
    return { nodes, edges: autoConnect(nodes.map((n) => ({ hx: n.x, hy: n.y })), 2) };
  },
  cluster: (W, H) => {
    const nodes = [], cx = W / 2, cy = H / 2;
    for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.2832, rad = 18 + Math.random() * 38; nodes.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad, r: 2.4 + Math.random() * 2, gold: Math.random() < 0.18, amp: 2 }); }
    nodes.push({ x: cx, y: cy, r: 4, amp: 1 });
    return { nodes, edges: autoConnect(nodes.map((n) => ({ hx: n.x, hy: n.y })), 2) };
  },
  understand: (W, H) => {
    const P = (nx, ny, r) => ({ x: nx * W, y: ny * H, r, amp: 2 });
    const nodes = [P(0.5, 0.22, 4), P(0.25, 0.5, 3.2), P(0.75, 0.5, 3.2), P(0.15, 0.8, 2.6), P(0.38, 0.82, 2.6), P(0.62, 0.82, 2.6), P(0.85, 0.8, 2.6), P(0.5, 0.5, 3)];
    const edges = [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 7 }, { a: 1, b: 3 }, { a: 1, b: 4 }, { a: 2, b: 5 }, { a: 2, b: 6 }, { a: 7, b: 1 }, { a: 7, b: 2 }];
    return { nodes, edges };
  },
  living: (W, H) => {
    const nodes = [], cx = W / 2, cy = H / 2;
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.2832 + 0.3, rad = 50 + Math.random() * 90; nodes.push({ x: cx + Math.cos(a) * rad * 0.9, y: cy + Math.sin(a) * rad, r: 3 + Math.random() * 2.5, gold: i % 4 === 0 }); }
    return { nodes, edges: autoConnect(nodes.map((n) => ({ hx: n.x, hy: n.y })), 2) };
  },
  structA: (W, H) => {
    const cx = W / 2, cy = H / 2, nodes = [{ x: cx, y: cy, r: 5 }], edges = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.2832, r = Math.min(W, H) * 0.34;
      nodes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: 3.2 }); edges.push({ a: 0, b: i + 1 });
      if (i % 2 === 0) { const a2 = a + 0.18, r2 = r * 1.45; nodes.push({ x: cx + Math.cos(a2) * r2, y: cy + Math.sin(a2) * r2, r: 2.4 }); edges.push({ a: i + 1, b: nodes.length - 1 }); }
    }
    return { nodes, edges };
  },
  structB: (W, H) => {
    const nodes = [], pad = 26;
    for (let i = 0; i < 11; i++) nodes.push({ x: pad + Math.random() * (W - 2 * pad), y: pad + Math.random() * (H - 2 * pad), r: 2.8 + Math.random() * 1.8 });
    return { nodes, edges: autoConnect(nodes.map((n) => ({ hx: n.x, hy: n.y })), 3) };
  },
  structC: (W, H) => {
    const nodes = [], edges = [], rows = [2, 4, 3], layerY = [0.22, 0.55, 0.85], layers = []; let idx = 0;
    rows.forEach((cnt, ri) => { const arr = []; for (let i = 0; i < cnt; i++) { const x = ((i + 1) / (cnt + 1)) * W; nodes.push({ x, y: layerY[ri] * H, r: 3.4 - ri * 0.2 }); arr.push(idx++); } layers.push(arr); });
    for (let r = 0; r < layers.length - 1; r++) layers[r].forEach((a) => { const b = layers[r + 1][(Math.random() * layers[r + 1].length) | 0]; edges.push({ a, b }); const b2 = layers[r + 1][(Math.random() * layers[r + 1].length) | 0]; if (b2 !== b) edges.push({ a, b: b2 }); });
    return { nodes, edges };
  },
};

/* Hero file-tile anchors (match the DOM tiles in Hero.jsx 1:1). */
export const HERO_FILES = [
  { key: 'doc', nx: 0.30, ny: 0.07, bg: '#11151d', border: 'rgba(255,255,255,0.12)' },
  { key: 'pdf', nx: 0.16, ny: 0.17, bg: '#1c1013', border: 'rgba(255,90,90,0.5)' },
  { key: 'txt', nx: 0.44, ny: 0.16, bg: '#11151d', border: 'rgba(255,255,255,0.12)' },
  { key: 'docx', nx: 0.32, ny: 0.30, bg: '#0f1a26', border: 'rgba(90,160,255,0.5)' },
  { key: 'globe', nx: 0.14, ny: 0.35, bg: '#11151d', border: 'rgba(255,255,255,0.12)' },
  { key: 'image', nx: 0.34, ny: 0.46, bg: '#11151d', border: 'rgba(255,255,255,0.12)' },
  { key: 'audio', nx: 0.13, ny: 0.53, bg: '#0c1820', border: 'rgba(87,216,255,0.45)' },
  { key: 'note', nx: 0.45, ny: 0.50, bg: '#1d1a0c', border: 'rgba(215,195,138,0.5)', amber: true },
  { key: 'video', nx: 0.27, ny: 0.64, bg: '#0c0e12', border: 'rgba(255,255,255,0.14)' },
];
export const HERO_CORE = { nx: 0.60, ny: 0.42 };

/* =================================================================
 * Shared drawing helpers (used by IconGraphController + FlowController)
 * ================================================================= */

/** Faceted crystal "Refinery core" (cyan gem with glow). */
export function drawCrystalCore(ctx, x, y, now) {
  const pulse = 1 + 0.06 * Math.sin(now * 0.002), R = 36 * pulse;
  let g = ctx.createRadialGradient(x, y, 0, x, y, R * 3.2);
  g.addColorStop(0, rgba(CYAN, 0.5)); g.addColorStop(0.35, rgba(CYAN, 0.14)); g.addColorStop(1, rgba(CYAN, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 3.2, 0, 6.2832); ctx.fill();
  const pts = [];
  for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R]); }
  const gg = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
  gg.addColorStop(0, '#a7ecff'); gg.addColorStop(0.5, '#2bb6ee'); gg.addColorStop(1, '#0a6f9e');
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
  ctx.fillStyle = gg; ctx.shadowColor = CYAN; ctx.shadowBlur = 30; ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = rgba('#ffffff', 0.34); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x, y + R);
  ctx.moveTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[4][0], pts[4][1]);
  ctx.moveTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[5][0], pts[5][1]); ctx.stroke();
  ctx.strokeStyle = rgba(CYAN, 0.95); ctx.lineWidth = 1.5; ctx.shadowColor = CYAN; ctx.shadowBlur = 14;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke();
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14; ctx.fillStyle = rgba('#ffffff', 0.92);
  ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
}

/** Small monospace pill label tethered to a node. */
export function drawLabel(ctx, n, col, W) {
  ctx.font = "500 11px 'Geist Mono', monospace";
  const tw = ctx.measureText(n.label).width, pw = tw + 18, ph = 22;
  let lx = n.cx + 12, ly = n.cy - 11;
  if (lx + pw > W - 4) lx = n.cx - 12 - pw;
  ctx.globalAlpha = Math.min(1, n.alpha == null ? 1 : n.alpha);
  ctx.fillStyle = 'rgba(18,23,32,0.92)';
  ctx.strokeStyle = rgba(col, 0.4); ctx.lineWidth = 1;
  roundRect(ctx, lx, ly, pw, ph, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.textBaseline = 'middle';
  ctx.fillText(n.label, lx + 9, ly + ph / 2 + 0.5);
  ctx.globalAlpha = 1;
}

/** Travelling "input" token (PDF / LINK / …) on its way into the core. */
function drawInputToken(ctx, x, y, label, col, alpha) {
  const w = 52, h = 30; ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(12,17,26,0.96)'; ctx.strokeStyle = rgba(col, 0.55); ctx.lineWidth = 1;
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.arc(x - w / 2 + 11, y, 2.8, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#c8d2de'; ctx.font = "600 10px 'Geist Mono',monospace"; ctx.textBaseline = 'middle';
  ctx.fillText(label, x - w / 2 + 21, y + 0.5); ctx.globalAlpha = 1;
}

/** Gold "new finding" tooltip card with a leader line to its node. */
function drawTooltip(ctx, node, tip, W) {
  if (!node) return;
  const pad = 12;
  let maxw = 0;
  tip.lines.forEach((l, i) => {
    ctx.font = i === 0 ? "500 10px 'Geist Mono',monospace" : (i === 1 ? "600 13px 'Geist',sans-serif" : "400 11px 'Geist',sans-serif");
    maxw = Math.max(maxw, ctx.measureText(l).width);
  });
  const pw = maxw + pad * 2, ph = 72;
  let lx = node.cx + 16, ly = node.cy - ph - 10;
  if (lx + pw > W - 4) lx = node.cx - 16 - pw;
  if (ly < 4) ly = node.cy + 16;
  ctx.globalAlpha = tip.alpha * 0.45; ctx.strokeStyle = rgba(GOLD, 0.5); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(node.cx, node.cy); ctx.lineTo(lx < node.cx ? lx + pw : lx, ly + ph / 2); ctx.stroke();
  ctx.globalAlpha = tip.alpha;
  ctx.fillStyle = 'rgba(16,21,32,0.97)'; ctx.strokeStyle = rgba(GOLD, 0.5); ctx.lineWidth = 1;
  ctx.shadowColor = rgba(GOLD, 0.3); ctx.shadowBlur = 18;
  roundRect(ctx, lx, ly, pw, ph, 9); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  let y = ly + 14;
  ctx.fillStyle = GOLD; ctx.font = "500 10px 'Geist Mono',monospace"; ctx.fillText(tip.lines[0], lx + pad, y); y += 19;
  ctx.fillStyle = '#E8ECF2'; ctx.font = "600 13px 'Geist',sans-serif"; ctx.fillText(tip.lines[1], lx + pad, y); y += 17;
  ctx.fillStyle = '#9AA7B8'; ctx.font = "400 11px 'Geist',sans-serif"; ctx.fillText(tip.lines[2], lx + pad, y); y += 15;
  ctx.fillStyle = '#9AA7B8'; ctx.fillText(tip.lines[3], lx + pad, y);
  ctx.globalAlpha = 1;
}

/** Monoline white glyph drawn inside an icon-disc node. */
function drawNodeGlyph(ctx, x, y, s, type) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = Math.max(1, s * 0.12); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const u = s;
  if (type === 'at') { ctx.beginPath(); ctx.arc(0, 0, u * 0.42, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, u * 0.16, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(u * 0.42, 0); ctx.lineTo(u * 0.42, u * 0.3); ctx.stroke(); }
  else if (type === 'pin') { ctx.beginPath(); ctx.arc(0, -u * 0.12, u * 0.34, Math.PI * 0.15, Math.PI * 0.85, true); ctx.lineTo(0, u * 0.5); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -u * 0.12, u * 0.13, 0, 6.2832); ctx.fill(); }
  else if (type === 'person') { ctx.beginPath(); ctx.arc(0, -u * 0.2, u * 0.2, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.arc(0, u * 0.42, u * 0.34, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  else if (type === 'video') { ctx.beginPath(); ctx.moveTo(-u * 0.16, -u * 0.26); ctx.lineTo(u * 0.3, 0); ctx.lineTo(-u * 0.16, u * 0.26); ctx.closePath(); ctx.fill(); }
  else if (type === 'chat') { roundRect(ctx, -u * 0.42, -u * 0.34, u * 0.84, u * 0.56, u * 0.14); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-u * 0.18, u * 0.22); ctx.lineTo(-u * 0.28, u * 0.44); ctx.lineTo(-u * 0.04, u * 0.22); ctx.stroke(); }
  else if (type === 'link') { ctx.beginPath(); ctx.arc(-u * 0.18, -u * 0.04, u * 0.22, Math.PI * 0.6, Math.PI * 1.8); ctx.stroke(); ctx.beginPath(); ctx.arc(u * 0.18, u * 0.04, u * 0.22, Math.PI * 1.6, Math.PI * 0.8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-u * 0.06, -u * 0.02); ctx.lineTo(u * 0.06, u * 0.02); ctx.stroke(); }
  else if (type === 'clock') { ctx.beginPath(); ctx.arc(0, 0, u * 0.4, 0, 6.2832); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -u * 0.24); ctx.moveTo(0, 0); ctx.lineTo(u * 0.18, u * 0.1); ctx.stroke(); }
  else if (type === 'lock') { roundRect(ctx, -u * 0.3, -u * 0.06, u * 0.6, u * 0.46, u * 0.08); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -u * 0.06, u * 0.2, Math.PI, 0); ctx.stroke(); }
  else if (type === 'doc') { roundRect(ctx, -u * 0.26, -u * 0.4, u * 0.52, u * 0.8, u * 0.06); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-u * 0.12, -u * 0.16); ctx.lineTo(u * 0.12, -u * 0.16); ctx.moveTo(-u * 0.12, u * 0.02); ctx.lineTo(u * 0.12, u * 0.02); ctx.moveTo(-u * 0.12, u * 0.2); ctx.lineTo(u * 0.04, u * 0.2); ctx.stroke(); }
  ctx.restore();
}

/* =================================================================
 * IconGraphController — the "Problem" section graph: glowing icon-disc
 * nodes (lock / @ / chat / video / person / pin / link) around a bright
 * hub, painted in the RIGHT portion of the canvas. The tilted document
 * thumbnails + arrow that sit to its LEFT are real DOM (see ProblemVisual).
 * ================================================================= */
const ICON_NODES = [
  { nx: 0.74, ny: 0.50, r: 14, icon: null, gold: false, hub: true },
  { nx: 0.66, ny: 0.20, r: 10, icon: 'lock', gold: false },
  { nx: 0.82, ny: 0.14, r: 10, icon: 'at', gold: false },
  { nx: 0.94, ny: 0.26, r: 9, icon: 'chat', gold: false },
  { nx: 0.97, ny: 0.50, r: 10, icon: 'video', gold: true },
  { nx: 0.90, ny: 0.76, r: 10, icon: 'person', gold: false },
  { nx: 0.76, ny: 0.84, r: 10, icon: 'pin', gold: false },
  { nx: 0.62, ny: 0.74, r: 9, icon: 'link', gold: true },
  { nx: 0.60, ny: 0.42, r: 7, icon: null, gold: false },
  { nx: 0.86, ny: 0.40, r: 7, icon: null, gold: false },
  { nx: 0.72, ny: 0.64, r: 6, icon: null, gold: false },
];
const ICON_EDGES = [
  { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 8 }, { a: 0, b: 9 }, { a: 0, b: 10 },
  { a: 2, b: 3 }, { a: 3, b: 4 }, { a: 4, b: 9 }, { a: 0, b: 5 }, { a: 5, b: 6 },
  { a: 0, b: 6 }, { a: 6, b: 7 }, { a: 7, b: 10 }, { a: 1, b: 8 }, { a: 9, b: 4 },
];

export class IconGraphController {
  constructor(canvas, color = CYAN) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.color = color; this.W = 0; this.H = 0;
    this.nodes = []; this.edges = [];
    this.mouse = { x: -999, y: -999, on: false };
    this._onMove = (e) => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; this.mouse.on = true; };
    this._onLeave = () => { this.mouse.on = false; this.mouse.x = -999; };
    canvas.addEventListener('mousemove', this._onMove);
    canvas.addEventListener('mouseleave', this._onLeave);
  }
  destroy() { this.canvas.removeEventListener('mousemove', this._onMove); this.canvas.removeEventListener('mouseleave', this._onLeave); }
  resize() {
    const r = this.canvas.getBoundingClientRect(); if (r.width < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); this.W = r.width; this.H = r.height;
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.nodes = ICON_NODES.map((d) => ({ ...d, x: d.nx * this.W, y: d.ny * this.H, cx: d.nx * this.W, cy: d.ny * this.H, phase: Math.random() * 6.28, amp: 1.6 + Math.random() * 1.2 }));
    this.edges = ICON_EDGES.map((d) => ({ ...d, draw: 0, cyc: Math.random() * 4000 }));
  }
  tick(now) {
    const ctx = this.ctx, W = this.W, H = this.H; if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const nodes = this.nodes, edges = this.edges;
    nodes.forEach((n, i) => { n.cx = n.x + Math.sin(now * 0.0005 * (0.6 + i * 0.05) + n.phase) * n.amp; n.cy = n.y + Math.cos(now * 0.0004 * (0.6 + i * 0.05) + n.phase * 1.2) * n.amp; });
    let hot = -1, hd = 40;
    if (this.mouse.on) nodes.forEach((n, i) => { const d = Math.hypot(this.mouse.x - n.cx, this.mouse.y - n.cy); if (d < hd) { hd = d; hot = i; } });
    ctx.lineCap = 'round';
    edges.forEach((ed) => {
      const a = nodes[ed.a], b = nodes[ed.b]; if (!a || !b) return;
      const col = (a.gold || b.gold) ? GOLD : this.color;
      const near = (hot >= 0 && (ed.a === hot || ed.b === hot));
      let al = 0.42 + 0.12 * Math.sin(now * 0.002 + ed.cyc); if (near) al = 0.85;
      ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = near ? 1.8 : 1.2; ctx.shadowColor = col; ctx.shadowBlur = near ? 10 : 4;
      ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(b.cx, b.cy); ctx.stroke();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    nodes.forEach((n, i) => {
      const col = n.gold ? GOLD : this.color; const hov = (i === hot);
      const pulse = 1 + 0.07 * Math.sin(now * 0.0024 + n.phase); const r = n.r * pulse;
      const g = ctx.createRadialGradient(n.cx, n.cy, 0, n.cx, n.cy, r * 3.4);
      g.addColorStop(0, rgba(col, n.hub ? 0.9 : 0.66)); g.addColorStop(0.32, rgba(col, 0.22)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 3.4, 0, 6.2832); ctx.fill();
      const disc = ctx.createRadialGradient(n.cx - r * 0.3, n.cy - r * 0.3, 0, n.cx, n.cy, r);
      if (n.hub) { disc.addColorStop(0, '#d6f6ff'); disc.addColorStop(0.5, '#7fdcff'); disc.addColorStop(1, '#2aa0d8'); }
      else if (n.gold) { disc.addColorStop(0, '#f3e6bd'); disc.addColorStop(1, '#caa94e'); }
      else { disc.addColorStop(0, '#bfeeff'); disc.addColorStop(1, '#2c93c4'); }
      ctx.fillStyle = disc; ctx.shadowColor = col; ctx.shadowBlur = hov ? 20 : 12;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, r, 0, 6.2832); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = rgba('#ffffff', 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(n.cx, n.cy, r + 1.5, 0, 6.2832); ctx.stroke();
      if (n.hub) { ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 0.32, 0, 6.2832); ctx.fill(); }
      else if (n.icon) drawNodeGlyph(ctx, n.cx, n.cy, r * 1.5, n.icon);
    });
  }
}

/* =================================================================
 * FlowController — the "Watch Understanding Emerge" live graph. Input
 * tokens flow into the crystal core while a subject graph builds itself
 * over a fixed 7-step sequence (spawn subject → connect findings →
 * flag a conflict → downgrade a weak edge → create a new subject →
 * update the model), then resets and loops with the next subject.
 *
 * Each step ALSO emits a refinement-log line through `onLog(text,color)`,
 * so the log panel and the graph are perfectly in sync (no random pool).
 *
 * cfg: { color, inputs, subjects, newSubjects, log:[{text,color}], onLog }
 * ================================================================= */
const FLOW_NODES = [
  { nx: 0.74, ny: 0.48, r: 6.5, label: 'subj', gold: false }, // 0 subject hub
  { nx: 0.62, ny: 0.22, r: 3.4, label: null, gold: false },   // 1
  { nx: 0.86, ny: 0.16, r: 3.4, label: null, gold: false },   // 2
  { nx: 0.94, ny: 0.38, r: 3.4, label: null, gold: false },   // 3
  { nx: 0.90, ny: 0.64, r: 3.4, label: null, gold: false },   // 4
  { nx: 0.63, ny: 0.66, r: 3.4, label: null, gold: false },   // 5
  { nx: 0.80, ny: 0.82, r: 3.4, label: null, gold: false },   // 6 conflict source
  { nx: 0.95, ny: 0.80, r: 4.6, label: 'new', gold: true },   // 7 new subject
  { nx: 0.71, ny: 0.84, r: 3, label: null, gold: false },     // 8
];
const FLOW_EDGES = [
  { a: 0, b: 1 }, { a: 0, b: 2 }, { a: 0, b: 3 }, { a: 3, b: 4 }, { a: 0, b: 5 },
  { a: 0, b: 6 }, { a: 0, b: 7 }, { a: 7, b: 4 }, { a: 7, b: 8 }, { a: 5, b: 8 }, { a: 0, b: 8 },
];

export class FlowController {
  constructor(canvas, cfg) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.color = cfg.color || CYAN;
    this.inputs = cfg.inputs; this.subjects = cfg.subjects; this.newSubjects = cfg.newSubjects;
    this.log = cfg.log; this.onLog = cfg.onLog || (() => {});
    this.W = 0; this.H = 0;
    this.nodes = []; this.edges = []; this.tip = { lines: [], alpha: 0, av: 0, targetNode: 7 };
    this.seqI = 0; this.loopN = 0; this.phase = 'run'; this.started = false; this.nextAt = 0;
  }
  destroy() {}
  resize() {
    const r = this.canvas.getBoundingClientRect(); if (r.width < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); this.W = r.width; this.H = r.height;
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.rebuild();
  }
  rebuild() {
    const W = this.W, H = this.H;
    const subj = this.subjects[this.loopN % this.subjects.length];
    const ns = this.newSubjects[this.loopN % this.newSubjects.length];
    this.nodes = FLOW_NODES.map((d) => {
      const x = (d.nx + (Math.random() - 0.5) * 0.018) * W, y = (d.ny + (Math.random() - 0.5) * 0.018) * H;
      return { x, y, cx: x, cy: y, r: d.r, gold: d.gold, phase: Math.random() * 6.28, amp: 1.8 + Math.random() * 1.4, alpha: 0, av: 0, label: d.label === 'subj' ? subj : (d.label === 'new' ? ns : null) };
    });
    this.edges = FLOW_EDGES.map((d) => ({ a: d.a, b: d.b, draw: 0, dr: 0, conflict: false, weak: false, gold: FLOW_NODES[d.a].gold || FLOW_NODES[d.b].gold }));
    this.tip = { lines: [], alpha: 0, av: 0, targetNode: 7 };
    this.seqI = 0;
  }
  _runStep(i) {
    const nodes = this.nodes, edges = this.edges, tip = this.tip;
    const eOn = (k) => { edges[k].dr = 1; edges[k].weak = false; return edges[k]; };
    if (i === 0) { [1, 2, 3].forEach((k) => (nodes[k].av = 1)); }
    else if (i === 1) { nodes[0].av = 1; eOn(0); eOn(1); }
    else if (i === 2) { nodes[4].av = 1; nodes[5].av = 1; eOn(2); eOn(3); eOn(4); }
    else if (i === 3) { nodes[6].av = 1; eOn(5).conflict = true; }
    else if (i === 4) { edges[3].dr = 0; edges[3].weak = true; }
    else if (i === 5) { nodes[8].av = 1; nodes[7].av = 1; eOn(6); eOn(7); eOn(8); eOn(9); tip.lines = ['New Finding', nodes[7].label, 'Referenced in 7 sources', 'Confidence: High']; tip.targetNode = 7; tip.av = 1; }
    else if (i === 6) { edges[5].conflict = false; eOn(10); tip.av = 0; }
  }
  tick(now) {
    const ctx = this.ctx, W = this.W, H = this.H; if (!W) return;
    if (!this.started) { this.started = true; this.nextAt = now + 900; }
    if (now >= this.nextAt) {
      if (this.phase === 'run') {
        if (this.seqI < this.log.length) {
          this._runStep(this.seqI); this.onLog(this.log[this.seqI].text, this.log[this.seqI].color); this.seqI++; this.nextAt = now + 1150;
          if (this.seqI >= this.log.length) { this.phase = 'hold'; this.nextAt = now + 2900; }
        }
      } else if (this.phase === 'hold') { this.nodes.forEach((n) => (n.av = 0)); this.edges.forEach((e) => (e.dr = 0)); this.tip.av = 0; this.phase = 'fade'; this.nextAt = now + 1100; }
      else if (this.phase === 'fade') { this.loopN++; this.rebuild(); this.phase = 'run'; this.nextAt = now + 700; }
    }
    ctx.clearRect(0, 0, W, H);
    const core = { x: 0.47 * W, y: 0.50 * H };
    const starts = [
      { x: 0.04 * W, y: 0.18 * H }, { x: 0.02 * W, y: 0.50 * H }, { x: 0.04 * W, y: 0.82 * H },
      { x: 0.20 * W, y: 0.05 * H }, { x: 0.20 * W, y: 0.95 * H }, { x: 0.10 * W, y: 0.34 * H },
    ];
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.setLineDash([5, 10]);
    ctx.beginPath(); ctx.moveTo(0.60 * W, 0.04 * H); ctx.lineTo(0.60 * W, 0.96 * H); ctx.stroke(); ctx.setLineDash([]);
    const nodes = this.nodes, edges = this.edges;
    nodes.forEach((n, i) => { n.alpha += (n.av - n.alpha) * 0.06; n.cx = n.x + Math.sin(now * 0.0006 * (0.5 + i * 0.07) + n.phase) * n.amp; n.cy = n.y + Math.cos(now * 0.0005 * (0.5 + i * 0.07) + n.phase * 1.3) * n.amp; });
    ctx.lineCap = 'round';
    edges.forEach((ed) => {
      ed.draw += (ed.dr - ed.draw) * 0.05; const a = nodes[ed.a], b = nodes[ed.b]; if (!a || !b) return;
      const pr = Math.max(0, Math.min(1, ed.draw)); if (pr < 0.01) return;
      const col = ed.conflict ? CONFLICT : (ed.gold ? GOLD : this.color);
      let al = 0.34 * Math.min(a.alpha, b.alpha) * pr; if (ed.conflict) al *= (0.65 + 0.35 * Math.sin(now * 0.006));
      ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = ed.conflict ? 1.7 : 1.1; ctx.shadowColor = col; ctx.shadowBlur = ed.conflict ? 9 : 3;
      ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(a.cx + (b.cx - a.cx) * pr, a.cy + (b.cy - a.cy) * pr); ctx.stroke();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    nodes.forEach((n) => {
      if (n.alpha < 0.02) return; const col = n.gold ? GOLD : this.color;
      const pulse = 1 + 0.09 * Math.sin(now * 0.0022 + n.phase); const r = n.r * pulse * Math.max(0.2, n.alpha);
      const g = ctx.createRadialGradient(n.cx, n.cy, 0, n.cx, n.cy, r * 4.2);
      g.addColorStop(0, rgba(col, 0.72 * n.alpha)); g.addColorStop(0.3, rgba(col, 0.2 * n.alpha)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 4.2, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = n.alpha; ctx.fillStyle = rgba(col, 1); ctx.shadowColor = col; ctx.shadowBlur = 7;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.95 * n.alpha); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(n.cx, n.cy, r * 0.5, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
      if (n.label && n.alpha > 0.5) { ctx.globalAlpha = (n.alpha - 0.5) * 2; drawLabel(ctx, n, col, W); ctx.globalAlpha = 1; }
    });
    this.inputs.forEach((inp, ii) => {
      const t = ((now + inp.offset * inp.period) % inp.period) / inp.period; const st = starts[ii];
      const cpx = st.x + (core.x - st.x) * 0.35, cpy = st.y + (core.y - st.y) * 0.55;
      if (t < 0.58) {
        const prog = easeInOutCubic(Math.min(1, t / 0.50));
        const px = qbez(st.x, cpx, core.x, prog), py = qbez(st.y, cpy, core.y, prog);
        const alpha = prog > 0.88 ? (1 - (prog - 0.88) / 0.12) : Math.min(1, prog * 8);
        ctx.globalAlpha = 0.10 * alpha; ctx.strokeStyle = inp.col; ctx.lineWidth = 1.2; ctx.setLineDash([3, 6]);
        ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.quadraticCurveTo(cpx, cpy, px, py); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        drawInputToken(ctx, px, py, inp.label, inp.col, alpha);
      }
    });
    drawCrystalCore(ctx, core.x, core.y, now);
    ctx.globalAlpha = 0.32; ctx.fillStyle = this.color; ctx.font = "500 10px 'Geist Mono', monospace";
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('REFINERY CORE', core.x, core.y + 50); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    this.tip.alpha += (this.tip.av - this.tip.alpha) * 0.08;
    if (this.tip.alpha > 0.02) drawTooltip(ctx, nodes[this.tip.targetNode], this.tip, W);
  }
}
