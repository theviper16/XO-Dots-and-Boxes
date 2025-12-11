import React, { useState, useEffect, useRef } from 'react';
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
    <div className={`absolute bottom-20 right-4 w-80 h-96 ${theme.boardBg} flex flex-col rounded-lg shadow-2xl border-2 border-current z-50 ${theme.textColor}`}>
      <div className={`p-3 border-b border-current flex justify-between items-center ${theme.bgGradient} bg-opacity-20`}>
        <h3 className={`font-bold ${theme.font} text-sm`}>Chat & AI Trash Talk</h3>
        <button onClick={onClose} className="hover:opacity-70"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-black/20">
        {messages.length === 0 && (
          <p className="text-xs opacity-60 text-center italic">Start chatting or ask AI for a line!</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'System' ? 'items-center' : (msg.sender === 'Player 1' ? 'items-start' : 'items-end')}`}>
            <span className="text-[10px] opacity-70 mb-1 flex gap-2 items-center">
              <span className="font-bold">{msg.sender}</span>
              <span className="opacity-50 text-[9px]">{msg.timestamp}</span>
            </span>
            <div className={`px-3 py-2 rounded max-w-[85%] text-sm ${msg.isSystem ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/50' : 'bg-white/10 backdrop-blur-sm'}`}>
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
          <button type="submit" className={`p-2 rounded ${theme.buttonStyle}`}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};