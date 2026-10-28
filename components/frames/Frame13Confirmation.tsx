'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { BakasurShareCardModal } from '../BakasurShareCardModal';
import { withBasePath } from '@/lib/basePath';

interface Frame13ConfirmationProps {
  participationId?: string;
  mobile?: string;
  restaurant?: Restaurant | null;
  dish?: Dish | { name: string; id?: number; price?: number; image?: string } | null;
  onBackToMap: () => void;
  onRestart?: () => void;
}

export const Frame13Confirmation: React.FC<Frame13ConfirmationProps> = ({
  participationId,
  mobile,
  restaurant,
  dish,
  onBackToMap
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-white animate-in fade-in duration-300 select-none">
      {/* ============================================================== */}
      {/* 1. TOP HALF (Mobile/Tablet) / LEFT HALF (Desktop): Blue Character Art */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 h-[62%] xs:h-[65%] sm:h-[60%] lg:h-full bg-[#0B1B48] flex items-center justify-center relative overflow-hidden shrink-0 p-0">
        {/* Character Illustration showing Bhookasur holding smartphone with verified pass */}
        <img
          src={withBasePath('/images/final-frames/Bhookasur-holding-smartphone.png')}
          alt="Bhookasur holding smartphone"
          className="w-full h-full object-cover object-top pointer-events-none select-none relative z-10"
        />
      </div>

      {/* ============================================================== */}
      {/* 2. BOTTOM HALF (Mobile/Tablet) / RIGHT HALF (Desktop): Content Card   */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 flex-1 lg:h-full flex flex-col justify-between items-center text-center px-4 py-3 sm:px-6 sm:py-5 lg:px-10 lg:py-8 bg-white overflow-y-auto gap-2 sm:gap-3">
        {/* Spacer on Desktop for center balance */}
        <div className="hidden lg:block w-full h-2" />

        {/* Copy Section */}
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 my-auto">
          {/* Main Headline */}
          <h1 className="text-[22px] xs:text-[25px] sm:text-[28px] md:text-3xl lg:text-4xl font-black tracking-tight leading-[1.15] text-[#0B1B48]">
            <span>Naam list mein.</span><br />
            <span>Ab nazar </span>
            <span className="text-[#D4380D]">phone par.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] md:text-base font-semibold text-[#0B1B48]/85 max-w-xs sm:max-w-md leading-snug mt-0.5">
            Get a chance to win Zomato voucher! Details isi registered number par aayengi.
          </p>

          {/* Registered Details Pill */}
          {mobile && (
            <div className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 text-[#0B1B48] font-bold text-[11px] sm:text-xs border border-slate-200 shadow-2xs">
              <span>📱 +91 {mobile}</span>
            </div>
          )}
        </div>

        {/* Action Button & Footer Container */}
        <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5 shrink-0 pt-1 max-w-sm sm:max-w-md">
          {/* Primary CTA: BACK TO FOOD TOUR MAP */}
          <button
            onClick={onBackToMap}
            type="button"
            className="w-full py-3 sm:py-3.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>BACK TO FOOD TOUR MAP</span>
          </button>

          {/* Secondary Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            type="button"
            className="w-full py-2.5 sm:py-3 px-6 rounded-2xl bg-[#071952] hover:bg-[#0a2370] text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border border-amber-400/40"
          >
            <span>SHARE INSTAGRAM / WHATSAPP CARD</span>
          </button>

          {/* Footer Subtext: POWERED BY GASTRIUM */}
          <div className="text-[10px] sm:text-[11px] font-black text-slate-400 tracking-widest uppercase pt-1">
            POWERED BY GASTRIUM
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <BakasurShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        restaurantName={restaurant?.name || 'Local Food Spot'}
        cityName={restaurant?.city || 'Pune'}
        dishName={dish?.name || 'Signature Dish'}
        dishImage={(dish as { image?: string })?.image}
        participationId={participationId}
      />
    </div>
  );
};
