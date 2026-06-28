import { useCanvasController } from './hooks/useCanvasGraph';
import { IconGraphController } from './lib/graphEngine';

export default function IconGraph({ color = '#57D8FF', className = '' }) {
  const ref = useCanvasController((canvas) => new IconGraphController(canvas, color));
  return (
    <canvas
      ref={ref}
      className={`block h-full w-full ${className}`}
      style={{ contain: 'layout paint size', willChange: 'transform' }}
    />
  );
}
