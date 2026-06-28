import { useCallback, useEffect, useRef, useState } from "react";

const nowTs = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const SEED_NODES = [
  { id: "ai",       label: "AI\nInfrastructure", x: 0.5,   y: 0.5,   radius: 46, color: [120,222,255], isCenter: true, appearAt: 1.0 },
  { id: "gpu",      label: "GPU\nEcosystem",      x: 0.255, y: 0.27,  radius: 30, color: [216,196,140], appearAt: 2.0 },
  { id: "cloud",    label: "Cloud\nProviders",    x: 0.74,  y: 0.225, radius: 28, color: [156,142,224], appearAt: 2.8 },
  { id: "training", label: "Training\nWorkloads", x: 0.805, y: 0.585, radius: 26, color: [96,206,255],  appearAt: 3.6 },
  { id: "compute",  label: "Compute\nEconomics",  x: 0.555, y: 0.825, radius: 24, color: [92,214,176],  appearAt: 4.3 },
  { id: "energy",   label: "Energy &\nPower",     x: 0.215, y: 0.7,   radius: 26, color: [232,172,112], appearAt: 5.0 },
];
const SEED_LINKS = [
  { from: "ai", to: "gpu", appearAt: 3.0 }, { from: "ai", to: "cloud", appearAt: 3.5 },
  { from: "ai", to: "training", appearAt: 4.0 }, { from: "ai", to: "compute", appearAt: 4.6 },
  { from: "ai", to: "energy", appearAt: 5.2 }, { from: "gpu", to: "energy", appearAt: 6.0 },
  { from: "cloud", to: "training", appearAt: 6.4 }, { from: "training", to: "compute", appearAt: 6.8 },
];
const SCRIPT = [
  { t: 1.4, text: "Reading uploaded documents\u2026" },
  { t: 2.8, text: "Extracted 47 documents and 2,183 chunks" },
  { t: 4.2, text: "Created new section: Cloud Infrastructure", detail: "Mentioned across 9 independent sources", discovery: true },
  { t: 5.9, text: "Connected NVIDIA and CoreWeave", detail: "Mentioned together in 6 sources" },
  { t: 7.5, text: "Merged similar concepts", detail: "\"Compute Costs\" and \"Computing Costs\" are the same concept" },
  { t: 9.2, text: "Removed weak relationship", detail: "Press-release content \u2014 only 1 unreliable source" },
  { t: 11.5, text: "Growing confidence: Cloud Infrastructure", detail: "Evidence strength now High", discovery: true },
  { t: 14.0, text: "New section emerging: Energy & Power", detail: "Mentioned across 7 sources", discovery: true },
  { t: 17.0, text: "Connected: GPU Ecosystem \u2192 Energy & Power", detail: "Co-occurrence in 4 technical documents" },
  { t: 20.5, text: "Open question flagged", detail: "Model-efficiency claims \u2014 needs more evidence" },
  { t: 24.0, text: "Building confidence: Compute Economics" },
  { t: 28.5, text: "Final cross-referencing in progress\u2026" },
  { t: 33.0, text: "All concepts verified and interconnected", detail: "Knowledge model is ready", discovery: true },
];
const SEED_FOCUS = {
  title: "Cloud Infrastructure", status: "Building confidence", evidence: "High",
  connected: [
    { label: "GPU Supply Chain", color: "#57D8FF" },
    { label: "Compute Costs", color: "#57D8FF" },
    { label: "Data Center Growth", color: "#9B8FD8" },
  ],
  sections: [{ heading: "OPEN QUESTIONS (2)", items: [
    { label: "Needs more evidence", tone: "muted" },
    { label: "Energy Consumption" }, { label: "Model Efficiency" },
  ]}],
};

export function useRefinement(projectId) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("refining");
  const [log, setLog] = useState([]);
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [focus, setFocus] = useState(null);
  const [discovery, setDiscovery] = useState(null);
  const raf = useRef(0);
  const start = useRef(0);
  const fired = useRef(new Set());

  const pushLog = useCallback((e) => {
    const entry = { id: e.id ?? crypto.randomUUID(), ts: nowTs(), glowing: true, ...e };
    setLog((l) => [...l, entry]);
    setTimeout(() => setLog((l) => l.map((x) => (x.id === entry.id ? { ...x, glowing: false } : x))), 1600);
    if (e.discovery) {
      setDiscovery({ id: entry.id, text: e.text });
      setTimeout(() => setDiscovery((d) => (d?.id === entry.id ? null : d)), 5000);
    }
  }, []);

  // ===== LOCAL SIMULATION =====
  useEffect(() => {
    setGraph({ nodes: SEED_NODES, links: SEED_LINKS });
    setFocus(SEED_FOCUS);
    start.current = performance.now();
    const tick = () => {
      const t = (performance.now() - start.current) / 1000;
      setProgress(Math.min(100, (t / 35) * 100));
      for (const s of SCRIPT) {
        if (t >= s.t && !fired.current.has(s.text)) {
          fired.current.add(s.text);
          pushLog(s);
        }
      }
      if (t >= 35) { setStatus("complete"); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pushLog]);
  // ===== END SIMULATION =====

  return { progress, status, log, graph, focus, discovery };
}
