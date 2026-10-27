'use client';

import React from 'react';

interface Frame8HelpBakasurProps {
  onHelpBakasur: () => void;
}

export const Frame8HelpBakasur: React.FC<Frame8HelpBakasurProps> = ({ onHelpBakasur }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between items-center text-center animate-in fade-in duration-300 py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8 gap-3 bg-white overflow-y-auto scrollbar-none">
      {/* Headline centered in two lines */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center justify-center text-center">
        <h1 className="text-[21px] xs:text-[24px] sm:text-[28px] md:text-[30px] lg:text-[34px] font-black text-[#0B1B48] tracking-tight leading-[1.22] text-center">
          Ab Bhookasur ko khaana nahi,<br />
          tumhari <span className="text-[#D4380D]">help</span> chahiye.
        </h1>
      </div>

      {/* Primary CTA: HELP BHOOKASUR */}
      <div className="shrink-0 w-full max-w-sm sm:max-w-md mx-auto pt-2 pb-2">
        <button
          onClick={onHelpBakasur}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          HELP BHOOKASUR
        </button>
      </div>
    </div>
  );
};
