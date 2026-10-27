'use client';

import React from 'react';
import { Flame, Utensils, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface FoodMeterHUDProps {
  percentage: number;
  stageNumber: number; // 1, 2, 3
  isAwaitingAction?: boolean;
  onAurKhiloClick: () => void;
  ctaText?: string;
  isLoading?: boolean;
  className?: string;
}

export const FoodMeterHUD: React.FC<FoodMeterHUDProps> = ({
  percentage,
  stageNumber,
  isAwaitingAction = true,
  onAurKhiloClick,
  ctaText = '🍽️ AUR KHILAO',
  isLoading = false,
  className = ''
}) => {
  const getHungerTitle = (pct: number) => {
    if (pct <= 25) {
      return {
        title: "Pehli Bhookh (Appetite Started)",
        subtitle: "Bhookasur is still hungry! Needs more food.",
        color: "text-amber-600",
        bg: "from-amber-500 via-orange-400 to-yellow-300",
      };
    }
    if (pct <= 60) {
      return {
        title: "Pel Ke Bhookh (Monster Gobbling)",
        subtitle: "Gobbling down fast! Still asking for more.",
        color: "text-orange-600",
        bg: "from-orange-500 via-amber-400 to-yellow-400",
      };
    }
    return {
      title: "Pet Phat Gaya! (Acidity Attack 🔥)",
      subtitle: "Too much spice! Bhookasur desperately needs Gastrium!",
      color: "text-red-600",
      bg: "from-red-600 via-rose-500 to-orange-500",
    };
  };

  const status = getHungerTitle(percentage);

  const handleActionClick = () => {
    if (isLoading) return;
    onAurKhiloClick();
  };

  return (
    <div className={`w-full rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-md flex flex-col gap-3.5 ${className}`}>
      {/* Top Title & Level Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shrink-0 shadow-sm">
            <Flame className={`w-5 h-5 fill-current ${percentage >= 100 ? 'text-red-500 animate-ping' : 'text-amber-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 uppercase tracking-wider brand-font">
                BHOOKASUR FOOD METER
              </h3>
              {percentage >= 100 && (
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-black uppercase animate-pulse">
                  🔥 OVERLOAD
                </span>
              )}
            </div>
            <p className={`text-xs font-bold ${status.color}`}>
              {status.title}
            </p>
          </div>
        </div>

        {/* Big Percentage Display */}
        <div className="text-right shrink-0">
          <span className={`font-black text-2xl sm:text-3xl brand-font ${
            percentage >= 100 
              ? 'text-red-600 animate-pulse' 
              : 'text-[#023093]'
          }`}>
            {percentage}%
          </span>
          <p className="text-[10px] text-slate-400 uppercase font-mono tracking-tight">Capacity</p>
        </div>
      </div>

      {/* Main Meter Progress Bar */}
      <div className="relative w-full h-7 rounded-xl bg-slate-100 p-1 border border-slate-200 overflow-hidden shadow-inner">
        {/* Animated Fill Line */}
        <div
          className={`h-full rounded-lg bg-gradient-to-r ${status.bg} transition-all duration-700 ease-out flex items-center justify-end pr-2 shadow-sm`}
          style={{ width: `${Math.max(percentage, 10)}%` }}
        >
          <span className="text-[11px] font-black text-slate-950 tracking-tight font-mono">
            {percentage}%
          </span>
        </div>

        {/* Milestone Tick Marks (20%, 45%, 100%) */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none opacity-40">
          <div className="h-3 w-0.5 bg-slate-400" title="20% Milestone" />
          <div className="h-3 w-0.5 bg-slate-400" title="45% Milestone" />
          <div className="h-3 w-0.5 bg-slate-400" title="100% Milestone" />
        </div>
      </div>

      {/* Stage Dots & Counters */}
      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5 font-medium flex-wrap gap-y-1">
        <div className="flex items-center gap-1.5 text-[11px]">
          {/* Milestone 1: 20% */}
          <span className={`w-2 h-2 rounded-full ${percentage >= 20 ? 'bg-amber-500' : 'bg-slate-300'}`} />
          <span className={percentage >= 20 ? 'text-amber-700 font-bold' : 'text-slate-400'}>Dish 1 (20%)</span>
          <span className="text-slate-300">•</span>

          {/* Milestone 2: 45% */}
          <span className={`w-2 h-2 rounded-full ${percentage >= 45 ? 'bg-orange-500' : 'bg-slate-300'}`} />
          <span className={percentage >= 45 ? 'text-orange-700 font-bold' : 'text-slate-400'}>Feed 2 (45%)</span>
          <span className="text-slate-300">•</span>

          {/* Milestone 3: 100% */}
          <span className={`w-2 h-2 rounded-full ${percentage >= 100 ? 'bg-red-500 animate-ping' : 'bg-slate-300'}`} />
          <span className={percentage >= 100 ? 'text-red-600 font-extrabold' : 'text-slate-400'}>Full (100%)</span>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Stage: <span className="font-bold text-slate-800">{stageNumber} / 3</span>
        </div>
      </div>

      {/* Interactive Action CTA Button */}
      <div className="mt-1">
        <button
          onClick={handleActionClick}
          disabled={isLoading}
          type="button"
          className={`w-full py-3.5 sm:py-4 px-6 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer brand-font ${
            percentage >= 100
              ? 'gastrium-pulse bg-gradient-to-r from-emerald-600 to-[#023093] text-white hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-emerald-900/30'
              : 'aur-khilo-btn bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-orange-950/20'
          } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          ) : percentage >= 100 ? (
            <>
              <ShieldAlert className="w-5 h-5 text-emerald-200 animate-bounce" />
              <span>💊 GIVE GASTRIUM TO BHOOKASUR ⚡</span>
            </>
          ) : (
            <>
              <Utensils className="w-4 h-4 fill-current text-white" />
              <span>{ctaText}</span>
              <Zap className="w-4 h-4 fill-current animate-bounce text-yellow-200" />
            </>
          )}
        </button>

        {percentage < 100 ? (
          <p className="text-center text-[11px] font-semibold text-amber-700 mt-1.5">
            👆 Click &apos;AUR KHILAO&apos; to feed Bhookasur and fill his monster appetite!
          </p>
        ) : (
          <p className="text-center text-[11px] font-bold text-red-600 mt-1.5 animate-pulse">
            🚨 Acidity overload! Bhookasur needs Gastrium fast antacid now!
          </p>
        )}
      </div>
    </div>
  );
};
