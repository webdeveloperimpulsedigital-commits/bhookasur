'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, ArrowRight, Check } from 'lucide-react';
import type { Restaurant } from '@/lib/db';

interface StepRestaurantProps {
  userLocation: { city: string; lat: number; lng: number };
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const StepRestaurant: React.FC<StepRestaurantProps> = ({
  userLocation,
  selectedRestaurant,
  onSelectRestaurant,
  onNext,
  onBack
}) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch restaurants for the selected city with AbortController and no auto-select without confirmation
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        let url = `/api/restaurants/nearby?city=${encodeURIComponent(userLocation.city)}&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        if (searchQuery.trim()) {
          url = `/api/restaurants/search?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(userLocation.city)}&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }
        const res = await fetch(url, { signal: controller.signal });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRestaurants(json.data);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error("Failed to fetch restaurants", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, userLocation.city, userLocation.lat, userLocation.lng]);

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-4 sm:gap-5 text-slate-900">
      {/* Top Label */}
      <div className="text-left">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 brand-font">
          {userLocation.city} Mein Kaunsa Joint?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select the famous restaurant, dhaba, or search any hotel near your home:
        </p>
      </div>

      {/* Food Joints List */}
      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {isLoading && restaurants.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">No food joints found for &quot;{searchQuery}&quot;.</p>
          </div>
        ) : (
          restaurants.map((rest, idx) => {
            const isSelected = selectedRestaurant?.id === rest.id;
            return (
              <div
                key={`${rest.id}-${idx}`}
                onClick={() => onSelectRestaurant(rest)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-2 border-[#023093] bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 bg-white'
                }`}
              >
                {/* Left info with pin */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${isSelected ? 'text-red-500' : 'text-slate-400'}`}>
                    📍
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-extrabold text-sm brand-font truncate ${isSelected ? 'text-[#023093]' : 'text-slate-900'}`}>
                      {rest.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {rest.area || rest.address} ({rest.description?.split('.')[0] || 'Legendary Joint'})
                    </p>
                  </div>
                </div>

                {/* Right Select / Selected Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRestaurant(rest);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#023093] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Live Search Local Joint */}
      <div className="flex flex-col gap-1.5 pt-1">
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <span>LIVE SEARCH LOCAL JOINT / HOTEL</span>
          <span>🔍</span>
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`🔍 ${selectedRestaurant?.name || 'Search local joint / hotel...'}`}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-[#023093] focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="pt-2">
        <button
          onClick={onNext}
          disabled={!selectedRestaurant}
          type="button"
          className="w-full py-3 px-5 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#D23002]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer brand-font disabled:opacity-50"
        >
          <span>Next: Pick Food to Feed</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
