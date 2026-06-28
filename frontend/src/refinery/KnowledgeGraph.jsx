import { useCanvasGraph } from './hooks/useCanvasGraph';
import { layouts } from './lib/graphEngine';

export default function KnowledgeGraph({ variant, color = '#57D8FF', evolve = false, edgeCycle = false, decorScatter = false, decorHero = false, className = '' }) {
  const ref = useCanvasGraph(() => ({
    color,
    evolve,
    edgeCycle,
    decor: decorScatter ? 'scatter' : decorHero ? 'hero' : null,
    build: layouts[variant],
  }));
  return (
    <canvas
      ref={ref}
      className={`block h-full w-full ${className}`}
      style={{ contain: 'layout paint size', willChange: 'transform' }}
    />
  );
}
