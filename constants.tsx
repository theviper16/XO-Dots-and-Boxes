import React from 'react';
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
];