'use client';

import React, { useState, useEffect } from 'react';
import { withBasePath } from '@/lib/basePath';

interface Frame9GastriumAnimationProps {
  onAnimationComplete: () => void;
}

export const Frame9GastriumAnimation: React.FC<Frame9GastriumAnimationProps> = ({ onAnimationComplete }) => {
  const [showTagline, setShowTagline] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [gastriumImgError, setGastriumImgError] = useState<boolean>(false);
  const [acidityImgError, setAcidityImgError] = useState<boolean>(false);

  // Preload both logo images immediately on mount with proper basePath
  useEffect(() => {
    setMounted(true);
    const img1 = new Image();
    img1.src = withBasePath('/images/final-frames/Gastrium-logo-new.png');
    const img2 = new Image();
    img2.src = withBasePath('/images/final-frames/Acidity-ko-bolo-gn.png');
  }, []);

  useEffect(() => {
    // 1. Listen for exact video time update (at ~4.0s when blue stomach appears)
    const handleStomachRevealed = () => {
      setShowTagline(true);
    };

    window.addEventListener('gastrium-stomach-revealed', handleStomachRevealed);

    // 2. Fallback timer if event doesn't fire (4.2s based on video keyframe 102 @ 24fps)
    const fallbackTimer = setTimeout(() => {
      setShowTagline(true);
    }, 4200);

    return () => {
      window.removeEventListener('gastrium-stomach-revealed', handleStomachRevealed);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // When tagline appears, ensure it stays for 7.5 to 8 seconds so user can read comfortably
  useEffect(() => {
    if (!showTagline) return;

    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 7500);

    return () => clearTimeout(timer);
  }, [showTagline, onAnimationComplete]);

  // Robust path fallbacks in case user places logos in /images/final-frames/ or alternate locations
  const handleGastriumError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const currentSrc = target.getAttribute('src') || '';
    if (currentSrc.includes('Gastrium-logo-new')) {
      target.src = withBasePath('/images/final-frames/Gastrium-Logo.png');
    } else {
      setGastriumImgError(true);
    }
  };

  const handleAcidityError = () => {
    setAcidityImgError(true);
  };

  return (
    <div
      onClick={onAnimationComplete}
      className="relative w-full h-full min-h-[170px] xs:min-h-[200px] flex items-center justify-center text-center px-4 sm:px-8 md:px-10 bg-white cursor-pointer select-none overflow-hidden"
    >
      {/* Soothing ambient glow transition behind logos */}
      <div
        className={`absolute w-72 h-36 xs:w-88 xs:h-44 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out ${
          showTagline
            ? 'bg-blue-500/10 scale-110 opacity-100'
            : 'bg-orange-500/8 scale-95 opacity-80'
        }`}
      />

      {/* 1. GASTRIUM LOGO (TOP & BIG) + "IN" (BOTTOM RIGHT CORNER & BIG) */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-4 py-2 sm:py-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          !showTagline && mounted
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 -translate-y-4 pointer-events-none'
        }`}
      >
        {!gastriumImgError ? (
          <div className="flex items-center justify-center gap-3 xs:gap-4 sm:gap-6 md:gap-7 select-none w-full max-w-[86%] xs:max-w-[80%] sm:max-w-[420px] md:max-w-[480px] mx-auto">
            {/* Gastrium Logo */}
            <img
              src={withBasePath('/images/final-frames/Gastrium-logo-new.png')}
              alt="Gastrium Suspension"
              onError={handleGastriumError}
              className="h-14 xs:h-16 sm:h-20 md:h-24 lg:h-26 w-auto max-w-[70%] object-contain select-none pointer-events-none drop-shadow-xs transition-transform duration-500 shrink-0"
            />
            {/* Word "IN" matched in height and visual weight with the logo */}
            <span className="text-[#E2370A] font-black italic text-4xl xs:text-5xl sm:text-6xl md:text-7xl uppercase tracking-wider leading-none select-none drop-shadow-xs shrink-0 flex items-center">
              IN
            </span>
          </div>
        ) : (
          <h1 className="text-[34px] xs:text-[42px] sm:text-[50px] md:text-[58px] font-black tracking-tight leading-none uppercase select-none">
            <span className="text-[#071746]">GASTRIUM</span>{' '}
            <span className="text-[#E2370A]">IN</span>
          </h1>
        )}
      </div>

      {/* 2. ACIDITY KO BOLO GOODNIGHT LOGO (Phase 2) */}
      <div
        className={`absolute inset-0 flex items-center justify-center px-4 py-2 sm:py-4 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${
          showTagline
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-5 pointer-events-none'
        }`}
      >
        {!acidityImgError ? (
          <img
            src={withBasePath('/images/final-frames/Acidity-ko-bolo-gn.png')}
            alt="Acidity ko bolo goodnight"
            onError={handleAcidityError}
            className="w-[82%] xs:w-[86%] sm:w-[90%] max-w-[290px] xs:max-w-[340px] sm:max-w-[400px] md:max-w-[450px] h-auto object-contain select-none pointer-events-none drop-shadow-sm transition-transform duration-500"
          />
        ) : (
          <h1 className="text-[28px] xs:text-[34px] sm:text-[40px] md:text-[44px] lg:text-[48px] font-black italic tracking-tight text-[#071746] leading-[1.12] select-none text-center">
            Acidity ko bolo<br />
            <span className="text-[#0047BA]">goodnight</span>
          </h1>
        )}
      </div>
    </div>
  );
};
