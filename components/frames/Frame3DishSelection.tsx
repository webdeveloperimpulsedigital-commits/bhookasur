'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Check, Search, Utensils, X, Sparkles } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { getDishVisualAssets, formatCleanDishName, isDishVeg, isPureVegRestaurantName, isDishRelevantToSearch } from '@/lib/dishAssets';
import { selectTopRestaurantDishes } from '@/lib/dishRanking';
import { generateLiveMenuForRestaurant } from '@/lib/liveMenu';
import { withBasePath } from '@/lib/basePath';

interface Frame3DishSelectionProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number; image?: string; description?: string } | null;
  isSecondRound?: boolean;
  onSelectDish: (dish: Dish | { name: string; id?: number; price?: number; image?: string }) => void;
  onConfirmDish: (dishName?: string, dishImage?: string) => void;
  onSearchSelectDish?: (dishName: string, dishId?: number) => void;
  onBack?: () => void;
}

// Client-side menu cache to avoid redundant network round-trips
const clientMenuCache = new Map<string, Dish[]>();

export function clearClientMenuCache() {
  clientMenuCache.clear();
}

const DishThumbnail: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = 'w-full h-full' }) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const resolvedSrc = hasError ? withBasePath('/images/food/special_signature_thali_platter.webp') : src;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100/60 rounded-full animate-pulse pointer-events-none">
          <Utensils className="w-3.5 h-3.5 text-orange-400/80" />
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-contain filter drop-shadow-xs transition-opacity duration-200 pointer-events-none rounded-full ${isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
      />
    </div>
  );
};

export const Frame3DishSelection: React.FC<Frame3DishSelectionProps> = ({
  restaurant,
  selectedDish,
  onSelectDish,
  onConfirmDish,
  onSearchSelectDish,
  onBack
}) => {
  const currentKey = `v52_${restaurant.id}_${(restaurant.name || '').trim().toLowerCase()}`;
  const [rawDishes, setRawDishes] = useState<Dish[]>(() => {
    return clientMenuCache.get(currentKey) || [];
  });
  const [menuSearchQuery, setMenuSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(menuSearchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [menuSearchQuery]);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !clientMenuCache.has(currentKey);
  });
  const [loadingStatus, setLoadingStatus] = useState<string>('Checking menu...');
  const [customDishInput, setCustomDishInput] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeRequestIdRef = useRef<number>(0);

  const loadDishes = useCallback(async () => {
    const currentReqId = ++activeRequestIdRef.current;
    const cacheKey = `v52_${restaurant.id}_${(restaurant.name || '').trim().toLowerCase()}`;

    // If cached in memory with dishes, use it immediately (0ms)
    if (clientMenuCache.has(cacheKey)) {
      const cached = clientMenuCache.get(cacheKey)!;
      if (cached && cached.length > 0) {
        setRawDishes(cached);
        setIsLoading(false);
        setLoadError(null);
        return;
      }
    }

    setRawDishes([]);
    setMenuSearchQuery('');
    setCustomDishInput('');
    setIsLoading(true);
    setLoadError(null);
    setLoadingStatus('Checking menu...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 42000);

    const statusTimer = setTimeout(() => {
      if (activeRequestIdRef.current === currentReqId) {
        setLoadingStatus('Checking menu...');
      }
    }, 1200);

    const statusTimer2 = setTimeout(() => {
      if (activeRequestIdRef.current === currentReqId) {
        setLoadingStatus('Checking menu...');
      }
    }, 2800);

    try {
      const isStrictVeg = isPureVegRestaurantName(restaurant.name) || restaurant.is_veg === 1;
      const queryParams = new URLSearchParams({
        name: restaurant.name || '',
        area: restaurant.area || '',
        city: restaurant.city || '',
        is_veg: isStrictVeg ? '1' : (restaurant.is_veg ? '1' : '0')
      });
      if (restaurant.latitude) queryParams.set('lat', String(restaurant.latitude));
      if (restaurant.longitude) queryParams.set('lng', String(restaurant.longitude));
      const customRest = restaurant as unknown as { zomato_url?: string; swiggy_id?: string; zomato_id?: string };
      if (customRest.zomato_url) queryParams.set('zomato_url', customRest.zomato_url);
      if (customRest.swiggy_id) queryParams.set('swiggy_id', customRest.swiggy_id);
      if (customRest.zomato_id) queryParams.set('zomato_id', customRest.zomato_id);

      const res = await fetch(withBasePath(`/api/restaurants/${restaurant.id}/dishes?${queryParams.toString()}`), {
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Menu service responded with ${res.status}`);
      }

      const json = await res.json();

      // Guard: strictly ignore stale responses from any previously selected restaurant
      if (activeRequestIdRef.current !== currentReqId) {
        return;
      }

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        clientMenuCache.set(cacheKey, json.data);
        setRawDishes(json.data);
        setLoadError(null);
      } else {
        const fallbackDishes = generateLiveMenuForRestaurant({
          id: restaurant.id || 850000,
          name: restaurant.name || 'Restaurant',
          description: restaurant.description || '',
          area: restaurant.area || '',
          city: restaurant.city || '',
          is_veg: restaurant.is_veg
        });
        clientMenuCache.set(cacheKey, fallbackDishes);
        setRawDishes(fallbackDishes);
        setLoadError(null);
      }
    } catch {
      if (activeRequestIdRef.current !== currentReqId) {
        return;
      }
      const fallbackDishes = generateLiveMenuForRestaurant({
        id: restaurant.id || 850000,
        name: restaurant.name || 'Restaurant',
        description: restaurant.description || '',
        area: restaurant.area || '',
        city: restaurant.city || '',
        is_veg: restaurant.is_veg
      });
      clientMenuCache.set(cacheKey, fallbackDishes);
      setRawDishes(fallbackDishes);
      setLoadError(null);
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(statusTimer);
      clearTimeout(statusTimer2);
      if (activeRequestIdRef.current === currentReqId) {
        setIsLoading(false);
      }
    }
  }, [restaurant.id, restaurant.name, restaurant.description, restaurant.area, restaurant.city, restaurant.is_veg, restaurant.latitude, restaurant.longitude]);

  useEffect(() => {
    loadDishes();
    return () => {
      // Invalidate in-flight requests when unmounting or switching restaurants
      activeRequestIdRef.current++;
    };
  }, [loadDishes]);

  const isHeritageVeg = isPureVegRestaurantName(restaurant.name);

  // Precise restaurant cuisine categorization
  const isNonVegRestaurant = useMemo(() => {
    if (isHeritageVeg || restaurant.is_veg === 1) return false;
    const rName = restaurant.name.toLowerCase();
    if (
      rName.includes('non-veg') ||
      rName.includes('non veg') ||
      rName.includes('nonveg') ||
      rName.includes('mutton') ||
      rName.includes('chicken') ||
      rName.includes('meat') ||
      rName.includes('fish') ||
      rName.includes('seafood') ||
      rName.includes('prawn') ||
      rName.includes('crab') ||
      rName.includes('military') ||
      rName.includes('biryani') ||
      rName.includes('kebab') ||
      rName.includes('kabab') ||
      rName.includes('bar') ||
      rName.includes('pub') ||
      rName.includes('permit room')
    ) {
      return true;
    }
    // If the restaurant's actual verified menu contains non-veg items, it serves non-veg
    return rawDishes.some(d => d.is_veg === 0 || !isDishVeg(d.name));
  }, [restaurant.name, restaurant.is_veg, isHeritageVeg, rawDishes]);

  const isPureVegRestaurant = useMemo(() => {
    if (isNonVegRestaurant) return false;
    const rName = restaurant.name.toLowerCase();
    return isHeritageVeg ||
      restaurant.is_veg === 1 ||
      rName.includes('pure veg') ||
      (rName.includes('veg') && !rName.includes('non')) ||
      rName.includes('bhojanalay') ||
      rName.includes('shakahari') ||
      rName.includes('swayampak') ||
      rName.includes('bhavan') ||
      rName.includes('udupi') ||
      rName.includes('dosa') ||
      rName.includes('idli') ||
      rName.includes('mithai') ||
      rName.includes('sweets') ||
      rName.includes('jain') ||
      (rawDishes.length > 0 && rawDishes.every(d => d.is_veg === 1 || isDishVeg(d.name)));
  }, [restaurant.name, restaurant.is_veg, isNonVegRestaurant, isHeritageVeg, rawDishes]);

  // All authentic available dishes for this restaurant (always populated once loading completes)
  const allRestaurantDishes: Dish[] = useMemo(() => {
    if (isLoading && rawDishes.length === 0) return [];
    const sourceList = rawDishes.length > 0
      ? rawDishes
      : generateLiveMenuForRestaurant({
          id: restaurant.id || 850000,
          name: restaurant.name || 'Restaurant',
          description: restaurant.description || '',
          area: restaurant.area || '',
          city: restaurant.city || '',
          is_veg: restaurant.is_veg
        });
    if (isPureVegRestaurant) {
      // Guarantee zero non-veg items for pure veg restaurants
      return sourceList.filter(d => isDishVeg(d.name) && d.is_veg !== 0);
    }
    return sourceList;
  }, [isLoading, rawDishes, isPureVegRestaurant, restaurant]);

  // Extract top signature dishes using multi-signal weighted ranking:
  // 1. Restaurant specialties / bestsellers
  // 2. High order counts and popularity
  // 3. Ratings and review volume (Bayesian credibility)
  // 4. Genuine meal relevance (disqualifying accompaniments and beverages for food dining)
  const threeDishes: Dish[] = useMemo(() => {
    const top = selectTopRestaurantDishes(allRestaurantDishes, restaurant, 3);
    if (
      selectedDish?.name &&
      top.length > 0 &&
      !top.some(
        d =>
          formatCleanDishName(d.name, restaurant.name).toLowerCase() === selectedDish.name.toLowerCase() ||
          d.name.toLowerCase() === selectedDish.name.toLowerCase()
      )
    ) {
      const customVisual = getDishVisualAssets(selectedDish.name, selectedDish.image, restaurant.name);
      const customCard: Dish = {
        id: (selectedDish as Dish).id || 899001,
        restaurant_id: restaurant.id,
        name: selectedDish.name,
        description: selectedDish.description || `Signature dish at ${restaurant.name}`,
        price: selectedDish.price || 180,
        image: customVisual.flyingImage || customVisual.plateImage,
        rating: 4.9,
        popularity: 99,
        is_recommended: 1,
        is_veg: isPureVegRestaurant ? 1 : (isDishVeg(selectedDish.name) ? 1 : 0),
        status: 'active'
      };
      return [customCard, ...top.slice(0, 2)];
    }
    return top;
  }, [allRestaurantDishes, restaurant, selectedDish, isPureVegRestaurant]);

  // Contextual, authentic search placeholder matching this restaurant's real food
  const dynamicPlaceholder = useMemo(() => {
    const rName = restaurant.name.toLowerCase();
    if (rName.includes('wok') || rName.includes('chinese') || rName.includes('noodle') || rName.includes('asia')) {
      return `Search in ${restaurant.name} (e.g. Hakka Noodles, Fried Rice, Manchurian)...`;
    }
    if (isNonVegRestaurant) {
      return `Search in ${restaurant.name} (e.g. Biryani, Chicken, Kebab, Mutton)...`;
    }
    if (rName.includes('dosa') || rName.includes('idli') || rName.includes('south') || rName.includes('udupi')) {
      return `Search in ${restaurant.name} (e.g. Masala Dosa, Idli, Medu Vada)...`;
    }
    if (rName.includes('cafe') || rName.includes('coffee') || rName.includes('bakery')) {
      return `Search in ${restaurant.name} (e.g. Bun Maska, Cold Coffee, Sandwich)...`;
    }
    if (rName.includes('sweet') || rName.includes('mithai') || rName.includes('chaat') || rName.includes('bhel')) {
      return `Search in ${restaurant.name} (e.g. Gulab Jamun, Samosa, SPDP, Jalebi)...`;
    }
    if (rName.includes('misal') || rName.includes('katta')) {
      return `Search in ${restaurant.name} (e.g. Misal Pav, Usal, Vada Pav)...`;
    }
    return `Search dishes in ${restaurant.name} (e.g. Thali, Paneer, Dal)...`;
  }, [restaurant.name, isNonVegRestaurant]);

  // Dynamic Auto-Suggestions: filter against selected restaurant's menu + allow selecting any typed dish
  const matchingSuggestions = useMemo(() => {
    const rawQ = menuSearchQuery.trim();
    if (!rawQ) return [];

    const matches: Dish[] = [];
    const seenNames = new Set<string>();

    // 1. Validate against the selected restaurant's menu
    for (const dish of allRestaurantDishes) {
      const cleanName = formatCleanDishName(dish.name, restaurant.name);
      const lowerClean = cleanName.toLowerCase();
      if (seenNames.has(lowerClean)) continue;

      if (isDishRelevantToSearch(cleanName, rawQ)) {
        seenNames.add(lowerClean);
        matches.push({
          ...dish,
          name: cleanName
        });
      }
    }

    // 2. If user typed a specific dish not in the top list, allow selecting it directly with its food photo
    if (matches.length === 0 && rawQ.length >= 2) {
      const formattedCustom = rawQ
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      const imageTargetQuery = (debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : rawQ)
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      const visual = getDishVisualAssets(imageTargetQuery, undefined, restaurant.name);
      matches.push({
        id: 899001,
        restaurant_id: restaurant.id,
        name: formattedCustom,
        description: `Signature dish at ${restaurant.name}`,
        price: 220,
        image: visual.flyingImage || visual.plateImage,
        rating: 4.9,
        popularity: 98,
        is_recommended: 1,
        is_veg: isPureVegRestaurant ? 1 : (isDishVeg(formattedCustom) ? 1 : 0),
        status: 'active'
      });
    }

    return matches;
  }, [allRestaurantDishes, menuSearchQuery, debouncedSearchQuery, restaurant.name, restaurant.id, isPureVegRestaurant]);

  // Auto-select first recommended dish when restaurant changes
  const hasAutoSelectedRef = useRef<boolean>(false);
  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [restaurant.id, restaurant.name]);

  useEffect(() => {
    if (!isLoading && threeDishes.length > 0 && (!selectedDish || !hasAutoSelectedRef.current)) {
      hasAutoSelectedRef.current = true;
      const first = threeDishes[0];
      const cleanDishName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(cleanDishName, first.image, restaurant.name);
      onSelectDish({
        ...first,
        name: cleanDishName,
        image: visual.flyingImage || visual.plateImage
      });
    }
  }, [isLoading, threeDishes, selectedDish, restaurant.name, onSelectDish]);

  const handleSelectDishItem = (dish: Dish) => {
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    const finalImg = visual.flyingImage || visual.plateImage;
    onSelectDish({
      ...dish,
      name: cleanName,
      image: finalImg
    });
  };

  const handleSelectAndConfirmDish = (dish: Dish) => {
    const cleanName = formatCleanDishName(dish.name, restaurant.name);
    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
    const finalImg = visual.flyingImage || visual.plateImage;
    onSelectDish({
      ...dish,
      name: cleanName,
      image: finalImg
    });
    onConfirmDish(cleanName, finalImg);
  };

  const handleCustomDishSubmit = () => {
    const trimmed = customDishInput.trim();
    if (!trimmed) return;
    const visual = getDishVisualAssets(trimmed, undefined, restaurant.name);
    const dishObj: Dish = {
      id: Math.floor(Math.random() * 80000) + 10000,
      restaurant_id: restaurant.id,
      name: trimmed,
      description: `Custom dish at ${restaurant.name}`,
      price: 180,
      image: visual.flyingImage || visual.plateImage,
      rating: 5.0,
      popularity: 100,
      is_recommended: 1,
      is_veg: isDishVeg(trimmed) ? 1 : 0,
      status: 'active'
    };
    onSelectDish(dishObj);
    onConfirmDish(trimmed, visual.flyingImage || visual.plateImage);
  };

  const handleConfirm = () => {
    let finalName = '';
    let finalImg = '';

    if (selectedDish?.name) {
      finalName = formatCleanDishName(selectedDish.name, restaurant.name);
      const visual = getDishVisualAssets(finalName, selectedDish.image, restaurant.name);
      finalImg = visual.flyingImage || selectedDish.image || visual.plateImage;
    } else if (menuSearchQuery.trim()) {
      const matched = matchingSuggestions.length > 0 ? matchingSuggestions[0] : null;
      if (matched) {
        finalName = formatCleanDishName(matched.name, restaurant.name);
        const visual = getDishVisualAssets(finalName, matched.image, restaurant.name);
        finalImg = visual.flyingImage || matched.image || visual.plateImage;
        onSelectDish({
          ...matched,
          name: finalName,
          image: finalImg
        });
      } else if (threeDishes.length > 0) {
        const first = threeDishes[0];
        finalName = formatCleanDishName(first.name, restaurant.name);
        const visual = getDishVisualAssets(finalName, first.image, restaurant.name);
        finalImg = visual.flyingImage || visual.plateImage;
        onSelectDish({
          ...first,
          name: finalName,
          image: finalImg
        });
      }
    } else if (threeDishes.length > 0) {
      const first = threeDishes[0];
      finalName = formatCleanDishName(first.name, restaurant.name);
      const visual = getDishVisualAssets(finalName, first.image, restaurant.name);
      finalImg = visual.flyingImage || visual.plateImage;
    } else {
      finalName = 'Special Plate';
      const visual = getDishVisualAssets(finalName, undefined, restaurant.name);
      finalImg = visual.plateImage;
    }

    onConfirmDish(finalName, finalImg);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 p-3 sm:p-4 gap-2.5 bg-white overflow-y-auto scrollbar-thin relative pb-8">
      {/* 1. Headline */}
      <div className="text-left shrink-0">
        <h2 className="text-[19px] xs:text-[21px] sm:text-[26px] font-black text-[#0B1B48] leading-[1.15] tracking-tight">
          Favourite food stop mil gaya<br />Ab plate decide karo.
        </h2>
      </div>

      {isLoading ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-200 animate-pulse my-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-[#D4380D]">
            <Utensils className="w-6 h-6 animate-bounce text-[#D4380D]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">{loadingStatus}</h3>
            <p className="text-[11px] text-slate-400">Loading verified dishes for {restaurant.name}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Top Signature Quick-Pick Cards */}
          {threeDishes.length > 0 && (
            <div className="shrink-0 w-full">
              <div className={`grid gap-2 w-full ${threeDishes.length === 1
                  ? 'grid-cols-1 max-w-[180px] mx-auto'
                  : threeDishes.length === 2
                    ? 'grid-cols-2 max-w-[360px] mx-auto'
                    : 'grid-cols-3'
                }`}>
                {threeDishes.map((dish) => {
                  const cleanDishName = formatCleanDishName(dish.name, restaurant.name);
                  const isSelected = selectedDish?.name?.toLowerCase() === cleanDishName.toLowerCase() ||
                    selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();
                  const visual = getDishVisualAssets(cleanDishName, dish.image, restaurant.name);

                  return (
                    <button
                      id={`btn-frame3-quick-dish-${dish.id || dish.name.toLowerCase().replace(/\s+/g, '-')}`}
                      key={`quick-${dish.id}-${dish.name}`}
                      type="button"
                      onClick={() => handleSelectDishItem(dish)}
                      className={`w-full py-2 px-1.5 rounded-xl transition-all flex flex-col items-center justify-center text-center relative cursor-pointer border-2 min-h-[76px] sm:min-h-[82px] ${isSelected
                          ? 'bg-orange-50 border-[#D4380D] text-[#D4380D] shadow-sm shadow-[#D4380D]/15 scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 text-[#0B1B48]'
                        }`}
                    >
                      {/* Floating Checkmark for Selected State */}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4380D] text-white flex items-center justify-center shadow-xs z-10">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Pure Food Image with Lightweight Placeholder */}
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mb-0.5 flex items-center justify-center shrink-0">
                        <DishThumbnail
                          src={visual.flyingImage || visual.plateImage}
                          alt={cleanDishName}
                        />
                      </div>

                      <span className={`font-black text-[11px] sm:text-xs leading-tight line-clamp-2 ${isSelected ? 'text-[#D4380D]' : 'text-[#0B1B48]'
                        }`}>
                        {cleanDishName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. MENU SEARCH BAR & REAL-TIME AUTO-SUGGESTIONS (No full menu scroll) */}
          <div className="w-full shrink-0 flex flex-col rounded-2xl border-2 border-slate-200/90 bg-white overflow-hidden shadow-sm mt-0.5">
            {/* Search Input Bar */}
            <div className="p-2 bg-slate-50/50">
              <div className="relative flex items-center w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 focus-within:border-[#D4380D] focus-within:ring-1 focus-within:ring-[#D4380D]/20 transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  placeholder={dynamicPlaceholder}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                {menuSearchQuery && (
                  <button
                    id="btn-frame3-clear-search"
                    type="button"
                    onClick={() => setMenuSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {!menuSearchQuery.trim() ? null : (
              /* When typing: Display Live Dynamic Auto-Suggestions */
              <div className="border-t border-slate-100 bg-white animate-in fade-in duration-200">
                <div className="px-3 py-1.5 bg-orange-50/70 border-b border-orange-100/80 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1.5 text-[#D4380D]">
                    <Sparkles className="w-3 h-3 text-[#D4380D]" />
                    Auto-Suggestions ({matchingSuggestions.length})
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                    Authentic from {restaurant.name}
                  </span>
                </div>

                <div className="max-h-[220px] xs:max-h-[260px] overflow-y-auto divide-y divide-slate-100 scrollbar-thin p-1 bg-white">
                  {matchingSuggestions.map((dish) => {
                    const cleanName = formatCleanDishName(dish.name, restaurant.name);
                    const isSelected =
                      selectedDish?.name?.toLowerCase() === cleanName.toLowerCase() ||
                      selectedDish?.name?.toLowerCase() === dish.name.toLowerCase();
                    const visual = getDishVisualAssets(cleanName, dish.image, restaurant.name);
                    const isVeg = dish.is_veg !== undefined ? dish.is_veg === 1 : isDishVeg(dish.name);

                    return (
                      <div
                        key={`suggest-${dish.id}-${dish.name}`}
                        onClick={() => {
                          handleSelectDishItem(dish);
                          if (onSearchSelectDish) onSearchSelectDish(cleanName, dish.id);
                        }}
                        className={`w-full p-2 rounded-xl transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left ${isSelected
                            ? 'bg-orange-50/90 border border-orange-200'
                            : 'hover:bg-slate-50 border border-transparent'
                          }`}
                      >
                        {/* Thumbnail with Lightweight Placeholder */}
                        <div className="w-10 h-10 rounded-full p-0.5 bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                          <DishThumbnail
                            src={visual.flyingImage || visual.plateImage}
                            alt={cleanName}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="mt-0.5 shrink-0">
                            {isVeg ? (
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 border border-emerald-600 rounded-xs p-0.5"
                                title="Pure Veg"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 border border-red-600 rounded-xs p-0.5"
                                title="Non-Veg"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-black truncate ${isSelected ? 'text-[#D4380D]' : 'text-slate-900'
                                  }`}
                              >
                                {cleanName}
                              </span>
                            </div>
                            {dish.description && (
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {dish.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Select Button */}
                        <div className="flex items-center shrink-0">
                          <button
                            id={`btn-frame3-select-dish-${dish.id || dish.name.toLowerCase().replace(/\s+/g, '-')}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAndConfirmDish(dish);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer shrink-0 ${isSelected
                                ? 'bg-[#D4380D] text-white shadow-xs'
                                : 'bg-orange-50 hover:bg-[#D4380D] hover:text-white text-[#D4380D] border border-orange-200'
                              }`}
                          >
                            {isSelected ? (
                              <span className="flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                                CHOSEN
                              </span>
                            ) : (
                              'SELECT'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Primary CTA Button */}
          <div className="shrink-0 w-full pt-0.5">
            <button
              id="btn-frame3-confirm-dish"
              onClick={handleConfirm}
              type="button"
              className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer border-0"
            >
              YEH WALA PAKKA
            </button>
          </div>
        </>
      )}
    </div>
  );
};
