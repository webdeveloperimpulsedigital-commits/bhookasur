'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flame, ShieldAlert, Utensils, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Restaurant, Dish } from '@/lib/db';
import { SpiceOption } from './StepDish';

interface StepEatingProps {
  restaurant: Restaurant;
  dish: Dish | { name: string; id?: number };
  spice: SpiceOption;
  sessionId: string;
  isHeartburnStage?: boolean;
  feastingStage?: 1 | 2 | 3;
  onFeastingStageChange?: (stage: 1 | 2 | 3) => void;
  onProceedToHeartburn?: () => void;
  onGiveGastrium: () => void;
  onBackToDish: () => void;
  onPlaySound?: (type: 'click' | 'bite' | 'fanfare' | 'relief') => void;
}

function getDishDialogues(dishName: string) {
  const n = (dishName || '').toLowerCase();
  if (n.includes('puran poli') || n.includes('puran') || n.includes('poli')) {
    return {
      stage1: 'Aaha! Sajuk Tupatli Garma-Garam Puran Poli! 🧈 Itna tasty? Yeh toh daant mein phas gaya... Aur lao jaldi! 😋',
      stage2: 'Mazedaar! Ghee aur jaggery stuffing ka kamaal! Monster pet full karne aur Puran Poli chahiye... Phenko idhar! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥 Heavy ghee & sweet masala blast! Seene mein volcano phat gaya... Bachao re koi!'
    };
  }
  if (n.includes('dosa') || n.includes('uttapam') || n.includes('mysore masala') || n.includes('rava dosa') || n.includes('set dosa')) {
    return {
      stage1: 'Waah! Butter Crispy Dosa & Chutney! 🥞 Hawa mein gayab! Aur lao jaldi! 😋',
      stage2: 'Super crunch! Red garlic chutney aur sambar ka kick mast hai! Phenko idhar! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥 Spicy sambar aur masala dosa overload! Seene mein volcano phat gaya!'
    };
  }
  if (n.includes('pav bhaji') || n.includes('bhaji') || n.includes('pavbhaji')) {
    return {
      stage1: 'Waah! Amul Butter mein tairti hui Pav Bhaji! 🍛 Naram naram pav khatam! Aur lao jaldi! 😋',
      stage2: 'Mazedaar! Double butter pav aur spicy bhaji feko idhar! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥 Seene mein Pav Bhaji masala overload! Aag lag gayi!'
    };
  }
  if (n.includes('spdp') || n.includes('dahi puri') || n.includes('puri') || n.includes('chaat') || n.includes('bhel')) {
    return {
      stage1: 'Aha! SPDP ka Chaat Blast! 🥣 Crispy puri aur sweet dahi ka kamaal! Aur lao jaldi! 😋',
      stage2: 'Mazedaar! Teekhi meethi chutney aur sev ka loaded round feko idhar! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥 Spicy chaat masala overload! Pet mein aag lag gayi!'
    };
  }
  if (n.includes('misal') || n.includes('tarri') || n.includes('katakirr') || n.includes('bedekar')) {
    return {
      stage1: 'Dhurr! Fiery red tarri misal with crispy farsan! 🌶️ Ekdum zordar! Aur lao jaldi! 😋',
      stage2: 'Pasina nikal raha hai! Extra rassa aur pav daalo idhar! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥🔥 100% Volcanic Misal Overload! Seene mein aag lag gayi!'
    };
  }
  if (n.includes('biryani') || n.includes('chicken') || n.includes('mutton') || n.includes('handi')) {
    return {
      stage1: 'Waah! Saffron Dum Biryani with juicy tender meat! 🍗 Palak jhapakte hi khatam! Aur lao jaldi! 😋',
      stage2: 'Mazedaar! Bhookasur ki monster bhookh jaag gayi... Ek aur handi feko! 🤪',
      stage3: 'ARRE BAAP RE! 🔥🔥 Spicy gravy aur biryani masala overload! Seene mein aag lag gayi!'
    };
  }
  return {
    stage1: 'Waah re waah! Itna tasty? Par yeh toh mere daant mein phas ke reh gaya... Aur lao jaldi! 😋',
    stage2: 'Mazedaar! Bhookasur ke monster pet ko full karne ke liye aur khana chahiye... Phenko idhar! 🤪',
    stage3: 'ARRE BAAP RE! 🔥🔥 Seene mein volcano phat gaya! Pet mein aag lag gayi... Bachao re koi!'
  };
}

export const StepEating: React.FC<StepEatingProps> = ({
  restaurant,
  dish,
  spice,
  sessionId,
  isHeartburnStage = false,
  feastingStage: externalStage,
  onFeastingStageChange,
  onProceedToHeartburn,
  onGiveGastrium,
  onBackToDish,
  onPlaySound
}) => {
  // Feasting Stage: 1 (20%), 2 (45%), 3 (100% Acidity Overload)
  const [internalStage, setInternalStage] = useState<1 | 2 | 3>(
    isHeartburnStage ? 3 : (externalStage || 1)
  );

  const currentStage = externalStage || internalStage;
  const dishDialogues = getDishDialogues(dish.name);

  // Track Meter Percent with smooth progression
  const [meterPercent, setMeterPercent] = useState<number>(20);

  useEffect(() => {
    if (currentStage === 1) {
      setMeterPercent(20);
    } else if (currentStage === 2) {
      setMeterPercent(45);
    } else if (currentStage === 3 || isHeartburnStage) {
      setMeterPercent(100);
    }
  }, [currentStage, isHeartburnStage]);

  // Stage Dialogues & Visual Metadata for the existing frame layout
  const STAGE_CONFIG = {
    1: {
      title: 'Appetite Started',
      dialogue: dishDialogues.stage1,
      badgeBg: 'bg-amber-100/20 text-amber-300 border-amber-400/40',
      progressBg: 'from-amber-500 via-orange-400 to-yellow-300',
      ctaText: '🍽️ AUR KHILAO! (FEED MORE)',
      ctaSubtext: '👆 20% capacity reached! Tap "AUR KHILAO" to feed Bhookasur more!',
      mascotEmoji: '😋',
      mascotMood: 'Waiting for More Food'
    },
    2: {
      title: 'Monster Hunger Rising',
      dialogue: dishDialogues.stage2,
      badgeBg: 'bg-orange-100/20 text-orange-300 border-orange-400/40',
      progressBg: 'from-orange-500 via-amber-400 to-yellow-400',
      ctaText: '💥 AUR KHILAO! (FINAL HELPING)',
      ctaSubtext: '👆 45% devoured! Tap "AUR KHILAO" to feed him to maximum capacity!',
      mascotEmoji: '🤤',
      mascotMood: 'Waiting for More Food'
    },
    3: {
      title: 'Acidity Overload 🔥',
      dialogue: dishDialogues.stage3,
      badgeBg: 'bg-red-900/40 text-red-300 border-red-500 animate-pulse',
      progressBg: 'from-red-600 via-rose-500 to-orange-500',
      ctaText: '⚡ HELP BHOOKASUR NOW! 🔥',
      ctaSubtext: '🚨 Bhookasur is in distress from overeating! Tap to neutralize burning discomfort!',
      mascotEmoji: '🔥',
      mascotMood: 'Discomfort from Indulgence'
    }
  };

  const currentConfig = STAGE_CONFIG[currentStage as 1 | 2 | 3] || STAGE_CONFIG[1];

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#FF5500', '#FFB800', '#FF3B30', '#00ACC1', '#00C853']
      });
    } catch {
      // Ignore
    }
  };

  const handleMainAction = () => {
    if (currentStage === 1) {
      if (onPlaySound) onPlaySound('bite');
      triggerConfetti();
      setInternalStage(2);
      if (onFeastingStageChange) onFeastingStageChange(2);
    } else if (currentStage === 2) {
      if (onPlaySound) onPlaySound('bite');
      triggerConfetti();
      setInternalStage(3);
      if (onFeastingStageChange) onFeastingStageChange(3);
      if (onProceedToHeartburn) onProceedToHeartburn();
    } else {
      if (onPlaySound) onPlaySound('relief');
      onGiveGastrium();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 sm:gap-5 text-white animate-in fade-in duration-300">
      {/* Top Header Label */}
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-300 bg-white/10 px-2.5 py-0.5 rounded-full">
            {currentStage === 3 ? 'Stage 3: Acidity Overload' : `Stage ${currentStage}: Feeding Bhookasur`}
          </span>
          {currentStage < 3 && (
            <span className="text-xs font-semibold text-blue-200">
              Devouring Pune&apos;s Best Flavours
            </span>
          )}
        </div>
      </div>

      {/* Bakasur Comic Speech Bubble (Existing Frame) */}
      <div className={`rounded-2xl p-4 sm:p-5 border-2 transition-all relative shadow-lg ${
        currentStage === 3
          ? 'bg-red-950/80 border-red-400 text-white shadow-red-950/50'
          : currentStage === 2
          ? 'bg-amber-950/80 border-amber-400 text-white shadow-amber-950/50'
          : 'bg-blue-950/80 border-blue-300 text-white shadow-blue-950/50'
      }`}>
        {/* Speech Bubble Pointer */}
        <div className={`absolute -top-2.5 left-8 w-5 h-5 rotate-45 border-t-2 border-l-2 bg-inherit ${
          currentStage === 3
            ? 'border-red-400'
            : currentStage === 2
            ? 'border-amber-400'
            : 'border-blue-300'
        }`} />

        <div className="flex items-start gap-3 relative z-10">
          <div className="text-3xl sm:text-4xl shrink-0 p-1 select-none animate-bounce">
            {currentConfig.mascotEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-300 flex items-center gap-1">
                <span>BHOOKASUR SAYS:</span>
                <span className="font-mono text-blue-200">({currentConfig.mascotMood})</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${currentConfig.badgeBg}`}>
                {meterPercent}% CAPACITY
              </span>
            </div>

            <p className="font-extrabold text-sm sm:text-base leading-snug tracking-tight text-white">
              &ldquo;{currentConfig.dialogue}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Selected Food & Multi-Stage Food Meter HUD (Existing Frame) */}
      <div className="rounded-2xl bg-white/10 text-white p-4 sm:p-5 flex flex-col gap-3.5 shadow-md border border-white/15 backdrop-blur-md relative z-10">
        {/* Row 1: Food Info & Spice Level */}
        <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider block">
              🍽 SELECTED FOOD &amp; JOINT
            </span>
            <h3 className="font-black text-base sm:text-lg text-white brand-font truncate">
              {dish.name}
            </h3>
            <p className="text-xs text-blue-100 font-medium truncate">
              📍 {restaurant.name} • {restaurant.city}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center gap-1 text-xs font-black text-yellow-300 bg-yellow-400/20 px-2.5 py-1 rounded-full border border-yellow-400/40 shadow-sm">
              <span>{spice.icon}</span>
              <span>{spice.name}</span>
            </span>
            <p className="text-[10px] text-blue-200 mt-0.5 font-mono">Heat: {spice.level}</p>
          </div>
        </div>

        {/* Row 2: Food Meter Capacity & Status */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Flame className={`w-4 h-4 ${meterPercent >= 100 ? 'text-red-400 animate-ping' : 'text-yellow-400'}`} />
              <span className="font-black text-white uppercase tracking-wide brand-font">
                FOOD METER: <span className="text-yellow-300">{currentConfig.title}</span>
              </span>
            </div>
            <span className={`font-black font-mono text-sm sm:text-base ${
              meterPercent >= 100 ? 'text-red-400 animate-pulse' : 'text-yellow-300'
            }`}>
              {meterPercent}%
            </span>
          </div>

          {/* Meter Bar */}
          <div className="relative w-full h-6 sm:h-7 rounded-xl bg-slate-900/60 p-1 border border-white/20 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-lg bg-gradient-to-r ${currentConfig.progressBg} transition-all duration-700 ease-out flex items-center justify-end pr-2 shadow-sm`}
              style={{ width: `${Math.max(meterPercent, 10)}%` }}
            >
              <span className="text-[10px] sm:text-[11px] font-black text-slate-950 font-mono tracking-tight">
                {meterPercent}%
              </span>
            </div>

            {/* Checkpoint Milestones (20%, 45%, 100%) */}
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none opacity-40">
              <div className="h-3 w-0.5 bg-white" title="Stage 1 (20%)" />
              <div className="h-3 w-0.5 bg-white" title="Stage 2 (45%)" />
              <div className="h-3 w-0.5 bg-white" title="Stage 3 (100%)" />
            </div>
          </div>

          {/* Stage Checkpoints (Clean 20%, 45%, 100% - No Plate 1 / Plate 2 labels) */}
          <div className="flex items-center justify-between text-[11px] text-blue-200 pt-1 font-medium">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${meterPercent >= 20 ? 'bg-yellow-400' : 'bg-white/30'}`} />
              <span className={meterPercent >= 20 ? 'text-yellow-300 font-bold' : ''}>20% Eaten</span>
            </div>

            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${meterPercent >= 45 ? 'bg-orange-400' : 'bg-white/30'}`} />
              <span className={meterPercent >= 45 ? 'text-orange-300 font-bold' : ''}>45% Gobbled</span>
            </div>

            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${meterPercent >= 100 ? 'bg-red-400 animate-ping' : 'bg-white/30'}`} />
              <span className={meterPercent >= 100 ? 'text-red-300 font-extrabold' : ''}>100% Critical 🔥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive CTA Button (Existing Frame) */}
      <div className="flex flex-col gap-2 pt-1 relative z-10">
        <div className="flex items-center gap-3">
          {/* Back Button (always available to pick food again) */}
          <button
            onClick={onBackToDish}
            type="button"
            className="px-4 sm:px-5 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Food</span>
          </button>

          {/* Dynamic Stage Progression CTA Button */}
          <button
            onClick={handleMainAction}
            type="button"
            className={`flex-1 py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer brand-font ${
              currentStage === 3
                ? 'gastrium-pulse bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-emerald-500/30 border border-emerald-300'
                : 'aur-khilo-btn bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-yellow-500/25 border border-yellow-300'
            }`}
          >
            {currentStage === 3 ? (
              <>
                <ShieldAlert className="w-5 h-5 text-slate-950 animate-bounce shrink-0" />
                <span>{currentConfig.ctaText}</span>
              </>
            ) : (
              <>
                <Utensils className="w-4 h-4 fill-current text-slate-950 shrink-0" />
                <span>{currentConfig.ctaText}</span>
                <Zap className="w-4 h-4 fill-current animate-bounce text-slate-950 shrink-0" />
              </>
            )}
          </button>
        </div>

        <p className={`text-center text-[11px] font-bold ${
          currentStage === 3 ? 'text-red-300 animate-pulse' : 'text-blue-200'
        }`}>
          {currentConfig.ctaSubtext}
        </p>
      </div>
    </div>
  );
};
