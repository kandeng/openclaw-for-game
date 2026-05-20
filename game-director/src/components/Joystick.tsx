import { useRef, useCallback, useState } from 'react';
import { MoveUp, MoveDown, MoveLeft, MoveRight } from 'lucide-react';

type JoystickMode = 'move' | 'rotate' | 'height' | 'lens';

const DEFAULT_MODE_CYCLE: JoystickMode[] = ['move', 'rotate', 'height', 'lens'];
const MODE_LABELS: Record<JoystickMode, string> = {
  move: 'M',
  rotate: 'R',
  height: 'H',
  lens: 'L',
};

interface JoystickProps {
  modeOrder?: JoystickMode[];
  onMove: (vx: number, vy: number) => void;
  onRotate: (vyaw: number) => void;
  onHeight: (vz: number) => void;
  onFocal: (vf: number) => void;
  onStop: () => void;
}

export default function Joystick({ modeOrder, onMove, onRotate, onHeight, onFocal, onStop }: JoystickProps) {
  const modeCycle = modeOrder ?? DEFAULT_MODE_CYCLE;
  const outerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const pressedRef = useRef(false);
  const lastTouchTime = useRef(0);
  const [mode, setMode] = useState<JoystickMode>(modeCycle[0]);
  const [pressed, setPressed] = useState(false); // visual feedback only

  const getRelativePos = useCallback(
    (clientX: number, clientY: number) => {
      if (!outerRef.current) return { dx: 0, dy: 0, dist: 0 };
      const rect = outerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (clientX - cx) / (rect.width / 2);
      const dy = (clientY - cy) / (rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      return { dx, dy, dist };
    },
    []
  );

  const applyInput = useCallback(
    (dx: number, dy: number) => {
      switch (mode) {
        case 'move':
          onMove(dx * 3, -dy * 3);
          break;
        case 'rotate': {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          onRotate(angle > 0 ? -90 : 90);
          break;
        }
        case 'height':
          onHeight(-dy * 3);
          break;
        case 'lens':
          onFocal(dx * 5);
          break;
      }
    },
    [mode, onMove, onRotate, onHeight, onFocal]
  );

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Ignore synthetic mouse events after touch
      if ('touches' in e) {
        lastTouchTime.current = Date.now();
      } else if (Date.now() - lastTouchTime.current < 500) {
        return;
      }
      e.preventDefault();
      const touch = 'touches' in e ? e.touches[0] : e;
      const { dx, dy, dist } = getRelativePos(touch.clientX, touch.clientY);

      if (dist < 0.35) {
        pressedRef.current = true;
        setPressed(true);
        return;
      }

      isDragging.current = true;
      applyInput(dx, dy);
    },
    [getRelativePos, applyInput]
  );

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Ignore synthetic mouse events after touch
      if (!('touches' in e) && Date.now() - lastTouchTime.current < 500) return;
      e.preventDefault();
      if (!isDragging.current) return;
      const touch = 'touches' in e ? e.touches[0] : e;
      const { dx, dy } = getRelativePos(touch.clientX, touch.clientY);
      applyInput(dx, dy);
    },
    [getRelativePos, applyInput]
  );

  const handleEnd = useCallback(() => {
    if (pressedRef.current) {
      pressedRef.current = false;
      setPressed(false);
      setMode((prev) => {
        const idx = modeCycle.indexOf(prev);
        return modeCycle[(idx + 1) % modeCycle.length];
      });
      onStop();
      return;
    }
    isDragging.current = false;
    onStop();
  }, [onStop]);

  const handleTouchEnd = useCallback(() => {
    lastTouchTime.current = Date.now();
    handleEnd();
  }, [handleEnd]);

  const handleMouseEnd = useCallback(() => {
    if (Date.now() - lastTouchTime.current < 500) return;
    handleEnd();
  }, [handleEnd]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div
        ref={outerRef}
        className="relative w-56 h-56 rounded-full bg-black/[0.03] backdrop-blur-[2px] border border-gray-400/20 shadow-sm pointer-events-auto"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleMouseEnd}
        onMouseLeave={handleMouseEnd}
      >
        {/* Move mode arrows: 12:00, 3:00, 6:00, 9:00 */}
        {mode === 'move' && (
          <>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-gray-500/60">
              <MoveUp size={28} />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-500/60">
              <MoveDown size={28} />
            </div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500/60">
              <MoveLeft size={28} />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500/60">
              <MoveRight size={28} />
            </div>
          </>
        )}

        {/* Rotate mode arrows: CW at 1:30 & 4:30, CCW at 7:30 & 10:30 */}
        {mode === 'rotate' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 224 224">
            <g transform="translate(112,112)">
              {/* 1:30 - CW, arrowhead upward */}
              <path d="M 73.6,-42.5 A 85,85 0 0,0 42.5,-73.6" fill="none" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="34,-79 41,-67 47,-78" fill="rgba(107,114,128,0.6)" />
              {/* 4:30 - CW, arrowhead downward */}
              <path d="M 73.6,42.5 A 85,85 0 0,1 42.5,73.6" fill="none" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="35,80 48,74 39,70" fill="rgba(107,114,128,0.6)" />
              {/* 7:30 - CCW, arrowhead downward */}
              <path d="M -73.6,42.5 A 85,85 0 0,0 -42.5,73.6" fill="none" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="-35,80 -48,74 -39,70" fill="rgba(107,114,128,0.6)" />
              {/* 10:30 - CCW, arrowhead upward */}
              <path d="M -73.6,-42.5 A 85,85 0 0,1 -42.5,-73.6" fill="none" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="-34,-79 -41,-67 -47,-78" fill="rgba(107,114,128,0.6)" />
            </g>
          </svg>
        )}

        {/* Height mode arrows: up at 12:00, down at 6:00 */}
        {mode === 'height' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 224 224">
            <g transform="translate(112,112)" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="rgba(107,114,128,0.6)">
              {/* Up arrow at 12:00 */}
              <line x1="0" y1="-50" x2="0" y2="-90" />
              <polygon points="0,-98 -7,-84 7,-84" />
              {/* Down arrow at 6:00 */}
              <line x1="0" y1="50" x2="0" y2="90" />
              <polygon points="0,98 -7,84 7,84" />
            </g>
          </svg>
        )}

        {/* Lens mode arrows: longer at 3:00, shorter at 9:00 */}
        {mode === 'lens' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 224 224">
            <g transform="translate(112,112)" stroke="rgba(107,114,128,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="rgba(107,114,128,0.6)">
              {/* Long (zoom in) arrow at 3:00 */}
              <line x1="50" y1="0" x2="90" y2="0" />
              <polygon points="98,0 84,-7 84,7" />
              {/* Short (zoom out) arrow at 9:00 */}
              <line x1="-50" y1="0" x2="-90" y2="0" />
              <polygon points="-98,0 -84,-7 -84,7" />
            </g>
          </svg>
        )}

        {/* Inner toggle circle */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border flex items-center justify-center transition-colors duration-150 ${
            pressed
              ? 'bg-gray-700/30 border-gray-500/40'
              : 'bg-white/10 border-gray-400/20'
          }`}
        >
          <span className={`text-lg font-bold ${
            pressed ? 'text-white' : 'text-gray-700'
          }`}>
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>
    </div>
  );
}
