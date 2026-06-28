import {
  AudioLines,
  Bot,
  BrainCircuit,
  CircleAlert,
  FileJson2,
  Gauge,
  Image as ImageIcon,
  MessagesSquare,
  ShieldAlert,
  Workflow as WorkflowIcon,
} from "lucide-react";

export const capabilities = [
  {
    icon: MessagesSquare,
    title: "Conversation Summaries",
    description: "Condense noisy threads into clear, decision-ready intelligence.",
  },
  {
    icon: Gauge,
    title: "Escalation Detection",
    description: "Surface rising conflict, sentiment shifts, and trigger patterns early.",
  },
  {
    icon: ShieldAlert,
    title: "FUD & Manipulation Analysis",
    description: "Identify panic amplification, coercion, and coordinated pressure.",
  },
  {
    icon: Bot,
    title: "Interaction Quality Audit",
    description: "Score agents on tone, helpfulness, accuracy, empathy, and compliance — for any platform.",
  },
  {
    icon: ImageIcon,
    title: "Image & Audio Intelligence",
    description: "Analyze screenshots, voice notes, OCR text, and multimodal evidence.",
    visual: "waveform",
  },
  {
    icon: BrainCircuit,
    title: "Dispute Verdict Engine",
    description: "Structured rulings with confidence scores, key findings, and actionable recommendations.",
  },
];

export const useCases = [
  {
    title: "Community Moderation",
    description: "Triage disputes, spot escalation, and summarize long threads.",
  },
  {
    title: "Web3 & Crypto Groups",
    description: "Detect panic loops, rumor spread, and narrative manipulation.",
  },
  {
    title: "Marketplace Disputes",
    description: "Review evidence faster across chats, screenshots, and attachments.",
  },
  {
    title: "Customer Support Audits",
    description: "Score service quality and inspect support conversations at scale.",
  },
  {
    title: "X/Twitter Thread Analysis",
    description: "Extract claims, tone, context gaps, and engagement risk.",
  },
  {
    title: "Escrow & Arbitration Platforms",
    description: "Structure evidence before decisions, reviews, or escalations.",
  },
];

export const workflowSteps = [
  {
    icon: WorkflowIcon,
    title: "Ingest",
    description: "Conversations, images, audio, or evidence enter the pipeline.",
  },
  {
    icon: CircleAlert,
    title: "Queue Analysis",
    description: "Async jobs route data through provider-agnostic intelligence.",
  },
  {
    icon: FileJson2,
    title: "Retrieve Intel",
    description: "Structured JSON returns summaries, risk, context, and actions.",
  },
];

export const platformIntegrations = [
  {
    label: "Telegram",
    abilities: [
      "Summarize threads & disputes",
      "FUD & manipulation detection",
      "Moderator behaviour audit",
      "Escalation alerts",
    ],
  },
  {
    label: "Customer Support",
    abilities: [
      "Score agents on 6 dimensions",
      "Tone & empathy analysis",
      "Resolution quality review",
      "Risk flags for management",
    ],
  },
  {
    label: "AI Agents",
    abilities: [
      "Audit chatbot responses",
      "Flag hallucinations & refusals",
      "Scope-violation detection",
      "Policy compliance scoring",
    ],
  },
  {
    label: "Marketplaces",
    abilities: [
      "Dispute evidence analysis",
      "Structured verdict engine",
      "Buyer/seller conflict review",
      "Missing evidence flags",
    ],
  },
];

export const developerSignals = [
  "REST API",
  "Async processing",
  "API key auth",
  "Provider-agnostic AI",
  "Local + cloud model support",
  "Structured JSON responses",
];

export const analysisStats = [
  ["Sentiment", "Negative"],
  ["Escalation Risk", "High"],
  ["Manipulation", "Detected"],
  ["Context Clarity", "78%"],
  ["Summary", "Ready"],
];

export const liveIntelEvents = [
  "Escalation spike detected",
  "Thread summary generated",
  "Context confidence: 81%",
  "Audio transcript processed",
  "Manipulation indicators detected",
  "Interaction audit completed",
  "Agent score: 9.0 / 10",
  "Risk alert: hostile tone flagged",
  "Dispute verdict: claimant prevails",
  "Evidence quality: strong",
];

export const heroStatuses = [
  "PROCESSING...",
  "ANALYSIS READY",
  "SYSTEM ONLINE",
  "CONTEXT LOCKED",
  "PROVIDER ACTIVE",
];

export const pricingPlans = [
  {
    code: "free",
    name: "Sandbox",
    price: "$0",
    credits: "250 credits",
    rateLimit: "10 req/min",
    description: "For evaluation and small internal tests.",
    perks: ["Core analysis endpoints", "Community support", "Shared queue"],
  },
  {
    code: "starter",
    name: "Builder",
    price: "$19",
    credits: "4,000 credits",
    rateLimit: "60 req/min",
    description: "For solo builders shipping first integrations.",
    perks: ["All Sandbox features", "API key access", "Faster queue priority"],
  },
  {
    code: "basic",
    name: "Scale",
    price: "$49",
    credits: "12,000 credits",
    rateLimit: "180 req/min",
    description: "For teams handling steady production volume.",
    perks: ["All Builder features", "Image + audio analysis", "Usage analytics"],
  },
  {
    code: "pro",
    name: "Enterprise",
    price: "$99",
    credits: "30,000 credits",
    rateLimit: "500 req/min",
    description: "For high-volume platforms and serious workflows.",
    perks: ["All Scale features", "Priority processing", "Advanced support"],
  },
];
