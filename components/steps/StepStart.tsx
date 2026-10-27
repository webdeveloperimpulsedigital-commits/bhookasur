'use client';

import React from 'react';

interface StepStartProps {
  onStartTour: () => void;
  isLoading?: boolean;
}

export const StepStart: React.FC<StepStartProps> = ({
  onStartTour,
  isLoading = false,
}) => {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-5 sm:gap-7 text-white max-w-sm mx-auto py-3">
      {/* Title & Paragraph */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight lowercase brand-font leading-tight">
          are you ready?
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-blue-100 font-medium max-w-xs sm:max-w-sm leading-relaxed">
          Bhookasur is starving for your city&apos;s best food! Treat him to your favorite street food, spicy delicacies &amp; legendary joints.
        </p>
      </div>

      {/* Start Button */}
      <div className="w-full max-w-xs">
        <button
          onClick={onStartTour}
          disabled={isLoading}
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-sm sm:text-base shadow-xl shadow-[#D23002]/30 hover:shadow-[#D23002]/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer brand-font tracking-wide border border-white/20"
        >
          <span>Start Food Tour</span>
        </button>
      </div>
    </div>
  );
};





