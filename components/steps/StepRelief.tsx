'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { SpiceOption } from './StepDish';

interface StepReliefProps {
  restaurant: Restaurant;
  dish: Dish | { name: string; id?: number };
  spice: SpiceOption;
  isCountdownDone: boolean;
  onCountdownComplete: () => void;
  onGetOfficialPass: () => void;
}

export const StepRelief: React.FC<StepReliefProps> = ({
  restaurant,
  dish,
  spice,
  isCountdownDone,
  onCountdownComplete,
  onGetOfficialPass
}) => {
  const [timeLeft, setTimeLeft] = useState(5.0);

  // 6-second countdown timer interval
  useEffect(() => {
    if (isCountdownDone) return;

    setTimeLeft(5.0);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = parseFloat((prev - 0.1).toFixed(1));
        return next > 0 ? next : 0.0;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isCountdownDone]);

  // Separate effect to safely trigger completion callback when countdown reaches 0
  useEffect(() => {
    if (!isCountdownDone && timeLeft <= 0.0) {
      onCountdownComplete();
    }
  }, [timeLeft, isCountdownDone, onCountdownComplete]);

  // Radius for SVG ring
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((5.0 - timeLeft) / 5.0) * circumference;

  if (!isCountdownDone) {
    /* STEP 6: 6-SECOND GASTRIUM RELIEF ACTIVE COUNTDOWN */
    return (
      <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 gap-2.5 sm:gap-3 text-white py-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-cyan-400/20 border border-cyan-400/40 text-cyan-200 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
          <span>Gastrium 6s Relief Active</span>
          <span className="text-yellow-400">⚡</span>
        </div>

        {/* Circular Timer Ring */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center my-0.5 sm:my-1">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active animated gradient ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#timerGradient)"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-100 ease-linear"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Countdown Number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-4xl font-black font-mono text-yellow-300 tracking-tight drop-shadow-md">
              {timeLeft.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Status Text Under Ring */}
        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          <h3 className="font-extrabold text-xs sm:text-base text-white brand-font">
            Extinguishing the Spice Volcano...
          </h3>
          <p className="text-[11px] sm:text-xs text-blue-100 font-medium max-w-xs truncate">
            Gastrium neutralizing acid burn in 6 seconds!
          </p>
        </div>
      </div>
    );
  }

  /* STEP 7: RELIEF COMPLETE SCREEN */
  return (
    <div className="w-full flex flex-col gap-2.5 sm:gap-4 text-white animate-in fade-in duration-300">
      {/* Top Label */}
      <div className="text-left pt-0.5">
        <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 uppercase tracking-wider block mb-1 flex items-center gap-1">
          <span>⚡</span>
          <span>100% RELIEVED IN 6 SECONDS</span>
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white brand-font leading-tight">
          Ahhhh! Bhookasur Ko Aagaya Chain! 🥰
        </h2>
        <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 leading-snug">
          Gastrium neutralized the spice volcano in just 6 seconds!
        </p>
      </div>

      {/* Verified Food Tour Stop Card */}
      <div className="rounded-xl sm:rounded-2xl bg-white text-slate-900 border border-emerald-300 p-3.5 sm:p-5 flex flex-col gap-1.5 sm:gap-2 shadow-lg relative z-10">
        <div className="flex items-center justify-between">
          <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>VERIFIED FOOD TOUR STOP</span>
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-slate-700">
            🌶 {spice.level}
          </span>
        </div>

        <div className="mt-0.5">
          <h3 className="font-black text-sm sm:text-lg text-slate-900 brand-font flex items-center gap-1.5">
            <span>📍 {restaurant.name}</span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">({restaurant.city})</span>
          </h3>
          <p className="text-xs sm:text-sm font-black text-[#023093] mt-0.5">
            🍽 {dish.name}
          </p>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="pt-1 relative z-10">
        <button
          onClick={onGetOfficialPass}
          type="button"
          className="w-full py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#D23002]/30 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer brand-font tracking-wide border border-white/20"
        >
          <span>Claim Certified Foodie Pass 🎟️</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

