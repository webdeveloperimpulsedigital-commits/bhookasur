'use client';

import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { FrameFooter } from './FrameFooter';
import { getFlyingDishAsset } from '../BakasurEatingStage';

interface Frame5EatingBeginsProps {
  restaurant: Restaurant;
  dish: Dish | { name: string; id?: number; price?: number; image?: string };
  onFeedMore: () => void;
  onBack: () => void;
}

const QUOTES = [
  '“Sharing ka plan tha. Ab nahi hai.”',
  '“Chef ki shift khatam. Bhookasur ki bhookh nahi.”',
  '“Arre bhai Bhookasur, iska bill kaun bharega?”',
  '“Khaali plates ka Eiffel Tower ban raha hai.”',
  '“Sahi chuna hai. Ab count mat karna!”'
];

export const Frame5EatingBegins: React.FC<Frame5EatingBeginsProps> = ({
  restaurant,
  dish,
  onFeedMore,
  onBack
}) => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const dishAsset = getFlyingDishAsset(dish.name, (dish as { image?: string }).image);

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 animate-in fade-in duration-300 gap-3 md:gap-4 text-left">
      {/* Top Header Section */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <span className="text-[10px] sm:text-xs font-black text-[#D4380D] uppercase tracking-wider block truncate">
          📍 {restaurant.name}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-[#D4380D] font-black text-[10px] uppercase border border-red-200">
          <Flame className="w-3 h-3 fill-[#D4380D]" />
          <span>Bhookasur Mode: ON</span>
        </span>
      </div>

      <div className="shrink-0 space-y-1">
        <h2 className="text-[24px] sm:text-[28px] md:text-[32px] font-black tracking-tight text-[#0B1B48] leading-[1.12]">
          Aapne suggest kiya.<br />Bhookasur ne khaana shuru kar diya!
        </h2>
        <p className="text-xs sm:text-sm text-[#1a264a] font-semibold">
          Khaane ki speed: Superfast 🚀
        </p>
      </div>

      {/* Selected Dish Spotlight Card */}
      <div className="shrink-0 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 flex items-center justify-center p-1">
          <img
            src={dishAsset.image}
            alt={dish.name}
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Now Devouring
          </span>
          <h4 className="font-black text-sm sm:text-base md:text-lg text-[#0B1B48] truncate">
            {dish.name}
          </h4>
          <p className="text-xs text-slate-500 font-semibold truncate">
            {restaurant.name} • {restaurant.area || restaurant.city}
          </p>
        </div>
      </div>

      {/* Dynamic Zomato-style engaging quote bubble */}
      <div className="flex-1 min-h-0 flex flex-col justify-center">
        <div className="rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-3.5 sm:p-4 shadow-sm transition-all duration-300">
          <div className="flex items-start gap-3">
            <span className="text-3xl shrink-0 select-none animate-bounce">🤤</span>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4380D] block mb-1">
                Bhookasur Foodie Thought:
              </span>
              <p className="text-sm sm:text-base font-black text-[#0B1B48] leading-snug transition-opacity duration-300">
                {QUOTES[quoteIdx]}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary CTA: AUR KHILAO */}
      <div className="shrink-0 pt-1">
        <button
          onClick={onFeedMore}
          type="button"
          className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base md:text-lg uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>AUR KHILAO</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer */}
      <div className="shrink-0 pt-0.5">
        <FrameFooter />
      </div>
    </div>
  );
};
