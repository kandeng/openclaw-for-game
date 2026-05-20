import type { EntityState } from '../App';

interface HUDProps {
  entityState: EntityState;
}

export default function HUD({ entityState }: HUDProps) {
  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="bg-white/20 backdrop-blur-md rounded-lg px-4 py-2 text-center">
        <p className="text-sm font-mono text-gray-700 leading-tight">
          x: {entityState.x.toFixed(1)}, y: {entityState.y.toFixed(1)}, z: {entityState.z.toFixed(1)}
        </p>
        <p className="text-sm font-mono text-gray-700 leading-tight">
          yaw: {Math.round(entityState.yaw)}, focal: {entityState.focal.toFixed(1)}
        </p>
      </div>
    </div>
  );
}
