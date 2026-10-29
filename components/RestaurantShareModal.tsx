'use client';

import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Instagram, Facebook, ArrowRight } from 'lucide-react';

interface RestaurantShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  restaurantName: string;
  cityName: string;
}

export const RestaurantShareModal: React.FC<RestaurantShareModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  restaurantName,
  cityName
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const shareUrl = `${baseUrl}/?ref=rest_share&rest=${encodeURIComponent(restaurantName)}&city=${encodeURIComponent(cityName || 'Pune')}`;

  const shareMessage = `🔥 Mene Bhookasur ke live Food Tour ke liye restaurant chun liya hai! 😋\n\n📍 Restaurant: ${restaurantName} (${cityName || 'Pune'})\n\nKya Bhookasur yahan khana kha kar santusht hoga? Tum bhi apna favourite food spot batao aur Live Food Tour jeeto! 🏆\n\nBhookasur ke saath khelo yahan 👇\n${shareUrl}`;

  // WhatsApp share link
  const handleShareWhatsApp = () => {
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
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Bhookasur Ka Food Tour - ${restaurantName}`,
          text: shareMessage,
          url: shareUrl
        });
      } catch {
        handleShareWhatsApp();
      }
    } else {
      handleShareWhatsApp();
    }
  };

  // Instagram share: copies message & opens Instagram Direct inbox
  const handleInstagramShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (isMobile) {
      window.location.href = 'instagram://direct';
      setTimeout(() => {
        window.open('https://www.instagram.com/direct/inbox/', '_blank');
      }, 1000);
    } else {
      window.open('https://www.instagram.com/direct/inbox/', '_blank');
    }
  };

  // Copy link & message
  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 relative flex flex-col gap-4 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          id="btn-restaurant-share-close"
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-left space-y-1 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 text-[#D4380D] text-[11px] font-black uppercase tracking-wider">
            <Share2 className="w-3 h-3 stroke-[2.5]" />
            <span>Restaurant Selected!</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#0B1B48] leading-tight">
            Doston ke saath share karo!
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            Apne favourite restaurant <strong className="text-[#0B1B48]">{restaurantName}</strong> ko social media par chat me share karo aur unhe challenge do!
          </p>
        </div>

        {/* Restaurant Badge Preview */}
        <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-[#0B1B48] truncate">{restaurantName}</h4>
              <p className="text-[11px] font-bold text-[#D4380D]">{cityName || 'Pune'}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 italic line-clamp-2 pt-1 border-t border-orange-200/60">
            &ldquo;Mene Bhookasur ke live Food Tour ke liye yeh restaurant chuna hai...&rdquo;
          </p>
        </div>

        {/* Social Share Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* WhatsApp Direct */}
          <button
            id="btn-restaurant-share-whatsapp"
            onClick={handleShareWhatsApp}
            type="button"
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#25D366]/30 active:scale-95 transition-all cursor-pointer border-0"
          >
            <MessageCircle className="w-4 h-4 fill-white stroke-none" />
            <span>WhatsApp Chat</span>
          </button>

          {/* Share to Chat (All Apps) */}
          <button
            id="btn-restaurant-share-native"
            onClick={handleNativeShare}
            type="button"
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#0047BA] hover:bg-[#003894] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-[#0047BA]/30 active:scale-95 transition-all cursor-pointer border-0"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>Share to Chat</span>
          </button>

          {/* Instagram Share */}
          <button
            id="btn-restaurant-share-instagram"
            onClick={handleInstagramShare}
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer border-0"
          >
            <Instagram className="w-4 h-4" />
            <span>Instagram</span>
          </button>

          {/* Facebook Share */}
          <button
            id="btn-restaurant-share-facebook"
            onClick={handleShareFacebook}
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#1877F2] hover:bg-[#1567d3] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer border-0"
          >
            <Facebook className="w-4 h-4 fill-white stroke-none" />
            <span>Facebook</span>
          </button>
        </div>

        {/* Copy Message / Link Action */}
        <button
          id="btn-restaurant-share-copy-link"
          onClick={handleCopyLink}
          type="button"
          className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-slate-200"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span className="text-emerald-700 font-black">Message & Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-600" />
              <span>Copy Message & Game Link</span>
            </>
          )}
        </button>

        {/* Divider & Continue Action */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <button
            id="btn-restaurant-share-continue"
            onClick={onContinue}
            type="button"
            className="w-full py-3.5 px-5 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
          >
            <span>AAGE BADHO (SELECT DISH)</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            id="btn-restaurant-share-dismiss"
            onClick={onClose}
            type="button"
            className="text-xs text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
          >
            Abhi nahi, sirf yahan ruko
          </button>
        </div>
      </div>
    </div>
  );
};
