'use client';

import React from 'react';

export const FrameFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <footer className={`shrink-0 pt-1.5 pb-0.5 text-center select-none ${className}`}>
      <div className="inline-flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-semibold">
        <span>Powered by</span>
        <span className="font-extrabold tracking-wide text-[#0B1B48]">Gastrium</span>
        <span className="text-[#D4380D] text-xs">⚡</span>
      </div>
    </footer>
  );
};
