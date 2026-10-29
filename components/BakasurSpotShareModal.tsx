'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Instagram, Facebook, Sparkles, ExternalLink } from 'lucide-react';
import { BakasurShareCardModal } from './BakasurShareCardModal';
import { withBasePath } from '@/lib/basePath';

interface BakasurSpotShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName: string;
  cityName: string;
  dishName: string;
  dishImage?: string;
  participationId?: string;
}

export const BakasurSpotShareModal: React.FC<BakasurSpotShareModalProps> = ({
  isOpen,
  onClose,
  restaurantName,
  cityName,
  dishName,
  dishImage,
  participationId = 'BKT-' + Math.floor(100000 + Math.random() * 900000)
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const preloadedFileRef = React.useRef<File | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    fetch(withBasePath('/images/final-frames/food-tour-img-gastrium.jpg'))
      .then(res => res.blob())
      .then(blob => {
        if (isMounted && blob && blob.size > 1000) {
          preloadedFileRef.current = new File([blob], 'bhookasur-food-tour.jpg', { type: 'image/jpeg' });
        }
      })
      .catch(e => console.warn('Preload spot share pass error:', e));
    return () => { isMounted = false; };
  }, []);

  if (!isOpen) return null;

  // Base URL for the campaign
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const shareUrl = `${baseUrl}/?ref=share&rest=${encodeURIComponent(restaurantName)}&dish=${encodeURIComponent(dishName)}&city=${encodeURIComponent(cityName)}`;

  // Formatted share message with emojis (dish and spot removed)
  const shareMessage = `🔥 Mene Bhookasur ko mera favourite food spot khilaya! 😋\n\n🎟️ Dekho Mera Foodie Pass:\n${baseUrl}/pass\n\nBhookasur ki bhookh abhi bhi shant nahi hui! Kya tum uski bhookh mita sakte ho? Apna favourite food spot batao aur Live Food Tour jeeto! 🏆\n\nPlay & Challenge Bhookasur here 👇\n${shareUrl}`;

  // WhatsApp share link
  const handleShareWhatsApp = async () => {
    // If on Laptop, Desktop PC, or Tablet (including when tested in DevTools mobile mode on PC)
    const isDesktopOrTablet = typeof window !== 'undefined' && (
      (typeof window.screen !== 'undefined' && (window.screen.width >= 1024 || window.screen.height >= 1024)) ||
      (typeof navigator !== 'undefined' && ((navigator as any).platform || '').toLowerCase().includes('win')) ||
      (typeof navigator !== 'undefined' && ((navigator as any).platform || '').toLowerCase().includes('mac')) ||
      window.innerWidth >= 768 ||
      /windows|macintosh|cros|ipad|tablet/i.test(navigator?.userAgent || '')
    );

    if (isDesktopOrTablet) {
      const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const file = preloadedFileRef.current;
    if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Bhookasur Ka Food Tour - ${restaurantName}`,
          text: shareMessage
        });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
      }
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  // Facebook share link
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareMessage)}`;
    window.open(url, '_blank');
  };

  // Native share sheet (WhatsApp, Instagram DM, Telegram, Snapchat, SMS, etc.)
  const handleNativeShare = async () => {
    const file = preloadedFileRef.current;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Bhookasur Ka Food Tour - ${restaurantName}`,
            text: shareMessage
          });
          return;
        }

        await navigator.share({
          title: `Bhookasur Ka Food Tour - ${restaurantName}`,
          text: shareMessage,
          url: shareUrl
        });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        handleShareWhatsApp();
      }
    } else {
      handleShareWhatsApp();
    }
  };

  // Copy full message and link
  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareMessage);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareMessage;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-slate-900">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#071746] to-[#0B1B48] text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#D4380D] flex items-center justify-center text-white shadow-md">
                <Share2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  Apna Food Spot Share Karo!
                </h3>
                <p className="text-[11px] sm:text-xs text-amber-300 font-semibold">
                  Doston ko bulao aur Bhookasur se milwao 😋
                </p>
              </div>
            </div>

            <button
              id="btn-spot-share-close"
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
            {/* Spot Card Preview */}
            <div className="bg-[#F8FAFC] border-2 border-slate-200/90 rounded-2xl p-3 sm:p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#0B1B48] text-white flex flex-col items-center justify-center font-black text-xl shrink-0 shadow-sm">
                📍
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-black text-[#D4380D] uppercase tracking-wider">
                  AAPKA RECOMMENDED SPOT
                </div>
                <div className="text-sm sm:text-base font-black text-[#0B1B48] truncate">
                  {restaurantName}
                </div>
                <div className="text-xs font-bold text-slate-600 truncate flex items-center gap-1 mt-0.5">
                  <span>🍽️ {dishName}</span>
                  <span>•</span>
                  <span>{cityName}</span>
                </div>
              </div>
            </div>

            {/* Social Share Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp */}
              <button
                id="btn-spot-share-whatsapp"
                onClick={handleShareWhatsApp}
                type="button"
                className="py-3 px-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/30 active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-white stroke-none shrink-0" />
                <span>WhatsApp</span>
              </button>

              {/* Instagram Story / Card */}
              <button
                id="btn-spot-share-instagram"
                onClick={() => setIsStoryModalOpen(true)}
                type="button"
                className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#FD1D1D]/25 active:scale-95 transition-all cursor-pointer"
              >
                <Instagram className="w-5 h-5 stroke-[2.3] shrink-0" />
                <span>Instagram</span>
              </button>

              {/* Facebook */}
              <button
                id="btn-spot-share-facebook"
                onClick={handleShareFacebook}
                type="button"
                className="py-3 px-3.5 rounded-2xl bg-[#1877F2] hover:bg-[#156cdb] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#1877F2]/30 active:scale-95 transition-all cursor-pointer"
              >
                <Facebook className="w-5 h-5 fill-white stroke-none shrink-0" />
                <span>Facebook</span>
              </button>

              {/* Share to Chat / More Apps */}
              <button
                id="btn-spot-share-native"
                onClick={handleNativeShare}
                type="button"
                className="py-3 px-3.5 rounded-2xl bg-[#0B1B48] hover:bg-[#122763] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0B1B48]/30 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[2.5] shrink-0 text-amber-300" />
                <span>Share to Chat</span>
              </button>
            </div>

            {/* Copy Link / Full Message Option */}
            <div className="pt-1">
              <button
                id="btn-spot-share-copy-link"
                onClick={handleCopyLink}
                type="button"
                className={`w-full py-3 px-4 rounded-2xl border-2 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Message & Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Copy Message & Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Message Preview Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 leading-relaxed text-left relative">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Shared Message Preview:
              </div>
              <p className="line-clamp-3 italic">
                &ldquo;Mene Bhookasur ko mera favourite food spot khilaya! Dekho Mera Foodie Pass...&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Instagram Canvas Story Card Modal */}
      {isStoryModalOpen && (
        <BakasurShareCardModal
          isOpen={isStoryModalOpen}
          onClose={() => setIsStoryModalOpen(false)}
          restaurantName={restaurantName}
          cityName={cityName}
          dishName={dishName}
          dishImage={dishImage}
          participationId={participationId}
        />
      )}
    </>
  );
};
