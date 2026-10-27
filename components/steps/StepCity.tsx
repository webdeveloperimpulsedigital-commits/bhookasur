'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ArrowRight, MapPin, Crosshair, X, Check, Building2, Sparkles, Navigation } from 'lucide-react';
import type { Restaurant } from '@/lib/db';
import { PUNE_AREAS, AreaInfo } from '@/lib/areas';

export interface CityItem {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const CITIES_LIST: CityItem[] = [
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8407 },
  { name: "Mumbai", state: "Maharashtra", lat: 18.9222, lng: 72.8317 },
  { name: "Delhi", state: "NCR-Delhi", lat: 28.6507, lng: 77.2334 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9452, lng: 77.5704 },
  { name: "Hyderabad", state: "Telangana", lat: 17.4416, lng: 78.4983 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5528, lng: 88.3533 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Amritsar", state: "Punjab", lat: 31.6340, lng: 74.8723 },
  { name: "Nashik", state: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Goa", state: "Goa", lat: 15.2993, lng: 74.1240 }
];

interface StepCityProps {
  selectedCity: string;
  selectedArea?: string;
  userCoords?: { lat: number; lng: number } | null;
  selectedRestaurant: Restaurant | null;
  isLocating?: boolean;
  locationSource?: 'gps' | 'ip' | 'manual';
  onDetectLocation?: () => Promise<void> | void;
  onSelectCity: (city: CityItem) => void;
  onSelectArea?: (area: string, coords?: { lat: number; lng: number }) => void;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const StepCity: React.FC<StepCityProps> = ({
  selectedCity,
  selectedArea,
  userCoords,
  selectedRestaurant,
  isLocating = false,
  locationSource = 'ip',
  onDetectLocation,
  onSelectCity,
  onSelectArea,
  onSelectRestaurant,
  onNext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyRestaurants, setNearbyRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  // Handle selecting any restaurant from any city
  const handleSelectSpot = useCallback((rest: Restaurant) => {
    onSelectRestaurant(rest);
  }, [onSelectRestaurant]);

  // Fetch Recommended Spots or Live Nationwide Search Results
  const fetchNearbySpots = useCallback(async (query: string, city: string, coords?: { lat: number; lng: number } | null) => {
    setIsLoadingSpots(true);
    try {
      const latParam = coords ? `&lat=${coords.lat}&lng=${coords.lng}` : '';
      const areaParam = selectedArea ? `&area=${encodeURIComponent(selectedArea)}` : '';
      let url = `/api/restaurants/nearby?city=${encodeURIComponent(city || 'Pune')}${areaParam}${latParam}`;
      if (query.trim()) {
        url = `/api/restaurants/search?q=${encodeURIComponent(query)}&city=${encodeURIComponent(city || '')}${areaParam}${latParam}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNearbyRestaurants(json.data);
        // Only auto-select default spot on initial load if no search query was entered
        if (!query.trim() && !selectedRestaurant && json.data.length > 0) {
          handleSelectSpot(json.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
    } finally {
      setIsLoadingSpots(false);
    }
  }, [selectedRestaurant, selectedArea, handleSelectSpot]);

  // Reactively fetch whenever user location, search query, or selected city changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNearbySpots(searchQuery, selectedCity, userCoords);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, selectedArea, userCoords, fetchNearbySpots]);

  // Handle Add Custom Restaurant if user types a new place
  const handleAddCustomRestaurant = () => {
    if (!searchQuery.trim()) return;
    const customSpot: Restaurant = {
      id: 999000 + Math.floor(Math.random() * 1000),
      name: searchQuery.trim(),
      description: `Custom selected food spot`,
      address: `${selectedArea ? selectedArea + ', ' : ''}${selectedCity || 'Pune'}`,
      area: selectedArea || selectedCity || 'Pune',
      city: selectedCity || 'Pune',
      latitude: userCoords?.lat || 18.5204,
      longitude: userCoords?.lng || 73.8407,
      rating: 5.0,
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      is_campaign_active: 1,
      total_visits: 1,
      status: 'active'
    };
    setNearbyRestaurants([customSpot, ...nearbyRestaurants]);
    handleSelectSpot(customSpot);
  };

  // Instant client-side filtering while typing (0ms latency)
  const displayedRestaurants = React.useMemo(() => {
    if (!searchQuery.trim()) return nearbyRestaurants;
    const q = searchQuery.toLowerCase().trim();
    return nearbyRestaurants.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.area && r.area.toLowerCase().includes(q)) || 
      (r.city && r.city.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }, [nearbyRestaurants, searchQuery]);

  // Filtered cities and areas for the Location Modal
  const filteredCities = React.useMemo(() => {
    if (!locationSearchQuery.trim()) return CITIES_LIST;
    const q = locationSearchQuery.toLowerCase().trim();
    return CITIES_LIST.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q));
  }, [locationSearchQuery]);

  const filteredPuneAreas = React.useMemo(() => {
    if (!locationSearchQuery.trim()) return PUNE_AREAS;
    const q = locationSearchQuery.toLowerCase().trim();
    return PUNE_AREAS.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.displayName.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q)
    );
  }, [locationSearchQuery]);

  // Handle Pick City from Modal
  const handlePickCity = (city: CityItem) => {
    onSelectCity(city);
    if (onSelectArea) {
      onSelectArea('', { lat: city.lat, lng: city.lng });
    }
    setShowLocationModal(false);
  };

  // Handle Pick Area from Modal
  const handlePickArea = (area: AreaInfo) => {
    if (onSelectArea) {
      onSelectArea(area.name, { lat: area.latitude, lng: area.longitude });
    }
    setShowLocationModal(false);
  };

  // Handle Trigger GPS from Modal or Top Bar
  const handleTriggerGPS = async () => {
    if (onDetectLocation) {
      await onDetectLocation();
    }
    setShowLocationModal(false);
  };

  const currentDisplayLabel = selectedArea
    ? `${selectedArea}, ${selectedCity || 'Pune'}`
    : `${selectedCity || 'Pune'}`;

  return (
    <div className="w-full h-full flex flex-col justify-between min-h-0 text-white gap-2.5">
      {/* Top Header + Zomato/Swiggy-Style Live Location Pill */}
      <div className="shrink-0 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-white brand-font leading-tight">
            Kahan Khilaoge Bhookasur Ko?
          </h2>
        </div>
      </div>

      {/* Prominent Search Bar */}
      <div className="shrink-0 relative z-10">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search any hotel, restaurant, cafe in ${selectedArea || selectedCity || 'Pune'} or anywhere...`}
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl bg-white border border-blue-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D23002] shadow-md transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Suggestions / Food Joints List - Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 flex flex-col gap-1.5 relative z-10">
        {isLoadingSpots && displayedRestaurants.length === 0 ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        ) : displayedRestaurants.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-white/10 border border-white/15">
            {searchQuery.trim() ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-bold text-blue-100">
                  No spot found for &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-blue-200">
                  Bhookasur can eat anywhere! Select this spot directly:
                </p>
                <button
                  onClick={handleAddCustomRestaurant}
                  type="button"
                  className="py-1.5 px-3 rounded-lg bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>➕ Feed Bhookasur at &quot;{searchQuery}&quot;</span>
                </button>
              </div>
            ) : (
              <p className="text-xs font-bold text-blue-100">
                Type above to search any hotel or food joint.
              </p>
            )}
          </div>
        ) : (
          displayedRestaurants.map((rest, idx) => {
            const isSelected = selectedRestaurant?.id === rest.id;
            return (
              <div
                key={`${rest.id}-${idx}`}
                onClick={() => handleSelectSpot(rest)}
                className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-slate-900 ${
                  isSelected
                    ? 'border-2 border-[#D23002] bg-orange-50/95 shadow-md scale-[1.01]'
                    : 'border-white/20 hover:border-[#D23002]/50 hover:bg-slate-50 bg-white shadow-sm'
                }`}
              >
                {/* Left Thumbnail & Details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-inner">
                    <img src={rest.image} alt={rest.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className={`font-black text-xs sm:text-sm brand-font truncate ${isSelected ? 'text-[#D23002]' : 'text-slate-900'}`}>
                        {rest.name}
                      </h4>
                      <span className="flex items-center text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                        ★ {rest.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
                      <span className="text-[#023093] font-bold bg-blue-100/70 px-1 rounded truncate">
                        📍 {rest.area && rest.city && !rest.area.toLowerCase().includes(rest.city.toLowerCase()) ? `${rest.area}, ${rest.city}` : rest.area || rest.city}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-700 font-mono font-bold">
                        ⚡ {(rest as Restaurant & { distanceKm?: number }).distanceKm !== undefined ? `${(rest as Restaurant & { distanceKm?: number }).distanceKm} km away` : 'Nearby'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Select CTA */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSpot(rest);
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

      {/* Navigation Footer */}
      <div className="shrink-0 pt-1 relative z-10">
        <button
          onClick={onNext}
          disabled={!selectedRestaurant}
          type="button"
          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#D23002]/30 transition-all flex items-center justify-center gap-2 cursor-pointer brand-font disabled:opacity-50 tracking-wide border border-white/20 active:scale-[0.99]"
        >
          <span>Next: Pick Spicy Dish</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ZOMATO-STYLE LOCATION PICKER MODAL / DRAWER */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 to-[#021b52] border border-blue-400/30 rounded-t-[2rem] sm:rounded-2xl p-4 sm:p-5 text-white max-h-[88vh] flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#D23002]" />
                <h3 className="text-base sm:text-lg font-black brand-font tracking-tight">
                  Choose Your Location
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-4 pr-1">
              
              {/* Option 1: Live GPS Auto-Detect Button */}
              <button
                type="button"
                onClick={handleTriggerGPS}
                disabled={isLocating}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-600/30 to-blue-600/30 border-2 border-emerald-400/40 hover:border-emerald-400 text-left transition-all flex items-center justify-between gap-3 group shadow-md active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform shrink-0">
                    <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin text-emerald-400' : 'text-emerald-300'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition-colors brand-font flex items-center gap-1.5">
                      <span>Use Current Live Location (GPS)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-emerald-200/80 font-medium">
                      {isLocating ? 'Acquiring GPS fix...' : 'Auto-detect device coordinates for nearby hotels'}
                    </p>
                  </div>
                </div>
                <Navigation className="w-4 h-4 text-emerald-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Search Locality / Area / City */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  placeholder="Search city or neighborhood (e.g. Kothrud, Bandra, FC Road)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D23002] transition-all font-medium"
                />
                {locationSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLocationSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Section 1: Popular Cities */}
              <div>
                <h4 className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>Popular Cities</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {filteredCities.map((c) => {
                    const isCityActive = selectedCity.toLowerCase() === c.name.toLowerCase();
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => handlePickCity(c)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isCityActive
                            ? 'bg-[#D23002] border-[#D23002] text-white shadow-md shadow-[#D23002]/30 scale-[1.02]'
                            : 'bg-white/5 hover:bg-white/15 border-white/10 text-white hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black brand-font truncate">{c.name}</span>
                          {isCityActive && <Check className="w-3 h-3 text-white shrink-0" />}
                        </div>
                        <span className="text-[9px] opacity-75 truncate">{c.state}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Popular Pune Areas (if Pune is selected or searched) */}
              {(selectedCity.toLowerCase() === 'pune' || locationSearchQuery.trim()) && (
                <div>
                  <h4 className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Popular Pune Localities & Hubs</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredPuneAreas.map((area) => {
                      const isAreaActive = selectedArea?.toLowerCase() === area.name.toLowerCase();
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => handlePickArea(area)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isAreaActive
                              ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                              : 'bg-white/5 hover:bg-white/15 border-white/10 text-white hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-black brand-font truncate">{area.name}</h5>
                            {isAreaActive && <Check className="w-3 h-3 text-white shrink-0" />}
                          </div>
                          <p className="text-[9px] text-blue-200/80 truncate mt-0.5">{area.popularLandmarks[0] || area.displayName}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/10 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="py-1.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
