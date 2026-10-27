'use client';

import React, { useState } from 'react';
import { Share2, RotateCcw, Check, Sparkles, Trophy, ShieldCheck, ArrowRight, User, Phone, Mail, CheckCircle2, Ticket } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { SpiceOption } from './StepDish';

interface StepContestProps {
  sessionId: string;
  restaurant: Restaurant;
  dish: Dish | { name: string; id?: number };
  spice: SpiceOption;
  onExploreMap: () => void;
  onRestartTour: () => void;
}

export const StepContest: React.FC<StepContestProps> = ({
  sessionId,
  restaurant,
  dish,
  spice,
  onExploreMap,
  onRestartTour
}) => {
  const [showOfflineTourModal, setShowOfflineTourModal] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [participationId, setParticipationId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle WhatsApp Share / Native Share
  const handleSharePass = async () => {
    const shareText = `🍽️ I just added my food recommendation (${dish.name} at ${restaurant.name}, ${restaurant.city}) to Bhookasur's Food Tour! Check out the Gastrium Food Tour Map: ${typeof window !== 'undefined' ? window.location.origin : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bhookasur Ka Food Tour Pass',
          text: shareText,
          url: window.location.href
        });
      } catch {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleRegisterOfflineTour = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = mobile.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!consentAccepted) {
      setError('Please accept the consent terms to register.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/campaign/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          name: name.trim(),
          mobile: cleanPhone,
          email: email.trim() || `${cleanPhone}@foodtour.com`,
          city: restaurant.city,
          restaurant_id: restaurant.id,
          restaurant_name: restaurant.name,
          dish_id: dish.id,
          dish_name: dish.name,
          latitude: restaurant.latitude,
          longitude: restaurant.longitude,
          consent: true,
          terms_accepted: true
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setParticipationId(json.data.participation_id);
        setIsRegistered(true);
        setShowOfflineTourModal(false);
      } else {
        setError(json.error || 'Failed to submit offline tour registration');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 sm:gap-3 text-white animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>SUBMISSION CONFIRMED</span>
          </span>
          <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white brand-font leading-tight">
            Bhookasur Certified Foodie Pass 🎫
          </h2>
          <p className="text-[10px] sm:text-[11px] text-blue-200 font-medium leading-snug">
            Spicy khana bhi khilaya aur Gastrium se Bhookasur ko bachaya!
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-white bg-[#D23002]/60 px-2 py-0.5 rounded-full border border-[#D23002] shrink-0">
          {participationId || 'LIVE PASS'}
        </span>
      </div>

      {/* Official Tour Pass Ticket Card */}
      <div className="rounded-2xl bg-white text-slate-900 p-3 sm:p-4 shadow-xl border border-slate-100 flex flex-col gap-2 relative overflow-hidden">
        {/* Ticket Header Row */}
        <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-[#023093] text-white flex items-center justify-center text-xs font-black shrink-0">
              🎫
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 brand-font truncate">
                {restaurant.name}
              </h4>
              <p className="text-[10px] text-slate-500 truncate">
                📍 {restaurant.area || restaurant.city}, {restaurant.city}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
            ★ {restaurant.rating || '4.8'}
          </span>
        </div>

        {/* Selected Dish & Spice Tag */}
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2 border border-slate-100 text-xs">
          <div className="min-w-0">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Recommended Dish</span>
            <span className="font-black text-xs sm:text-sm text-[#023093] brand-font truncate block">
              🍽️ {dish.name}
            </span>
          </div>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200 shrink-0">
            {spice.icon} {spice.name}
          </span>
        </div>

        {/* Offline Food Tour Registration Callout */}
        {isRegistered ? (
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Registered for Influencer Food Tour!</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0 font-bold">
              {participationId}
            </span>
          </div>
        ) : (
          <div className="p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-black text-[11px] text-slate-900 brand-font flex items-center gap-1 truncate">
                <span>🎉 Join Real-World Food Tour</span>
              </span>
              <p className="text-[9px] text-slate-500 truncate">
                Meet top food influencers in {restaurant.city}
              </p>
            </div>

            <button
              onClick={() => setShowOfflineTourModal(true)}
              type="button"
              className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] sm:text-[11px] shadow-sm transition-all cursor-pointer whitespace-nowrap shrink-0 brand-font"
            >
              Register Free 🎟️
            </button>
          </div>
        )}
      </div>

      {/* Primary Action Button: Explore Food Tour Map */}
      <div className="flex flex-col gap-1.5 pt-0.5 relative z-10">
        <button
          onClick={onExploreMap}
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#D23002]/30 transition-all flex items-center justify-center gap-2 cursor-pointer brand-font tracking-wide border border-white/20"
        >
          <span>Explore Live Food Tour Map</span>
          <span className="text-base">🗺️</span>
        </button>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRestartTour}
            type="button"
            className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 truncate"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Another Spot</span>
          </button>

          <button
            onClick={handleSharePass}
            type="button"
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm truncate"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Share Pass</span>
          </button>
        </div>
      </div>

      {/* Fully Responsive Offline Food Tour Registration Modal */}
      {showOfflineTourModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col gap-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-base font-black shrink-0">
                  🏆
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base brand-font text-slate-900">
                    Join Offline Food Tour
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Exclusive tour with food influencers in {restaurant.city}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineTourModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Explainer Notice */}
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-slate-700 leading-relaxed">
              <strong className="text-blue-950 font-bold block mb-0.5">Free Registration:</strong>
              Get shortlisted to visit legendary food joints in {restaurant.city} with top food creators and enjoy Gastrium perks.
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleRegisterOfflineTour} className="flex flex-col gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#023093] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:border-[#023093] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#023093] focus:bg-white"
                  />
                </div>
              </div>

              {/* Explicit Consent Checkbox */}
              <div className="flex items-start gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#023093] focus:ring-[#023093] cursor-pointer"
                />
                <label htmlFor="consentCheckbox" className="text-[10px] text-slate-600 leading-tight cursor-pointer">
                  I agree to receive invitation updates regarding the offline Gastrium Food Tour with influencers in {restaurant.city}.
                </label>
              </div>

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-1 py-2.5 px-4 rounded-xl bg-[#023093] hover:bg-[#033bb8] text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer brand-font disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Confirm Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
