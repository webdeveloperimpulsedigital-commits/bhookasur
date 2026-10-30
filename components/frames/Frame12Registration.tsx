'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { FrameFooter } from './FrameFooter';

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

interface Frame12RegistrationProps {
  onSubmitNumber: (mobile: string, name?: string) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
  onViewExistingPass?: (data: { mobile: string; participation_id: string }) => void;
}

export const Frame12Registration: React.FC<Frame12RegistrationProps> = ({
  onSubmitNumber,
  onBack,
  isLoading = false,
  error = '',
  onViewExistingPass
}) => {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [localError, setLocalError] = useState('');

  // Real-time mobile check
  const [isChecking, setIsChecking] = useState(false);
  const [registeredInfo, setRegisteredInfo] = useState<{
    isRegistered: boolean;
    participation_id?: string;
  } | null>(null);

  React.useEffect(() => {
    const clean = mobile.replace(/\D/g, '');
    if (!clean) {
      setRegisteredInfo(null);
      setLocalError('');
      return;
    }
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
    setIsChecking(true);
    setLocalError('');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/campaign/participate?check_mobile=${clean}`);
        const json = await res.json();
        if (isMounted && json.success) {
          if (json.isRegistered && json.data) {
            setRegisteredInfo({
              isRegistered: true,
              participation_id: json.data.participation_id
            });
            setLocalError('Yeh mobile number pehle se registered hai! Duplicate entry allow nahi hai.');
          } else {
            setRegisteredInfo({ isRegistered: false });
            setLocalError('');
          }
        }
      } catch (err) {
        console.warn('Check error:', err);
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mobile]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    const clean = mobile.replace(/\D/g, '');
    if (!clean || clean.length !== 10 || !isValidIndianMobile(clean)) {
      setLocalError('Please enter a valid mobile number');
      return;
    }

    if (registeredInfo?.isRegistered) {
      setLocalError(`Yeh mobile number pehle se registered hai (Pass: ${registeredInfo.participation_id || ''}). Duplicate registration nahi ho sakti.`);
      return;
    }

    if (!consent) {
      setLocalError('Kripya communication consent check karein.');
      return;
    }

    await onSubmitNumber(clean, cleanName);
  };

  return (
    <div className="w-full h-full flex flex-col justify-center min-h-0 animate-in fade-in duration-300 gap-2.5 sm:gap-3 text-left overflow-y-auto scrollbar-thin py-4 sm:py-6 px-4 sm:px-6">
      {/* Top Section: Back Button */}
      <div className="shrink-0 flex items-center justify-start gap-2">
        <button
          id="btn-frame12-back-to-map"
          onClick={onBack}
          type="button"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wapas Map Par</span>
        </button>
      </div>

      {/* Frame Copy Header */}
      <div className="shrink-0">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B48] brand-font leading-[1.15]">
          Live Food Tour par chalne ke liye apna number register karo.
        </h2>
        <p className="text-xs text-[#2A3B66] font-medium mt-1 leading-snug">
          Select hone par aapko Food Tour ki details registered number par milengi.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col justify-start sm:justify-center gap-2 sm:gap-2.5">
        {/* Name (Required - Only characters) */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Aapka Naam:</span>
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-semibold placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D4380D] shadow-sm"
            />
          </div>
        </div>

        {/* Required Field: Mobile number */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-[#0B1B48] uppercase tracking-wider">
            Mobile Number (Required):
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-600">
              +91
            </div>
            <input
              type="tel"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm font-black tracking-wider placeholder-slate-400 border transition-all focus:outline-none focus:ring-2 shadow-sm ${
                registeredInfo?.isRegistered
                  ? 'bg-amber-50 border-amber-400 text-amber-950 focus:ring-amber-500'
                  : registeredInfo && !registeredInfo.isRegistered
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 focus:ring-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:ring-[#D4380D]'
              }`}
            />
          </div>

          {isChecking && (
            <p className="text-[11px] font-bold text-slate-500 animate-pulse">Checking number...</p>
          )}

          {!isChecking && registeredInfo && !registeredInfo.isRegistered && mobile.length === 10 && (
            <p className="text-[11px] font-bold text-emerald-600">✓ Sahi number - Nayi Registration</p>
          )}
        </div>

        {/* Duplicate Notice Card */}
        {registeredInfo?.isRegistered && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <div>
                <p className="text-xs font-black text-[#0B1B48]">
                  Yeh mobile number pehle se registered hai!
                </p>
                <p className="text-[11px] font-semibold text-slate-700">
                  Duplicate entry allow nahi hai. Pass ID: <span className="font-mono font-bold text-[#D4380D]">{registeredInfo.participation_id}</span>
                </p>
              </div>
            </div>
            {onViewExistingPass && registeredInfo.participation_id && (
              <button
                id="btn-frame12-view-existing-pass"
                type="button"
                onClick={() => onViewExistingPass({ mobile: mobile.slice(-10), participation_id: registeredInfo.participation_id! })}
                className="w-full py-2 px-3 rounded-xl bg-[#0B1B48] text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>AAPKA PASS DEKHEIN 🎫</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-0.5 select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#D4380D] focus:ring-[#D4380D] cursor-pointer"
          />
          <span className="text-xs text-slate-600 font-medium leading-tight">
            Zomato voucher result aur Food Tour details WhatsApp par paane ke liye sehmat hoon.
          </span>
        </label>

        {(localError || error) && !registeredInfo?.isRegistered && (
          <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
            ⚠️ {localError || error}
          </p>
        )}
      </form>

      {/* Primary CTA: Mera naam jodo */}
      <div className="shrink-0 pt-1">
        <button
          id="btn-frame12-submit-registration"
          onClick={handleSubmit}
          disabled={isLoading || isChecking || mobile.length !== 10 || registeredInfo?.isRegistered}
          type="button"
          className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-2 brand-font ${
            registeredInfo?.isRegistered
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
              : 'bg-[#D4380D] hover:bg-[#ba300a] text-white shadow-xl shadow-[#D4380D]/30 active:scale-[0.98] cursor-pointer disabled:opacity-50'
          }`}
        >
          <span>
            {isLoading
              ? 'JOD RAHE HAIN...'
              : registeredInfo?.isRegistered
              ? 'NUMBER REGISTERED HAI (BLOCKED)'
              : 'MERA NAAM JODO'}
          </span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Footer */}
      <FrameFooter />
    </div>
  );
};
