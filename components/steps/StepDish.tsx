'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ArrowRight, ArrowLeft, PlusCircle, Check, Flame, Sparkles } from 'lucide-react';
import type { Restaurant, Dish } from '@/lib/db';
import { getDishImage } from '../BakasurVideoPlayer';
import { withBasePath } from '@/lib/basePath';

export interface SpiceOption {
  id: string;
  name: string;
  level: string;
  icon: string;
  description: string;
}

export const SPICE_LEVELS: SpiceOption[] = [
  { id: 'mild', name: 'Mild & Makkhan', level: '1/5', icon: '🧈', description: 'Bachha Level - Bhookasur will laugh at you!' },
  { id: 'masaledaar', name: 'Masaledaar', level: '3/5', icon: '🌶️', description: 'Asli Street Spice - Thoda thoda pasina aayega' },
  { id: 'fire', name: 'Bhookasur Fire', level: '5/5', icon: '🔥', description: 'Direct Volcano - Seene mein aag guarantee!' }
];

interface StepDishProps {
  restaurant: Restaurant;
  selectedDish: Dish | { name: string; id?: number; price?: number } | null;
  selectedSpice: SpiceOption;
  onSelectDish: (dish: Dish | { name: string; id?: number; price?: number }) => void;
  onSelectSpice: (spice: SpiceOption) => void;
  onFeedBakasur: (customDishName?: string) => void;
  onBack?: () => void;
}

export const StepDish: React.FC<StepDishProps> = ({
  restaurant,
  selectedDish,
  selectedSpice,
  onSelectDish,
  onFeedBakasur,
  onSelectSpice,
  onBack
}) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const activeReqIdRef = React.useRef(0);

  // Fetch live menu for the selected restaurant
  const fetchDishes = useCallback(async () => {
    const currentReqId = ++activeReqIdRef.current;
    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    try {
      const queryParams = new URLSearchParams({
        name: restaurant.name || '',
        area: restaurant.area || '',
        city: restaurant.city || ''
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
      const json = await res.json();
      if (activeReqIdRef.current !== currentReqId) return;

      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setDishes(json.data);
        if (!selectedDish) {
          onSelectDish(json.data[0]);
        }
      }
    } catch (err: unknown) {
      if (activeReqIdRef.current === currentReqId && (err as Error)?.name !== 'AbortError') {
        console.error("Failed to fetch dishes", err);
      }
    } finally {
      clearTimeout(timer);
      if (activeReqIdRef.current === currentReqId) {
        setIsLoading(false);
      }
    }
  }, [restaurant.id, restaurant.name, restaurant.area, restaurant.city, restaurant.latitude, restaurant.longitude, selectedDish, onSelectDish]);

  useEffect(() => {
    fetchDishes();
    return () => {
      activeReqIdRef.current++;
    };
  }, [fetchDishes]);

  // Display ALL dishes from the restaurant; filterable by search and category
  const displayedDishes = useMemo(() => {
    let list = dishes;
    if (categoryFilter === 'special') {
      list = dishes.filter(d => d.is_recommended || d.popularity >= 98);
    } else if (categoryFilter === 'starters') {
      list = dishes.filter(d => {
        const n = d.name.toLowerCase();
        return n.includes('tikka') || n.includes('kebab') || n.includes('fry') || n.includes('vada') || n.includes('chaat') || n.includes('soup') || n.includes('momos') || n.includes('roll') || n.includes('bread') || n.includes('bites') || n.includes('pakoda');
      });
    } else if (categoryFilter === 'mains') {
      list = dishes.filter(d => {
        const n = d.name.toLowerCase();
        return n.includes('biryani') || n.includes('curry') || n.includes('gravy') || n.includes('handi') || n.includes('masala') || n.includes('thali') || n.includes('paneer') || n.includes('mutton') || n.includes('chicken') || n.includes('pithla') || n.includes('misal') || n.includes('pizza') || n.includes('burger') || n.includes('rice') || n.includes('noodles');
      });
    } else if (categoryFilter === 'desserts') {
      list = dishes.filter(d => {
        const n = d.name.toLowerCase();
        return n.includes('mastani') || n.includes('ice cream') || n.includes('falooda') || n.includes('kulfi') || n.includes('modak') || n.includes('jamun') || n.includes('cake') || n.includes('lassi') || n.includes('shake') || n.includes('coffee') || n.includes('chai') || n.includes('solkadhi') || n.includes('waffle') || n.includes('sheera');
      });
    }

    if (!searchQuery.trim()) {
      return list.length > 0 ? list : dishes;
    }

    const q = searchQuery.toLowerCase().trim();
    return dishes.filter(d => 
      d.name.toLowerCase().includes(q) || 
      (d.description && d.description.toLowerCase().includes(q))
    );
  }, [dishes, searchQuery, categoryFilter]);

  // Handle selecting a dish
  const handleSelectDish = (dish: Dish) => {
    onSelectDish(dish);
  };

  // Handle selecting custom searched dish
  const handleSelectCustomDish = (customName: string) => {
    if (!customName.trim()) return;
    const customItem = {
      name: customName.trim(),
      id: Math.floor(Math.random() * 90000) + 10000,
      price: 180
    };
    onSelectDish(customItem);
  };

  const activeDishName = selectedDish?.name || '';
  const isCustomMatch = searchQuery.trim() && !displayedDishes.some(d => d.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 text-white gap-2">
      {/* Top Header - Restaurant Title & Change Spot */}
      <div className="shrink-0 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white brand-font leading-tight truncate">
              {restaurant.name}:
            </h2>
            <span className="text-[9px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>📖 Full Menu ({dishes.length} Items)</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-blue-200 font-medium leading-snug">
            Choose what Bhookasur will feast on today!
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold shrink-0 transition-all border border-white/15 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Change Spot</span>
          </button>
        )}
      </div>

      {/* Category Filter Chips Bar */}
      <div className="shrink-0 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {[
          { id: 'all', label: `All (${dishes.length})` },
          { id: 'special', label: '👑 Specials' },
          { id: 'mains', label: '🍛 Main Course' },
          { id: 'starters', label: '🍢 Starters & Snacks' },
          { id: 'desserts', label: '🥤 Drinks & Sweets' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all border cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-[#D23002] border-[#D23002] text-white shadow-sm'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-blue-200 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dish Search Bar */}
      <div className="shrink-0 relative z-10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search all ${dishes.length} dishes from ${restaurant.name}...`}
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-white border border-blue-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D23002] shadow-md"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 px-1 py-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Custom Dish Quick Add Banner if user typed something not on menu */}
      {isCustomMatch && (
        <div
          onClick={() => handleSelectCustomDish(searchQuery)}
          className="shrink-0 p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 cursor-pointer transition-all flex items-center justify-between gap-2 text-white"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <PlusCircle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[11px] font-bold truncate">
              Feed custom dish: <span className="underline text-amber-200">&quot;{searchQuery}&quot;</span>
            </span>
          </div>
          <button
            type="button"
            className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] shrink-0"
          >
            Select 🍛
          </button>
        </div>
      )}

      {/* Dishes List (Top 3 or Filtered Search Results) - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1.5 relative z-10">
        {isLoading && dishes.length === 0 ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : displayedDishes.length === 0 && !isCustomMatch ? (
          <div className="p-3 text-center rounded-xl bg-white/10 border border-white/15">
            <p className="text-xs font-bold text-blue-100">No matching dishes for &quot;{searchQuery}&quot;</p>
            <p className="text-[10px] text-blue-200 mt-0.5">Type above to feed Bhookasur any custom dish!</p>
          </div>
        ) : (
          displayedDishes.map((dish, idx) => {
            const isSelected = selectedDish?.name.toLowerCase() === dish.name.toLowerCase();
            const rankLabel = !searchQuery.trim() ? (idx === 0 ? '🔥 #1 Signature' : idx === 1 ? '⭐ #2 Popular' : '✨ #3 Must Try') : null;
            return (
              <div
                key={`${dish.id}-${idx}`}
                onClick={() => handleSelectDish(dish)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-slate-900 ${
                  isSelected
                    ? 'border-2 border-[#D23002] bg-orange-50/95 shadow-md scale-[1.01]'
                    : 'border-white/20 hover:border-[#D23002]/50 hover:bg-slate-50 bg-white shadow-sm'
                }`}
              >
                {/* Left image & details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img 
                      src={getDishImage(dish.name, dish.image)} 
                      alt={dish.name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-black text-xs sm:text-sm brand-font truncate ${isSelected ? 'text-[#D23002]' : 'text-slate-900'}`}>
                        {dish.name}
                      </h4>
                      {rankLabel && (
                        <span className="text-[8px] font-extrabold text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-200">
                          {rankLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">
                      {dish.description || `Specialty at ${restaurant.name}.`}
                    </p>
                  </div>
                </div>

                {/* Right Select button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDish(dish);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all shrink-0 cursor-pointer brand-font ${
                    isSelected
                      ? 'bg-[#D23002] text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Spice Level Selector */}
      <div className="shrink-0 flex flex-col gap-1 pt-0.5 relative z-10">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-extrabold text-[#ff8566] uppercase tracking-wider flex items-center gap-1">
            <span>SPICE LEVEL:</span>
            <span>🌶️</span>
          </span>
          <span className="font-bold text-[#ffb09c]">
            {selectedSpice.name} ({selectedSpice.level})
          </span>
        </div>

        {/* 3 Spice Pill Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {SPICE_LEVELS.map((sp) => {
            const isSelected = selectedSpice.id === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => onSelectSpice(sp)}
                type="button"
                className={`py-1.5 px-2 rounded-xl text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'border-2 border-[#D23002] bg-[#D23002] text-white font-black shadow-md scale-[1.02]'
                    : 'border-white/20 hover:border-[#D23002]/50 bg-white/10 text-white'
                }`}
              >
                <span className="text-sm">{sp.icon}</span>
                <span className="font-extrabold text-[10px] sm:text-[11px] brand-font truncate">{sp.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="shrink-0 pt-0.5 relative z-10">
        <button
          onClick={() => onFeedBakasur(activeDishName)}
          disabled={!activeDishName.trim()}
          type="button"
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#D23002]/30 transition-all flex items-center justify-center gap-2 cursor-pointer brand-font disabled:opacity-50 tracking-wide border border-white/20 active:scale-[0.99]"
        >
          <span>Feed Bhookasur: {activeDishName ? `"${activeDishName.slice(0, 20)}${activeDishName.length > 20 ? '...' : ''}"` : 'Pick a Dish'} 🍛</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

