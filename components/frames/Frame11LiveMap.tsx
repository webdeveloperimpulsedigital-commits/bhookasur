'use client';

import React, { useState } from 'react';
import { Menu, ArrowRight, ArrowLeft, X, Phone, User, CheckCircle2, AlertCircle, HelpCircle, Share2 } from 'lucide-react';
import { InteractiveTourMap } from './InteractiveTourMap';
import { BakasurShareCardModal } from '../BakasurShareCardModal';
import { getOrCreateUserId, getUserSessionsHistory, getStoredUserMobile } from '@/lib/tracker';

function isValidIndianMobile(raw: string): boolean {
  const clean = (raw || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(clean)) return false;
  if (/(\d)\1{5,}/.test(clean)) return false;
  if (/^(\d\d)\1{4}$/.test(clean)) return false;
  if (new Set(clean.split('')).size < 3) return false;
  const sequences = [
    '012345', '123456', '234567', '345678', '456789', '567890', '678901',
    '987654', '876543', '765432', '654321', '543210', '432109'
  ];
  for (const seq of sequences) {
    if (clean.includes(seq)) return false;
  }
  return true;
}

interface Frame11LiveMapProps {
  sessionId?: string;
  isRegistered?: boolean;
  registeredMobile?: string;
  participationId?: string;
  currentUserSpot?: {
    name: string;
    city: string;
    dishName: string;
    latitude?: number;
    longitude?: number;
    stopNumber?: number;
  } | null;
  currentUserSpots?: Array<{
    name: string;
    city: string;
    dishName: string;
    latitude?: number;
    longitude?: number;
    stopNumber?: number;
  }>;
  onRegisterLiveTour?: () => void;
  onSuggestAnotherSpot: () => void;
  onRegisterSubmit?: (mobile: string, name?: string, concern?: string) => Promise<boolean | void>;
  isRegistering?: boolean;
  regError?: string;
  onBack?: () => void;
  onViewExistingPass?: (data: { mobile: string; participation_id: string; restaurant_name?: string; dish_name?: string }) => void;
}

export const Frame11LiveMap: React.FC<Frame11LiveMapProps> = ({
  sessionId,
  isRegistered = false,
  registeredMobile = '',
  participationId = '',
  currentUserSpot,
  currentUserSpots,
  onRegisterLiveTour,
  onSuggestAnotherSpot,
  onRegisterSubmit,
  isRegistering = false,
  regError = '',
  onBack,
  onViewExistingPass
}) => {
  const [stats, setStats] = useState<{ foodSpots: number | null; mustTryDishes: number | null; citiesCount: number | null }>({
    foodSpots: null,
    mustTryDishes: null,
    citiesCount: null
  });

  // Registration Popup State (Name, Mobile Number & User Consent Checkbox)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [mobile, setMobile] = useState<string>('');
  const [consent, setConsent] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  // Real-time mobile duplicate check state
  const [isCheckingMobile, setIsCheckingMobile] = useState<boolean>(false);
  const [registeredInfo, setRegisteredInfo] = useState<{
    isRegistered: boolean;
    participation_id?: string;
    name?: string;
    city?: string;
    restaurant_name?: string;
    dish_name?: string;
  } | null>(null);

  const hasRegistered = Boolean(isRegistered || registeredMobile || participationId || isSubmittedSuccess || registeredInfo?.isRegistered);

  // Debounced check whenever digits are typed
  React.useEffect(() => {
    const clean = mobile.replace(/\D/g, '');
    if (!clean) {
      setRegisteredInfo(null);
      setLocalError('');
      return;
    }

    // Immediate check if first digit is not 6-9 (e.g. 1234567890)
    if (!/^[6-9]/.test(clean)) {
      setRegisteredInfo(null);
      setLocalError('Please enter a valid mobile number');
      return;
    }

    if (clean.length !== 10) {
      setRegisteredInfo(null);
      setLocalError('');
      return;
    }

    if (!isValidIndianMobile(clean)) {
      setRegisteredInfo(null);
      setLocalError('Please enter a valid mobile number');
      return;
    }

    let isMounted = true;
    setIsCheckingMobile(true);
    setLocalError('');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/campaign/participate?check_mobile=${clean}`);
        const json = await res.json();
        if (isMounted && json.success) {
          if (json.isRegistered && json.data) {
            setRegisteredInfo({
              isRegistered: true,
              participation_id: json.data.participation_id,
              name: json.data.name,
              city: json.data.city,
              restaurant_name: json.data.restaurant_name,
              dish_name: json.data.dish_name
            });
            setLocalError('Yeh mobile number pehle se registered hai! Duplicate entry allow nahi hai.');
          } else {
            setRegisteredInfo({ isRegistered: false });
            setLocalError('');
          }
        }
      } catch (err) {
        console.warn('Registration duplicate check notice:', err);
      } finally {
        if (isMounted) setIsCheckingMobile(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mobile]);

  // Fetch dynamic stats from /api/campaign/map immediately
  React.useEffect(() => {
    async function loadStats() {
      try {
        const params = new URLSearchParams();
        if (sessionId) params.set('session_id', sessionId);

        const url = `/api/campaign/map?${params.toString()}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && json.data?.stats) {
          setStats(json.data.stats);
        }
      } catch (err) {
        console.warn('Failed to load map stats:', err);
      }
    }
    loadStats();
  }, [sessionId, registeredMobile]);

  const handleOpenRegistration = () => {
    setLocalError('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const cleanName = name.trim();
    if (!cleanName || cleanName.length < 2) {
      setLocalError('Kripya apna naam daalein (kam se kam 2 akshar).');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(cleanName)) {
      setLocalError('Naam mein sirf letters (characters) allow hain, numbers ya symbols nahi.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length !== 10 || !isValidIndianMobile(cleanMobile)) {
      setLocalError('Please enter a valid mobile number');
      return;
    }

    if (registeredInfo?.isRegistered) {
      setLocalError(`Yeh mobile number pehle se registered hai (Pass: ${registeredInfo.participation_id || ''}). Duplicate registration nahi ho sakti.`);
      return;
    }

    if (!consent) {
      setLocalError('Kripya Live Food Tour communication consent checkbox check karein (Required).');
      return;
    }

    if (onRegisterSubmit) {
      const ok = await onRegisterSubmit(cleanMobile, cleanName);
      if (ok) {
        setIsSubmittedSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1200);
      }
    } else if (onRegisterLiveTour) {
      setIsModalOpen(false);
      onRegisterLiveTour();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between text-left animate-in fade-in duration-300 bg-white relative overflow-hidden">
      {/* ========================================================== */}
      {/* 1. MOBILE & TABLET PORTRAIT VIEW (< lg): EXACT VERTICAL LAYOUT */}
      {/* ========================================================== */}
      <div className="flex lg:hidden flex-1 flex-col justify-between px-3.5 sm:px-4 py-2 sm:py-3 gap-2 overflow-y-auto">
        {/* Top Header Controls with Back Button */}
        <div className="shrink-0 pt-1 flex items-center justify-between">
          {onBack ? (
            <button
              id="btn-frame11-mobile-back"
              onClick={onBack}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-white font-black text-xs shadow-md border border-slate-700 active:scale-95 transition-all cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Back</span>
            </button>
          ) : <div />}
        </div>

        {/* Headline */}
        <div className="shrink-0 w-full text-center">
          <h1 className="text-[19px] xs:text-[22px] sm:text-[25px] font-black tracking-tight leading-[1.18] text-[#D4380D] text-center">
            #Bhookasur ka Food Tour Map Live
          </h1>
        </div>

        {/* Stats Bar (Positioned directly under headline) */}
        <div className="w-full bg-[#F3F5FA] rounded-2xl border border-slate-200/90 shadow-xs flex items-center py-1.5 px-1 shrink-0">
          <div className="flex-1 text-center border-r border-slate-200/90 px-1">
            <div className="text-lg sm:text-2xl font-black text-[#D4380D] leading-none">
              {stats.foodSpots !== null ? stats.foodSpots : '...'}
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#0B1B48] mt-0.5 tracking-tight">
              Food spots
            </div>
          </div>

          <div className="flex-1 text-center px-1">
            <div className="text-lg sm:text-2xl font-black text-[#D4380D] leading-none">
              {stats.mustTryDishes !== null ? stats.mustTryDishes : '...'}
            </div>
            <div className="text-[10px] sm:text-[11px] font-black text-[#0B1B48] mt-0.5 tracking-tight">
              No of dishes
            </div>
          </div>
        </div>

        {/* Center Map Component (Actual Interactive Google Map) */}
        <div className="w-full h-[210px] xs:h-[225px] sm:h-[250px] shrink-0">
          <InteractiveTourMap
            sessionId={sessionId}
            currentUserSpot={currentUserSpot}
            currentUserSpots={currentUserSpots}
            onStatsLoaded={(s) => setStats(s)}
            onShareUserSpot={() => setIsShareModalOpen(true)}
          />
        </div>

        {/* Primary CTA: EK AUR FOOD STOP JODO */}
        <div className="w-full shrink-0">
          <button
            id="btn-frame11-mobile-suggest-spot"
            onClick={onSuggestAnotherSpot}
            type="button"
            className="w-full py-2.5 sm:py-3 px-5 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
          >
            <span>EK AUR FOOD STOP JODO</span>
          </button>
        </div>

        {/* Register CTA: LIVE FOOD TOUR KE LIYE REGISTER KARO */}
        <div className="w-full shrink-0">
          <button
            id="btn-frame11-mobile-register"
            onClick={handleOpenRegistration}
            type="button"
            className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-[#0B1B48] border-2 border-[#0B1B48] font-black text-xs sm:text-sm uppercase tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span className="leading-tight">
              {hasRegistered ? 'TOUR PASS CLAIMED / REGISTERED ✓' : 'REGISTER NOW AND GET CHANCE TO WIN ZOMATO VOUCHER'}
            </span>
            {!hasRegistered && <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />}
          </button>
        </div>

        {/* Sharing CTA (Positioned right after register): SHARE ON WHATSAPP / INSTA */}
        <div className="w-full pb-1 shrink-0">
          <button
            id="btn-frame11-mobile-share"
            onClick={() => setIsShareModalOpen(true)}
            type="button"
            className="w-full py-2.5 sm:py-3 px-5 rounded-2xl bg-[#00A859] hover:bg-[#00914c] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-[#00A859]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>SHARE ON WHATSAPP / INSTA</span>
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. DESKTOP VIEW (lg:flex): LEFT SIDE MAP, RIGHT SIDE BUTTONS */}
      {/* ========================================================== */}
      <div className="hidden lg:flex flex-1 min-h-0 flex-row overflow-hidden">
        {/* LEFT SIDE: MAP */}
        <div className="w-1/2 h-full flex items-center justify-center p-4 lg:p-6 bg-slate-50/70 border-r border-slate-200/80 relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <InteractiveTourMap
              sessionId={sessionId}
              currentUserSpot={currentUserSpot}
              currentUserSpots={currentUserSpots}
              onStatsLoaded={(s) => setStats(s)}
              onShareUserSpot={() => setIsShareModalOpen(true)}
            />
          </div>
        </div>

        {/* RIGHT SIDE: HEADLINE, STATS & BUTTONS */}
        <div className="w-1/2 h-full flex flex-col justify-center px-8 lg:px-12 py-8 gap-5 lg:gap-6 bg-white overflow-y-auto">
          {/* Headline */}
          <div className="w-full text-center">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-black tracking-tight leading-[1.18] text-[#D4380D] text-center">
              #Bhookasur ka Food Tour Map Live
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="w-full bg-[#F3F5FA] rounded-2xl border border-slate-200/90 shadow-xs flex items-center py-3 px-2">
            <div className="flex-1 text-center border-r border-slate-200/90 px-2">
              <div className="text-2xl lg:text-3xl font-black text-[#D4380D] leading-none">
                {stats.foodSpots !== null ? stats.foodSpots : '...'}
              </div>
              <div className="text-xs lg:text-sm font-black text-[#0B1B48] mt-1 tracking-tight">
                Food spots
              </div>
            </div>

            <div className="flex-1 text-center px-2">
              <div className="text-2xl lg:text-3xl font-black text-[#D4380D] leading-none">
                {stats.mustTryDishes !== null ? stats.mustTryDishes : '...'}
              </div>
              <div className="text-xs lg:text-sm font-black text-[#0B1B48] mt-1 tracking-tight">
                No of dishes
              </div>
            </div>
          </div>

          {/* Primary CTA: EK AUR FOOD STOP JODO */}
          <div className="w-full pt-1">
            <button
              id="btn-frame11-desktop-suggest-spot"
              onClick={onSuggestAnotherSpot}
              type="button"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm lg:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
            >
              <span>EK AUR FOOD STOP JODO</span>
            </button>
          </div>

          {/* Register CTA: REGISTER NOW AND GET CHANCE TO WIN ZOMATO VOUCHER */}
          <div className="w-full">
            <button
              id="btn-frame11-desktop-register"
              onClick={handleOpenRegistration}
              type="button"
              className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-[#0B1B48] border-2 border-[#0B1B48] font-black text-xs lg:text-sm uppercase tracking-wide active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs text-center"
            >
              <span className="leading-tight">
                {hasRegistered ? 'TOUR PASS CLAIMED / REGISTERED ✓' : 'REGISTER NOW AND GET CHANCE TO WIN ZOMATO VOUCHER'}
              </span>
              {!hasRegistered && <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />}
            </button>
          </div>

          {/* Sharing CTA (Positioned right after register): SHARE ON WHATSAPP / INSTA */}
          <div className="w-full">
            <button
              id="btn-frame11-desktop-share"
              onClick={() => setIsShareModalOpen(true)}
              type="button"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#00A859] hover:bg-[#00914c] text-white font-black text-sm lg:text-base uppercase tracking-wider shadow-md shadow-[#00A859]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
            >
              <Share2 className="w-5 h-5 stroke-[2.5]" />
              <span>SHARE ON WHATSAPP / INSTA</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 8. REGISTRATION POPUP MODAL (Mobile Number & Consent Only) */}
      {/* ========================================================== */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 relative flex flex-col gap-3 animate-in zoom-in-95 duration-200 max-h-[92%] overflow-y-auto">
            {/* Close Button */}
            <button
              id="btn-frame11-modal-close"
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0B1B48] leading-tight pr-6">
                Register karein aur paayein Zomato voucher jeetne ka mauka!
              </h3>
            </div>

            {/* Success State if Submitted */}
            {isSubmittedSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                <h4 className="font-black text-base text-[#0B1B48]">Registration Kamyab!</h4>
                <p className="text-xs text-slate-600">Aapka Tour Pass generate ho raha hai...</p>
              </div>
            ) : (
              /* Registration Form: Name + Mobile Number + Consent Checkbox */
              <form onSubmit={handleModalSubmit} className="flex flex-col gap-3">
                {/* Field 1: Aapka Naam (Required - Only characters) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-[#0B1B48] uppercase tracking-wider flex items-center justify-between">
                    <span>Aapka Naam</span>
                    <span className="text-[#D4380D] font-bold text-[10px]">* Required</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                      placeholder="Rahul Sharma"
                      maxLength={50}
                      required
                      autoFocus
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl text-sm font-bold placeholder-slate-400 border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#D4380D] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Field 2: Mobile Number (Required - Strictly 10 digits) */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-black text-[#0B1B48] uppercase tracking-wider flex items-center justify-between">
                    <span>Mobile Number</span>
                    <span className="text-[#D4380D] font-bold text-[10px]">* Required</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-700 flex items-center gap-1">
                      <span>🇮🇳 +91</span>
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      maxLength={10}
                      required
                      className={`w-full pl-16 pr-3 py-2.5 rounded-xl text-sm font-black tracking-wider placeholder-slate-400 border transition-all focus:outline-none focus:ring-2 ${
                        registeredInfo?.isRegistered
                          ? 'bg-amber-50/70 border-amber-400 text-amber-950 focus:ring-amber-500'
                          : registeredInfo && !registeredInfo.isRegistered
                          ? 'bg-emerald-50/50 border-emerald-400 text-emerald-950 focus:ring-emerald-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-[#D4380D] focus:bg-white'
                      }`}
                    />
                  </div>

                  {/* Real-time Status Indicators */}
                  {isCheckingMobile && (
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 pt-0.5 animate-pulse">
                      <span className="inline-block w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                      <span>Number registration status check ho raha hai...</span>
                    </div>
                  )}

                  {!isCheckingMobile && registeredInfo && !registeredInfo.isRegistered && mobile.length === 10 && (
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 pt-0.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>✓ Nayi registration ke liye number uplabdh hai</span>
                    </div>
                  )}
                </div>

                {/* Duplicate Registration Detected Notice Card */}
                {registeredInfo?.isRegistered && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col gap-2 animate-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#0B1B48] leading-tight">
                          Yeh mobile number pehle se registered hai!
                        </p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-0.5 leading-snug">
                          Aapka Tour Pass pehle hi generate ho chuka hai. Duplicate entries allow nahi hain.
                        </p>
                        {registeredInfo.participation_id && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-mono font-black text-[#D4380D] shadow-2xs">
                            <span className="text-[10px] text-slate-500">PASS ID:</span>
                            <span>{registeredInfo.participation_id}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {onViewExistingPass && registeredInfo.participation_id && (
                      <button
                        id="btn-frame11-view-existing-pass"
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          onViewExistingPass({
                            mobile: mobile.replace(/\D/g, '').slice(-10),
                            participation_id: registeredInfo.participation_id!,
                            restaurant_name: registeredInfo.restaurant_name,
                            dish_name: registeredInfo.dish_name
                          });
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0B1B48] hover:bg-[#152a68] text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                      >
                        <span>AAPKA TOUR PASS DEKHEIN 🎫</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Field 3: User Consent Checkbox (Required) */}
                <div className="flex flex-col gap-1 pt-0.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      className="mt-0.5 rounded text-[#D4380D] focus:ring-[#D4380D] h-4 w-4 border-slate-300 accent-[#D4380D] cursor-pointer"
                    />
                    <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-700 leading-snug">
                      Zomato voucher result aur Food Tour details WhatsApp par paane ke liye sehmat hoon. <span className="text-[#D4380D] font-bold">*</span>
                    </span>
                  </label>
                </div>

                {/* Error Message */}
                {(localError || regError) && !registeredInfo?.isRegistered && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 text-red-600 text-[11px] font-bold border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{localError || regError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    id="btn-frame11-submit-registration"
                    type="submit"
                    disabled={isRegistering || isCheckingMobile || !isValidIndianMobile(mobile) || name.trim().length < 2 || !consent || registeredInfo?.isRegistered}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                      registeredInfo?.isRegistered
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                        : 'bg-[#D4380D] hover:bg-[#ba300a] text-white shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isRegistering ? (
                      <span className="animate-pulse">Registering...</span>
                    ) : registeredInfo?.isRegistered ? (
                      <span>NUMBER PEHLE SE REGISTERED HAI ⚠️</span>
                    ) : (
                      <>
                        <span>TOUR PASS CLAIM KARO</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* 9. FOODIE PASS SHARE MODAL (WhatsApp, Instagram, Facebook) */}
      {/* ========================================================== */}
      <BakasurShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        restaurantName={currentUserSpot?.name || 'Local Food Spot'}
        cityName={currentUserSpot?.city || 'Pune'}
        dishName={currentUserSpot?.dishName || 'Specialty Dish'}
        participationId={participationId || registeredInfo?.participation_id || 'BKT-' + Math.floor(100000 + Math.random() * 900000)}
      />
    </div>
  );
};
