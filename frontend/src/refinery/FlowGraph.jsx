import { useCanvasController } from './hooks/useCanvasGraph';
import { FlowController } from './lib/graphEngine';
import { FLOW_INPUTS, FLOW_SUBJECTS, FLOW_NEW_SUBJECTS, FLOW_LOG } from './data';

export default function FlowGraph({ onLog, color = '#57D8FF', className = '' }) {
  const ref = useCanvasController((canvas) => new FlowController(canvas, {
    color,
    inputs: FLOW_INPUTS,
    subjects: FLOW_SUBJECTS,
    newSubjects: FLOW_NEW_SUBJECTS,
    log: FLOW_LOG,
    onLog,
  }));
  return (
    <canvas
      ref={ref}
      className={`block h-full w-full ${className}`}
      style={{ contain: 'layout paint size', willChange: 'transform' }}
    />
  );
}
