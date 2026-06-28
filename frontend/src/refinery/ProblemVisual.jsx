import IconGraph from './IconGraph';
import { PROBLEM_CARDS } from './data';

export default function ProblemVisual() {
  return (
    <div className="relative h-[340px] sm:h-[400px]">
      <div
        className="pointer-events-none absolute left-[2%] top-[24%] z-0 h-[62%] w-[44%]"
        style={{ background: 'radial-gradient(ellipse at center,rgba(45,95,205,0.32),rgba(95,45,170,0.18),transparent 72%)', filter: 'blur(8px)' }}
      />
      <IconGraph className="absolute inset-0 z-[1]" />
      <div
        className="pointer-events-none absolute left-0 top-0 z-[2] h-full w-[48%]"
        style={{ transform: 'perspective(1100px) rotateX(22deg) rotateZ(-3deg)', transformStyle: 'preserve-3d' }}
      >
        {PROBLEM_CARDS.map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: `${c.l}%`, top: `${c.t}%`, width: `${c.w}px`, height: `${c.h}px`, transform: `rotateY(${c.ry}deg) rotateX(${(c.z - 3) * -2}deg) rotateZ(${c.rot}deg)`, zIndex: c.z }}
          >
            <div
              className="h-full w-full overflow-hidden rounded-[7px] border border-white/[0.14] float-card"
              style={{ boxShadow: c.z >= 4 ? '0 22px 42px rgba(0,0,0,0.6),0 6px 14px rgba(0,0,0,0.5)' : '0 12px 26px rgba(0,0,0,0.5)', animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
            >
              <CardThumb kind={c.kind} arg={c.arg} />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 arrow-nudge">
        <svg width="46" height="26" viewBox="0 0 46 26" fill="none" style={{ filter: 'drop-shadow(0 0 8px #57D8FF)' }}>
          <path d="M3 13h36M31 6l10 7-10 7" stroke="#57D8FF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function CardThumb({ kind, arg }) {
  switch (kind) {
    case 'wp':
      return (
        <div className="flex h-full w-full flex-col bg-white">
          <div className="flex h-[24%] items-center gap-[3px] px-[6px]" style={{ background: `linear-gradient(90deg,${arg})` }}>
            <div className="h-[5px] w-[5px] rounded-full bg-white/75" />
            <div className="h-[3px] w-[34%] rounded-[2px] bg-white/60" />
          </div>
          <div className="flex flex-1 flex-col gap-[3px] p-[6px]">
            <div className="h-[46%] rounded-[3px]" style={{ background: 'linear-gradient(135deg,#9ec0f0,#d8e6fa)' }} />
            <div className="h-[3px] w-[90%] rounded-[2px] bg-[#dde3ec]" />
            <div className="h-[3px] w-[68%] rounded-[2px] bg-[#e6ebf2]" />
          </div>
        </div>
      );
    case 'photo':
      return (
        <div className="relative h-full w-full" style={{ background: `linear-gradient(135deg,${arg})` }}>
          <div className="absolute inset-x-0 bottom-0 h-[34%]" style={{ background: 'linear-gradient(transparent,rgba(0,0,0,0.4))' }} />
        </div>
      );
    case 'chart':
      return (
        <div className="flex h-full w-full items-end gap-[3px] bg-white p-[8px]">
          <div className="h-[42%] flex-1 rounded-[1px] bg-[#3a6fd8]" />
          <div className="h-[72%] flex-1 rounded-[1px] bg-[#2aa37a]" />
          <div className="h-[54%] flex-1 rounded-[1px] bg-[#3a6fd8]" />
          <div className="h-[88%] flex-1 rounded-[1px] bg-[#e0a93a]" />
          <div className="h-[48%] flex-1 rounded-[1px] bg-[#3a6fd8]" />
        </div>
      );
    case 'news':
      return (
        <div className="flex h-full w-full flex-col gap-[2px] bg-[#f4f1e8] p-[6px]">
          <div className="h-[6px] w-full rounded-[1px] bg-[#2a2620]" />
          <div className="mt-[2px] flex flex-1 gap-[5px]">
            <div className="flex flex-1 flex-col gap-[2px]">
              <div className="h-[2px] bg-[#9a948a]" />
              <div className="h-[2px] w-[82%] bg-[#b5afa4]" />
              <div className="my-[1px] h-[16px] rounded-[1px] bg-[#cac4b9]" />
              <div className="h-[2px] bg-[#9a948a]" />
              <div className="h-[2px] w-[70%] bg-[#b5afa4]" />
            </div>
            <div className="flex flex-1 flex-col gap-[2px]">
              <div className="h-[2px] bg-[#9a948a]" />
              <div className="h-[2px] w-[88%] bg-[#b5afa4]" />
              <div className="h-[2px] bg-[#9a948a]" />
              <div className="h-[2px] w-[64%] bg-[#b5afa4]" />
              <div className="h-[2px] bg-[#9a948a]" />
            </div>
          </div>
        </div>
      );
    case 'note':
      return (
        <div className="flex h-full w-full flex-col gap-[5px] p-[9px]" style={{ background: 'linear-gradient(135deg,#ffe566,#f4d23a)' }}>
          <div className="h-[3px] w-[72%] rounded-[2px]" style={{ background: 'rgba(120,90,20,0.42)' }} />
          <div className="h-[3px] w-[90%] rounded-[2px]" style={{ background: 'rgba(120,90,20,0.3)' }} />
          <div className="h-[3px] w-[52%] rounded-[2px]" style={{ background: 'rgba(120,90,20,0.3)' }} />
        </div>
      );
    case 'video':
      return (
        <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg,${arg})` }}>
          <div className="ml-[3px]" style={{ width: 0, height: 0, borderLeft: '11px solid rgba(255,255,255,0.92)', borderTop: '7px solid transparent', borderBottom: '7px solid transparent', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' }} />
        </div>
      );
    case 'social':
      return (
        <div className="flex h-full w-full flex-col gap-[3px] bg-white p-[6px]">
          <div className="flex items-center gap-[4px]">
            <div className="h-[13px] w-[13px] rounded-full" style={{ background: 'linear-gradient(135deg,#e0507a,#f59e5a)' }} />
            <div className="flex-1">
              <div className="mb-[2px] h-[2px] w-[50%] rounded-[1px] bg-[#cbd2dc]" />
              <div className="h-[2px] w-[30%] rounded-[1px] bg-[#e0e5ec]" />
            </div>
          </div>
          <div className="flex-1 rounded-[3px]" style={{ background: 'linear-gradient(135deg,#5ab0e0,#7ad0c0)' }} />
        </div>
      );
    case 'email':
      return (
        <div className="flex h-full w-full flex-col bg-white">
          <div className="h-[38%]" style={{ background: 'linear-gradient(90deg,#e8505a,#f57a5a)' }} />
          <div className="flex flex-col gap-[3px] p-[6px]">
            <div className="h-[3px] w-[80%] rounded-[2px] bg-[#dde3ec]" />
            <div className="h-[3px] w-[58%] rounded-[2px] bg-[#e6ebf2]" />
          </div>
        </div>
      );
    default:
      return <div className="h-full w-full bg-white" />;
  }
}
