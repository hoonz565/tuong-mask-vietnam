import React from 'react';

export default function Header() {
  return (
    <header className="w-full z-10 border-b border-inverse/50 py-4 flex justify-center items-center relative">
      <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex items-center justify-between px-4">
        <div className="w-1 h-1 bg-secondary rounded-full" />
        <div className="w-1 h-1 bg-secondary rounded-full" />
      </div>
    </header>
  );
}
