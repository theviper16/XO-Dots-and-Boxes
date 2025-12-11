import React from 'react';

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
}