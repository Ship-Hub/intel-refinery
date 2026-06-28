import React from 'react';
import logoMark from '../assets/intel-refinery-icon-512.png';

const P = {
  pdf: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16h4"/>',
  web: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17"/>',
  img: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4 3 2.5 3-3L20 17"/>',
  shot: '<path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16"/>',
  notes: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  text: '<path d="M5 6h14M5 6V5h14v1M12 6v13M9 19h6"/>',
  audio: '<path d="M4 10v4M8 6v12M12 3v18M16 8v8M20 11v2"/>',
  docs: '<path d="M9 3h6l4 4v12a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M15 3v4h4M10 13h5M10 16h3"/>',
  bookmark: '<path d="M7 4h10a1 1 0 011 1v15l-6-4-6 4V5a1 1 0 011-1z"/>',
  paper: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8 8h8M8 11h8M8 14h6M8 17h4"/>',
  video: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M10 9.5l4.5 2.5L10 14.5z" fill="currentColor" stroke="none"/>',
  email: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  chat: '<path d="M4 5.5h16a1 1 0 011 1v8a1 1 0 01-1 1H9l-4 3.5V15.5H4a1 1 0 01-1-1v-8a1 1 0 011-1z"/>',
  github: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 14s.5 1.5 3 1.5S15 14 15 14M9.5 9.5v1M14.5 9.5v1"/>',
  api: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
  youtube: '<rect x="3.5" y="6" width="17" height="12" rx="3"/><path d="M10 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none"/>',
  brief: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8 8h8M8 11h8M8 14h5"/>',
  deck: '<rect x="3.5" y="5" width="17" height="11" rx="1.5"/><path d="M12 16v3M9 19h6"/>',
  report: '<path d="M9 3h6l4 4v12a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z"/><path d="M15 3v4h4M9.5 13l2 2 3-3.5"/>',
  guide: '<path d="M5 4.5A1.5 1.5 0 016.5 3H18v15H6.5A1.5 1.5 0 005 19.5v-15z"/><path d="M5 19.5A1.5 1.5 0 006.5 21H18v-3"/>',
  mindmap: '<circle cx="12" cy="6" r="2.2"/><circle cx="6" cy="17" r="2.2"/><circle cx="18" cy="17" r="2.2"/><path d="M12 8.2v3.8M10.5 13l-3 2.4M13.5 13l3 2.4"/>',
  graph: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="9" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M7.7 8.3l5.5 6.7M16.2 10.6L11 15.5M8 7.6l8.2 1M10.7 17h4.5"/>',
  word: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8.5 9l1.3 6 1.7-4.5 1.7 4.5 1.3-6"/>',
  more: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  arrow: '<path d="M3 8h9M8 4l4 4-4 4"/>',
  timeline: '<path d="M4 6h16M4 12h8M4 18h12"/><circle cx="17" cy="6" r="1.5"/><circle cx="14" cy="12" r="1.5"/><circle cx="18" cy="18" r="1.5"/>',
  comparison: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="8" width="8" height="12" rx="1"/><path d="M7 8v2M17 11v2"/>',
  code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13 6l-2 12"/>',
};

export function Glyph({ name, size = 22, stroke = 1.5, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}
      dangerouslySetInnerHTML={{ __html: P[name] || P.docs }} />
  );
}

export function Logo({ size = 26, withWord = true }) {
  return (
    <span className="inline-flex items-center gap-[11px] text-ink">
      <img
        src={logoMark}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      {withWord && <span className="font-semibold tracking-[0.16em] text-[15px]">INTEL REFINERY</span>}
    </span>
  );
}

export function FileGlyph({ name }) {
  const badge = (t, c) => (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="7" y="4" width="20" height="26" rx="2.5" fill="rgba(255,255,255,0.06)" stroke={c} strokeWidth="1.4" />
      <path d="M22 4v6h5" stroke={c} strokeWidth="1.4" />
      <text x="16.5" y="22" fontFamily="Geist Mono,monospace" fontSize="6" fontWeight="700" fill={c} textAnchor="middle">{t}</text>
    </svg>
  );
  const line = (inner, c) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: inner }} />
  );
  switch (name) {
    case 'doc': return badge('DOC', '#cbd5e1');
    case 'pdf': return badge('PDF', '#ff6a6a');
    case 'txt': return badge('TXT', '#cbd5e1');
    case 'docx': return badge('DOCX', '#62a6ff');
    case 'globe': return line('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17"/>', '#9fd0e8');
    case 'image': return line('<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 17l4.5-4 3 2.5 3-3L20 17"/>', '#9fd0e8');
    case 'audio': return line('<path d="M4 10v4M8 6v12M12 3v18M16 8v8M20 11v2"/>', '#57D8FF');
    case 'note': return line('<rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M8 9h8M8 13h5"/>', '#D7C38A');
    case 'video': return line('<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M10 9.5l4.5 2.5L10 14.5z" fill="#cbd5e1" stroke="none"/>', '#cbd5e1');
    default: return null;
  }
}
