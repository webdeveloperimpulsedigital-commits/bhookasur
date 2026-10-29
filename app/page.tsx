'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BakasurVideoPlayer } from '@/components/BakasurVideoPlayer';
import { BakasurEatingStage } from '@/components/BakasurEatingStage';
import { Frame1Welcome } from '@/components/frames/Frame1Welcome';
import { Frame2RestaurantSearch } from '@/components/frames/Frame2RestaurantSearch';
import { Frame3DishSelection } from '@/components/frames/Frame3DishSelection';
import { Frame5EatingBegins } from '@/components/frames/Frame5EatingBegins';
import { Frame6FeedingLoop } from '@/components/frames/Frame6FeedingLoop';
import { Frame6PostEating } from '@/components/frames/Frame6PostEating';
import { Frame6RandomFoodSpot } from '@/components/frames/Frame6RandomFoodSpot';
import { FoodTourSpot, getRandomFoodSpot } from '@/lib/foodTourSpots';
import { Frame7AcidityAppears } from '@/components/frames/Frame7AcidityAppears';
import { Frame8HelpBakasur } from '@/components/frames/Frame8HelpBakasur';
import { Frame9GastriumAnimation } from '@/components/frames/Frame9GastriumAnimation';
import { Frame10Submitted } from '@/components/frames/Frame10Submitted';
import { Frame11LiveMap } from '@/components/frames/Frame11LiveMap';
import { Frame12Registration } from '@/components/frames/Frame12Registration';
import { Frame13Confirmation } from '@/components/frames/Frame13Confirmation';
import { VideoTransitionOverlay } from '@/components/VideoTransitionOverlay';
import type { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName } from '@/lib/dishAssets';
import { getOrCreateSessionId, resetSessionId, trackUserStep, getOrCreateUserId, setStoredUserMobile } from '@/lib/tracker';
import { preloadUpcomingFrameMedia } from '@/lib/mediaPreloader';
import { withBasePath } from '@/lib/basePath';
import { getConsentedLocation, saveConsentedLocation, hasConsentFor } from '@/lib/cookieConsent';

export type FrameNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export default function CampaignPage() {
  // Campaign State
  const [currentFrame, setCurrentFrame] = useState<FrameNumber>(1);
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null>(null);
  const [firstRoundRestaurant, setFirstRoundRestaurant] = useState<Restaurant | null>(null);
  const [firstRoundDish, setFirstRoundDish] = useState<Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [feastingStage, setFeastingStage] = useState<1 | 2 | 3>(1);
  const [registeredMobile, setRegisteredMobile] = useState<string>('');
  const [participationId, setParticipationId] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regError, setRegError] = useState<string>('');
  const [tourSpotRound, setTourSpotRound] = useState<number>(0); // 0 = trailer, 1 = spot 1, 2 = spot 2
  const [currentTourSpot, setCurrentTourSpot] = useState<FoodTourSpot | null>(null);
  const [visitedSpotIds, setVisitedSpotIds] = useState<string[]>([]);

  // Full-width Video Interstitial Transition State
  const [activeTransitionVideo, setActiveTransitionVideo] = useState<{
    videoUrl: string;
    desktopVideoUrl?: string;
    buttonText: string;
    nextFrame: FrameNumber;
    onVideoComplete?: () => void;
  } | null>(null);

  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const triggerFrameTransition = useCallback((targetFrame: FrameNumber, onTransitionComplete?: () => void, customMsg?: string) => {
    setCurrentFrame(targetFrame);
    if (onTransitionComplete) onTransitionComplete();
  }, []);

  // Audio FX generator (Disabled - All frames muted)
  const playSound = useCallback((_type?: string) => { }, []);

  // Initialize Session on Mount
  useEffect(() => {
    const sess = getOrCreateSessionId();
    const savedLoc = getConsentedLocation();
    if (savedLoc?.city && !selectedCity) setSelectedCity(savedLoc.city);
    if (savedLoc?.coords && !userCoords) setUserCoords(savedLoc.coords);
    setSessionId(sess);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const f = parseInt(params.get('frame') || '', 10);
      if (f >= 1 && f <= 13) {
        setCurrentFrame(f as FrameNumber);
      }
    }

    trackUserStep({
      sessionId: sess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Frame 1: Welcome Screen Opened',
      stepNumber: 1,
      userLocation: selectedCity
    });

    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [selectedCity]);

  // Preload upcoming animation frames and media into memory and cache
  useEffect(() => {
    preloadUpcomingFrameMedia(currentFrame);
    if (selectedCity && hasConsentFor('location')) {
      saveConsentedLocation(selectedCity, userCoords);
    }
  }, [currentFrame]);

  // Location Detection: ONLY if user explicitly allows location access
  useEffect(() => {
    let isMounted = true;

    const fetchIpFallback = async () => {
      try {
        const res = await fetch(withBasePath('/api/location'));
        const data = await res.json();
        if (isMounted && data.success) {
          if (data.userCoords && !userCoords) setUserCoords(data.userCoords);
          if (data.detectedCity?.name && !selectedCity) setSelectedCity(data.detectedCity.name);
        }
      } catch {}
    };

    if (typeof window === 'undefined' || !navigator.geolocation) {
      fetchIpFallback();
      return;
    }

    // Check permission status if permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (!isMounted) return;
        if (result.state === 'denied') {
          fetchIpFallback();
          return;
        }
      }).catch(() => {});
    }

    const handleGpsSuccess = async (pos: GeolocationPosition) => {
      if (!isMounted) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserCoords({ lat, lng });
      try {
        const res = await fetch(withBasePath(`/api/location?lat=${lat}&lng=${lng}`));
        const data = await res.json();
        if (isMounted && data.success && data.detectedCity?.name) {
          setSelectedCity(data.detectedCity.name);
        }
      } catch {}
    };

    const handleGpsError = () => {
      // Location access not granted/allowed or denied by user: try IP fallback
      if (!isMounted) return;
      fetchIpFallback();
    };

    navigator.geolocation.getCurrentPosition(
      handleGpsSuccess,
      handleGpsError,
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 60000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  // Frame 1 -> Frame 2 (Welcome -> Restaurant Search)
  const handleStartTour = async () => {
    playSound('click');
    triggerFrameTransition(2);

    const activeSession = sessionId || getOrCreateSessionId();
    if (!sessionId) setSessionId(activeSession);

    // Save tour start session in DB immediately
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_location: selectedCity,
          latitude: userCoords?.lat || null,
          longitude: userCoords?.lng || null,
          current_stage: 'frame_2_restaurant_search',
          current_step: 'restaurant_search',
          food_meter_percentage: 20
        })
      });
    } catch (err) {
      console.warn('Session start save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_2_restaurant_search',
      stepTitle: 'Frame 2: Restaurant Search Screen Opened',
      stepNumber: 2,
      userLocation: selectedCity,
      latitude: userCoords?.lat,
      longitude: userCoords?.lng
    });
  };

  // Frame 2 -> Frame 3 (Restaurant Chosen -> 3 Dish Options)
  const handleRestaurantConfirmed = async (confirmedSpot?: Restaurant) => {
    playSound('click');
    const effectiveSpot = confirmedSpot || selectedRestaurant;
    if (confirmedSpot) {
      setSelectedRestaurant(confirmedSpot);
    }
    setSelectedDish(null);
    triggerFrameTransition(3);

    const activeSession = sessionId || getOrCreateSessionId();

    // Persist restaurant selection to DB session
    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_location: effectiveSpot?.city || selectedCity,
          latitude: effectiveSpot?.latitude || userCoords?.lat,
          longitude: effectiveSpot?.longitude || userCoords?.lng,
          restaurant_id: effectiveSpot?.id,
          current_stage: 'frame_3_dish_selection',
          current_step: 'dish_selection'
        })
      });
    } catch (err) {
      console.warn('Restaurant confirm save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_3_dish_selection',
      stepTitle: `Frame 3: Dish Options Opened for ${effectiveSpot?.name || 'Restaurant'}`,
      stepNumber: 3,
      restaurantId: effectiveSpot?.id,
      userLocation: effectiveSpot?.city || selectedCity,
      latitude: effectiveSpot?.latitude || userCoords?.lat,
      longitude: effectiveSpot?.longitude || userCoords?.lng,
      metadata: {
        restaurant_name: effectiveSpot?.name,
        restaurant_id: effectiveSpot?.id,
        city: effectiveSpot?.city || selectedCity,
        latitude: effectiveSpot?.latitude,
        longitude: effectiveSpot?.longitude
      }
    });
  };

  // Frame 3 -> Frame 5 (Dish Chosen -> Eating Begins)
  const handleDishConfirmed = async (customDishName?: string, customDishImage?: string) => {
    playSound('bite');
    const rawDishName = customDishName || selectedDish?.name || 'Signature Food';
    const dishName = formatCleanDishName(rawDishName, selectedRestaurant?.name);
    const isSameDishAsCurrent = Boolean(
      selectedDish?.name &&
      formatCleanDishName(selectedDish.name, selectedRestaurant?.name).toLowerCase() === dishName.toLowerCase()
    );
    const effectiveDishImage = customDishImage || (isSameDishAsCurrent ? selectedDish?.image : undefined);
    const visual = getDishVisualAssets(dishName, effectiveDishImage, selectedRestaurant?.name);
    const finalDish = {
      name: dishName,
      id: customDishName ? Math.floor(Math.random() * 80000) + 10000 : ((selectedDish as { id?: number })?.id || 1),
      price: selectedDish?.price || 150,
      image: visual.plateImage || effectiveDishImage || `/api/ai/dish-image?dish=${encodeURIComponent(dishName)}`
    };

    setSelectedDish(finalDish);
    if (feastingStage !== 2) {
      setFeastingStage(1);
    }
    triggerFrameTransition(5);

    const activeSession = sessionId || getOrCreateSessionId();

    // Persist session and record visit in DB immediately
    try {
      const activeUserId = getOrCreateUserId();
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_id: activeUserId,
          user_location: selectedRestaurant?.city || selectedCity,
          latitude: selectedRestaurant?.latitude || userCoords?.lat,
          longitude: selectedRestaurant?.longitude || userCoords?.lng,
          restaurant_id: selectedRestaurant?.id || 1,
          dish_id: (finalDish as { id?: number })?.id || 1,
          current_stage: 'frame_5_eating_begins',
          current_step: 'eating_begins',
          food_meter_percentage: 20
        })
      });

      // Save visit to campaign_visits in DB (distinguishing round 1 and round 2)
      await fetch('/api/campaign/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_id: activeUserId,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Food Spot',
          dish_id: (finalDish as { id?: number })?.id || 1,
          dish_name: finalDish.name,
          city: selectedRestaurant?.city || selectedCity || 'Local',
          latitude: selectedRestaurant?.latitude ?? userCoords?.lat ?? null,
          longitude: selectedRestaurant?.longitude ?? userCoords?.lng ?? null,
          round_number: feastingStage === 2 ? 2 : 1
        })
      });
    } catch (err) {
      console.warn('Dish & visit save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_5_eating_begins',
      stepTitle: `Frame 5: Bakasur Mode ON - Eating ${finalDish.name}`,
      stepNumber: 5,
      restaurantId: selectedRestaurant?.id,
      dishId: (finalDish as { id?: number })?.id,
      userLocation: selectedRestaurant?.city || selectedCity,
      latitude: selectedRestaurant?.latitude || userCoords?.lat,
      longitude: selectedRestaurant?.longitude || userCoords?.lng,
      foodMeterPercentage: 20,
      metadata: {
        dish_name: finalDish.name,
        restaurant_name: selectedRestaurant?.name,
        city: selectedRestaurant?.city || selectedCity
      }
    });
  };

  // Frame 5 -> Frame 6 (Eating Begins -> Feeding Loop)
  const handleFeedMore = async () => {
    playSound('click');
    const activeSession = sessionId || getOrCreateSessionId();

    let nextStage: 1 | 2 | 3 = 2;
    if (feastingStage === 1) {
      nextStage = 2;
      setFeastingStage(2);
      setCurrentFrame(6);
    } else if (feastingStage === 2) {
      nextStage = 3;
      setFeastingStage(3);
      setCurrentFrame(6);
    } else {
      handleFeedingLoopComplete();
      return;
    }

    const newPct = nextStage === 2 ? 60 : 90;

    try {
      await fetch('/api/campaign/aur-khilo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: `stage_${nextStage}`
        })
      });
    } catch (err) {
      console.warn('Aur khilo save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_6_feeding_loop',
      stepTitle: `Frame 6: Feeding Loop Progressed (Round ${nextStage})`,
      stepNumber: 6,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: newPct
    });
  };

  // Frame 6 (Interstitial) -> Second Restaurant & Dish Selection for Round 2
  const handleStartSecondEatingStage = () => {
    playSound('click');
    // Preserve round 1 restaurant and dish before resetting selection for round 2
    if (selectedRestaurant) {
      setFirstRoundRestaurant(selectedRestaurant);
    }
    if (selectedDish) {
      setFirstRoundDish(selectedDish);
    }
    setFeastingStage(2);
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setCurrentFrame(2);
  };

  // Frame 6 (Trailer) -> Random Food Tour Spot 1
  const handleStartFoodTour = async () => {
    playSound('bite');
    const firstSpot = getRandomFoodSpot([]);
    setCurrentTourSpot(firstSpot);
    setVisitedSpotIds([firstSpot.id]);
    setCurrentFrame(6);

    setTourSpotRound(1);
    setFeastingStage(2);

    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'frame_6_tour_spot_1',
          current_step: 'tour_spot_1',
          food_meter_percentage: 65
        })
      });
    } catch (err) {
      console.warn('Spot 1 save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: `frame_6_tour_spot_1_${firstSpot.id}`,
      stepTitle: `Frame 6: Random Tour Spot 1 - ${firstSpot.dishName} at ${firstSpot.spotName}`,
      stepNumber: 6,
      foodMeterPercentage: 65,
      metadata: {
        dish_name: firstSpot.dishName,
        spot_name: firstSpot.spotName,
        round: 1
      }
    });
  };

  // Random Food Tour Spot (Eating twice - 2 dishes before acidity kicks in)
  const handleNextTourSpot = async () => {
    const activeSession = sessionId || getOrCreateSessionId();

    if (tourSpotRound === 1) {
      playSound('bite');
      const secondSpot = getRandomFoodSpot(visitedSpotIds);
      setCurrentTourSpot(secondSpot);
      setVisitedSpotIds((prev) => [...prev, secondSpot.id]);
      setTourSpotRound(2);
      setFeastingStage(2);
      return;
    }

    // After Round 3 finishes: Overeating Acidity kicks in!
    playSound('relief');
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setFeastingStage(3);
    setCurrentFrame(7);

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'acidity',
          current_step: 'acidity_appears',
          food_meter_percentage: 100
        })
      });
    } catch (err) {
      console.warn('Acidity save notice:', err);
    }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Bakasur Overeats 2 Food Tour Spots - Acidity Appears',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 6 -> Frame 7 (Feeding Loop Complete -> Acidity Appears)
  const handleFeedingLoopComplete = async () => {
    playSound('bite');
    setFeastingStage(3);
    triggerFrameTransition(7);

    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'acidity',
          current_step: 'acidity_appears',
          food_meter_percentage: 100
        })
      });
    } catch { }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_7_acidity_appears',
      stepTitle: 'Frame 7: Acidity Appears (Overeating After Round 3)',
      stepNumber: 7,
      restaurantId: selectedRestaurant?.id,
      foodMeterPercentage: 100
    });
  };

  // Frame 7 -> Frame 8 (Comic Reaction Complete -> Help Bakasur)
  const handleAcidityAutoAdvance = () => {
    triggerFrameTransition(8);
    const activeSession = sessionId || getOrCreateSessionId();
    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_8_help_bakasur',
      stepTitle: 'Frame 8: Bakasur Needs Help Prompt',
      stepNumber: 8,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 8 -> Frame 9 (Help Bakasur Clicked -> Gastrium Dose Animation)
  const handleHelpBakasur = async () => {
    playSound('relief');
    triggerFrameTransition(9);
    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'frame_9_gastrium_animation',
          current_step: 'gastrium_dose'
        })
      });
    } catch { }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_9_gastrium_animation',
      stepTitle: 'Frame 9: Gastrium 4-Message Automatic Relief Sequence Started',
      stepNumber: 9,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 9 -> Frame 10 (Gastrium Animation Finished -> Thank You / Shukriya Frame)
  const handleGastriumComplete = async () => {
    playSound('fanfare');
    triggerFrameTransition(10);
    const activeSession = sessionId || getOrCreateSessionId();

    try {
      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          current_stage: 'relief_done',
          current_step: 'recommendation_submitted'
        })
      });
    } catch { }

    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_10_recommendation_submitted',
      stepTitle: 'Frame 10: Recommendation Submitted (Mazaa Aa Gaya)',
      stepNumber: 10,
      restaurantId: selectedRestaurant?.id,
      dishId: (selectedDish as { id?: number })?.id,
      metadata: {
        restaurant_name: selectedRestaurant?.name,
        dish_name: selectedDish?.name
      }
    });
  };

  // Frame 10 -> Frame 11 (Recommendation Submitted -> Live Food Tour Map)
  const handleViewMap = async () => {
    playSound('click');
    const activeSession = sessionId || getOrCreateSessionId();

    // Automatically persist visited spot to MySQL DB and mark map_visited = 1
    try {
      const activeUserId = getOrCreateUserId();
      await fetch('/api/campaign/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_id: activeUserId,
          restaurant_id: selectedRestaurant?.id || 1,
          restaurant_name: selectedRestaurant?.name || 'Local Restaurant',
          dish_id: (selectedDish as { id?: number })?.id || null,
          dish_name: selectedDish?.name || 'Signature Food',
          city: selectedRestaurant?.city || selectedCity || 'Local',
          latitude: selectedRestaurant?.latitude ?? userCoords?.lat ?? null,
          longitude: selectedRestaurant?.longitude ?? userCoords?.lng ?? null,
          round_number: feastingStage === 2 ? 2 : 1
        })
      });

      await fetch('/api/campaign/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession,
          user_id: activeUserId,
          current_stage: 'map',
          current_step: 'live_map',
          map_visited: 1
        })
      });
    } catch (err) {
      console.warn('Failed to record visit to DB:', err);
    }

    triggerFrameTransition(11);
    trackUserStep({
      sessionId: activeSession,
      stepName: 'frame_11_live_map',
      stepTitle: 'Frame 11: Live Food Tour Map Explored',
      stepNumber: 11,
      restaurantId: selectedRestaurant?.id
    });
  };

  // Frame 11 -> Frame 2 (Ek Aur Food Stop Jodo)
  const handleAddAnotherSpot = () => {
    playSound('click');
    if (selectedRestaurant && !firstRoundRestaurant) {
      setFirstRoundRestaurant(selectedRestaurant);
      setFirstRoundDish(selectedDish);
    }
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFeastingStage(2);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    triggerFrameTransition(2);
    trackUserStep({
      sessionId,
      stepName: 'frame_11_add_another_spot',
      stepTitle: 'Frame 11: Ek Aur Food Stop Jodo Clicked',
      stepNumber: 11
    });
  };

  // Universal Previous Frame Handler for Top-Left Navigation
  const handleGoPreviousFrame = useCallback(() => {
    playSound('click');
    if (currentFrame === 2) triggerFrameTransition(1);
    else if (currentFrame === 3) triggerFrameTransition(2);
    else if (currentFrame === 5) triggerFrameTransition(3);
    else if (currentFrame === 6) {
      if (tourSpotRound > 0) setTourSpotRound(0);
      else triggerFrameTransition(3);
    }
    else if (currentFrame === 7) triggerFrameTransition(6);
    else if (currentFrame === 8) triggerFrameTransition(7);
    else if (currentFrame === 9) triggerFrameTransition(8);
    else if (currentFrame === 10) triggerFrameTransition(9);
    else if (currentFrame === 11) triggerFrameTransition(10);
    else if (currentFrame === 12) triggerFrameTransition(11);
    else if (currentFrame === 13) triggerFrameTransition(12);
  }, [currentFrame, tourSpotRound, playSound, triggerFrameTransition]);

  // Frame 11 -> Frame 12 (Live Map -> Registration Form)
  const handleRegisterLiveTour = () => {
    playSound('click');
    triggerFrameTransition(12);
    trackUserStep({
      sessionId,
      stepName: 'frame_12_registration',
      stepTitle: 'Frame 12: Live Food Tour Registration Form Opened',
      stepNumber: 12
    });
  };

  // Frame 12 -> Frame 13 (Registration Submit -> Confirmation)
  const handleRegistrationSubmit = async (mobile: string, name?: string, concern?: string) => {
    setIsRegistering(true);
    setRegError('');

    // Combine both visited restaurant names if user did 2 rounds
    const combinedRestName = firstRoundRestaurant && selectedRestaurant && firstRoundRestaurant.name !== selectedRestaurant.name
      ? `${firstRoundRestaurant.name} & ${selectedRestaurant.name}`
      : (selectedRestaurant?.name || firstRoundRestaurant?.name || 'Local Food Spot');

    const combinedDishName = firstRoundDish && selectedDish && firstRoundDish.name !== selectedDish.name
      ? `${firstRoundDish.name} & ${selectedDish.name}`
      : (selectedDish?.name || firstRoundDish?.name || 'Signature Food');

    try {
      const activeUserId = getOrCreateUserId();
      const res = await fetch('/api/campaign/participate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: activeUserId,
          mobile,
          name: name || 'Foodie Follower',
          city: selectedRestaurant?.city || firstRoundRestaurant?.city || selectedCity,
          restaurant_id: selectedRestaurant?.id || firstRoundRestaurant?.id || null,
          restaurant_name: combinedRestName,
          dish_id: (selectedDish as { id?: number })?.id || (firstRoundDish as { id?: number })?.id || null,
          dish_name: combinedDishName,
          latitude: selectedRestaurant?.latitude || firstRoundRestaurant?.latitude || 18.5204,
          longitude: selectedRestaurant?.longitude || firstRoundRestaurant?.longitude || 73.8407,
          consent: true,
          terms_accepted: true,
          user_concern: concern
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        playSound('fanfare');
        setRegisteredMobile(mobile);
        setStoredUserMobile(mobile);
        setParticipationId(json.data.participation_id || 'BKT-' + Math.floor(100000 + Math.random() * 900000));
        setCurrentFrame(13);

        trackUserStep({
          sessionId,
          stepName: 'frame_13_confirmation',
          stepTitle: `Frame 13: Tour Pass Confirmed (${json.data.participation_id})`,
          stepNumber: 13,
          metadata: { mobile, participation_id: json.data.participation_id, user_concern: concern }
        });
        return true;
      } else {
        if (json.alreadyRegistered && json.data?.participation_id) {
          setParticipationId(json.data.participation_id);
          setRegisteredMobile(mobile);
        }
        setRegError(json.error || 'Registration failed. Please try again.');
        return false;
      }
    } catch {
      setRegError('Server error. Please try again.');
      return false;
    } finally {
      setIsRegistering(false);
    }
  };

  // Restart Food Tour (Back to Frame 1 / Frame 2 with a clean session)
  const handleRestart = () => {
    playSound('click');
    const newSess = resetSessionId();
    setSessionId(newSess);
    setSelectedRestaurant(null);
    setSelectedDish(null);
    setFirstRoundRestaurant(null);
    setFirstRoundDish(null);
    setFeastingStage(1);
    setTourSpotRound(0);
    setCurrentTourSpot(null);
    setVisitedSpotIds([]);
    setCurrentFrame(1);

    trackUserStep({
      sessionId: newSess,
      stepName: 'frame_1_welcome',
      stepTitle: 'Food Tour Restarted - Fresh Session Initiated',
      stepNumber: 1
    });
  };

  const getVideoContainerHeightClass = (frame: number) => {
    if (frame === 8) {
      return 'h-[66%] xs:h-[68%] sm:h-[62%] lg:h-full';
    }
    if (frame === 3) {
      return 'h-[65%] xs:h-[67%] sm:h-[60%] lg:h-full';
    }
    if (frame === 10) {
      return 'h-[54%] xs:h-[56%] sm:h-[52%] lg:h-full';
    }
    return 'h-[62%] xs:h-[65%] sm:h-[60%] lg:h-full';
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex items-center justify-center bg-[#07153B] overflow-hidden select-none p-0 relative">
      {/* Smooth Frame Slide-In Right-to-Left (Mobile Only, Disabled on Tablet/Desktop) */}
      <div
        key={`frame-stage-${currentFrame}-${tourSpotRound}`}
        className={`w-full h-full flex items-center justify-center overflow-hidden relative ${
          hasMounted ? 'animate-frame-slide-mobile' : ''
        }`}
      >
        {/* Responsive Canvas: Mobile/Tablet portrait stack (< lg), Desktop split screen (lg:flex-row, Left: Video, Right: Content) */}
        {/* If Frame 5: FULL SCREEN EATING STAGE */}
        {currentFrame === 5 ? (
        <div className="fixed inset-0 w-full h-[100dvh] flex items-center justify-center bg-[#031058] overflow-hidden select-none touch-none overscroll-none z-40">
          <div className="w-full h-full max-w-[480px] lg:max-w-[500px] bg-[#031058] overflow-hidden relative select-none touch-none overscroll-none">
            <BakasurEatingStage
              dishName={selectedDish?.name || 'Signature Dish'}
              dishImage={selectedDish?.image}
              restaurantName={selectedRestaurant?.name}
              restaurant={selectedRestaurant}
              feastingStage={feastingStage}
              soundEnabled={false}
              onBack={() => {
                setCurrentFrame(3);
              }}
              onWatchVideo={() => {
                setActiveTransitionVideo({
                  videoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating.mp4'),
                  desktopVideoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating-desktop.mp4'),
                  buttonText: 'Aage Badho ➡️',
                  nextFrame: 7
                });
              }}
              onComplete={() => {
                playSound('click');
                setCurrentFrame(6);
              }}
              onPlayBite={() => playSound('bite')}
            />
          </div>
        </div>
      ) : currentFrame === 6 && tourSpotRound === 0 ? (
        /* Frame 6 Interstitial with bakasur_empty_plate video & smooth zoom-out reveal animation */
        <div className="w-full h-full bg-[#07153B] overflow-hidden relative flex flex-col">
          {feastingStage === 1 ? (
            <Frame6FeedingLoop
              restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: selectedCity || 'Local' }}
              dish={selectedDish || { name: 'Signature Food', id: 1 }}
              onCompleteLoop={handleStartSecondEatingStage}
              onBack={() => setCurrentFrame(5)}
              onWatchVideo={() => {
                setActiveTransitionVideo({
                  videoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating.mp4'),
                  desktopVideoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating-desktop.mp4'),
                  buttonText: 'Aage Badho ➡️',
                  nextFrame: 7
                });
              }}
            />
          ) : (
            <Frame6PostEating
              onBack={() => setCurrentFrame(5)}
              onWatchVideo={() => {
                setActiveTransitionVideo({
                  videoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating.mp4'),
                  desktopVideoUrl: withBasePath('/images/final-frames/Bhookasur-Food-Eating-desktop.mp4'),
                  buttonText: 'Aage Badho ➡️',
                  nextFrame: 7
                });
              }}
            />
          )}
        </div>
      ) : currentFrame === 7 || currentFrame === 8 ? (
        /* Frame 7 & 8: Acidity Reaction & Help Bhookasur (Continuous Video, Seamless Animated Content Transition) */
        <div className="w-full h-full bg-[#07153B] overflow-hidden relative flex flex-col">
          <Frame7AcidityAppears
            initialStep={currentFrame === 8 ? 2 : 1}
            onHelpBakasur={handleHelpBakasur}
            onStepChange={(step) => {
              if (step === 2) {
                const activeSession = sessionId || getOrCreateSessionId();
                trackUserStep({
                  sessionId: activeSession,
                  stepName: 'frame_8_help_bakasur',
                  stepTitle: 'Frame 8: Bakasur Needs Help Prompt',
                  stepNumber: 8,
                  restaurantId: selectedRestaurant?.id
                });
              }
            }}
            onBack={() => setCurrentFrame(6)}
            soundEnabled={false}
          />
        </div>
      ) : currentFrame === 6 && tourSpotRound > 0 && currentTourSpot ? (
        <div className="w-full h-full bg-white overflow-hidden relative">
          <Frame6RandomFoodSpot
            spot={currentTourSpot}
            round={tourSpotRound}
            soundEnabled={false}
            onBack={() => setTourSpotRound(0)}
            onFeedMore={handleNextTourSpot}
          />
        </div>
      ) : currentFrame === 11 ? (
        /* Standalone Map Frame matching user_mockup_map.png */
        /* Desktop: Horizontal side-by-side (w-full h-full), Mobile: Full viewport phone card */
        <div className="w-full h-full bg-white overflow-hidden relative flex flex-col">
          {(() => {
            const userSpotsList = [
              ...(firstRoundRestaurant ? [{
                name: firstRoundRestaurant.name,
                city: firstRoundRestaurant.city,
                dishName: firstRoundDish?.name || 'Specialty Dish',
                latitude: firstRoundRestaurant.latitude,
                longitude: firstRoundRestaurant.longitude,
                stopNumber: 1
              }] : []),
              ...(selectedRestaurant && (!firstRoundRestaurant || selectedRestaurant.name !== firstRoundRestaurant.name) ? [{
                name: selectedRestaurant.name,
                city: selectedRestaurant.city,
                dishName: selectedDish?.name || 'Specialty Dish',
                latitude: selectedRestaurant.latitude,
                longitude: selectedRestaurant.longitude,
                stopNumber: firstRoundRestaurant ? 2 : 1
              }] : [])
            ];

            return (
              <Frame11LiveMap
                sessionId={sessionId}
                isRegistered={Boolean(registeredMobile || participationId)}
                registeredMobile={registeredMobile}
                participationId={participationId}
                currentUserSpot={userSpotsList[0] || null}
                currentUserSpots={userSpotsList}
                onRegisterLiveTour={handleRegisterLiveTour}
                onSuggestAnotherSpot={handleAddAnotherSpot}
                onRegisterSubmit={handleRegistrationSubmit}
                isRegistering={isRegistering}
                regError={regError}
                onBack={() => triggerFrameTransition(10)}
                onViewExistingPass={(data) => {
                  playSound('fanfare');
                  setRegisteredMobile(data.mobile);
                  setParticipationId(data.participation_id);
                  setCurrentFrame(13);
                  trackUserStep({
                    sessionId,
                    stepName: 'frame_13_confirmation',
                    stepTitle: `Frame 13: Existing Tour Pass Claimed (${data.participation_id})`,
                    stepNumber: 13,
                    metadata: { mobile: data.mobile, participation_id: data.participation_id, is_existing: true }
                  });
                }}
              />
            );
          })()}
        </div>
      ) : currentFrame === 13 ? (
        /* Frame 13: Last Frame (Registration Completed) */
        /* Desktop view is horizontal (w-full h-full lg:flex-row), Mobile/Tablet view is vertical (flex-col) */
        <div className="w-full h-full bg-white overflow-hidden relative flex flex-col lg:flex-row">
          <Frame13Confirmation
            participationId={participationId}
            mobile={registeredMobile}
            restaurant={selectedRestaurant || firstRoundRestaurant}
            dish={selectedDish || firstRoundDish}
            onBackToMap={() => setCurrentFrame(11)}
            onRestart={handleRestart}
          />
        </div>
      ) : (
        /* Normal Canvas for Other Frames - Full Screen Bleed (Left 50% Video, Right 50% Content on Desktop) */
        <div className={`w-full h-full ${currentFrame === 1 ? 'bg-[#f4f6fa]' : 'bg-white'} overflow-hidden flex flex-col lg:flex-row relative`}>

          {/* Left Side on Desktop / Top Half on Mobile & Tablet: Royal Blue Character Stage */}
          <div className={`w-full lg:w-1/2 ${getVideoContainerHeightClass(currentFrame)} lg:h-full relative overflow-hidden bg-[#182858] shrink-0`}>
            <BakasurVideoPlayer
              videoUrl={
                currentFrame === 1
                  ? "/images/final-frames/1.mp4"
                  : currentFrame === 2
                    ? isDesktop
                      ? "/images/final-frames/Bakasur-Pointing-Rightside.mp4"
                      : "/images/final-frames/2.mp4"
                    : currentFrame === 3
                      ? "/images/final-frames/3.mp4"
                      : currentFrame === 6
                        ? "/images/all-frames/Showing Love.mp4"
                        : (currentFrame as number) === 8
                          ? "/images/final-frames/Acidity-and-Dakare.mp4"
                          : currentFrame === 9
                            ? "/images/final-frames/Bhookasur-Drinking-Gastrium.mp4"
                            : currentFrame === 10
                              ? "/images/final-frames/Bhookasur-Showing-Heart.mp4"
                              : currentFrame === 12
                                ? "/images/all-frames/Showing Love.mp4"
                                : "/images/final-frames/1.mp4"
              }
              stageName={
                currentFrame === 1 ? 'welcome' :
                  currentFrame === 2 ? 'restaurant' :
                    currentFrame === 3 ? 'dish' :
                      currentFrame === 6 ? 'trailer' :
                        (currentFrame as number) === 8 ? 'heartburn' :
                          currentFrame === 9 ? 'relief' :
                            currentFrame === 10 ? 'relief_done' : 'map'
              }
              frameNumber={currentFrame}
              feastingStage={feastingStage}
              dishName={selectedDish?.name || 'Signature Food'}
              dishImage={selectedDish?.image}
              restaurantName={selectedRestaurant?.name}
              soundEnabled={false}
              onBack={currentFrame > 1 ? handleGoPreviousFrame : undefined}
            />
          </div>

          {/* Right Side on Desktop / Bottom Half on Mobile & Tablet: Content Card */}
          <div className={`w-full lg:w-1/2 flex-1 lg:h-full flex flex-col overflow-y-auto scrollbar-thin ${currentFrame === 1 ? 'bg-[#f4f6fa] p-0' : currentFrame <= 3 || currentFrame === 9 ? 'bg-white p-0' : 'bg-white p-2 sm:p-4 md:p-6 lg:p-8'} text-slate-900 relative z-20 justify-start lg:justify-center`}>
            <main className="flex-1 w-full flex flex-col justify-start lg:justify-center min-h-0 relative">
              {/* Frame 1: Welcome */}
              {currentFrame === 1 && (
                <Frame1Welcome onStart={handleStartTour} cityName={selectedCity} />
              )}

              {/* Frame 2: Restaurant Search */}
              {currentFrame === 2 && (
                <Frame2RestaurantSearch
                  selectedCity={selectedCity}
                  selectedRestaurant={selectedRestaurant}
                  userCoords={userCoords}
                  isSecondRound={feastingStage === 2}
                  onSelectRestaurant={(r) => {
                    setSelectedRestaurant(r);
                    setSelectedDish(null);
                  }}
                  onNext={handleRestaurantConfirmed}
                  onWatchVideo={() => {
                    setActiveTransitionVideo({
                      videoUrl: '/images/final-frames/Bhookasur-Food-Eating.mp4',
                      desktopVideoUrl: '/images/final-frames/Bhookasur-Food-Eating-dekstop.mp4',
                      buttonText: 'Aage Badho ➡️',
                      nextFrame: 2
                    });
                  }}
                  onBack={() => {
                    if (feastingStage === 2) {
                      setCurrentFrame(6);
                    } else {
                      setCurrentFrame(1);
                    }
                  }}
                />
              )}

              {/* Frame 3: Dish Selection (3 Options) */}
              {currentFrame === 3 && selectedRestaurant && (
                <Frame3DishSelection
                  key={`${selectedRestaurant.id}-${selectedRestaurant.name}`}
                  restaurant={selectedRestaurant}
                  selectedDish={selectedDish}
                  isSecondRound={feastingStage === 2}
                  onSelectDish={(d) => setSelectedDish(d)}
                  onConfirmDish={(name, img) => handleDishConfirmed(name, img)}
                  onBack={() => setCurrentFrame(2)}
                />
              )}



              {/* Frame 8: Help Bakasur */}
              {(currentFrame as number) === 8 && (
                <Frame8HelpBakasur onHelpBakasur={handleHelpBakasur} />
              )}

              {/* Frame 9: Gastrium Animation (4 sequential messages + end line) */}
              {currentFrame === 9 && (
                <Frame9GastriumAnimation onAnimationComplete={handleGastriumComplete} />
              )}

              {/* Frame 10: Shukriya Dost / Map Par Dekho (Matching User Mockup 2) */}
              {currentFrame === 10 && (
                <Frame10Submitted
                  restaurant={selectedRestaurant || { id: 1, name: 'Local Restaurant', city: selectedCity || 'Local' }}
                  dish={selectedDish || { name: 'Signature Food' }}
                  onViewMap={handleViewMap}
                />
              )}

              {/* Frame 12: Registration (Mobile number & consent) */}
              {currentFrame === 12 && (
                <Frame12Registration
                  onSubmitNumber={async (m, n) => { await handleRegistrationSubmit(m, n); }}
                  onBack={() => setCurrentFrame(11)}
                  isLoading={isRegistering}
                  error={regError}
                  onViewExistingPass={(data) => {
                    playSound('fanfare');
                    setRegisteredMobile(data.mobile);
                    setParticipationId(data.participation_id);
                    setCurrentFrame(13);
                    trackUserStep({
                      sessionId,
                      stepName: 'frame_13_confirmation',
                      stepTitle: `Frame 13: Existing Tour Pass Claimed (${data.participation_id})`,
                      stepNumber: 13,
                      metadata: { mobile: data.mobile, participation_id: data.participation_id, is_existing: true }
                    });
                  }}
                />
              )}

            </main>
          </div>
        </div>
      )}
      </div>

      {/* Full-width Story Video Transition Overlay between frames */}
      {activeTransitionVideo && (
        <VideoTransitionOverlay
          key={`${activeTransitionVideo.videoUrl}-${activeTransitionVideo.desktopVideoUrl || ''}`}
          videoUrl={activeTransitionVideo.videoUrl}
          desktopVideoUrl={activeTransitionVideo.desktopVideoUrl}
          buttonText={activeTransitionVideo.buttonText}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onComplete={() => {
            const callback = activeTransitionVideo.onVideoComplete;
            const next = activeTransitionVideo.nextFrame;
            setActiveTransitionVideo(null);
            if (callback) {
              setTimeout(() => {
                callback();
              }, 50);
            } else {
              setCurrentFrame(next);
            }
          }}
        />
      )}

      {/* High-speed active background preloader to pre-buffer upcoming frame videos in browser cache */}
      <div className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {currentFrame === 1 && (
          <>
            <video src="/images/final-frames/2.mp4" preload="auto" muted />
            <video src="/images/final-frames/Bakasur-Pointing-Rightside.mp4" preload="auto" muted />
            <video src="/images/final-frames/3.mp4" preload="auto" muted />
          </>
        )}
        {currentFrame === 2 && (
          <>
            <video src="/images/final-frames/3.mp4" preload="auto" muted />
            <video src="/images/final-frames/front-eat-video.mp4" preload="auto" muted />
          </>
        )}
        {currentFrame === 3 && (
          <>
            <video src="/images/final-frames/front-eat-video.mp4" preload="auto" muted />
            <video src="/images/final-frames/side-view-final.mp4?v=2" preload="auto" muted />
            <video src="/images/final-frames/5.mp4" preload="auto" muted />
          </>
        )}
        {currentFrame === 5 && (
          <>
            <video src="/images/final-frames/5.mp4" preload="auto" muted />
            <video src="/images/final-frames/Bhookasur-Food-Eating.mp4" preload="auto" muted />
            <video src="/images/final-frames/Bhookasur-Food-Eating-dekstop.mp4" preload="auto" muted />
          </>
        )}
        {currentFrame === 6 && (
          <>
            <video src="/images/final-frames/Acidity-and-Dakare.mp4" preload="auto" muted />
            <video src="/images/final-frames/Bhookasur-Food-Eating.mp4" preload="auto" muted />
            <video src="/images/final-frames/Bhookasur-Food-Eating-dekstop.mp4" preload="auto" muted />
          </>
        )}
        {(currentFrame === 7 || currentFrame === 8) && (
          <video src="/images/final-frames/Bhookasur-Drinking-Gastrium.mp4" preload="auto" muted />
        )}
      </div>
    </div>
  );
}
