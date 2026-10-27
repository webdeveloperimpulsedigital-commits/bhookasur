'use client';

import React from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, ShieldCheck, Settings } from 'lucide-react';

interface NavbarProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  currentStepTitle?: string;
  selectedCity?: string;
  stepIndex?: number;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header className="w-full z-40 px-2 py-1 flex items-center justify-end pointer-events-auto">
      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all shadow-sm cursor-pointer backdrop-blur-md"
          title="Admin CMS"
        >
          <Settings className="w-4 h-4 text-white/80 hover:text-white" />
        </Link>
      </div>
    </header>
  );
};
