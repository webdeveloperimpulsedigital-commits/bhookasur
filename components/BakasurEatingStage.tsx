'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Volume2, VolumeX, ChevronUp, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Restaurant } from '@/lib/db';
import { getDishVisualAssets, getDishExactFlyingImage } from '@/lib/dishAssets';
import { getPreloadedUrl } from '@/lib/mediaPreloader';

export { getDishVisualAssets };

export function getFlyingDishAsset(dishName?: string, dishImage?: string): { image: string; isCircleCrop: boolean } {
  const visual = getDishVisualAssets(dishName, dishImage);
  return { image: visual.flyingImage || visual.plateImage || '/api/ai/dish-image?dish=Vada%20Pav', isCircleCrop: false };
}

interface BakasurEatingStageProps {
  dishName?: string;
  dishImage?: string;
  restaurantName?: string;
  restaurant?: Restaurant | null;
  feastingStage?: 1 | 2 | 3;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onBack?: () => void;
  onFeedMore?: () => void;
  onComplete?: () => void;
  onWatchVideo?: () => void;
  onPlayBite?: () => void;
}

interface FoodOption {
  id: string;
  name: string;
  image: string;
}

export const BakasurEatingStage: React.FC<BakasurEatingStageProps> = ({
  dishName = 'Food',
  dishImage,
  feastingStage = 1,
  soundEnabled = true,
  onToggleSound,
  onBack,
  onComplete,
  onPlayBite
}) => {
  const isSideAngle = feastingStage === 2;
  const TOTAL_FEEDS = 3;
  const [fedCount, setFedCount] = useState<number>(0);
  const [eatenDishIds, setEatenDishIds] = useState<string[]>([]);
  const [activeFlyingItems, setActiveFlyingItems] = useState<
    {
      id: string;
      image: string;
      name: string;
      startX: number;
      startY: number;
      targetX: number;
      targetY: number;
      rotation: number;
    }[]
  >([]);
  const [chompEffect, setChompEffect] = useState<boolean>(false);
  const [bitePopupText, setBitePopupText] = useState<string>('');
  
  const POPUP_MESSAGES = useMemo(() => [
    'YUMMM!',
    'WOWWW!',
    'MAZA AA GAYA!',
    'SWAAAD!',
    'GAZAB!'
  ], []);

  // Stage 1 uses front-facing video (front-eat-video.mp4), Stage 2 uses side-angle (side-view-final.mp4)
  const MAIN_VIDEO = getPreloadedUrl(
    isSideAngle
      ? '/images/final-frames/side-view-final.mp4?v=2'
      : '/images/final-frames/front-eat-video.mp4'
  );

  const [isEatingVideoPlaying, setIsEatingVideoPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Touch/Mouse Drag state for transparent PNG morsel following finger
  const [draggingFood, setDraggingFood] = useState<{ id: string; food: FoodOption; flyingPNG: string } | null>(null);
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const draggingFoodRef = useRef(draggingFood);
  draggingFoodRef.current = draggingFood;

  const dragCurrentPosRef = useRef(dragCurrentPos);
  dragCurrentPosRef.current = dragCurrentPos;

  const isSideAngleRef = useRef(isSideAngle);
  isSideAngleRef.current = isSideAngle;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onPlayBiteRef = useRef(onPlayBite);
  useEffect(() => {
    onPlayBiteRef.current = onPlayBite;
  }, [onPlayBite]);

  // Reset feeding progress state when feastingStage changes
  useEffect(() => {
    setFedCount(0);
    setEatenDishIds([]);
    setActiveFlyingItems([]);
    setDraggingFood(null);
    setChompEffect(false);
  }, [feastingStage]);

  // Prevent browser native scrolling or rubber-banding while swiping food on mobile devices
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';

    const el = containerRef.current;
    const preventTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    if (el) {
      el.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
      document.body.style.touchAction = originalTouchAction;
      if (el) {
        el.removeEventListener('touchmove', preventTouchScroll);
      }
    };
  }, []);

  // Global window listeners while dragging to guarantee smooth tracking and release on mobile
  useEffect(() => {
    if (!draggingFood) return;

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        if (e.cancelable) e.preventDefault();
        setDragCurrentPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      setDragCurrentPos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalEnd = () => {
      handleEndDrag();
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleGlobalEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
    };
  }, [draggingFood]);

  // Selected dish visual asset (plate or user-uploaded image)
  const selectedDishAsset = useMemo(() => {
    // If user provided custom upload / data URL, use it directly!
    if (dishImage && (dishImage.startsWith('data:') || dishImage.includes('upload'))) {
      return dishImage;
    }
    const visual = getDishVisualAssets(dishName, dishImage);
    return visual.plateImage || visual.flyingImage || '/api/ai/dish-image?dish=Vada%20Pav';
  }, [dishName, dishImage]);

  // Food Options: 3 Servings of the USER'S SELECTED DISH
  const foodOptions: FoodOption[] = useMemo(() => {
    return Array.from({ length: 3 }, (_, idx) => ({
      id: `dish_serving_${idx + 1}`,
      name: dishName || 'Selected Dish',
      image: selectedDishAsset
    }));
  }, [dishName, selectedDishAsset]);

  // Always keep background video muted so mobile browsers (iOS Safari) never block autoplay/playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      if (!isEatingVideoPlaying) {
        videoRef.current.currentTime = 0;
        videoRef.current.pause();
      }
    }
  }, [isEatingVideoPlaying]);

  // Smooth Arcade-Style Feeding
  const handleFeedFood = (
    food: FoodOption,
    clientX?: number,
    plateIndex?: number,
    plateEl?: HTMLElement | null,
    clientY?: number
  ) => {
    if (eatenDishIds.includes(food.id) || fedCount >= TOTAL_FEEDS) return;

    // Mark food as eaten instantly
    setEatenDishIds((prev) => [...prev, food.id]);
    const newFedCount = fedCount + 1;
    setFedCount(newFedCount);

    // Get 100% transparent PNG food morsel/cutout for smooth realistic mouth feeding
    const flyingPNG = getDishExactFlyingImage(food.name, food.image);

    // Ensure video is muted for immediate, unblocked play
    if (videoRef.current) {
      videoRef.current.muted = true;
    }

    if (isSideAngle) {
      // In Side-Angle mode: Morsels fly from Right side plate arc directly into mouth on the Left!
      // In side-view-final.mp4 (1080x1920), with object-cover object-left:
      // Exact mouth cavity in new video (1080x1920): X = 465px (43.05% of 1080), Y = 1035px (53.90% of 1920)
      let targetMouthX = 10;
      let targetMouthY = 32;
      let plateStartX = 140;
      let plateStartY = 0;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const W = rect.width;
        const H = rect.height;
        const centerX = W / 2;
        const centerY = H / 2;

        const videoAspect = 1080 / 1920; // 0.5625
        let videoW: number;
        let videoH: number;
        let videoLeft = 0; // pinned to left with object-left
        let videoTop = 0;

        if (W / H > videoAspect) {
          // Container is wider than 9:16 (video width fits, vertically centered)
          videoW = W;
          videoH = W / videoAspect;
          videoTop = (H - videoH) / 2;
        } else {
          // Container is taller than 9:16 (standard vertical phone screen)
          videoH = H;
          videoW = H * videoAspect;
          videoTop = 0;
        }

        const mouthPixelX = videoLeft + videoW * (465 / 1080);
        const mouthPixelY = videoTop + videoH * (1035 / 1920);

        targetMouthX = Math.round(mouthPixelX - centerX);
        targetMouthY = Math.round(mouthPixelY - centerY);

        if (plateEl) {
          const pRect = plateEl.getBoundingClientRect();
          const pCenterX = pRect.left + pRect.width / 2 - rect.left;
          const pCenterY = pRect.top + pRect.height / 2 - rect.top;
          plateStartX = Math.round(pCenterX - centerX);
          plateStartY = Math.round(pCenterY - centerY);
        } else if (typeof clientX === 'number' && typeof clientY === 'number' && clientX > 0 && clientY > 0) {
          plateStartX = Math.round(clientX - rect.left - centerX);
          plateStartY = Math.round(clientY - rect.top - centerY);
        } else {
          const pIdx = typeof plateIndex === 'number' ? plateIndex : 1;
          plateStartX = Math.round(W * 0.38);
          plateStartY = Math.round((pIdx - 1) * 85);
        }
      }

      const pIdx = typeof plateIndex === 'number' ? plateIndex : 1;
      const BURST_COUNT = 2;
      for (let i = 0; i < BURST_COUNT; i++) {
        setTimeout(() => {
          const itemId = `${food.id}_side_${Date.now()}_${i}_${Math.random()}`;
          const offsetStartX = plateStartX + (i === 0 ? 0 : (Math.random() > 0.5 ? 8 : -8));
          const offsetStartY = plateStartY + (i === 0 ? 0 : (Math.random() > 0.5 ? 10 : -10));
          const rotation = (i === 0 ? -12 : 12) + (Math.random() * 8 - 4);

          setActiveFlyingItems((prev) => [
            ...prev,
            {
              id: itemId,
              image: flyingPNG,
              name: food.name,
              startX: offsetStartX,
              startY: offsetStartY,
              targetX: targetMouthX,
              targetY: targetMouthY,
              rotation
            }
          ]);

          setTimeout(() => {
            setActiveFlyingItems((prev) => prev.filter((item) => item.id !== itemId));
          }, 520);
        }, i * 85);
      }
    } else {
      // Stage 1: Bottom to Top flying arc
      let baseOffsetX = 0;
      if (typeof clientX === 'number' && clientX > 0 && typeof window !== 'undefined' && window.innerWidth > 0) {
        baseOffsetX = clientX - window.innerWidth / 2;
      } else if (typeof plateIndex === 'number') {
        const count = foodOptions.length;
        baseOffsetX = (plateIndex - (count - 1) / 2) * 110;
      }

      const BURST_COUNT = 2;
      for (let i = 0; i < BURST_COUNT; i++) {
        setTimeout(() => {
          const itemId = `${food.id}_burst_${Date.now()}_${i}_${Math.random()}`;
          const offsetX = baseOffsetX + (i === 0 ? 0 : (Math.random() > 0.5 ? 12 : -12));
          const rotation = (baseOffsetX < 0 ? -1 : 1) * (i * 8 + 6);

          setActiveFlyingItems((prev) => [
            ...prev,
            {
              id: itemId,
              image: flyingPNG,
              name: food.name,
              startX: offsetX,
              startY: 240,
              targetX: 0,
              targetY: 45,
              rotation
            }
          ]);

          setTimeout(() => {
            setActiveFlyingItems((prev) => prev.filter((item) => item.id !== itemId));
          }, 520);
        }, i * 90);
      }
    }

    // USER REQUIREMENT: "when dish go in bhookasur mouth then he can start eating"
    // Trigger chewing animation, bite crunch sound, and reaction banner ONLY when morsel enters mouth (~380ms)
    const EAT_DELAY = isSideAngle ? 380 : 320;

    setTimeout(() => {
      // A. Play bite / crunch sound effect exactly when food enters mouth
      onPlayBiteRef.current?.();

      // B. Pick fun reaction message & trigger chomp effect
      const msg = POPUP_MESSAGES[fedCount % POPUP_MESSAGES.length];
      setBitePopupText(msg);
      setChompEffect(true);

      // C. Start chewing animation video NOW
      setIsEatingVideoPlaying(true);
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((err) => {
          console.warn('Video play prevented:', err);
        });
      }

      // D. Device haptic bump if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    }, EAT_DELAY);

    // Hide reaction popup banner after chewing
    setTimeout(() => setChompEffect(false), EAT_DELAY + 1400);

    // If all required feeds completed, complete stage cleanly after chewing
    if (newFedCount >= TOTAL_FEEDS) {
      setTimeout(() => {
        onCompleteRef.current?.();
      }, EAT_DELAY + 1750);
    } else {
      // Reset video to open mouth ready state after chewing this bite
      setTimeout(() => {
        setIsEatingVideoPlaying(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }, EAT_DELAY + 1750);
    }
  };

  // Drag / Swipe handlers for mobile & desktop
  const handleStartDrag = (food: FoodOption, clientX: number, clientY: number) => {
    if (fedCount >= TOTAL_FEEDS || eatenDishIds.includes(food.id)) return;

    const flyingPNG = getDishExactFlyingImage(food.name, food.image);
    setDraggingFood({ id: food.id, food, flyingPNG });
    touchStartPosRef.current = { x: clientX, y: clientY };
    setDragCurrentPos({ x: clientX, y: clientY });
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!draggingFood) return;
    setDragCurrentPos({ x: clientX, y: clientY });
  };

  const handleEndDrag = () => {
    const currentDrag = draggingFoodRef.current;
    if (!currentDrag) return;

    const currentPos = dragCurrentPosRef.current;
    const deltaY = currentPos.y - touchStartPosRef.current.y;
    const deltaX = currentPos.x - touchStartPosRef.current.x;

    if (isSideAngleRef.current) {
      // In Side-Angle mode: Dragging LEFT towards mouth triggers feeding
      if (deltaX < -25 || currentPos.x < (typeof window !== 'undefined' ? window.innerWidth * 0.65 : 300)) {
        const pIdx = foodOptions.findIndex((f) => f.id === currentDrag.food.id);
        handleFeedFood(
          currentDrag.food,
          touchStartPosRef.current.x,
          pIdx >= 0 ? pIdx : 1,
          null,
          touchStartPosRef.current.y
        );
      }
    } else {
      // In Stage 1 mode: Dragging UP towards mouth triggers feeding
      // Highly responsive: even a small 20px swipe up or release in top 72% triggers feeding
      if (deltaY < -20 || currentPos.y < (typeof window !== 'undefined' ? window.innerHeight * 0.72 : 450)) {
        handleFeedFood(currentDrag.food, touchStartPosRef.current.x);
      }
    }

    setDraggingFood(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
      onMouseUp={handleEndDrag}
      onTouchMove={(e) => {
        if (e.touches && e.touches[0]) {
          handleMoveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      onTouchEnd={handleEndDrag}
      style={{ touchAction: 'none' }}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#031058] select-none touch-none overscroll-none"
    >
      {/* 1. BACKGROUND VIDEO LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <video
          key={MAIN_VIDEO}
          ref={videoRef}
          src={MAIN_VIDEO}
          playsInline
          autoPlay={false}
          loop={false}
          muted
          preload="auto"
          onLoadedMetadata={() => {
            if (videoRef.current && !isEatingVideoPlaying) {
              videoRef.current.muted = true;
              videoRef.current.currentTime = 0;
              videoRef.current.pause();
            }
          }}
          className={`w-full h-full object-cover ${
            isSideAngle ? 'object-left' : 'object-center'
          } relative z-0 transition-opacity duration-300`}
        />

        {/* Clean top and bottom gradient overlays - no blue side tint */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/75 via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/75 via-black/25 to-transparent z-10 pointer-events-none" />
      </div>

      {/* 2. TOP LEFT BACK BUTTON (Identical to Frame 2, 7, 8) */}
      {onBack && (
        <button
          id="btn-eating-stage-back"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          type="button"
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          <span>Back</span>
        </button>
      )}


      {/* Center flex container for rapid flying food morsels */}
      <div className="relative flex-1 w-full min-h-0 pointer-events-none z-30 flex flex-col items-center justify-center">
        {activeFlyingItems.map((item) => (
          <div key={item.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div
              style={
                {
                  '--start-x': `${item.startX}px`,
                  '--start-y': `${item.startY}px`,
                  '--target-x': `${item.targetX}px`,
                  '--target-y': `${item.targetY}px`,
                  '--start-rot': `${item.rotation}deg`
                } as React.CSSProperties
              }
              className={`${
                isSideAngle
                  ? 'w-20 h-20 sm:w-26 sm:h-26 animate-smooth-fly-side'
                  : 'w-20 h-20 sm:w-28 sm:h-28 animate-smooth-fly'
              } flex items-center justify-center`}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.95)]"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Active Touch/Mouse Dragged Transparent PNG Food Piece Following Finger */}
      {draggingFood && (
        <div
          style={{
            position: 'fixed',
            left: `${dragCurrentPos.x}px`,
            top: `${dragCurrentPos.y}px`,
            transform: 'translate(-50%, -50%) scale(1.25)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
          className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
        >
          <img
            src={draggingFood.flyingPNG}
            alt="Dragging Food Morsel PNG"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Floating Animated Reaction Text (No Boxes, Pure Kinetic Comic Typography) */}
      {chompEffect && bitePopupText && (
        <div
          key={bitePopupText}
          className={`absolute inset-x-0 ${
            isSideAngle
              ? 'top-[22%] xs:top-[25%] sm:top-[28%] md:left-[20%]'
              : 'top-[20%] xs:top-[22%] sm:top-[24%]'
          } flex items-center justify-center pointer-events-none z-50`}
        >
          <div className="animate-punchy-pop flex items-center justify-center filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.95)]">
            <span
              className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black tracking-wider uppercase select-none italic text-center text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#FFFFFF',
                WebkitTextStroke: '2px #000000',
                textShadow: '0 4px 18px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.85)'
              }}
            >
              {bitePopupText}
            </span>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE SWIPE AREA & FOOD PLATES */}
      {isSideAngle ? (
        /* SIDE-ANGLE MODE: Food Plates on the RIGHT side, Bhookasur on the LEFT */
        <>
          {/* Swipe Hint indicator positioned in clean space above plates on the right */}
          {!draggingFood && fedCount < TOTAL_FEEDS && (
            <div className="absolute right-3 xs:right-4 sm:right-6 top-[20%] sm:top-[22%] z-30 pointer-events-none animate-pulse">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/25 text-white font-black text-[11px] xs:text-xs sm:text-sm tracking-wide shadow-xl select-none whitespace-nowrap">
                <ChevronLeft className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-400 animate-bounce" />
                <span>Swipe karke khilao</span>
              </div>
            </div>
          )}

          {/* Right side floating vertical stack of 3 food plates - centered vertically on screen */}
          <div className="absolute right-3 xs:right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 xs:gap-5 select-none touch-none">
            {foodOptions.map((food, index) => {
              const isEaten = eatenDishIds.includes(food.id);

              return (
                <div
                  key={food.id}
                  style={{ touchAction: 'none' }}
                  onMouseDown={(e) => handleStartDrag(food, e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleStartDrag(food, e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onClick={(e) => handleFeedFood(food, e.clientX, index, e.currentTarget, e.clientY)}
                  className={`group relative w-14 h-14 xs:w-16 xs:h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.85)] border-[2.5px] transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 bg-slate-950 touch-none select-none ${
                    isEaten
                      ? 'border-white/30 opacity-40 grayscale-[50%]'
                      : 'border-amber-400 hover:border-amber-300 hover:scale-105 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                  }`}
                >
                  <img
                    src={food.image}
                    alt={food.name}
                    className="w-full h-full object-cover rounded-full pointer-events-none transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = selectedDishAsset || '/api/ai/dish-image?dish=Vada%20Pav';
                    }}
                  />

                  {isEaten && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-[1px] rounded-full">
                      <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 fill-slate-950 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="relative z-30 px-4 pb-2 w-full shrink-0" />
        </>
      ) : (
        /* NORMAL STAGE 1 MODE: Food Plates in bottom row */
        <div className="relative z-30 px-3 xs:px-4 pb-[max(1.25rem,env(safe-area-inset-bottom,20px))] sm:pb-6 flex flex-col items-center justify-end w-full shrink-0 gap-1.5 touch-none select-none">
          {/* 3 Food Item Ceramic Plates Row */}
          <div className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-6 w-full max-w-2xl mx-auto pt-0.5 pb-0.5 touch-none">
            {foodOptions.map((food, index) => {
              const isEaten = eatenDishIds.includes(food.id);

              return (
                <div
                  key={food.id}
                  style={{ touchAction: 'none' }}
                  onMouseDown={(e) => handleStartDrag(food, e.clientX, e.clientY)}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleStartDrag(food, e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onClick={(e) => handleFeedFood(food, e.clientX, index, e.currentTarget, e.clientY)}
                  className="group relative w-[72px] h-[72px] xs:w-20 xs:h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.9)] border-[2.5px] border-amber-400/80 bg-slate-950 cursor-grab active:cursor-grabbing transition-all duration-150 flex items-center justify-center shrink-0 active:scale-95 touch-none select-none"
                >
                  <img
                    src={food.image}
                    alt={food.name}
                    className={`w-full h-full object-cover rounded-full pointer-events-none transition-transform duration-150 group-hover:scale-105 ${
                      isEaten ? 'opacity-40 grayscale-[40%]' : 'opacity-100'
                    }`}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = selectedDishAsset || '/api/ai/dish-image?dish=Vada%20Pav';
                    }}
                  />

                  {isEaten && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[1px]">
                      <CheckCircle2 className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 text-emerald-400 fill-slate-950 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Swipe Hint Badge BELOW the plates so it NEVER touches Bhookasur's mouth */}
          {!draggingFood && fedCount < TOTAL_FEEDS && (
            <div className="pointer-events-none z-30 animate-pulse pt-0.5">
              <div className="flex items-center justify-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-black text-[11px] xs:text-xs sm:text-sm tracking-wide shadow-xl select-none">
                <span>Swipe karke khilao</span>
                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-bounce" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline Keyframes for Smooth Realistic Food Flight into Mouth */}
      <style jsx global>{`
        @keyframes smoothFlyToMouth {
          0% {
            transform: translate(var(--start-x, 0px), 240px) scale(0.9) rotate(var(--start-rot, 0deg));
            opacity: 1;
          }
          45% {
            transform: translate(calc(var(--start-x, 0px) * 0.5), 110px) scale(1.2) rotate(calc(var(--start-rot, 0deg) * 0.5));
            opacity: 1;
          }
          80% {
            transform: translate(0px, 60px) scale(0.3) rotate(0deg);
            opacity: 0.85;
          }
          100% {
            transform: translate(0px, 45px) scale(0.02) rotate(0deg);
            opacity: 0;
          }
        }
        .animate-smooth-fly {
          animation: smoothFlyToMouth 0.52s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          will-change: transform, opacity;
        }

        @keyframes smoothFlyToMouthSide {
          0% {
            transform: translate(var(--start-x, 140px), var(--start-y, 0px)) scale(0.9) rotate(var(--start-rot, 0deg));
            opacity: 1;
          }
          45% {
            /* Arcs upward in mid-air towards mouth, scaling up like stage 1 */
            transform: translate(
              calc(var(--start-x, 140px) * 0.45 + var(--target-x, 10px) * 0.55),
              calc(var(--start-y, 0px) * 0.45 + var(--target-y, 32px) * 0.55 - 45px)
            ) scale(1.22) rotate(calc(var(--start-rot, 0deg) * 0.5));
            opacity: 1;
          }
          80% {
            /* Right at the mouth entrance */
            transform: translate(
              calc(var(--target-x, 10px) + 10px),
              calc(var(--target-y, 32px) - 2px)
            ) scale(0.35) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            /* Plunges directly into the mouth opening and vanishes */
            transform: translate(var(--target-x, 10px), var(--target-y, 32px)) scale(0.04) rotate(0deg);
            opacity: 0;
          }
        }
        @keyframes punchyPop {
          0% {
            transform: scale(0.35) translateY(20px) rotate(-6deg);
            opacity: 0;
          }
          20% {
            transform: scale(1.25) translateY(-8px) rotate(-3deg);
            opacity: 1;
          }
          35% {
            transform: scale(1.02) translateY(-14px) rotate(2deg);
            opacity: 1;
          }
          75% {
            transform: scale(1.0) translateY(-26px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.85) translateY(-48px) rotate(4deg);
            opacity: 0;
          }
        }
        .animate-punchy-pop {
          animation: punchyPop 1.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          will-change: transform, opacity;
        }
        .animate-smooth-fly-side {
          animation: smoothFlyToMouthSide 0.44s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};
