'use client';

import React, { useRef, useState, useEffect } from 'react';
import { withBasePath } from '@/lib/basePath';

interface VideoTransitionOverlayProps {
  videoUrl: string;
  desktopVideoUrl?: string;
  buttonText?: string;
  onComplete: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const VideoTransitionOverlay: React.FC<VideoTransitionOverlayProps> = ({
  videoUrl,
  desktopVideoUrl,
  buttonText,
  onComplete,
  soundEnabled,
  onToggleSound
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(() => withBasePath(videoUrl));

  useEffect(() => {
    const updateSrc = () => {
      // Tablet and desktop screens have width >= 640px (including iPads at 768px+)
      const isTabletOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 640;

      let targetSrc = videoUrl;
      if (isTabletOrDesktop) {
        if (desktopVideoUrl) {
          targetSrc = desktopVideoUrl;
        } else if (videoUrl.includes('Bhookasur-Food-Eating')) {
          targetSrc = '/images/final-frames/Bhookasur-Food-Eating-desktop.mp4';
        }
      } else {
        // Mobile: Prefer optimized lightweight 2.3 MB video over the heavy 12.7 MB export
        if (videoUrl.includes('Bhookasur-Food-Eating-final')) {
          targetSrc = '/images/final-frames/Bhookasur-Food-Eating.mp4';
        }
      }
      setCurrentSrc(withBasePath(targetSrc));
    };

    updateSrc();
    window.addEventListener('resize', updateSrc);
    return () => window.removeEventListener('resize', updateSrc);
  }, [videoUrl, desktopVideoUrl]);

  const handleAction = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    onComplete();
  };

  const markLoadedAndPlay = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    }
  };

  useEffect(() => {
    setIsNavigating(false);
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = !soundEnabled;
    video.muted = !soundEnabled;
    video.playsInline = true;

    if (video.readyState >= 1) {
      markLoadedAndPlay();
    }

    // Safety timeout: Never keep the user waiting on a black spinner screen for more than 600ms
    const safetyTimer = setTimeout(() => {
      markLoadedAndPlay();
    }, 600);

    video.play().then(() => {
      setIsVideoLoaded(true);
    }).catch(() => {
      video.muted = true;
      video.play().then(() => setIsVideoLoaded(true)).catch(() => {});
    });

    return () => {
      clearTimeout(safetyTimer);
    };
  }, [currentSrc, soundEnabled]);

  return (
    <div
      onClick={handleAction}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black select-none cursor-pointer animate-in fade-in duration-200"
    >
      {/* Full-width / Full-screen Video Player */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 z-0 gap-3">
            <div className="w-9 h-9 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Loading scene...</span>
          </div>
        )}
        <video
          key={currentSrc}
          ref={videoRef}
          src={currentSrc}
          playsInline
          autoPlay
          preload="auto"
          muted={!soundEnabled}
          onEnded={handleAction}
          onLoadedMetadata={markLoadedAndPlay}
          onLoadedData={markLoadedAndPlay}
          onCanPlay={markLoadedAndPlay}
          onPlaying={markLoadedAndPlay}
          onTimeUpdate={() => {
            if (!isVideoLoaded) setIsVideoLoaded(true);
          }}
          onError={() => {
            console.error('VideoTransitionOverlay error loading:', currentSrc);
            const fallbackSrc = withBasePath('/images/final-frames/Bhookasur-Food-Eating.mp4');
            if (videoRef.current && currentSrc !== fallbackSrc) {
              setCurrentSrc(fallbackSrc);
              videoRef.current.load();
              videoRef.current.play().catch(() => {});
            } else {
              handleAction();
            }
          }}
          className={`w-full h-full object-contain object-center relative z-10 transition-opacity duration-150 ${
            isVideoLoaded ? 'opacity-100' : 'opacity-80'
          }`}
        />
      </div>
    </div>
  );
};

