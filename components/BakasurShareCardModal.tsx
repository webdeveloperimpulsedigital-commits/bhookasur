'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Instagram, MessageCircle, Ticket, Check } from 'lucide-react';
import { withBasePath } from '@/lib/basePath';

interface BakasurShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName?: string;
  cityName?: string;
  dishName?: string;
  dishImage?: string;
  participationId?: string;
  userName?: string;
}

export const BakasurShareCardModal: React.FC<BakasurShareCardModalProps> = ({
  isOpen,
  onClose,
  restaurantName,
  cityName,
  dishName,
  dishImage,
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Strictly use the official existing Bhookasur Food Tour image only
  const heroImageSrc = withBasePath('/images/final-frames/food-tour-img-gastrium.jpg');
  const activeImageSrc = heroImageSrc;

  // In-memory preloaded Bhookasur photo assets
  const preloadedFileRef = useRef<File | null>(null);
  const preloadedPngBlobRef = useRef<Blob | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Full campaign link for food pass sharing
  const shareUrl = typeof window !== 'undefined' && !window.location.origin.includes('localhost')
    ? (window.location.origin.includes('gastrium.in')
        ? 'https://gastrium.in/bhookasur_ka_food_tour'
        : `${window.location.origin}/bhookasur_ka_food_tour`)
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://gastrium.in/bhookasur_ka_food_tour');

  // Formatted message with live clickable link for WhatsApp and Instagram
  const shareText = `Maine Bhookasur ke saath Food Tour kiya!\nAap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!\n\n👉 Join the Food Tour:\n${shareUrl}`;

  // Preload the pure Bhookasur image directly as File and PNG blob for mobile & desktop sharing
  useEffect(() => {
    let isMounted = true;
    
    // Pure photo (only image, no baked-in message text)
    fetch(activeImageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        if (isMounted && blob) {
          preloadedFileRef.current = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });

          // Generate PNG blob for desktop clipboard pasting (Ctrl+V) into WhatsApp / Instagram
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1080;
            canvas.height = img.naturalHeight || 1080;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((pngBlob) => {
                if (isMounted && pngBlob) {
                  preloadedPngBlobRef.current = pngBlob;
                }
              }, 'image/png');
            }
          };
          img.src = URL.createObjectURL(blob);
        }
      })
      .catch((err) => console.warn('Preload photo error:', err));

    return () => {
      isMounted = false;
    };
  }, [activeImageSrc]);

  if (!isOpen) return null;

  // Check if device is Laptop, Desktop PC, or Tablet (including when tested in DevTools mobile mode on PC)
  const isPCorTablet = () => {
    if (typeof window === 'undefined') return false;

    // 1. Physical monitor resolution: On PC/laptops, screen resolution is >= 1024
    if (typeof window.screen !== 'undefined') {
      if (window.screen.width >= 1024 || window.screen.height >= 1024) {
        return true;
      }
    }

    // 2. Hardware platform: On PC/Mac, platform is Win32/MacIntel
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (nav) {
      const platform = (nav.platform || '').toLowerCase();
      if (
        platform.includes('win') ||
        platform.includes('mac') ||
        (platform.includes('linux') && !platform.includes('arm') && !platform.includes('android'))
      ) {
        return true;
      }
      const uaPlatform = (nav.userAgentData?.platform || '').toLowerCase();
      if (uaPlatform.includes('win') || uaPlatform.includes('mac') || uaPlatform.includes('linux')) {
        return true;
      }
    }

    // 3. User agent string
    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '').toLowerCase();
    if (
      ua.includes('windows') ||
      ua.includes('macintosh') ||
      ua.includes('cros') ||
      (ua.includes('linux') && !ua.includes('android')) ||
      ua.includes('ipad') ||
      ua.includes('tablet') ||
      (ua.includes('android') && !ua.includes('mobile'))
    ) {
      return true;
    }

    // 4. Viewport width
    if (window.innerWidth >= 768) {
      return true;
    }

    return false;
  };

  // Helper to copy text to clipboard reliably across all devices
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      if (typeof document !== 'undefined') {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        ta.setAttribute('readonly', '');
        document.body.appendChild(ta);
        ta.select();
        const success = document.execCommand('copy');
        document.body.removeChild(ta);
        return success;
      }
    } catch {
      // ignore
    }
    return false;
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    // 1. LAPTOP / TAB / PC (or testing on PC): Open WhatsApp Web in a new tab immediately
    if (isPCorTablet()) {
      const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      copyTextToClipboard(shareText);
      showToast('Opening WhatsApp Web in a new tab! Message ready.');
      return;
    }

    // 2. MOBILE PHONE: Native App Share (pure image only + text caption)
    let file = preloadedFileRef.current;
    if (!file) {
      try {
        const res = await fetch(activeImageSrc);
        const blob = await res.blob();
        file = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });
      } catch {
        // ignore
      }
    }

    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Bhookasur Ka Food Tour',
          text: shareText,
          files: [file]
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Mobile fallback if Web Share is unavailable
    const mobileWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(mobileWaUrl, '_blank');
  };

  // Instagram Share Handler: Shares pure image + copies caption
  const handleShareInstagram = async () => {
    // 1. LAPTOP / TAB / PC (or testing on PC): Open Instagram DM in a new tab immediately
    if (isPCorTablet()) {
      window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
      copyTextToClipboard(shareText);
      showToast('Opening Instagram in a new tab! Message copied — paste (Ctrl+V) in chat.');

      // Also copy PNG blob to clipboard if supported so user can paste both image & text
      if (
        preloadedPngBlobRef.current &&
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        'write' in navigator.clipboard &&
        typeof ClipboardItem !== 'undefined'
      ) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': preloadedPngBlobRef.current })
          ]);
          showToast('Instagram DM opened! Card & message copied — press Ctrl+V to paste.');
        } catch {
          // ignore
        }
      }
      return;
    }

    // 2. MOBILE PHONE:
    // ALWAYS copy full text message and link to clipboard first
    await copyTextToClipboard(shareText);

    // Share ONLY the pure image file
    let file = preloadedFileRef.current;
    if (!file) {
      try {
        const res = await fetch(activeImageSrc);
        const blob = await res.blob();
        file = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });
      } catch {
        // ignore
      }
    }

    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        showToast('📸 Photo ready & 📋 Message copied! Tap "Paste" in Instagram chat.');
        await navigator.share({
          title: 'Bhookasur Ka Food Tour',
          text: shareText,
          files: [file]
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Mobile fallback if Web Share is unavailable
    showToast('📋 Message copied! Opening Instagram DM...');
    window.location.href = 'instagram://direct';
    setTimeout(() => {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 select-none">

        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#D4380D]" />
            <span className="font-black text-sm uppercase tracking-wider text-[#0B1B48]">
              Share Food Tour Pass
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean White Card Preview Container */}
        <div className="p-3 sm:p-5 flex-1 overflow-y-auto flex flex-col items-center justify-start bg-slate-100/70">

          {/* Clean White Card */}
          <div
            id="bhookasur-single-message-preview"
            className="w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[380px] bg-white rounded-2xl p-3 sm:p-3.5 shadow-md border border-slate-200/90 flex flex-col text-left relative select-none"
          >
            {/* 1. Existing Hero Image on Top */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-xs bg-slate-100 relative mb-3 border border-slate-100">
              <img
                src={activeImageSrc}
                alt="Bhookasur Food Tour Feast"
                className="w-full h-full object-cover block"
              />
            </div>

            {/* 2. Text Message Directly Underneath in Clean Dark Typography */}
            <div className="text-left text-slate-800 space-y-1.5 text-xs sm:text-sm leading-relaxed px-1">
              <p className="font-bold text-[#0B1B48]">
                Maine Bhookasur ke saath Food Tour kiya!
              </p>
              <p className="text-slate-600 font-medium text-[11px] sm:text-xs">
                Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
              </p>

              <div className="pt-1 text-[11px] sm:text-xs">
                <span className="font-bold text-[#0B1B48]">👉 Join the Food Tour:</span>
                <br />
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline font-bold break-all cursor-pointer inline-block mt-0.5"
                >
                  {shareUrl}
                </a>
              </div>
            </div>

            {/* Message Delivery Meta (Timestamp) */}
            <div className="flex items-center justify-end mt-2 px-1 text-[10px] text-slate-400 font-medium">
              <span>{typeof window !== 'undefined' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '5:40 pm'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex flex-col gap-2.5">
          {/* Notification Toast */}
          {toastMessage && (
            <div className="py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Primary Social Share Buttons: WhatsApp Chat & Instagram DM */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              type="button"
              className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#25D366]/30"
            >
              <MessageCircle className="w-4 h-4 fill-white stroke-none shrink-0" />
              <span>WhatsApp Chat</span>
            </button>

            {/* Instagram */}
            <button
              onClick={handleShareInstagram}
              type="button"
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-[#FD1D1D]/25"
            >
              <Instagram className="w-4 h-4 stroke-[2.3] shrink-0" />
              <span>Instagram DM</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
