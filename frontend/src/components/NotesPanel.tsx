'use client';

import { Eraser } from 'lucide-react';

interface NotesPanelProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export default function NotesPanel({ value, onChange, onClear }: NotesPanelProps) {
  const MAX_CHAR = 2000;

  return (
    <div className="studio-card p-10 group bg-black/60 relative">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Your Studio Response</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <button 
          onClick={onClear}
          className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-rose-500 transition-colors flex items-center gap-2"
        >
          <Eraser className="w-4 h-4" /> Clear
        </button>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHAR))}
          className="w-full h-56 bg-black/20 border border-white/5 rounded-2xl p-8 text-slate-300 placeholder:text-slate-800 outline-none focus:border-[#d4af37]/20 transition-all resize-none text-base leading-relaxed font-medium"
          placeholder="Answer here or use live voice mode. The interviewer watches for structure, examples, metrics, trade-offs, and a clean close..."
        />
        <div className="absolute bottom-6 right-8 text-[10px] font-mono font-bold text-slate-800 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full">
          {value.length} / {MAX_CHAR} characters
        </div>
      </div>
    </div>
  );
}
