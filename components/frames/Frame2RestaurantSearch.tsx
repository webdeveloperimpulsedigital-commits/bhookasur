'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Check, Sparkles } from 'lucide-react';
import type { Restaurant } from '@/lib/db';
import { isPureVegRestaurantName } from '@/lib/dishAssets';
import { parseRestaurantQuery, getDeterministicPlaceId } from '@/lib/locationParser';
import { resolveRestaurantQuery } from '@/lib/restaurantNormalizer';
import { withBasePath } from '@/lib/basePath';

interface Frame2RestaurantSearchProps {
  selectedCity: string;
  selectedRestaurant: Restaurant | null;
  userCoords?: { lat: number; lng: number } | null;
  isSecondRound?: boolean;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onNext: (restaurant?: Restaurant) => void;
  onBack: () => void;
  onWatchVideo?: () => void;
}

export const Frame2RestaurantSearch: React.FC<Frame2RestaurantSearchProps> = ({
  selectedCity,
  selectedRestaurant,
  userCoords,
  isSecondRound = false,
  onSelectRestaurant,
  onNext,
  onWatchVideo
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return selectedRestaurant ? selectedRestaurant.name : '';
  });
  const [chosenSpot, setChosenSpot] = useState<Restaurant | null>(selectedRestaurant);
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(userCoords || null);
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [firstVisitorInfo, setFirstVisitorInfo] = useState<{
    checked: boolean;
    isFirstVisitor: boolean;
    visitCount: number;
    restaurantName: string;
  } | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync coords if prop updates from page
  useEffect(() => {
    setCoords(userCoords || null);
    if (!userCoords) {
      setLocationLabel('');
    }
  }, [userCoords]);

  // Show dropdown when user focuses on search box ONLY if there is an active search query
  const handleFocus = () => {
    if (searchQuery.trim() && searchResults.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      if (!searchQuery.trim()) {
        setSearchResults([]);
      }
    }
  };

  // Reset selectedIndex on new search results
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Sync searchQuery & chosenSpot if selectedRestaurant is explicitly updated
  useEffect(() => {
    if (selectedRestaurant) {
      setChosenSpot(selectedRestaurant);
      setSearchQuery(
        selectedRestaurant.name +
        (selectedRestaurant.area && !selectedRestaurant.name.includes(selectedRestaurant.area)
          ? `, ${selectedRestaurant.area}`
          : '')
      );
    }
  }, [selectedRestaurant]);

  // Check in DB if user is the first visitor for the searched/selected restaurant
  useEffect(() => {
    const candidateName = selectedRestaurant?.name || searchQuery.trim();
    if (!candidateName || candidateName.length < 3) {
      setFirstVisitorInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const idParam = selectedRestaurant?.id ? `&id=${selectedRestaurant.id}` : '';
        const res = await fetch(withBasePath(`/api/restaurants/check-visits?name=${encodeURIComponent(candidateName)}${idParam}`));
        const data = await res.json();
        if (data.success) {
          setFirstVisitorInfo({
            checked: true,
            isFirstVisitor: Boolean(data.isFirstVisitor),
            visitCount: Number(data.visitCount || 0),
            restaurantName: candidateName
          });
        }
      } catch (err) {
        console.warn('Error checking restaurant visits:', err);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [selectedRestaurant, searchQuery]);

  // Live Search autocomplete query with fast AbortController & live distance
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setShowDropdown(false);
      setSpellingSuggestion(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const latParam = coords?.lat ? `&lat=${coords.lat}` : '';
        const lngParam = coords?.lng ? `&lng=${coords.lng}` : '';
        const cityParam = selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : '';
        const res = await fetch(
          withBasePath(`/api/restaurants/search?q=${encodeURIComponent(q)}${cityParam}${latParam}${lngParam}`),
          { signal: controller.signal }
        );
        const json = await res.json();
        const verifiedList = json.success && Array.isArray(json.data) ? json.data.slice(0, 15) : [];
        setSearchResults(verifiedList);
        setShowDropdown(true);
        setSpellingSuggestion(json.spellingSuggestion || null);
        setSearchMessage(verifiedList.length === 0 ? String(json.message || '') : '');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setSearchResults([]);
          setSpellingSuggestion(null);
          setSearchMessage('');
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCity, coords]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSpot = (spot: Restaurant) => {
    setChosenSpot(spot);
    onSelectRestaurant(spot);
    setSearchQuery(
      spot.area && !spot.name.toLowerCase().includes(spot.area.toLowerCase())
        ? `${spot.name}, ${spot.area}`
        : spot.name
    );
    setShowDropdown(false);

    // Live menu background prefetch so Frame 3 opens instantaneously
    try {
      const isStrictVeg = isPureVegRestaurantName(spot.name) || spot.is_veg === 1;
      const params = new URLSearchParams({
        name: spot.name || '',
        area: spot.area || '',
        city: spot.city || '',
        is_veg: isStrictVeg ? '1' : (spot.is_veg ? '1' : '0')
      });
      if (spot.latitude) params.set('lat', String(spot.latitude));
      if (spot.longitude) params.set('lng', String(spot.longitude));
      const customSpot = spot as unknown as { zomato_url?: string; swiggy_id?: string; zomato_id?: string };
      if (customSpot.zomato_url) params.set('zomato_url', customSpot.zomato_url);
      if (customSpot.swiggy_id) params.set('swiggy_id', customSpot.swiggy_id);
      if (customSpot.zomato_id) params.set('zomato_id', customSpot.zomato_id);
      fetch(withBasePath(`/api/restaurants/${spot.id}/dishes?${params.toString()}`)).catch(() => {});
    } catch {
      // background prefetch failure can be safely ignored
    }
  };

  // Find a verified restaurant in the current results that matches the typed text with typo & phonetic tolerance
  const normalizeSearchKey = (s: string) => {
    return s
      .toLowerCase()
      .replace(/ph/g, 'f')
      .replace(/w/g, 'v')
      .replace(/dinning/g, 'dining')
      .replace(/restaurant|hotel|cafe|dhaba/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const findVerifiedMatch = (text: string): Restaurant | undefined => {
    const q = text.trim();
    if (!q || searchResults.length === 0) return undefined;
    const qLower = q.toLowerCase();
    const qNorm = normalizeSearchKey(q);

    // 1. Direct exact or substring match
    const exact = searchResults.find(r => {
      const rLower = r.name.toLowerCase();
      return (
        rLower === qLower ||
        rLower.includes(qLower) ||
        qLower.includes(rLower) ||
        (r.area && `${rLower}, ${r.area.toLowerCase()}` === qLower)
      );
    });
    if (exact) return exact;

    // 2. Normalized phonetic / spelling match
    if (qNorm.length >= 3) {
      const phoneticMatch = searchResults.find(r => {
        const rNorm = normalizeSearchKey(r.name);
        return rNorm === qNorm || rNorm.includes(qNorm) || qNorm.includes(rNorm);
      });
      if (phoneticMatch) return phoneticMatch;
    }

    return undefined;
  };

  const createCustomRestaurant = (name: string): Restaurant => {
    // Check if typo normalizer resolves this to an iconic brand or heritage spot
    const brandResolution = resolveRestaurantQuery(name, selectedCity);
    const resolvedName = brandResolution.isResolved ? brandResolution.canonicalName : name;

    const cleanTitle = resolvedName
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    const isVeg = brandResolution.isVeg !== undefined ? (brandResolution.isVeg ? 1 : 0) : (isPureVegRestaurantName(cleanTitle) ? 1 : 0);
    const parsed = parseRestaurantQuery(cleanTitle, brandResolution.city || selectedCity || '', coords);
    let resolvedCity = brandResolution.city || parsed.city || selectedCity || '';
    if (!resolvedCity && coords?.lat && coords?.lng) {
      if (coords.lat >= 18.9 && coords.lat <= 19.4 && coords.lng >= 72.7 && coords.lng <= 73.2) {
        resolvedCity = cleanTitle.toLowerCase().includes('thane') ? 'Thane' : 'Mumbai';
      } else if (coords.lat >= 18.3 && coords.lat <= 18.8 && coords.lng >= 73.6 && coords.lng <= 74.1) {
        resolvedCity = 'Pune';
      }
    }
    if (!resolvedCity) {
      resolvedCity = locationLabel || (cleanTitle.toLowerCase().includes('thane') ? 'Thane' : 'Mumbai');
    }
    const locArea = brandResolution.area || (locationLabel && locationLabel !== resolvedCity ? locationLabel : '') || parsed.area || resolvedCity;
    const id = getDeterministicPlaceId(cleanTitle, resolvedCity, locArea);

    let finalLat = coords?.lat || (parsed.latitude !== 0 ? parsed.latitude : 0);
    let finalLng = coords?.lng || (parsed.longitude !== 0 ? parsed.longitude : 0);
    if (!finalLat || !finalLng || (finalLat >= 18.8 && finalLat <= 19.5 && finalLng < 72.80)) {
      const cityLower = resolvedCity.toLowerCase();
      const titleLower = cleanTitle.toLowerCase();
      if (cityLower.includes('thane') || titleLower.includes('thane')) {
        finalLat = 19.2183;
        finalLng = 72.9781;
      } else if (cityLower.includes('navi mumbai') || titleLower.includes('navi mumbai') || cityLower.includes('airoli')) {
        finalLat = 19.0330;
        finalLng = 73.0297;
      } else if (cityLower.includes('mumbai') || titleLower.includes('mumbai')) {
        finalLat = 19.0760;
        finalLng = 72.8777;
      } else {
        finalLat = 18.5204;
        finalLng = 73.8567;
      }
    }
    return {
      id,
      name: cleanTitle,
      address: locArea ? `${locArea}${resolvedCity && resolvedCity !== locArea ? `, ${resolvedCity}` : ''}` : (cleanTitle || 'Food Spot'),
      area: locArea || resolvedCity,
      city: resolvedCity,
      latitude: finalLat,
      longitude: finalLng,
      rating: 4.8,
      image: '/images/default-restaurant.jpg',
      description: `Authentic food spot${locArea ? ` in ${locArea}` : ''}`,
      is_campaign_active: 1,
      total_visits: 1,
      status: 'active',
      is_veg: isVeg,
      is_verified: 1,
      verification_source: brandResolution.isResolved ? 'zomato' : 'google',
      cuisine_tags: isVeg ? ['Pure Veg', 'Street Food'] : ['Authentic Dining', 'Street Food']
    } as Restaurant;
  };

  const ensureRestaurantSelected = () => {
    const query = searchQuery.trim();
    if (!query) {
      return chosenSpot || selectedRestaurant;
    }

    const qLower = query.toLowerCase();

    // 1. If user already picked a spot and the query is for that spot
    if (chosenSpot) {
      const cNameLower = chosenSpot.name.toLowerCase();
      if (
        cNameLower === qLower ||
        qLower.startsWith(cNameLower) ||
        cNameLower.startsWith(qLower) ||
        (chosenSpot.area && `${cNameLower}, ${chosenSpot.area.toLowerCase()}` === qLower)
      ) {
        return chosenSpot;
      }
    }

    // 2. Check if query matches any item in live searchResults
    const searchMatch = findVerifiedMatch(query);
    if (searchMatch) {
      setChosenSpot(searchMatch);
      onSelectRestaurant(searchMatch);
      return searchMatch;
    }

    // 2.5 Check if brand normalizer resolves this query to an iconic brand in searchResults
    const brandResolution = resolveRestaurantQuery(query, selectedCity);
    if (brandResolution.isResolved) {
      const canonicalMatch = findVerifiedMatch(brandResolution.canonicalName);
      if (canonicalMatch) {
        setChosenSpot(canonicalMatch);
        onSelectRestaurant(canonicalMatch);
        return canonicalMatch;
      }
    }

    // 3. Fallback to top result from live search if available
    if (searchResults.length > 0) {
      const top = searchResults[0];
      setChosenSpot(top);
      onSelectRestaurant(top);
      return top;
    }

    // 4. Zero-failure fallback: Allow ANY custom restaurant or street food joint the user searched
    if (query.length >= 2) {
      const custom = createCustomRestaurant(query);
      setChosenSpot(custom);
      onSelectRestaurant(custom);
      return custom;
    }

    return null;
  };

  const handleConfirm = () => {
    const confirmed = ensureRestaurantSelected();
    if (!confirmed) {
      // Keep the user on this step and show the verified options instead
      setShowDropdown(true);
      return;
    }
    onNext(confirmed);
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col justify-start items-start text-left animate-in fade-in duration-300 py-3 sm:py-5 px-3.5 sm:px-8 gap-2.5 sm:gap-3 bg-white overflow-y-auto scrollbar-thin relative pb-10 sm:pb-14">
      {/* 1. Main Headline & Subtitle */}
      <div className="space-y-0.5 sm:space-y-1 text-left shrink-0 w-full">
        <h2 className="text-[20px] xs:text-[23px] sm:text-[30px] md:text-[36px] font-black text-[#0B1B48] leading-[1.1] tracking-tight">
          {isSecondRound ? (
            <>
              Foodie ho.<br />
              Sirf ek favourite food stop thodi hoga.
            </>
          ) : (
            <>
              Apna favourite<br />food stop batavo.
            </>
          )}
        </h2>
        {!isSecondRound && (
          <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-semibold text-[#0B1B48] leading-tight">
            Jahan jaakar Bhookasur kahe: isi ke liye toh prakat hua tha.
          </p>
        )}
      </div>

      {/* 2. SEARCH BAR (Live Real-Time Autocomplete Search) */}
      <div className="w-full relative shrink-0" ref={containerRef}>
        <div className="flex items-center w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-white border-2 border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/20 shadow-xs transition-all">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#0047BA] fill-[#0047BA] shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.trim()) {
                setShowDropdown(true);
              } else {
                setShowDropdown(false);
                setSearchResults([]);
              }
            }}
            onFocus={handleFocus}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                if (searchResults.length > 0) {
                  e.preventDefault();
                  setShowDropdown(true);
                  setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                }
              } else if (e.key === 'ArrowUp') {
                if (searchResults.length > 0) {
                  e.preventDefault();
                  setShowDropdown(true);
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                }
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && searchResults[selectedIndex]) {
                  handleSelectSpot(searchResults[selectedIndex]);
                } else if (searchResults.length > 0) {
                  handleSelectSpot(searchResults[0]);
                } else if (searchQuery.trim()) {
                  ensureRestaurantSelected();
                }
              } else if (e.key === 'Escape') {
                setShowDropdown(false);
              }
            }}
            placeholder="Search any restaurant, cafe or dhaba..."
            className="w-full bg-transparent text-xs sm:text-base font-semibold text-slate-900 placeholder-[#64748B] focus:outline-none"
          />
          {isSearching ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-[#1D4ED8] border-t-transparent rounded-full animate-spin shrink-0 mr-1.5" />
          ) : searchQuery ? (
            <button
              id="btn-frame2-clear-search"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFirstVisitorInfo(null);
                setSelectedIndex(-1);
                setShowDropdown(false);
                setSearchResults([]);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#0047BA] shrink-0 stroke-[2.5]" />
        </div>

        {searchQuery ? (
          <div className="text-[10px] sm:text-xs text-[#0047BA] font-semibold mt-1 ml-1 text-right">
            Press Enter to select
          </div>
        ) : null}

        {/* Live Search Autocomplete Dropdown */}
        {showDropdown && (
          <div className="absolute top-[105%] inset-x-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[260px] sm:max-h-[300px] overflow-y-auto p-1.5 scrollbar-thin">
            {/* Spelling Correction Suggestion Banner */}
            {spellingSuggestion && spellingSuggestion.toLowerCase() !== searchQuery.toLowerCase().trim() && (
              <button
                id="btn-frame2-spelling-suggestion"
                type="button"
                onClick={() => {
                  setSearchQuery(spellingSuggestion);
                }}
                className="w-full text-left p-2 xs:p-2.5 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 flex items-center justify-between gap-2 transition-all cursor-pointer mb-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[#D4380D] font-black text-[11px] sm:text-xs shrink-0">Did you mean:</span>
                  </div>
                  <span className="text-[#0B1B48] font-black underline text-[11px] sm:text-xs break-words">
                    {spellingSuggestion}
                  </span>
                </div>
                <span className="text-[10px] font-black text-[#D4380D] bg-white border border-amber-300 px-2 py-0.5 rounded-full shrink-0 shadow-2xs whitespace-nowrap ml-1">
                  Click to use
                </span>
              </button>
            )}

            {/* List of matching search results */}
            {searchResults.length > 0 ? (
              searchResults.map((spot, idx) => {
                const isSelected = selectedRestaurant?.id === spot.id || (selectedRestaurant && selectedRestaurant.name.toLowerCase() === spot.name.toLowerCase());
                const isHighlighted = idx === selectedIndex;

                return (
                  <button
                    id={`btn-frame2-search-result-${idx}`}
                    key={`${spot.id}-${spot.name}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSpot(spot)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-2 sm:p-2.5 rounded-lg transition-all flex items-center justify-between gap-2.5 border-b border-slate-100 last:border-b-0 cursor-pointer ${
                      isHighlighted
                        ? 'bg-blue-100/70 border-blue-200 text-[#0B1B48]'
                        : isSelected
                          ? 'bg-blue-50 text-[#0B1B48]'
                          : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0 border border-blue-100">
                        <MapPin className="w-3.5 h-3.5 fill-[#1D4ED8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs sm:text-sm text-[#0B1B48] line-clamp-2 break-words leading-snug">
                          {spot.name}
                        </p>
                        {(() => {
                          const isPlaceholder = (val?: string) =>
                            !val || ['area', 'city', 'local', 'unknown', 'null', 'undefined', 'india'].includes(val.toLowerCase().trim());

                          let cleanArea = !isPlaceholder(spot.area) ? spot.area!.trim() : '';
                          let cleanCity = !isPlaceholder(spot.city) ? spot.city!.trim() : '';

                          // If area or city is missing, extract from spot.address
                          if (!cleanArea || !cleanCity) {
                            const rawAddr = (spot.address || '').trim();
                            if (rawAddr && rawAddr.toLowerCase() !== spot.name.toLowerCase()) {
                              const escapedName = spot.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                              const cleanedAddr = rawAddr
                                .replace(new RegExp(`^${escapedName}[,\\s-]*`, 'i'), '')
                                .trim();
                              const parts = cleanedAddr
                                .split(',')
                                .map(s => s.trim())
                                .filter(s => !isPlaceholder(s) && !/^\d{6}$/.test(s));
                              if (parts.length > 0) {
                                if (!cleanArea && parts[0]) cleanArea = parts[0];
                                if (!cleanCity && parts.length > 1) {
                                  cleanCity = parts[parts.length - 1];
                                } else if (!cleanCity && parts[0]) {
                                  cleanCity = parts[0];
                                }
                              }
                            }
                          }

                          // Fallback to locationLabel or selectedCity if still missing
                          if (!cleanArea && !cleanCity) {
                            if (locationLabel && !isPlaceholder(locationLabel)) {
                              cleanCity = locationLabel.trim();
                            } else if (selectedCity && !isPlaceholder(selectedCity)) {
                              cleanCity = selectedCity.trim();
                            }
                          }

                          // Prevent repeating area if it's the exact same as city
                          if (cleanArea && cleanCity && cleanArea.toLowerCase() === cleanCity.toLowerCase()) {
                            cleanArea = '';
                          }

                          const primaryLoc = cleanArea || cleanCity;
                          const secondaryLoc = cleanArea && cleanCity ? cleanCity : '';

                          if (!primaryLoc) {
                            return null;
                          }

                          return (
                            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                              <span className="text-[#1D4ED8] font-semibold">{primaryLoc}</span>
                              {secondaryLoc && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span>{secondaryLoc}</span>
                                </>
                              )}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Check className="w-4 h-4 text-[#0047BA] stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                {isSearching ? 'Searching live restaurants...' : coords ? 'Type name or select from nearby list' : 'Type restaurant name to search'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2.2 SELECTED RESTAURANT CONFIRMATION BADGE */}
      {selectedRestaurant && (
        <div className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs animate-in fade-in duration-200 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-emerald-950 truncate">
                {selectedRestaurant.name}
              </p>
              {(() => {
                const isPlaceholder = (val?: string) => !val || ['area', 'city', 'local', 'unknown', 'null', 'undefined'].includes(val.toLowerCase().trim());
                const cleanArea = !isPlaceholder(selectedRestaurant.area) ? selectedRestaurant.area!.trim() : '';
                const cleanCity = !isPlaceholder(selectedRestaurant.city) ? selectedRestaurant.city!.trim() : '';
                const locStr = [cleanArea, cleanCity && cleanCity !== cleanArea ? cleanCity : ''].filter(Boolean).join(', ');
                return (
                  <p className="text-[10px] sm:text-xs text-emerald-700 font-medium truncate">
                    {locStr ? `📍 ${locStr}` : '📍 Selected Spot'}
                  </p>
                );
              })()}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 sm:py-1 rounded-lg border border-emerald-200 shrink-0">
            CHOSEN ✓
          </span>
        </div>
      )}

      {/* 3. PRIMARY CTA BUTTON: YEH WALA PAKKA */}
      <div className="w-full shrink-0 mt-auto pt-2 flex flex-col gap-2">
        <button
          id="btn-frame2-confirm-restaurant"
          onClick={handleConfirm}
          disabled={!selectedRestaurant && !searchQuery.trim()}
          type="button"
          className="w-full py-3 sm:py-3.5 px-6 rounded-xl sm:rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-[#D4380D]/30 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0"
        >
          YEH WALA PAKKA
        </button>
      </div>
    </div>
  );
};
