import React from 'react';
import { Grid, List } from 'lucide-react';

export default function Header({ viewMode, setViewMode }) {
  return (
    <header className="w-full z-10 border-b border-inverse/50 py-4 flex justify-center items-center gap-8 relative">
      <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex items-center justify-between px-4">
        <div className="w-1 h-1 bg-secondary rounded-full" />
        <div className="w-1 h-1 bg-secondary rounded-full" />
      </div>
      <button 
        onClick={() => setViewMode('grid')}
        className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${viewMode === 'grid' ? 'text-secondary' : 'text-tertiary/50 hover:text-tertiary'}`}
      >
        <Grid size={14} /> GRID
      </button>
      <button 
        onClick={() => setViewMode('list')}
        className={`flex items-center gap-2 font-bold text-xs tracking-widest transition-colors ${viewMode === 'list' ? 'text-secondary' : 'text-tertiary/50 hover:text-tertiary'}`}
      >
        <List size={14} /> LIST
      </button>
    </header>
  );
}
