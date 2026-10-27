'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { withBasePath } from '@/lib/basePath';

interface Frame6PostEatingProps {
  onWatchVideo: () => void;
  onBack?: () => void;
}

export const Frame6PostEating: React.FC<Frame6PostEatingProps> = ({
  onWatchVideo,
  onBack
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const tryPlay = () => {
      setIsVideoLoaded(true);
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    if (video.readyState >= 1) {
      tryPlay();
    }

    // Safety timeout: Never trap user on loading spinner
    const timer = setTimeout(() => {
      setIsVideoLoaded(true);
      tryPlay();
    }, 400);

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    video.addEventListener('playing', tryPlay);

    tryPlay();

    return () => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('loadeddata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
      video.removeEventListener('playing', tryPlay);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-[#07153B] overflow-hidden relative">
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>Back</span>
        </button>
      )}

      {/* Video Section: Left on Desktop (lg:w-1/2 lg:h-full), Top on Mobile/Tablet */}
      <div className="relative w-full lg:w-1/2 h-[62%] xs:h-[64%] sm:h-[60%] lg:h-full bg-[#081B4B] flex items-center justify-center overflow-hidden shrink-0">
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-0 gap-2.5">
            <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Loading video...</span>
          </div>
        )}
        <video
          ref={videoRef}
          src={withBasePath('/images/final-frames/Food-Around-Bhookasur.mp4')}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => setIsVideoLoaded(true)}
          onLoadedData={() => setIsVideoLoaded(true)}
          onCanPlay={() => setIsVideoLoaded(true)}
          onPlaying={() => setIsVideoLoaded(true)}
          className="w-full h-full object-cover object-top relative z-10 transition-opacity duration-200 opacity-100"
        />
        <div className="absolute bottom-0 inset-x-0 h-10 lg:hidden bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-20" />
      </div>

      {/* Content Section: Right on Desktop (lg:w-1/2 lg:h-full), Bottom on Mobile/Tablet */}
      <div className="w-full lg:w-1/2 flex-1 lg:h-full min-h-0 bg-white px-4 py-4 xs:px-5 xs:py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-12 flex flex-col justify-between items-center text-center shadow-[0_-12px_35px_rgba(0,0,0,0.18)] lg:shadow-none z-10 shrink-0">
        <div className="hidden lg:block w-full h-4" />
        <div className="w-full max-w-md mx-auto my-auto flex flex-col justify-center items-center space-y-2 xs:space-y-2.5">
          <h1 className="text-[22px] xs:text-[25px] sm:text-[30px] md:text-[36px] font-black text-black tracking-tight leading-[1.18] text-center">
            Itne se Bhookasur ka kya pet bharega?
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-black font-bold leading-snug text-center">
            Aage pure shehar ka menu saaf kar diya.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="w-full max-w-md mx-auto pt-2 pb-1 md:pb-4 flex flex-col gap-2.5 sm:gap-3">
          <button
            onClick={onWatchVideo}
            type="button"
            className="w-full py-3.5 xs:py-4 sm:py-4 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] active:bg-[#a12908] text-white font-black text-base xs:text-lg sm:text-xl uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all cursor-pointer border-0"
          >
            DEKHO BHOOKASUR NE AUR KYA KHAYA
          </button>
        </div>
      </div>
    </div>
  );
};
