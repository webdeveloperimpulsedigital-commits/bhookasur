'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { getPreloadedUrl } from '@/lib/mediaPreloader';
import { withBasePath } from '@/lib/basePath';

interface Frame7AcidityAppearsProps {
  onAutoAdvance?: () => void;
  onHelpBakasur?: () => void;
  onBack?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  initialStep?: 1 | 2;
  onStepChange?: (step: 1 | 2) => void;
}

const PHASE_1_DURATION = 5500;

export const Frame7AcidityAppears: React.FC<Frame7AcidityAppearsProps> = ({
  onAutoAdvance,
  onHelpBakasur,
  onBack,
  soundEnabled = true,
  onToggleSound,
  initialStep = 1,
  onStepChange
}) => {
  const [contentStep, setContentStep] = useState<1 | 2>(initialStep);
  const [isProgressActive, setIsProgressActive] = useState<boolean>(false);

  // Sync initialStep if passed from parent
  useEffect(() => {
    if (initialStep) {
      setContentStep(initialStep);
    }
  }, [initialStep]);

  // Smoothly transition from Step 1 to Step 2: stays for a full 5.5 seconds with running progress line
  useEffect(() => {
    if (contentStep !== 1) {
      setIsProgressActive(false);
      return;
    }

    // Trigger the running progress line animation immediately
    const animTimer = setTimeout(() => {
      setIsProgressActive(true);
    }, 60);

    const autoAdvanceTimer = setTimeout(() => {
      setContentStep(2);
      onStepChange?.(2);
    }, PHASE_1_DURATION);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(autoAdvanceTimer);
    };
  }, [contentStep, onStepChange]);

  const handleBackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contentStep === 2) {
      setContentStep(1);
      onStepChange?.(1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleHelpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onHelpBakasur) {
      onHelpBakasur();
    } else if (onAutoAdvance) {
      onAutoAdvance();
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#07153B] overflow-hidden relative">
      {/* Top Header Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {onBack ? (
          <button
            onClick={handleBackClick}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Back</span>
          </button>
        ) : <div />}
      </div>

      {/* Video Container: Left on Desktop (lg:w-1/2 lg:h-full), Top on Mobile/Tablet */}
      {/* This video continues playing seamlessly across both content phases without interrupting or reloading */}
      <div
        className="relative w-full lg:w-1/2 bg-[#182858] flex items-center justify-center overflow-hidden shrink-0 lg:h-full h-[60%] xs:h-[62%] sm:h-[60%]"
      >
        <video
          src={getPreloadedUrl('/images/final-frames/Acidity-and-Dakare.mp4')}
          poster={withBasePath('/images/final-frames/Acidity-and-Dakare_poster.jpg')}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute bottom-0 inset-x-0 h-12 lg:hidden bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-20" />
      </div>

      {/* Content Card: Right on Desktop (lg:w-1/2 lg:h-full), Bottom on Mobile/Tablet */}
      <div
        className="w-full lg:w-1/2 flex-1 lg:h-full bg-white px-4 py-4 xs:px-5 xs:py-5 sm:p-8 lg:p-12 flex flex-col justify-center items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] lg:shadow-none rounded-none z-10 shrink-0 relative overflow-hidden"
      >
        {/* Subtle soothing dynamic ambient glow behind content */}
        <div
          className={`absolute w-80 h-40 xs:w-96 xs:h-48 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out ${
            contentStep === 2
              ? 'bg-gradient-to-r from-red-600/15 via-orange-500/20 to-red-600/15 scale-110 opacity-100 animate-pulse'
              : 'bg-gradient-to-r from-amber-500/10 via-orange-500/12 to-red-500/10 scale-95 opacity-80'
          }`}
        />

        {/* ========================================================= */}
        {/* PHASE 1: "Plot twist: Pet ne emergency brake laga di..." */}
        {/* Stays for 5.5 to 6 seconds before transitioning */}
        {/* ========================================================= */}
        <div
          onClick={() => {
            setContentStep(2);
            onStepChange?.(2);
          }}
          className={`absolute inset-0 flex flex-col justify-between items-center p-5 xs:p-7 sm:p-10 cursor-pointer select-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            contentStep === 1
              ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-10 blur-[3px] pointer-events-none'
          }`}
        >
          {/* Top spacer to vertically balance the headline */}
          <div className="w-full shrink-0 h-2 sm:h-6" />

          {/* Central Headline */}
          <div className="space-y-3 xs:space-y-3.5 sm:space-y-4 max-w-md mx-auto flex flex-col items-center justify-center text-center px-2 my-auto">
            <p className="text-[15px] xs:text-[17px] sm:text-[20px] md:text-[22px] lg:text-[24px] font-black text-[#0B1B48] leading-snug tracking-tight text-center transition-transform duration-500">
              Plot twist: Pet ne emergency brake laga di.
            </p>
            <h2 className="text-[27px] xs:text-[32px] sm:text-[38px] md:text-[42px] lg:text-[46px] font-black tracking-tight leading-[1.12] text-center drop-shadow-xs">
              <span className="text-[#D4380D] inline-block hover:scale-105 transition-transform duration-300">Acidity</span>{' '}
              <span className="text-black">aur</span><br />
              <span className="text-[#D4380D] inline-block hover:scale-105 transition-transform duration-300">khatti dakaarein.</span>
            </h2>
          </div>

          {/* Bottom Running Progress Line */}
          <div className="w-full max-w-xs sm:max-w-sm flex items-center justify-center pt-2 pb-2 shrink-0">
            <div className="w-full h-1.5 xs:h-2 bg-slate-100 border border-slate-200/80 rounded-full overflow-hidden shadow-inner relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#D4380D] rounded-full shadow-[0_0_10px_rgba(212,56,13,0.5)]"
                style={{
                  width: isProgressActive ? '100%' : '0%',
                  transition: isProgressActive ? `width ${PHASE_1_DURATION}ms linear` : 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PHASE 2: "Ab Bhookasur ko khaana nahi..." + [HELP BHOOKASUR] */}
        {/* Smooth spring slide-up and glow entrance */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 flex flex-col justify-between items-center text-center p-4 xs:p-6 sm:p-8 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] delay-75 ${
            contentStep === 2
              ? 'opacity-100 scale-100 translate-y-0 blur-0 pointer-events-auto'
              : 'opacity-0 scale-95 translate-y-10 blur-[3px] pointer-events-none'
          }`}
        >
          {/* Headline centered with high contrast */}
          <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center text-center">
            <h1 className="text-[22px] xs:text-[25px] sm:text-[29px] md:text-[32px] lg:text-[36px] font-black text-[#0B1B48] tracking-tight leading-[1.22] text-center">
              Ab Bhookasur ko khaana nahi,<br />
              tumhari <span className="text-[#D4380D]">help</span> chahiye.
            </h1>
          </div>

          {/* Primary CTA: HELP BHOOKASUR with glowing bounce & shine */}
          <div className="shrink-0 w-full max-w-sm sm:max-w-md mx-auto pt-2 pb-1">
            <button
              onClick={handleHelpClick}
              type="button"
              className="relative w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-xl shadow-[#D4380D]/40 hover:shadow-2xl hover:shadow-[#D4380D]/60 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0 overflow-hidden group"
            >
              <span className="relative z-10">HELP BHOOKASUR</span>
              {/* Subtle light sweep animation on button */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
