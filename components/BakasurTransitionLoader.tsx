'use client';

import React, { useEffect, useState } from 'react';
import { withBasePath } from '@/lib/basePath';

interface BakasurTransitionLoaderProps {
  isOpen: boolean;
  targetFrame?: number;
  customMessage?: string;
  onFinish?: () => void;
  durationMs?: number;
}

export const BakasurTransitionLoader: React.FC<BakasurTransitionLoaderProps> = ({
  isOpen,
  targetFrame = 2,
  customMessage,
  onFinish,
  durationMs = 2000
}) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        if (onFinish) onFinish();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isOpen, durationMs, onFinish]);

  if (!isOpen) return null;

  // Dynamic Hindi Subtitle based on target frame
  const getMessage = () => {
    if (customMessage) return customMessage;
    switch (targetFrame) {
      case 2:
        return 'Bhookasur Raste Mein Hai... Famous Spots Dhoond Raha Hai! 🚗💨';
      case 3:
        return 'Masaledar Dishes List Ho Rahi Hain... 🌶️';
      case 5:
      case 6:
        return 'Bhookasur Ka Feast Table Ready Ho Raha Hai! 🍽️';
      case 7:
        return 'Bhookasur Ka Pet Bhar Gaya... 💥';
      case 11:
        return 'India Ka Live Food Tour Map Open Ho Raha Hai... 🗺️';
      default:
        return 'Bhookasur Aa Raha Hai... 🚀';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020a26]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white select-none animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center max-w-sm mx-auto text-center gap-5">
        
        {/* Full Natural Standing/Walking Bhookasur GIF */}
        <div className="relative w-52 h-72 sm:w-60 sm:h-80 flex items-center justify-center pointer-events-none">
          <img
            src={withBasePath('/images/bhookasur_walk.gif')}
            alt="Bhookasur Walking Loop"
            className="w-full h-full object-contain filter drop-shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = withBasePath('/images/eating/bakasur_eating_head_clean.png');
            }}
          />
        </div>

        {/* Dynamic Subtitle Text */}
        <div className="flex flex-col items-center gap-1.5">
          <h3 className="font-black text-lg sm:text-xl text-amber-300 tracking-wide uppercase drop-shadow-md animate-pulse">
            {getMessage()}
          </h3>
          <p className="text-xs text-white/80 font-medium tracking-wider">
            Loading {progress}%
          </p>
        </div>

        {/* Clean White Progress Line at the Bottom */}
        <div className="w-64 h-1.5 bg-white/20 rounded-full overflow-hidden shadow-inner mt-1">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_10px_rgba(255,255,255,0.9)]"
          />
        </div>
      </div>
    </div>
  );
};