export const NAV_LINKS = ['Product', 'How It Works', 'Use Cases', 'Developers', 'Pricing', 'Resources'];

export const SOURCES = [
  ['PDFs', 'pdf'], ['Research Papers', 'paper'], ['Web Pages', 'web'], ['Screenshots', 'shot'],
  ['Voice Notes', 'audio'], ['Articles', 'text'], ['Videos', 'video'], ['Notes', 'notes'],
  ['Emails', 'email'], ['Chat Exports', 'chat'],
];

export const STEPS = [
  ['Add everything', 'Upload documents, paste notes, add URLs, images or recordings. You do not need to organise everything first.'],
  ['Observe and connect', 'Refinery identifies important information, recurring ideas, relationships, conflicting details and emerging subjects across your sources.'],
  ['Challenge the understanding', 'Weak relationships are reconsidered, uncertain conclusions are tested and alternative explanations are explored.'],
  ['Explore and use', 'Navigate the structured model or transform it into a report, brief, timeline, comparison, graph or export.'],
];

export const INPUTS = [
  ['PDF', 'pdf'], ['Website', 'web'], ['Images', 'img'], ['Screenshots', 'shot'],
  ['Notes', 'notes'], ['Text', 'text'], ['Audio', 'audio'], ['Documents', 'docs'],
  ['CSV', 'paper'], ['JSON', 'code'],
];
export const SOON = [['GitHub', 'github'], ['YouTube', 'youtube'], ['Cloud Storage', 'more'], ['API Imports', 'api']];

export const OUTPUTS_TOP = [
  ['Executive Brief', 'brief'], ['Full Report', 'report'], ['Timeline', 'timeline'],
  ['Comparison', 'comparison'], ['Study Guide', 'guide'],
];
export const OUTPUTS_BOT = [
  ['Knowledge Graph', 'graph'], ['Source Map', 'mindmap'], ['Structured JSON', 'code'],
  ['Markdown', 'docs'], ['PDF', 'pdf'], ['DOCX', 'word'],
];

export const STRUCTURES = [
  ['Market Research', 'structA', '#B794F6'],
  ['Historical Investigation', 'structB', '#6EE7B7'],
  ['Product Feedback', 'structC', '#E3C77A'],
];

export const PROBLEM_CARDS = [
  { l: 6, t: 14, w: 120, h: 80, rot: -13, z: 3, ry: 14, kind: 'wp', arg: '#2b5fd0,#5a8ff0', dur: 8.4, delay: 0.0 },
  { l: 32, t: 5, w: 76, h: 76, rot: 11, z: 4, ry: -12, kind: 'photo', arg: '#7b3fe4,#b06ab3,#e89b5a', dur: 9.1, delay: 1.2 },
  { l: 42, t: 22, w: 82, h: 104, rot: -6, z: 5, ry: -16, kind: 'news', dur: 7.6, delay: 2.1 },
  { l: 3, t: 44, w: 104, h: 68, rot: 8, z: 3, ry: 16, kind: 'chart', dur: 10.2, delay: 0.6 },
  { l: 22, t: 46, w: 68, h: 68, rot: -16, z: 6, ry: -8, kind: 'note', dur: 8.0, delay: 1.7 },
  { l: 40, t: 56, w: 72, h: 92, rot: 7, z: 4, ry: -14, kind: 'social', dur: 9.6, delay: 0.4 },
  { l: 8, t: 67, w: 108, h: 68, rot: -11, z: 5, ry: 12, kind: 'video', arg: '#1a3a5a,#2a6a8a', dur: 7.9, delay: 2.4 },
  { l: 29, t: 72, w: 100, h: 64, rot: 14, z: 3, ry: -10, kind: 'email', dur: 10.5, delay: 1.0 },
  { l: 16, t: 25, w: 98, h: 64, rot: 5, z: 2, ry: 10, kind: 'wp', arg: '#6b35a0,#9a5fd0', dur: 8.7, delay: 1.9 },
  { l: 46, t: 42, w: 68, h: 68, rot: -20, z: 2, ry: -18, kind: 'photo', arg: '#2a8a6a,#5ac0a0', dur: 9.3, delay: 0.8 },
  { l: 2, t: 82, w: 66, h: 88, rot: -6, z: 2, ry: 14, kind: 'news', dur: 7.4, delay: 2.6 },
  { l: 36, t: 82, w: 94, h: 60, rot: 16, z: 2, ry: -12, kind: 'chart', dur: 10.8, delay: 0.2 },
];

export const FLOW_INPUTS = [
  { label: 'PDF', col: '#ff7070', period: 7800, offset: 0.00 },
  { label: 'LINK', col: '#9fd0e8', period: 8600, offset: 0.16 },
  { label: 'NOTE', col: '#D7C38A', period: 7200, offset: 0.32 },
  { label: 'IMAGE', col: '#90d4c8', period: 9100, offset: 0.48 },
  { label: 'AUDIO', col: '#57D8FF', period: 8000, offset: 0.64 },
  { label: 'VIDEO', col: '#b794f6', period: 7600, offset: 0.80 },
];

export const FLOW_SUBJECTS = ['Compute Demand', 'Supply Chain', 'Model Capability'];
export const FLOW_NEW_SUBJECTS = ['Infrastructure Costs', 'Pricing Trends', 'Energy Footprint'];

const C = { cyan: '#57D8FF', gold: '#D7C38A', mute: '#5C6878' };
export const FLOW_LOG = [
  { text: 'Reading uploaded sources', color: C.cyan },
  { text: 'Recurring subject detected across 6 sources', color: C.cyan },
  { text: 'Related findings connected', color: C.cyan },
  { text: 'Conflicting detail identified', color: C.gold },
  { text: 'Weak relationship downgraded', color: C.mute },
  { text: 'New subject created', color: C.gold },
  { text: 'Existing understanding reorganised', color: C.cyan },
  { text: 'Refinery Model updated', color: C.cyan },
];

export const USE_CASES = [
  ['Understand a market', 'Combine reports, competitor pages, customer opinions and internal notes to reveal the forces shaping a market.'],
  ['Investigate a company', 'Connect company documents, public information, interviews and research into one structured view.'],
  ['Analyse customer feedback', 'Turn reviews, support conversations, surveys and interviews into recurring problems, needs and priorities.'],
  ['Organise research', 'Bring papers, notes, links and recordings together without losing their relationships or origins.'],
  ['Compare competing ideas', 'See where products, strategies, proposals or explanations agree, conflict and leave questions unanswered.'],
  ['Build internal knowledge', 'Transform scattered documents, meeting records and team knowledge into something structured and reusable.'],
];

export const COMPARISON_ROWS = [
  ['Answers the prompt you give it', 'Discovers what the information means and how it fits together'],
  ['Produces a one-off response', 'Builds persistent understanding that evolves over time'],
  ['Depends heavily on your prompting', 'Finds relationships, patterns, conflicts and gaps automatically'],
  ['Compresses information into prose', 'Organises findings, sources, connections and questions into a structured model'],
  ['Starts over when new information is added', 'Updates the existing understanding and shows what changed'],
  ['Produces one output at a time', 'Creates reports, timelines, comparisons, graphs and exports from the same model'],
  ['Leaves you to manage files, OCR and processing', 'Handles the complete information-refinement pipeline'],
  ['Helps you ask questions about your information', 'Helps you understand what it means and what to do with it'],
];

export const PLANS = [
  {
    id: 'explorer', name: 'Explorer', price: 'Free',
    desc: 'Experience Intel Refinery with a small personal project.',
    items: ['1 active project', '100 MB storage', '2 refinements per month', 'PDF export'],
    cta: 'Start Free',
  },
  {
    id: 'researcher', name: 'Researcher', price: '$19/month',
    desc: 'For individuals doing serious research and analysis.',
    items: ['5 active projects', '2 GB storage', '20 refinements per month', 'OCR, images and audio', 'Version history', 'Standard exports'],
    cta: 'Choose Researcher', recommended: true,
  },
  {
    id: 'studio', name: 'Studio', price: '$79/month',
    desc: 'For small teams building understanding together.',
    items: ['5 members', '20 active projects', '20 GB shared storage', '100 shared refinements', 'API access', 'Collaboration'],
    cta: 'Choose Studio',
  },
  {
    id: 'organization', name: 'Organization', price: 'From $299/month',
    desc: 'For organisations that need greater scale, control and integration.',
    items: ['Custom limits', 'API access', 'Audit logs', 'SSO-ready', 'BYO OpenRouter', 'Advanced administration'],
    cta: 'Contact Us',
  },
];

export const CAPABILITIES = [
  'Ingest documents, URLs, text, images and recordings',
  'Run asynchronous refinements',
  'Retrieve structured findings and relationships',
  'Update existing models incrementally',
  'Generate reports, graphs and exports',
  'Receive completion events through webhooks',
];
