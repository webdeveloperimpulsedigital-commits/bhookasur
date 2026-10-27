'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star, Sparkles, Flame, ArrowRight, Layers, Trophy } from 'lucide-react';

interface MapPoint {
  id: number;
  name: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  rating: number;
  image: string;
  total_visits: number;
  featured_dish: string;
  featured_dish_image: string;
}

interface StepMapProps {
  onProceedToContest?: () => void;
  onRestartTour?: () => void;
  selectedRestaurantName?: string;
  selectedCity?: string;
}

export const StepMap: React.FC<StepMapProps> = ({
  onProceedToContest,
  onRestartTour,
  selectedRestaurantName,
  selectedCity
}) => {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [activePoint, setActivePoint] = useState<MapPoint | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  const [totalVisits, setTotalVisits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        const res = await fetch('/api/campaign/map');
        const json = await res.json();
        if (json.success && json.data) {
          setPoints(json.data.points || []);
          setTotalVisits(json.data.totalCampaignVisits || 8900);
          if (json.data.points?.length > 0) {
            setActivePoint(json.data.points[0]);
          }
        }
      } catch (err) {
        console.error("Map fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMapData();
  }, []);

  const filteredPoints = selectedCityFilter === 'All'
    ? points
    : points.filter(p => p.city.toLowerCase() === selectedCityFilter.toLowerCase());

  const cities = ['All', 'Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Hyderabad'];

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4 w-full max-w-2xl mx-auto py-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span>Collective Outcome</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white brand-font leading-tight">Bhookasur&apos;s All-India Spice Trail 🗺️</h2>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-600/20 border border-blue-400/40 text-[10px] sm:text-xs text-cyan-300 font-extrabold">
          <Flame className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span>{totalVisits.toLocaleString()}+ Visits</span>
        </div>
      </div>

      <p className="text-[11px] sm:text-xs text-blue-200/80">
        Dekho desh bhar ke foodies ne Bhookasur ko kaunse dangerous spicy joints par bheja! Click any spot to explore.
      </p>

      {/* City Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {cities.map((city) => (
          <button
            key={city}
            onClick={() => {
              setSelectedCityFilter(city);
              const match = points.find(p => city === 'All' || p.city.toLowerCase() === city.toLowerCase());
              if (match) setActivePoint(match);
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shrink-0 transition-all cursor-pointer ${selectedCityFilter === city
                ? 'bg-[#D23002] text-white font-black shadow-md'
                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
              }`}
          >
            {city === 'All' ? 'All India 🇮🇳' : city}
          </button>
        ))}
      </div>

      {/* Interactive Visual Map Container */}
      <div className="relative w-full h-52 sm:h-72 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20 bg-slate-900/60 shadow-lg flex flex-col justify-between p-2.5 sm:p-4">
        {/* Map Top Status Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-[10px] sm:text-[11px] text-slate-800 flex items-center gap-1.5 font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Food-Tour Trail</span>
          </span>

          <span className="text-[10px] sm:text-[11px] text-slate-700 bg-white/90 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-slate-200 font-semibold shadow-sm">
            {filteredPoints.length} Food Spots
          </span>
        </div>

        {/* Map Points Visualization */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2 my-auto overflow-y-auto max-h-[140px] sm:max-h-[180px] pr-1">
          {filteredPoints.map((point) => {
            const isSelected = activePoint?.id === point.id;
            return (
              <button
                key={point.id}
                onClick={() => setActivePoint(point)}
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer shadow-sm ${isSelected
                    ? 'bg-[#D23002] border-white/40 text-white shadow-md scale-[1.02] font-black'
                    : 'bg-white/90 border-slate-200 hover:border-[#D23002] text-slate-800'
                  }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[11px]">📍</span>
                  <span className={`font-extrabold text-[11px] sm:text-xs truncate brand-font ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {point.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                  <span className={isSelected ? 'text-rose-100 font-bold' : 'text-[#023093] font-bold'}>
                    {point.city}
                  </span>
                  <span className={isSelected ? 'text-white font-bold' : 'text-slate-500 font-mono'}>
                    {point.total_visits} visits
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Restaurant Mini Details Drawer */}
        {activePoint && (
          <div className="relative z-10 rounded-xl sm:rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/20 p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <img src={activePoint.image} alt={activePoint.name} className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-cover border border-white/20 shrink-0" />
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs sm:text-sm text-white truncate brand-font">{activePoint.name}</h4>
                <p className="text-[10px] sm:text-[11px] text-blue-200/90 truncate">
                  Dish: <span className="font-semibold text-[#ff8566]">{activePoint.featured_dish}</span>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-[#ff8566] block">{activePoint.total_visits}</span>
              <span className="text-[8px] sm:text-[9px] text-blue-200/70 uppercase">Visits</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pb-1">
        {onProceedToContest && (
          <button
            onClick={onProceedToContest}
            className="py-2.5 sm:py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>← Back to Submission</span>
          </button>
        )}

        {onRestartTour && (
          <button
            onClick={onRestartTour}
            className="py-2.5 sm:py-3 px-4 rounded-xl bg-[#D23002] hover:bg-[#eb420e] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#D23002]/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer brand-font border border-white/20"
          >
            <span>🍽️ Recommend Another Spot</span>
          </button>
        )}
      </div>
    </div>
  );
};
