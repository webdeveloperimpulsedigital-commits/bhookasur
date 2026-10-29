'use client';

import React from 'react';
import type { Restaurant, Dish } from '@/lib/db';

interface Frame10SubmittedProps {
  restaurant?: Partial<Restaurant> | { name: string; city?: string };
  dish?: Dish | { name: string; id?: number; price?: number; image?: string };
  onViewMap: () => void;
}

export const Frame10Submitted: React.FC<Frame10SubmittedProps> = ({
  onViewMap
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center animate-in fade-in duration-300 py-3 xs:py-4 sm:py-6 md:py-8 px-3 xs:px-4 sm:px-8 md:px-10 gap-3 sm:gap-4 md:gap-5 overflow-y-auto scrollbar-none">
      {/* 2. Main Headline */}
      <div className="space-y-0.5 sm:space-y-1 w-full max-w-md mx-auto flex flex-col items-center text-center">
        <h1 className="text-[20px] xs:text-[23px] sm:text-[28px] md:text-[30px] lg:text-[34px] font-black tracking-tight leading-[1.22] text-center">
          <span className="text-[#0B1B48]">Khilane wale bahut mile.</span><br />
          <span className="text-[#D4380D]">Sambhalne wale tum nikle.</span><br />
          <span className="text-[#0B1B48]">Shukriya Dost.</span>
        </h1>
      </div>

      {/* 3. Subtext */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
        <p className="text-[13px] xs:text-[14px] sm:text-[16px] md:text-[17px] font-bold text-[#0B1B48]/90 leading-snug text-center">
          Aapka favourite food stop map par add hua hai.
        </p>
      </div>

      {/* 4. Action CTA: MAP PAR DEKHO */}
      <div className="shrink-0 w-full max-w-md mx-auto pt-1.5 sm:pt-3">
        <button
          id="btn-frame10-view-map"
          onClick={onViewMap}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-lg xs:text-xl sm:text-2xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
        >
          MAP PAR DEKHO
        </button>
      </div>
    </div>
  );
};

