import React, { useMemo, useState, useRef } from 'react';
import { GRID_ROWS, GRID_COLS } from '../constants';
import { GameState, Theme, Player } from '../types';

interface GameBoardProps {
  gameState: GameState;
  players: { 1: Player; 2: Player };
  theme: Theme;
  onLineClick: (r: number, c: number, orientation: 'h' | 'v') => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  players,
  theme,
  onLineClick,
}) => {
  const SPACING = 45; 
  const PADDING = 25;
  const WIDTH = (GRID_COLS - 1) * SPACING + PADDING * 2;
  const HEIGHT = (GRID_ROWS - 1) * SPACING + PADDING * 2;

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragStart, setDragStart] = useState<{ r: number, c: number } | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number, y: number } | null>(null);
  const [snapDot, setSnapDot] = useState<{ r: number, c: number } | null>(null);

  // --- Gesture Handling ---
  
  const getCoordinates = (e: React.PointerEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  };

  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDragStart({ r, c });
    setPointerPos(getCoordinates(e));
    setSnapDot(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    
    e.preventDefault();
    const coords = getCoordinates(e);
    setPointerPos(coords);

    // Vector-based Snapping Logic
    // Instead of checking if we are "close" to a neighbor, we check if the drag 
    // vector has enough magnitude and a clear direction. This feels more like a "swipe".
    
    const startX = dragStart.c * SPACING + PADDING;
    const startY = dragStart.r * SPACING + PADDING;
    
    const dx = coords.x - startX;
    const dy = coords.y - startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Threshold: Drag must be at least 40% of the spacing to trigger a snap
    const SNAP_THRESHOLD = SPACING * 0.4;

    if (dist < SNAP_THRESHOLD) {
      setSnapDot(null);
      return;
    }

    let targetR = dragStart.r;
    let targetC = dragStart.c;

    // Determine dominant axis
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal Drag
      if (dx > 0) targetC += 1;
      else targetC -= 1;
    } else {
      // Vertical Drag
      if (dy > 0) targetR += 1;
      else targetR -= 1;
    }

    // Validate bounds
    if (targetR >= 0 && targetR < GRID_ROWS && targetC >= 0 && targetC < GRID_COLS) {
       setSnapDot({ r: targetR, c: targetC });
    } else {
       setSnapDot(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStart) {
      svgRef.current?.releasePointerCapture(e.pointerId);
      if (snapDot) {
        attemptConnection(dragStart.r, dragStart.c, snapDot.r, snapDot.c);
      }
    }
    setDragStart(null);
    setPointerPos(null);
    setSnapDot(null);
  };

  const attemptConnection = (r1: number, c1: number, r2: number, c2: number) => {
    // Normalize coordinates (ensure we process from top-left perspective)
    const r = Math.min(r1, r2);
    const c = Math.min(c1, c2);
    
    const isHorizontal = r1 === r2; // Same row = horizontal connection
    const isVertical = c1 === c2;   // Same col = vertical connection

    // Only allow strictly orthogonal connections of length 1
    if (isHorizontal && Math.abs(c1 - c2) === 1) {
        onLineClick(r, c, 'h');
    } else if (isVertical && Math.abs(r1 - r2) === 1) {
        onLineClick(r, c, 'v');
    }
  };

  // --- Rendering ---

  // Invisible hit areas for better click sensitivity
  const renderHitAreas = useMemo(() => {
    const hits = [];
    
    // Horizontal Hit Areas
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        if (gameState.horizontalLines[r][c] !== null) continue;
        const x = c * SPACING + PADDING + 10;
        const y = r * SPACING + PADDING - 10;
        hits.push(
          <rect
            key={`h-hit-${r}-${c}`}
            x={x}
            y={y}
            width={SPACING - 20}
            height={20}
            fill="transparent"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onLineClick(r, c, 'h');
            }}
          />
        );
      }
    }

    // Vertical Hit Areas
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gameState.verticalLines[r][c] !== null) continue;
        const x = c * SPACING + PADDING - 10;
        const y = r * SPACING + PADDING + 10;
        hits.push(
          <rect
            key={`v-hit-${r}-${c}`}
            x={x}
            y={y}
            width={20}
            height={SPACING - 20}
            fill="transparent"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onLineClick(r, c, 'v');
            }}
          />
        );
      }
    }
    return hits;
  }, [gameState.horizontalLines, gameState.verticalLines, onLineClick]);

  const renderHorizontalLines = useMemo(() => {
    const lines = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const ownerId = gameState.horizontalLines[r][c];
        if (ownerId !== null) {
          const x = c * SPACING + PADDING;
          const y = r * SPACING + PADDING;
          lines.push(
            <rect
              key={`h-${r}-${c}`}
              x={x + 5}
              y={y - 1.5}
              width={SPACING - 10}
              height={3}
              rx={1.5}
              className={`${ownerId === 1 ? theme.lineActive1 : theme.lineActive2}`}
            />
          );
        }
      }
    }
    return lines;
  }, [gameState.horizontalLines, theme]);

  const renderVerticalLines = useMemo(() => {
    const lines = [];
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const ownerId = gameState.verticalLines[r][c];
        if (ownerId !== null) {
          const x = c * SPACING + PADDING;
          const y = r * SPACING + PADDING;
          lines.push(
            <rect
              key={`v-${r}-${c}`}
              x={x - 1.5}
              y={y + 5}
              width={3}
              height={SPACING - 10}
              rx={1.5}
              className={`${ownerId === 1 ? theme.lineActive1 : theme.lineActive2}`}
            />
          );
        }
      }
    }
    return lines;
  }, [gameState.verticalLines, theme]);

  const renderBoxes = useMemo(() => {
    const els = [];
    for (let r = 0; r < GRID_ROWS - 1; r++) {
      for (let c = 0; c < GRID_COLS - 1; c++) {
        const owner = gameState.boxes[r][c];
        if (owner) {
           const x = c * SPACING + PADDING;
           const y = r * SPACING + PADDING;
           const player = players[owner];
           
           els.push(
             <g key={`box-${r}-${c}`} className="animate-fade-in-scale">
                <rect
                  x={x + 10} y={y + 10} width={SPACING - 20} height={SPACING - 20}
                  rx="8"
                  className={owner === 1 ? theme.lineActive1 : theme.lineActive2}
                  fillOpacity="0.2"
                />
                <text
                  x={x + SPACING / 2}
                  y={y + SPACING / 2}
                  dy=".35em"
                  textAnchor="middle"
                  className={`${theme.font} font-bold text-2xl fill-current pointer-events-none drop-shadow-md ${owner === 1 ? theme.p1Color : theme.p2Color}`}
                >
                  {player.symbol}
                </text>
             </g>
           );
        }
      }
    }
    return els;
  }, [gameState.boxes, players, theme]);

  const renderDots = () => {
    const els = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
         const x = c * SPACING + PADDING;
         const y = r * SPACING + PADDING;
         
         const isStart = dragStart?.r === r && dragStart?.c === c;
         const isSnap = snapDot?.r === r && snapDot?.c === c;

         els.push(
           <g key={`dot-g-${r}-${c}`}>
              <circle
                cx={x} cy={y} r={15} 
                fill="transparent"
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                className="cursor-pointer touch-none"
              />
              <circle
                cx={x} cy={y} r={isStart || isSnap ? 8 : 5}
                className={`${theme.dotColor} transition-all duration-200 pointer-events-none`}
              />
              {isSnap && (
                  <circle cx={x} cy={y} r={12} fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" className="animate-pulse pointer-events-none" />
              )}
           </g>
         );
      }
    }
    return els;
  };

  const startX = dragStart ? (dragStart.c * SPACING + PADDING) : 0;
  const startY = dragStart ? (dragStart.r * SPACING + PADDING) : 0;
  
  return (
    <div className={`relative p-2 rounded-xl overflow-hidden ${theme.boardBg}`}>
      <svg 
        ref={svgRef}
        width={WIDTH} 
        height={HEIGHT} 
        className={`${theme.textColor} touch-none select-none`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
         {renderBoxes}
         {renderHitAreas}
         {renderHorizontalLines}
         {renderVerticalLines}
         
         {dragStart && pointerPos && (
             <g className="pointer-events-none">
                 <line 
                    x1={startX} 
                    y1={startY} 
                    x2={snapDot ? (snapDot.c * SPACING + PADDING) : pointerPos.x} 
                    y2={snapDot ? (snapDot.r * SPACING + PADDING) : pointerPos.y} 
                    stroke="currentColor" 
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity={snapDot ? "1" : "0.5"} 
                 />
             </g>
         )}

         {renderDots()}
      </svg>
    </div>
  );
};