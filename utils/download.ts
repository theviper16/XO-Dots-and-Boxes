import JSZip from 'jszip';

// Helper to escape backticks in template literals for the embedded code
const t = (strings: TemplateStringsArray, ...values: any[]) => {
    return String.raw({ raw: strings }, ...values);
};

const FILES = {
  "metadata.json": `{
  "name": "Dots & Boxes Arcade",
  "description": "A classic arcade-style Dots and Boxes game with multiple themes, a timer, and AI-powered chat commentary.",
  "requestFramePermissions": []
}`,

  "index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  "types.ts": `import React from 'react';

export type PlayerId = 1 | 2;

export interface Player {
  id: PlayerId;
  name: string;
  symbol: 'X' | 'O';
  color: string;
  score: number;
}

export interface Line {
  r: number;
  c: number;
  orientation: 'h' | 'v'; // horizontal or vertical
}

export interface GameState {
  horizontalLines: (PlayerId | null)[][]; // [row][col] - stores who connected it
  verticalLines: (PlayerId | null)[][];   // [row][col] - stores who connected it
  boxes: (PlayerId | null)[][]; // [row][col]
  currentPlayer: PlayerId;
  timeLeft: number;
  isPaused: boolean;
  isGameOver: boolean;
  winner: PlayerId | 'draw' | null;
}

export interface Theme {
  id: string;
  name: string;
  font: string;
  bgGradient: string;
  boardBg: string;
  dotColor: string;
  lineInactive: string;
  lineActive1: string;
  lineActive2: string;
  textColor: string;
  buttonStyle: string;
  icon: React.ReactNode;
  // Specific styling for players
  p1Color: string; // TailWind classes for text
  p2Color: string; // TailWind classes for text
  p1Border: string;
  p2Border: string;
  p1Bg: string; // for badges/active states
  p2Bg: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}`,

  "constants.tsx": `import React from 'react';
import { Theme } from './types';
import { CircuitBoard, ShoppingBag, Trees } from 'lucide-react';

export const GRID_ROWS = 10;
export const GRID_COLS = 8;
export const TURN_DURATION = 10; // seconds

export const THEMES: Theme[] = [
  {
    id: 'cyber',
    name: 'Cyber City',
    font: 'font-cyber',
    bgGradient: 'bg-black', // Deep black base
    boardBg: 'bg-black border-2 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)]',
    dotColor: 'fill-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]',
    lineInactive: 'fill-slate-800',
    lineActive1: 'fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,1)]',
    lineActive2: 'fill-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,1)]',
    textColor: 'text-cyan-400',
    buttonStyle: 'bg-transparent text-cyan-400 font-bold border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    icon: <CircuitBoard className="w-6 h-6" />,
    p1Color: 'text-pink-500',
    p2Color: 'text-cyan-400',
    p1Border: 'border-pink-500',
    p2Border: 'border-cyan-400',
    p1Bg: 'bg-pink-500',
    p2Bg: 'bg-cyan-400',
  },
  {
    id: 'mall',
    name: 'Midnight Mall',
    font: 'font-standard',
    bgGradient: 'bg-gradient-to-br from-slate-900 to-black',
    boardBg: 'bg-slate-900/80 backdrop-blur-md border-4 border-purple-500/50 shadow-xl rounded-3xl',
    dotColor: 'fill-purple-400',
    lineInactive: 'fill-slate-700',
    lineActive1: 'fill-pink-400',
    lineActive2: 'fill-violet-400',
    textColor: 'text-purple-300',
    buttonStyle: 'bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(147,51,234,0.4)]',
    icon: <ShoppingBag className="w-6 h-6" />,
    p1Color: 'text-pink-400',
    p2Color: 'text-violet-400',
    p1Border: 'border-pink-400',
    p2Border: 'border-violet-400',
    p1Bg: 'bg-pink-400',
    p2Bg: 'bg-violet-400',
  },
  {
    id: 'jungle',
    name: 'Dark Jungle',
    font: 'font-arcade', 
    bgGradient: 'bg-gradient-to-br from-black via-green-950 to-black',
    boardBg: 'bg-black/60 backdrop-blur-sm border-2 border-green-600/50 shadow-2xl rounded-lg',
    dotColor: 'fill-yellow-600',
    lineInactive: 'fill-green-900',
    lineActive1: 'fill-orange-600',
    lineActive2: 'fill-lime-600',
    textColor: 'text-green-400',
    buttonStyle: 'bg-green-900 hover:bg-green-800 text-green-100 border border-green-500',
    icon: <Trees className="w-6 h-6" />,
    p1Color: 'text-orange-500',
    p2Color: 'text-lime-500',
    p1Border: 'border-orange-500',
    p2Border: 'border-lime-500',
    p1Bg: 'bg-orange-500',
    p2Bg: 'bg-lime-500',
  },
];`,

  "services/gemini.ts": `import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const getGameCommentary = async (
  player1Name: string,
  player2Name: string,
  score1: number,
  score2: number,
  theme: string,
  lastAction: string
): Promise<string> => {
  if (!ai) return "AI commentator is offline (API Key missing).";

  try {
    const prompt = \`
      You are an energetic arcade game commentator for a game of Dots and Boxes.
      The current theme is \${theme}.
      Player 1: \${player1Name} (Score: \${score1}).
      Player 2: \${player2Name} (Score: \${score2}).
      The last action was: \${lastAction}.
      
      Give a short, witty, 1-sentence commentary on the state of the game.
      Be playful and thematic based on the \${theme} setting.
    \`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The commentator is speechless!";
  }
};

export const getTrashTalk = async (theme: string): Promise<string> => {
    if (!ai) return "Good luck!";

    try {
        const prompt = \`Generate a short, funny, family-friendly trash talk line for a competitive arcade game player. Theme: \${theme}. Max 10 words.\`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (e) {
        return "I'm going to win this!";
    }
}`,

  "components/Button.tsx": `import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  themeStyle: string;
  variant?: 'primary' | 'secondary' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  children, 
  themeStyle, 
  variant = 'primary',
  ...props 
}) => {
  const baseClass = "transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  let variantClass = themeStyle;
  if (variant === 'icon') {
    variantClass = \`\${themeStyle} p-2 rounded-full flex items-center justify-center\`;
  } else {
    variantClass = \`\${themeStyle} px-6 py-3 rounded uppercase tracking-wider\`;
  }

  return (
    <button className={\`\${baseClass} \${variantClass} \${className}\`} {...props}>
      {children}
    </button>
  );
};`,

  "components/GameBoard.tsx": `import React, { useMemo, useState, useRef } from 'react';
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
            key={\`h-hit-\${r}-\${c}\`}
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
            key={\`v-hit-\${r}-\${c}\`}
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
              key={\`h-\${r}-\${c}\`}
              x={x + 5}
              y={y - 1.5}
              width={SPACING - 10}
              height={3}
              rx={1.5}
              className={\`\${ownerId === 1 ? theme.lineActive1 : theme.lineActive2}\`}
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
              key={\`v-\${r}-\${c}\`}
              x={x - 1.5}
              y={y + 5}
              width={3}
              height={SPACING - 10}
              rx={1.5}
              className={\`\${ownerId === 1 ? theme.lineActive1 : theme.lineActive2}\`}
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
             <g key={\`box-\${r}-\${c}\`} className="animate-fade-in-scale">
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
                  className={\`\${theme.font} font-bold text-2xl fill-current pointer-events-none drop-shadow-md \${owner === 1 ? theme.p1Color : theme.p2Color}\`}
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
           <g key={\`dot-g-\${r}-\${c}\`}>
              <circle
                cx={x} cy={y} r={15} 
                fill="transparent"
                onPointerDown={(e) => handlePointerDown(r, c, e)}
                className="cursor-pointer touch-none"
              />
              <circle
                cx={x} cy={y} r={isStart || isSnap ? 8 : 5}
                className={\`\${theme.dotColor} transition-all duration-200 pointer-events-none\`}
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
    <div className={\`relative p-2 rounded-xl overflow-hidden \${theme.boardBg}\`}>
      <svg 
        ref={svgRef}
        width={WIDTH} 
        height={HEIGHT} 
        className={\`\${theme.textColor} touch-none select-none\`}
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
};`,

  "components/Chat.tsx": `import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, X } from 'lucide-react';
import { Theme, ChatMessage } from '../types';
import { getTrashTalk } from '../services/gemini';

interface ChatProps {
  theme: Theme;
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onAiTrashTalk: () => void;
}

export const Chat: React.FC<ChatProps> = ({ theme, isOpen, onClose, messages, onSendMessage, onAiTrashTalk }) => {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className={\`absolute bottom-20 right-4 w-80 h-96 \${theme.boardBg} flex flex-col rounded-lg shadow-2xl border-2 border-current z-50 \${theme.textColor}\`}>
      <div className={\`p-3 border-b border-current flex justify-between items-center \${theme.bgGradient} bg-opacity-20\`}>
        <h3 className={\`font-bold \${theme.font} text-sm\`}>Chat & AI Trash Talk</h3>
        <button onClick={onClose} className="hover:opacity-70"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/20">
        {messages.length === 0 && (
          <p className="text-xs opacity-60 text-center italic">Start chatting or ask AI for a line!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={\`flex flex-col \${msg.sender === 'System' ? 'items-center' : (msg.sender === 'Player 1' ? 'items-start' : 'items-end')}\`}>
            <span className="text-[10px] opacity-70 mb-1 flex gap-2 items-center">
              <span className="font-bold">{msg.sender}</span>
              <span className="opacity-50 text-[9px]">{msg.timestamp}</span>
            </span>
            <div className={\`px-3 py-2 rounded max-w-[85%] text-sm \${msg.isSystem ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50' : 'bg-white/10 backdrop-blur-sm'}\`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="p-2 border-t border-current bg-black/10">
        <div className="flex gap-2 mb-2">
           <button 
             type="button" 
             onClick={onAiTrashTalk}
             className="text-xs flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded flex items-center justify-center gap-1 hover:brightness-110"
           >
             <Bot size={12} /> Generate Trash Talk
           </button>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-black/20 border border-current/30 rounded px-2 py-1 text-sm focus:outline-none focus:border-current"
            placeholder="Type a message..."
          />
          <button type="submit" className={\`p-2 rounded \${theme.buttonStyle}\`}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};`,

  "App.tsx": `import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GRID_ROWS, GRID_COLS, THEMES, TURN_DURATION } from './constants';
import { GameState, Player, Theme, ChatMessage, PlayerId } from './types';
import { GameBoard } from './components/GameBoard';
import { Button } from './components/Button';
import { Chat } from './components/Chat';
import { getGameCommentary, getTrashTalk } from './services/gemini';
import { Settings, Play, Pause, RotateCcw, MessageSquare, Volume2, VolumeX, Home, Gamepad2, Wifi, Users, Copy, Share2, Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import Peer from 'peerjs';

// --- Sound Utility ---
const playArcadeSound = (type: 'click' | 'win' | 'select' | 'error' | 'type') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'select') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'type') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'win') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.1); 
    osc.frequency.setValueAtTime(659, now + 0.2); 
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } else if (type === 'error') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
};

// --- Helper Functions ---
const createInitialState = (): GameState => ({
  horizontalLines: Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS - 1).fill(null)),
  verticalLines: Array(GRID_ROWS - 1).fill(null).map(() => Array(GRID_COLS).fill(null)),
  boxes: Array(GRID_ROWS - 1).fill(null).map(() => Array(GRID_COLS - 1).fill(null)),
  currentPlayer: 1,
  timeLeft: TURN_DURATION,
  isPaused: false,
  isGameOver: false,
  winner: null,
});

const copyToClipboard = async (text: string) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (err) {
        console.error('Copy failed', err);
        return false;
    }
};

// --- Independent Components ---

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  theme: Theme;
  gameState: GameState;
  onNameChange: (id: PlayerId, name: string) => void;
  isMultiplayer: boolean;
  myPlayerId: PlayerId | null;
}

const PlayerCard = ({ player, isActive, theme, gameState, onNameChange, isMultiplayer, myPlayerId }: PlayerCardProps) => {
  const isWinner = gameState.isGameOver && gameState.winner === player.id;
  
  const colorClass = player.id === 1 ? theme.p1Color : theme.p2Color;
  const borderClass = player.id === 1 ? theme.p1Border : theme.p2Border;
  const bgClass = player.id === 1 ? theme.p1Bg : theme.p2Bg;
  
  const isMe = isMultiplayer && myPlayerId === player.id;

  return (
    <div className={\`relative p-3 md:p-4 rounded-xl border-2 flex-1 transition-all duration-300 overflow-hidden
        \${isActive && !gameState.isGameOver ? \`\${colorClass} \${borderClass} bg-black/80 scale-105 shadow-xl ring-2 ring-offset-0 \${player.id === 1 ? 'ring-pink-500/50' : 'ring-cyan-500/50'}\` : ''}
        \${isWinner ? \`\${bgClass} text-black scale-110 shadow-[0_0_50px_currentColor] animate-neon border-white z-50\` : ''}
        \${!isActive && !isWinner ? \`border-current/10 bg-black/40 opacity-60 hover:opacity-80 \${colorClass}\` : ''}\`}>
      
      <div className="flex justify-between items-center z-10 relative">
        <div className="w-full mr-2">
          {/* If multiplayer and not me, read only */}
          {isMultiplayer && !isMe ? (
             <div className={\`text-sm md:text-base font-bold \${theme.font} uppercase truncate\`}>{player.name}</div>
          ) : (
             <input 
                type="text"
                value={player.name}
                onChange={(e) => onNameChange(player.id, e.target.value)}
                className={\`text-sm md:text-base font-bold \${theme.font} uppercase bg-transparent border-b border-transparent hover:border-white/50 focus:border-white focus:outline-none w-full cursor-text placeholder-current\`}
                onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex gap-2 text-[10px] opacity-80 uppercase tracking-wider font-bold mt-1">
             <span>Sym: {player.symbol}</span>
             {isMe && <span className="text-white bg-white/20 px-1 rounded">YOU</span>}
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-bold">{player.score}</div>
      </div>
      
      {isWinner && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
      
      {isActive && !gameState.isGameOver && !gameState.isPaused && (
         <div className={\`absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear \${bgClass}\`}
            style={{ width: \`\${(gameState.timeLeft / TURN_DURATION) * 100}%\` }} 
         />
      )}
    </div>
  );
};

// --- Extracted Screens ---

type ScreenType = 'welcome' | 'setup' | 'game' | 'create-room' | 'join-room';

interface WelcomeScreenProps {
  goHome: () => void;
  setScreen: (s: ScreenType) => void;
  playSound: (type: any) => void;
  showTutorial: boolean;
  setShowTutorial: (v: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ setScreen, playSound, showTutorial, setShowTutorial }) => (
  <div className="min-h-screen relative flex flex-col items-center justify-center bg-black overflow-hidden font-cyber text-white">
    <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>
    <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
    <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-500 rounded-full blur-[100px] opacity-20 animate-pulse"></div>

    <div className="z-10 flex flex-col items-center space-y-12">
      <div className="text-center space-y-2">
          <h2 className="text-cyan-400 text-sm tracking-[0.5em] uppercase animate-pulse">System Online</h2>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-pink-500 glitch px-4" data-text="XO DOTS">
              XO DOTS
          </h1>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-widest">& BOXES</h2>
          <p className="text-pink-500 text-lg tracking-widest mt-4">ARCADE EDITION</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm px-4 z-20">
          <button 
              onClick={() => { playSound('select'); setScreen('setup'); }}
              className="group relative px-8 py-4 bg-transparent border-2 border-cyan-400 text-cyan-400 font-bold text-xl uppercase tracking-wider overflow-hidden transition-all hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] w-full"
          >
              <span className="relative z-10 flex items-center justify-center gap-3">
                  <Gamepad2 /> PLAY LOCAL
              </span>
          </button>

          <div className="flex gap-4 w-full">
            <button 
                onClick={() => { playSound('select'); setScreen('create-room'); }}
                className="flex-1 py-3 border border-pink-500 text-pink-500 font-bold text-sm uppercase tracking-wider hover:bg-pink-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] flex flex-col items-center justify-center gap-2"
            >
                <Wifi size={20} />
                Create Room
            </button>
            <button 
                onClick={() => { playSound('select'); setScreen('join-room'); }}
                className="flex-1 py-3 border border-purple-500 text-purple-500 font-bold text-sm uppercase tracking-wider hover:bg-purple-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] flex flex-col items-center justify-center gap-2"
            >
                <Users size={20} />
                Join Room
            </button>
          </div>
          
          <button 
              onClick={() => { playSound('select'); setShowTutorial(true); }}
              className="px-8 py-3 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-widest border-b border-transparent hover:border-white"
          >
              How To Play
          </button>
      </div>
    </div>
    
    <div className="absolute bottom-4 text-xs text-gray-600 font-mono">
       VER 2.5.0 // POWERED BY GEMINI AI
    </div>

    {showTutorial && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-cyan-500/50 p-8 max-w-lg w-full relative shadow-[0_0_50px_rgba(6,182,212,0.2)]">
          <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-cyan-400 hover:text-white transition-colors">
              <Play className="rotate-180" size={24}/>
          </button>
          <h2 className="text-2xl font-bold mb-6 text-cyan-400 uppercase tracking-wider">Mission Briefing</h2>
          <ul className="space-y-4 text-gray-300 font-mono text-sm">
             <li className="flex gap-3"><span className="text-pink-500">></span> Drag between dots to build lines.</li>
             <li className="flex gap-3"><span className="text-pink-500">></span> Complete squares to capture sectors.</li>
             <li className="flex gap-3"><span className="text-pink-500">></span> Captured sectors grant a bonus turn.</li>
             <li className="flex gap-3"><span className="text-pink-500">></span> Time Limit: {TURN_DURATION} SECONDS.</li>
          </ul>
          <div className="mt-8 text-center">
            <button 
              onClick={() => setShowTutorial(false)}
              className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-wider"
            >
              Accept Mission
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

interface CreateRoomScreenProps {
    goHome: () => void;
    setScreen: (s: ScreenType) => void;
    playSound: (t: any) => void;
    theme: Theme;
    onCreateRoom: (code: string) => void;
    connectionError: string | null;
}
  
const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({ goHome, setScreen, playSound, theme, onCreateRoom, connectionError }) => {
     const [roomId] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
     const [copied, setCopied] = useState(false);
     const [shared, setShared] = useState(false);
     
     // Initialize Host immediately on mount
     useEffect(() => {
        onCreateRoom(roomId);
     }, []); // Empty dependency array to run only once on mount

     const handleCopy = async () => {
         const success = await copyToClipboard(roomId);
         if (success) {
             setCopied(true);
             playSound('select');
             setTimeout(() => setCopied(false), 2000);
         } else {
             // Fallback prompt if silent copy fails
             prompt("Copy this code:", roomId);
         }
     };

     const handleShare = async () => {
        const url = \`\${window.location.origin}\${window.location.pathname}?room=\${roomId}\`;
        
        // Use Web Share API if available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'XO Dots Multiplayer',
                    text: \`Join my room with code: \${roomId}\`,
                    url: url,
                });
                return;
            } catch (err) {
                // Ignore abort or fail, fallback to clipboard
            }
        }

        const success = await copyToClipboard(url);
        if (success) {
            setShared(true);
            playSound('select');
            setTimeout(() => setShared(false), 2000);
        } else {
             prompt("Copy this invite link:", url);
        }
     };
  
     return (
       <div className={\`min-h-screen flex flex-col items-center justify-center p-4 \${theme.bgGradient} \${theme.textColor} font-cyber\`}>
          <div className={\`\${theme.boardBg} p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md w-full animate-fade-in\`}>
              <h2 className="text-2xl mb-2 font-bold uppercase tracking-widest text-pink-500">Mission Control</h2>
              <p className="text-sm opacity-70 mb-8">Secure line established</p>
  
              <div className="bg-black/50 p-6 rounded-xl border-2 border-dashed border-current mb-4 w-full relative group">
                  <div className="text-xs uppercase opacity-50 mb-2 tracking-widest">Access Code</div>
                  <div className="text-6xl font-black tracking-[0.2em] glitch" data-text={roomId}>{roomId}</div>
                  <button onClick={handleCopy} className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-full transition-colors opacity-50 group-hover:opacity-100" title="Copy Code">
                      <Copy size={16} />
                  </button>
              </div>
              {copied && <div className="text-xs text-green-400 mb-4 animate-bounce">Code Copied!</div>}
              {shared && <div className="text-xs text-green-400 mb-4 animate-bounce">Link Copied!</div>}
  
              {connectionError ? (
                  <div className="flex items-center gap-3 mb-8 text-sm text-red-500 bg-red-500/10 p-3 rounded">
                      <AlertTriangle size={16}/>
                      <span>{connectionError}</span>
                  </div>
              ) : (
                  <div className="flex items-center gap-3 mb-8 text-sm animate-pulse text-cyan-400">
                      <Loader2 className="animate-spin" size={16}/>
                      <span>Waiting for remote player...</span>
                  </div>
              )}

              <button onClick={handleShare} className="flex items-center gap-2 mb-8 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors text-xs uppercase font-bold tracking-widest">
                  <LinkIcon size={14} /> Share Invite Link
              </button>
              
              <div className="flex gap-4 w-full">
                  <button onClick={goHome} className="flex-1 text-xs uppercase hover:text-white transition-colors opacity-60 hover:opacity-100">
                      Abort
                  </button>
              </div>
          </div>
       </div>
     )
}

interface JoinRoomScreenProps {
    goHome: () => void;
    setScreen: (s: ScreenType) => void;
    playSound: (t: any) => void;
    theme: Theme;
    initialCode?: string;
    onJoinRoom: (code: string) => void;
}

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({ goHome, setScreen, playSound, theme, initialCode, onJoinRoom }) => {
    const [code, setCode] = useState(initialCode ? initialCode.split('') : ['', '', '', '']);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'error'>('idle');

    useEffect(() => {
        if (initialCode && initialCode.length === 4) {
            handleJoin(initialCode);
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        playSound('type');
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next
        if (value && index < 3) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleJoin = (codeToJoin?: string) => {
        const joinCode = codeToJoin || code.join('');
        if (joinCode.length === 4) {
            setStatus('connecting');
            onJoinRoom(joinCode);
        } else {
            playSound('error');
        }
    };

    return (
        <div className={\`min-h-screen flex flex-col items-center justify-center p-4 \${theme.bgGradient} \${theme.textColor} font-cyber\`}>
           <div className={\`\${theme.boardBg} p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center max-w-md w-full animate-fade-in\`}>
               <h2 className="text-2xl mb-2 font-bold uppercase tracking-widest text-purple-500">Join Operation</h2>
               <p className="text-sm opacity-70 mb-8">Enter 4-digit security code</p>
   
               <div className="flex gap-4 mb-8">
                   {code.map((digit, i) => (
                       <input
                         key={i}
                         ref={el => inputsRef.current[i] = el}
                         type="text"
                         maxLength={1}
                         value={digit}
                         onChange={(e) => handleChange(i, e.target.value)}
                         onKeyDown={(e) => handleKeyDown(i, e)}
                         disabled={status === 'connecting'}
                         className="w-14 h-16 text-center text-3xl font-bold bg-black/40 border-2 border-current/30 rounded-lg focus:outline-none focus:border-current focus:shadow-[0_0_15px_currentColor] transition-all disabled:opacity-50"
                       />
                   ))}
               </div>
                
               {status === 'connecting' && <div className="mb-4 text-cyan-400 flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Connecting to secure line...</div>}

               <div className="flex gap-4 w-full">
                   <Button 
                     themeStyle={theme.buttonStyle} 
                     className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-600 border-none text-white hover:brightness-110 disabled:opacity-50 disabled:grayscale" 
                     onClick={() => handleJoin()}
                     disabled={!code.every(d => d !== '') || status === 'connecting'}
                   >
                      Connect
                   </Button>
                   <button onClick={goHome} className="flex-1 text-xs uppercase hover:text-white transition-colors opacity-60 hover:opacity-100">
                       Cancel
                   </button>
               </div>
           </div>
        </div>
      )
}

interface SetupScreenProps {
  players: { 1: Player; 2: Player };
  setPlayers: React.Dispatch<React.SetStateAction<{ 1: Player; 2: Player }>>;
  theme: Theme;
  setTheme: (t: Theme) => void;
  setScreen: (s: ScreenType) => void;
  playSound: (type: any) => void;
  isMultiplayer: boolean;
  myPlayerId: PlayerId | null;
  onMultiplayerReady?: () => void;
  goHome: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ players, setPlayers, theme, setTheme, setScreen, playSound, isMultiplayer, myPlayerId, onMultiplayerReady, goHome }) => {
  const toggleSymbol = (pid: 1 | 2, sym: 'X' | 'O') => {
      // In multiplayer, you can only change your own symbol usually, but let's allow host to set it up for now
      // Or if I am Player 2, I might be restricted.
      if (isMultiplayer && myPlayerId !== 1) return; // Only host sets up symbols/theme for simplicity

      setPlayers(prev => ({
          ...prev,
          1: { ...prev[1], symbol: pid === 1 ? sym : (sym === 'X' ? 'O' : 'X') },
          2: { ...prev[2], symbol: pid === 2 ? sym : (sym === 'X' ? 'O' : 'X') }
      }));
  };
  
  const handleStart = () => {
    playSound('select');
    if (isMultiplayer) {
       onMultiplayerReady?.();
    } else {
       setScreen('game'); 
    }
  };

  return (
  <div className={\`min-h-screen flex flex-col items-center justify-center p-4 \${theme.bgGradient} \${theme.textColor} transition-all duration-500\`}>
    <div className={\`\${theme.boardBg} p-8 rounded-2xl shadow-2xl w-full max-w-2xl\`}>
      <h2 className={\`text-3xl mb-6 text-center \${theme.font} uppercase tracking-widest\`}>
        {isMultiplayer ? (myPlayerId === 1 ? "Host Configuration" : "Waiting for Host...") : "Initialize Setup"}
      </h2>
      
      {/* Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((id) => {
            const pid = id as PlayerId;
            const isMe = isMultiplayer && myPlayerId === pid;
            const isControl = !isMultiplayer || (isMultiplayer && myPlayerId === pid);
            const canChangeSettings = !isMultiplayer || (isMultiplayer && myPlayerId === 1);

            return (
                <div key={pid} className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold opacity-70 uppercase tracking-wider flex justify-between">
                          Player {pid} ID
                          {isMe && <span className="text-green-400">YOU</span>}
                      </label>
                      <input 
                        className={\`w-full bg-black/40 border border-current/30 rounded p-3 focus:outline-none focus:border-current focus:shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all \${!isControl ? 'opacity-50 cursor-not-allowed' : ''}\`}
                        value={players[pid].name}
                        disabled={!isControl}
                        onChange={(e) => setPlayers(p => ({ ...p, [pid]: { ...p[pid], name: e.target.value } }))}
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold opacity-70 uppercase tracking-wider">Symbol</label>
                      <div className="flex gap-2">
                          <button 
                              onClick={() => canChangeSettings && toggleSymbol(pid, 'X')}
                              disabled={!canChangeSettings}
                              className={\`flex-1 p-2 rounded border transition-colors \${players[pid].symbol === 'X' ? \`\${pid === 1 ? theme.p1Bg : theme.p2Bg} text-black border-transparent font-bold\` : 'border-current/30 hover:bg-white/10'} \${!canChangeSettings ? 'opacity-50' : ''}\`}
                          >X</button>
                          <button 
                               onClick={() => canChangeSettings && toggleSymbol(pid, 'O')}
                               disabled={!canChangeSettings}
                              className={\`flex-1 p-2 rounded border transition-colors \${players[pid].symbol === 'O' ? \`\${pid === 1 ? theme.p1Bg : theme.p2Bg} text-black border-transparent font-bold\` : 'border-current/30 hover:bg-white/10'} \${!canChangeSettings ? 'opacity-50' : ''}\`}
                          >O</button>
                      </div>
                  </div>
                </div>
            )
        })}
      </div>

      {/* Theme Select - Only Host/Local */}
      <div className="mb-8">
        <label className="text-xs font-bold opacity-70 block mb-3 uppercase tracking-wider">Select Battleground</label>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { if(!isMultiplayer || myPlayerId === 1) { playSound('select'); setTheme(t); } }}
              disabled={isMultiplayer && myPlayerId !== 1}
              className={\`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300 overflow-hidden \${
                theme.id === t.id ? \`\${t.dotColor} text-black border-transparent scale-105 shadow-[0_0_25px_rgba(255,255,255,0.3)]\` : \`border-current/30 hover:bg-white/10\`
              } \${isMultiplayer && myPlayerId !== 1 ? 'opacity-50 cursor-not-allowed' : ''}\`}
            >
              {theme.id === t.id && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
              
              <div className="relative z-10">
                 {t.icon}
              </div>
              <span className="relative z-10 text-[10px] md:text-xs font-bold uppercase">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
         {(!isMultiplayer) && <button onClick={goHome} className="opacity-70 hover:opacity-100 flex items-center gap-2 font-bold uppercase text-sm"><Home size={16}/> Back</button>}
         
         {(!isMultiplayer || myPlayerId === 1) ? (
             <Button themeStyle={theme.buttonStyle} onClick={handleStart} className="ml-auto">Start Game</Button>
         ) : (
             <div className="ml-auto flex items-center gap-2 text-sm animate-pulse"><Loader2 className="animate-spin" size={14}/> Waiting for host to start...</div>
         )}
      </div>
    </div>
  </div>
  );
};

export default function App() {
  // --- App State ---
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [players, setPlayers] = useState<{ 1: Player; 2: Player }>({
    1: { id: 1, name: 'Player 1', symbol: 'X', color: 'blue', score: 0 },
    2: { id: 2, name: 'Player 2', symbol: 'O', color: 'red', score: 0 },
  });
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [joinCode, setJoinCode] = useState<string | undefined>(undefined);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // --- Multiplayer State ---
  const [peer, setPeer] = useState<any>(null);
  const [conn, setConn] = useState<any>(null);
  const [myPlayerId, setMyPlayerId] = useState<PlayerId | null>(null);

  // --- Helper to clean URL ---
  const goHome = useCallback(() => {
    playSound('select');
    setScreen('welcome');
    if (window.history.replaceState) {
       window.history.replaceState({}, '', window.location.pathname);
    }
    setJoinCode(undefined);
    setConnectionError(null);
    if (peer) {
        peer.destroy();
        setPeer(null);
        setConn(null);
    }
  }, [peer]);

  // --- Init Check for Share Link ---
  useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const room = params.get('room');
     if (room) {
         setJoinCode(room);
         setScreen('join-room');
     }
  }, []);

  // --- Multiplayer Logic ---

  const handleCreateRoom = useCallback((code: string) => {
    // Destroy old peer if exists
    if (peer) peer.destroy();
    setConnectionError(null);

    const newPeer = new Peer(\`xodots-game-\${code}\`);
    setPeer(newPeer);
    setMyPlayerId(1);
    
    newPeer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
    });

    newPeer.on('connection', (c) => {
        console.log('Remote Connected');
        setConn(c);
        setupConnection(c);
        // Once connected, go to setup screen
        setScreen('setup');
    });

    newPeer.on('error', (err) => {
        console.error(err);
        setConnectionError("Room code taken or network error. Try 'Abort' and create again.");
    });
  }, [peer]);

  const handleJoinRoom = useCallback((code: string) => {
    if (peer) peer.destroy();
    
    const newPeer = new Peer(); // Random ID for joiner
    setPeer(newPeer);
    setMyPlayerId(2);

    newPeer.on('open', () => {
        const c = newPeer.connect(\`xodots-game-\${code}\`);
        setConn(c);
        setupConnection(c);
        
        c.on('open', () => {
             console.log("Connected to host");
             setScreen('setup');
        });
        
        c.on('error', (err) => {
             alert("Could not connect to room. Check code.");
        });

        // Timeout handling?
        setTimeout(() => {
            if (!c.open) {
                // playSound('error'); 
            }
        }, 8000);
    });
    
    newPeer.on('error', (err) => {
         console.error('Peer error', err);
         alert("Connection failed. Please retry.");
    });
  }, [peer]);

  const setupConnection = (c: any) => {
      c.on('data', (data: any) => {
          handleIncomingData(data);
      });
      c.on('close', () => {
          alert("Opponent disconnected");
          setScreen('welcome');
          setConn(null);
          setPeer(null);
      });
  };

  const sendData = (data: any) => {
      if (conn && conn.open) {
          conn.send(data);
      }
  };

  const handleIncomingData = (data: any) => {
      switch (data.type) {
          case 'SYNC_PLAYERS':
              // Merge remote player name into local state
              setPlayers(prev => ({
                  ...prev,
                  [data.id]: { ...prev[data.id as PlayerId], name: data.name }
              }));
              break;
          case 'SYNC_THEME':
               const t = THEMES.find(x => x.id === data.themeId);
               if (t) setTheme(t);
               break;
          case 'SYNC_SYMBOLS':
               setPlayers(data.players);
               break;
          case 'START_GAME':
               setScreen('game');
               setGameState(createInitialState()); // Ensure fresh start
               break;
          case 'MOVE':
               // Apply move locally without triggering another send
               applyMove(data.r, data.c, data.orientation, false);
               break;
          case 'CHAT':
               addMessage(data.sender, data.text);
               break;
          case 'RESTART':
               setGameState(createInitialState());
               break;
      }
  };

  // Sync player name changes
  useEffect(() => {
      if (conn && myPlayerId) {
          sendData({ type: 'SYNC_PLAYERS', id: myPlayerId, name: players[myPlayerId].name });
      }
  }, [players[1].name, players[2].name]);

  // Sync theme (Host only)
  useEffect(() => {
      if (conn && myPlayerId === 1) {
          sendData({ type: 'SYNC_THEME', themeId: theme.id });
      }
  }, [theme]);

  // Sync symbols (Host only)
  useEffect(() => {
      if (conn && myPlayerId === 1) {
         sendData({ type: 'SYNC_SYMBOLS', players });
      }
  }, [players[1].symbol, players[2].symbol]);


  // --- Game Loop / Timer ---
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (screen === 'game' && !gameState.isPaused && !gameState.isGameOver) {
      timer = setInterval(() => {
        setGameState((prev) => {
          if (prev.timeLeft <= 1) {
            // Time ran out: switch turn
            return {
              ...prev,
              timeLeft: TURN_DURATION,
              currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [screen, gameState.isPaused, gameState.isGameOver, gameState.currentPlayer]);

  // --- Logic ---
  const playSound = (type: 'click' | 'win' | 'select' | 'error' | 'type') => {
    if (!isSoundOn) return;
    playArcadeSound(type);
  };

  const applyMove = (r: number, c: number, orientation: 'h' | 'v', emit: boolean = true) => {
    if (gameState.isPaused || gameState.isGameOver) return;

    let madeBox = false;
    // Deep copy state
    const newH = gameState.horizontalLines.map(row => [...row]);
    const newV = gameState.verticalLines.map(row => [...row]);
    const newBoxes = gameState.boxes.map(row => [...row]);

    // Validation & Update
    if (orientation === 'h') {
      if (newH[r][c] !== null) return; // Already taken
      newH[r][c] = gameState.currentPlayer;
    } else {
      if (newV[r][c] !== null) return; // Already taken
      newV[r][c] = gameState.currentPlayer;
    }

    // Check for boxes
    let boxesClaimed = 0;
    for (let i = 0; i < GRID_ROWS - 1; i++) {
      for (let j = 0; j < GRID_COLS - 1; j++) {
        if (newBoxes[i][j] !== null) continue; // Already owned

        const top = newH[i][j] !== null;
        const bottom = newH[i + 1][j] !== null;
        const left = newV[i][j] !== null;
        const right = newV[i][j + 1] !== null;

        if (top && bottom && left && right) {
          newBoxes[i][j] = gameState.currentPlayer;
          madeBox = true;
          boxesClaimed++;
        }
      }
    }

    // Update Scores
    if (madeBox) {
      playSound('win');
      setPlayers(prev => ({
        ...prev,
        [gameState.currentPlayer]: {
          ...prev[gameState.currentPlayer],
          score: prev[gameState.currentPlayer].score + boxesClaimed
        }
      }));
    } else {
      playSound('click');
    }

    // Check Win Condition
    const totalBoxes = (GRID_ROWS - 1) * (GRID_COLS - 1);
    const claimedBoxes = newBoxes.flat().filter(id => id !== null).length;
    let isGameOver = claimedBoxes === totalBoxes;
    let winner = gameState.winner;

    if (isGameOver) {
      playSound('win');
      const p1Score = players[1].score + (gameState.currentPlayer === 1 ? boxesClaimed : 0);
      const p2Score = players[2].score + (gameState.currentPlayer === 2 ? boxesClaimed : 0);
      
      if (p1Score > p2Score) winner = 1;
      else if (p2Score > p1Score) winner = 2;
      else winner = 'draw';
    }

    setGameState(prev => ({
      ...prev,
      horizontalLines: newH,
      verticalLines: newV,
      boxes: newBoxes,
      // If made a box, keep turn, reset timer. Else switch turn.
      currentPlayer: madeBox ? prev.currentPlayer : (prev.currentPlayer === 1 ? 2 : 1),
      timeLeft: TURN_DURATION,
      isGameOver,
      winner
    }));

    if (emit && conn) {
        sendData({ type: 'MOVE', r, c, orientation });
    }
  };

  const handleLineConnect = (r: number, c: number, orientation: 'h' | 'v') => {
      // If multiplayer, check if it's my turn
      if (conn && myPlayerId !== gameState.currentPlayer) return;
      applyMove(r, c, orientation, true);
  };

  const addMessage = (sender: string, text: string, isSystem = false) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp, isSystem }]);
  };

  const handleSendMessage = (text: string) => {
    addMessage(players[gameState.currentPlayer].name, text); // Locally add
    if (conn) {
        sendData({ type: 'CHAT', sender: players[gameState.currentPlayer].name, text });
    }
  };

  const handleAiTrashTalk = async () => {
    const talk = await getTrashTalk(theme.name);
    addMessage(players[gameState.currentPlayer].name, talk);
    if (conn) {
        sendData({ type: 'CHAT', sender: players[gameState.currentPlayer].name, text: talk });
    }
  }

  const handleNameChange = (id: PlayerId, name: string) => {
    // In multiplayer, only allow changing own name
    if (conn && id !== myPlayerId) return;
    setPlayers(prev => ({ ...prev, [id]: { ...prev[id], name } }));
  };

  const resetGame = () => {
    const doReset = () => {
        setGameState(createInitialState());
        setPlayers(prev => ({
            1: { ...prev[1], score: 0 },
            2: { ...prev[2], score: 0 }
        }));
        setMessages([]);
    };
    doReset();
    if (conn) sendData({ type: 'RESTART' });
  };

  const handleHostStartGame = () => {
      setScreen('game');
      setGameState(createInitialState());
      if (conn) sendData({ type: 'START_GAME' });
  };

  const GameScreen = () => {
    const isMyTurn = !conn || gameState.currentPlayer === myPlayerId;

    return (
      <div className={\`min-h-screen flex flex-col \${theme.bgGradient} \${theme.textColor} overflow-hidden font-cyber transition-all duration-500\`}>
        <header className={\`px-4 py-3 flex items-center justify-between \${theme.boardBg} border-b border-current/20 z-20\`}>
          <div className="flex items-center gap-4">
             <button onClick={goHome} className="hover:opacity-70 transition-opacity"><Home size={20}/></button>
             <button onClick={() => { playSound('select'); setIsSoundOn(!isSoundOn); }} className="hover:opacity-70 transition-opacity">
               {isSoundOn ? <Volume2 size={20}/> : <VolumeX size={20}/>}
             </button>
             {conn && <div className="text-xs text-green-400 animate-pulse flex items-center gap-2"><Wifi size={14}/> ONLINE</div>}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => { playSound('select'); setGameState(p => ({ ...p, isPaused: !p.isPaused })); }} className="hover:opacity-70 transition-opacity">
              {gameState.isPaused ? <Play size={20}/> : <Pause size={20}/>}
            </button>
            <button onClick={() => { playSound('select'); setIsChatOpen(!isChatOpen); }} className={\`relative hover:opacity-70 transition-opacity \${isChatOpen ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : ''}\`}>
               <MessageSquare size={20}/>
               {!isChatOpen && messages.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
            </button>
          </div>
        </header>
        
        <div className="sticky top-0 z-10 px-4 pt-2 pb-2 backdrop-blur-sm bg-black/20">
           <div className="w-full max-w-lg mx-auto flex gap-4">
             <PlayerCard 
               player={players[1]} 
               isActive={gameState.currentPlayer === 1} 
               theme={theme}
               gameState={gameState}
               onNameChange={handleNameChange}
               isMultiplayer={!!conn}
               myPlayerId={myPlayerId}
             />
             <PlayerCard 
               player={players[2]} 
               isActive={gameState.currentPlayer === 2} 
               theme={theme}
               gameState={gameState}
               onNameChange={handleNameChange}
               isMultiplayer={!!conn}
               myPlayerId={myPlayerId}
             />
           </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-start p-2 gap-6 relative overflow-y-auto touch-none">
          <div className="relative z-0 mt-2 pb-20">
             {gameState.isPaused && (
               <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl border border-white/10">
                 <h2 className={\`text-4xl \${theme.font} animate-pulse tracking-widest text-white\`}>PAUSED</h2>
               </div>
             )}
             
             {/* Not My Turn Overlay */}
             {!isMyTurn && !gameState.isGameOver && !gameState.isPaused && (
                 <div className="absolute top-0 left-0 w-full h-full z-30 flex items-center justify-center pointer-events-none">
                     <div className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur text-xs font-bold uppercase tracking-widest border border-white/20">
                         Waiting for Opponent
                     </div>
                 </div>
             )}

             <GameBoard 
               gameState={gameState} 
               players={players} 
               theme={theme} 
               onLineClick={handleLineConnect} 
             />
          </div>
        </main>

        {gameState.isGameOver && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
             <h2 className={\`text-6xl mb-4 \${theme.font} \${gameState.winner === 'draw' ? 'text-yellow-400' : 'text-green-400'} glitch\`} data-text={gameState.winner === 'draw' ? 'DRAW' : 'WINNER'}>
               {gameState.winner === 'draw' ? 'DRAW' : 'WINNER'}
             </h2>
             <p className="text-xl mb-8 uppercase tracking-widest text-gray-300">
               {gameState.winner === 'draw' 
                 ? "System Status: Tie" 
                 : \`Champion: \${players[gameState.winner as PlayerId].name}\`}
             </p>
             <div className="flex gap-4">
               <Button themeStyle={theme.buttonStyle} onClick={() => { playSound('select'); resetGame(); }}><RotateCcw className="inline mr-2"/> Rematch</Button>
               <Button themeStyle={theme.buttonStyle} onClick={goHome}><Home className="inline mr-2"/> Exit</Button>
             </div>
          </div>
        )}

        <Chat 
          theme={theme} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          messages={messages} 
          onSendMessage={handleSendMessage}
          onAiTrashTalk={handleAiTrashTalk}
        />
      </div>
    );
  };

  return (
    <>
     {screen === 'welcome' && <WelcomeScreen setScreen={setScreen} playSound={playSound} showTutorial={showTutorial} setShowTutorial={setShowTutorial} goHome={goHome} />}
     {screen === 'create-room' && <CreateRoomScreen setScreen={setScreen} playSound={playSound} theme={theme} onCreateRoom={handleCreateRoom} connectionError={connectionError} goHome={goHome} />}
     {screen === 'join-room' && <JoinRoomScreen setScreen={setScreen} playSound={playSound} theme={theme} initialCode={joinCode} onJoinRoom={handleJoinRoom} goHome={goHome} />}
     {screen === 'setup' && <SetupScreen players={players} setPlayers={setPlayers} theme={theme} setTheme={setTheme} setScreen={setScreen} playSound={playSound} isMultiplayer={!!conn} myPlayerId={myPlayerId} onMultiplayerReady={handleHostStartGame} goHome={goHome} />}
     {screen === 'game' && <GameScreen />}
    </>
  );
}`
};

export const downloadProject = async () => {
    const zip = new JSZip();
    
    // Add all files to the zip
    Object.entries(FILES).forEach(([path, content]) => {
        zip.file(path, content);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};