'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Utensils,
  Store,
  Users,
  Trash2,
  Edit3,
  Download,
  RefreshCw,
  Search,
  ChevronLeft,
  MapPin,
  Eye,
  LogOut,
  Crown,
  FileSpreadsheet,
  X,
  Check,
  Phone,
  Database
} from 'lucide-react';
import { withBasePath } from '@/lib/basePath';
import type { AdminRole } from '@/lib/adminSession';

type AdminTab = 'campaign_visits' | 'participants';

interface VisitRecord {
  id: number;
  session_id: string;
  user_id: string | null;
  restaurant_id: number;
  restaurant_name: string;
  dish_id: number | null;
  dish_name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  round_number: number;
  spot_label: string;
  visited_at: string;
}

interface EnrichedParticipant {
  id: number;
  session_id: string;
  participation_id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  restaurant_name?: string;
  dish_name?: string;
  spot1_restaurant: string;
  spot1_dish: string;
  spot1_location: string;
  spot2_restaurant: string;
  spot2_dish: string;
  spot2_location: string;
  created_at: string;
}

interface AnalyticsData {
  totalUsers: number;
  totalToursStarted: number;
  totalAurKhiloClicks: number;
  totalCompletedTours: number;
  totalSubmissions: number;
  totalVisits?: number;
  dbStatus: {
    engine: string;
    isMySQLHealthy: boolean;
    config: { host: string; database: string; user: string };
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [role, setRole] = useState<AdminRole>('admin');
  const [username, setUsername] = useState<string>('admin');
  const [activeTab, setActiveTab] = useState<AdminTab>('campaign_visits');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isSuperAdmin = role === 'super_admin';

  // Data States
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [visitsSummary, setVisitsSummary] = useState({
    totalSearches: 0,
    uniqueUsersVisited: 0,
    uniqueRestaurants: 0,
    uniqueDishes: 0
  });
  const [participants, setParticipants] = useState<EnrichedParticipant[]>([]);

  // Search / Filter States
  const [visitSearch, setVisitSearch] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');

  // Edit Modals State (Super Admin only)
  const [editingVisit, setEditingVisit] = useState<VisitRecord | null>(null);
  const [visitEditForm, setVisitEditForm] = useState({
    restaurant_name: '',
    city: '',
    dish_name: '',
    round_number: 1
  });
  const [isSavingVisit, setIsSavingVisit] = useState(false);

  const [editingParticipant, setEditingParticipant] = useState<EnrichedParticipant | null>(null);
  const [participantEditForm, setParticipantEditForm] = useState({
    name: '',
    mobile: '',
    city: '',
    spot1_restaurant: '',
    spot1_dish: '',
    spot2_restaurant: '',
    spot2_dish: ''
  });
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  // Authentication & Role Check
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch(withBasePath('/api/admin/auth/me'), { cache: 'no-store', credentials: 'include' });
        const json = await res.json();
        if (json.authenticated) {
          setIsAuthenticated(true);
          setRole(json.role === 'super_admin' ? 'super_admin' : 'admin');
          setUsername(json.username || (json.role === 'super_admin' ? 'superadmin' : 'admin'));
        } else {
          setIsAuthenticated(false);
          router.replace('/admin/login');
        }
      } catch {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      }
    };
    verifyAuth();
  }, [router]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Load All Dashboard Data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aRes, vRes, pRes] = await Promise.all([
        fetch('/api/admin/analytics'),
        fetch('/api/admin/visits'),
        fetch('/api/admin/participants')
      ]);

      const [aJson, vJson, pJson] = await Promise.all([
        aRes.json(),
        vRes.json(),
        pRes.json()
      ]);

      if (aJson.success) setAnalytics(aJson.data);
      if (vJson.success) {
        setVisits(vJson.data || []);
        if (vJson.summary) setVisitsSummary(vJson.summary);
      }
      if (pJson.success) {
        setParticipants(pJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  // Super Admin: Open Edit Visit Modal
  const handleOpenEditVisit = (v: VisitRecord) => {
    if (!isSuperAdmin) return;
    setEditingVisit(v);
    setVisitEditForm({
      restaurant_name: v.restaurant_name,
      city: v.city,
      dish_name: v.dish_name,
      round_number: v.round_number || 1
    });
  };

  // Super Admin: Save Edited Visit
  const handleSaveVisitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit || !isSuperAdmin) return;
    setIsSavingVisit(true);
    try {
      const res = await fetch(`/api/admin/visits/${editingVisit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitEditForm)
      });
      const json = await res.json();
      if (json.success) {
        showToast('Record in campaign_visits updated successfully!', 'success');
        setEditingVisit(null);
        loadDashboardData();
      } else {
        showToast(json.error || 'Failed to update record', 'error');
      }
    } catch {
      showToast('Network error while updating record', 'error');
    } finally {
      setIsSavingVisit(false);
    }
  };

  // Super Admin: Delete Visit Record
  const handleDeleteVisit = async (v: VisitRecord) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to delete "${v.restaurant_name}" (${v.dish_name}) from campaign_visits?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/visits/${v.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Record deleted from campaign_visits!', 'success');
        loadDashboardData();
      } else {
        showToast(json.error || 'Delete failed', 'error');
      }
    } catch {
      showToast('Failed to delete record', 'error');
    }
  };

  // Super Admin: Open Edit Participant Modal
  const handleOpenEditParticipant = (p: EnrichedParticipant) => {
    if (!isSuperAdmin) return;
    setEditingParticipant(p);
    setParticipantEditForm({
      name: p.name,
      mobile: p.mobile,
      city: p.city,
      spot1_restaurant: p.spot1_restaurant === '-' ? '' : p.spot1_restaurant,
      spot1_dish: p.spot1_dish === '-' ? '' : p.spot1_dish,
      spot2_restaurant: p.spot2_restaurant === '-' ? '' : p.spot2_restaurant,
      spot2_dish: p.spot2_dish === '-' ? '' : p.spot2_dish
    });
  };

  // Super Admin: Save Edited Participant
  const handleSaveParticipantEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant || !isSuperAdmin) return;
    setIsSavingParticipant(true);
    try {
      const res = await fetch(`/api/admin/participants/${editingParticipant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participantEditForm)
      });
      const json = await res.json();
      if (json.success) {
        showToast('Participant record updated successfully!', 'success');
        setEditingParticipant(null);
        loadDashboardData();
      } else {
        showToast(json.error || 'Failed to update participant', 'error');
      }
    } catch {
      showToast('Network error while updating participant', 'error');
    } finally {
      setIsSavingParticipant(false);
    }
  };

  // Super Admin: Delete Participant Record
  const handleDeleteParticipant = async (p: EnrichedParticipant) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to delete participant "${p.name}" (${p.mobile})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/participants/${p.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Participant record deleted!', 'success');
        loadDashboardData();
      } else {
        showToast(json.error || 'Delete failed', 'error');
      }
    } catch {
      showToast('Failed to delete participant', 'error');
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(withBasePath('/api/admin/auth/logout'), { method: 'POST', cache: 'no-store', credentials: 'include' });
      setIsAuthenticated(false);
      window.location.replace(withBasePath('/admin/login'));
    } catch {
      window.location.replace(withBasePath('/admin/login'));
    }
  };

  // Filtered lists
  const filteredVisits = visits.filter((v) => {
    if (!visitSearch.trim()) return true;
    const q = visitSearch.toLowerCase();
    return (
      v.restaurant_name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      v.dish_name.toLowerCase().includes(q) ||
      v.session_id.toLowerCase().includes(q) ||
      v.spot_label.toLowerCase().includes(q)
    );
  });

  const filteredParticipants = participants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.participation_id.toLowerCase().includes(q) ||
      p.spot1_restaurant.toLowerCase().includes(q) ||
      p.spot1_dish.toLowerCase().includes(q) ||
      p.spot2_restaurant.toLowerCase().includes(q) ||
      p.spot2_dish.toLowerCase().includes(q)
    );
  });

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm text-center max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Verifying Access</h3>
            <p className="text-xs text-slate-500">Checking credentials &amp; role permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Total users visited metric
  const totalUsersVisited = Math.max(
    analytics?.totalUsers || 0,
    visitsSummary.uniqueUsersVisited || 0,
    participants.length
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Admin Header (White Base) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 flex items-center gap-1 text-xs font-semibold transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Tour</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black text-base shadow-xs">
                👹
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  #Bhookasur Admin Dashboard
                </h1>
                <p className="text-[11px] text-slate-500">
                  Logged in as <strong className="text-slate-900">{username}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Role Badge */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-black">
                <Crown className="w-3.5 h-3.5 text-orange-600" />
                <span>SUPER ADMIN (Edit, Delete &amp; Excel Export)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-black">
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>ADMIN (View &amp; Excel Export)</span>
              </div>
            )}

            {/* Full Excel Export (Available to both Super Admin & Admin) */}
            <a
              href={withBasePath('/api/admin/export-all')}
              download
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-xs transition"
              title="Download Complete Excel Report (campaign_visits + participants)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export All in Excel</span>
            </a>

            <button
              onClick={loadDashboardData}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer transition"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition text-xs font-bold cursor-pointer"
              title="Sign out of Admin Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Status Toast Banner */}
      {statusMessage && (
        <div
          className={`p-3 text-center text-xs font-bold border-b ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* KPI SUMMARY CARDS (White Base) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👥</span>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[10px] text-orange-700 font-mono font-bold">
                LIVE VISITORS
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalUsersVisited.toLocaleString()}</div>
            <div className="text-xs text-slate-700 font-bold mt-0.5">No. of Users Visited</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {visitsSummary.uniqueUsersVisited} active food tour sessions
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🍽️</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] text-amber-700 font-mono font-bold">
                campaign_visits
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900">{visits.length.toLocaleString()}</div>
            <div className="text-xs text-slate-700 font-bold mt-0.5">Searched Restaurants &amp; Dishes</div>
            <div className="text-[11px] text-slate-500 mt-1">
              {visitsSummary.uniqueRestaurants} unique restaurants • {visitsSummary.uniqueDishes} dishes
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📋</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-700 font-mono font-bold">
                participants
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900">{participants.length.toLocaleString()}</div>
            <div className="text-xs text-slate-700 font-bold mt-0.5">Registered Participants</div>
            <div className="text-[11px] text-slate-500 mt-1">
              Users with Spot 1 &amp; Spot 2 recorded
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{isSuperAdmin ? '👑' : '👁️'}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[10px] text-sky-700 font-mono font-bold">
                ACCESS LEVEL
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </div>
            <div className="text-xs text-slate-700 font-bold mt-1">
              {isSuperAdmin ? 'Edit, Delete & Excel Export Enabled' : 'View & Excel Export Enabled'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              DB: {analytics?.dbStatus?.config?.database || 'bakasur_food_tour_1'}
            </div>
          </div>
        </div>

        {/* TWO TABS: campaign_visits AND participants */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('campaign_visits')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer border ${
              activeTab === 'campaign_visits'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>campaign_visits</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'campaign_visits'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {visits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer border ${
              activeTab === 'participants'
                ? 'bg-orange-600 text-white border-orange-600 shadow-sm shadow-orange-600/20'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>participants</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'participants'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {participants.length}
            </span>
          </button>
        </div>

        {/* =====================================================================
            TAB 1: campaign_visits (USER SEARCHED RESTAURANTS, LOCATION & DISH NAME)
           ===================================================================== */}
        {activeTab === 'campaign_visits' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-mono font-bold mb-1">
                  <span>Table: campaign_visits</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-600" />
                  <span>User Searched Restaurants, Location &amp; Dish Name ({filteredVisits.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shows every restaurant searched by users along with the restaurant location and dish name.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <a
                  href={withBasePath('/api/admin/visits/export')}
                  download
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export campaign_visits (.xls)</span>
                </a>
              </div>
            </div>

            {/* Search Filter Input */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={visitSearch}
                onChange={(e) => setVisitSearch(e.target.value)}
                placeholder="Search in campaign_visits by user session ID, restaurant name, location (city), or dish name..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {visitSearch && (
                <button
                  onClick={() => setVisitSearch('')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* campaign_visits Table */}
            <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-16">Sr.</th>
                    <th className="p-3.5">User Session ID</th>
                    <th className="p-3.5">Searched Restaurant Name</th>
                    <th className="p-3.5">Location of Restaurant</th>
                    <th className="p-3.5">Searched Dish Name</th>
                    <th className="p-3.5">Visited Date &amp; Time</th>
                    <th className="p-3.5 text-right">{isSuperAdmin ? 'Edit / Delete' : 'Access'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No records found in campaign_visits.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v, index) => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-mono text-slate-500">
                          {index + 1} <span className="text-[10px] text-slate-400">(#{v.id})</span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px] font-bold">
                            {v.session_id}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{v.restaurant_name}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-semibold text-xs">
                            <MapPin className="w-3 h-3 text-orange-600" />
                            <span>{v.city || 'Pune'}</span>
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs sm:text-sm">
                            <Utensils className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{v.dish_name || 'Signature Dish'}</span>
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(v.visited_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {isSuperAdmin ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditVisit(v)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Edit Record"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteVisit(v)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: participants (USER FORM DATA WITH SPOT 1 AND SPOT 2)
           ===================================================================== */}
        {activeTab === 'participants' && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold mb-1">
                  <span>Table: participants</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Participant Registration Data — Spot 1 &amp; Spot 2 ({filteredParticipants.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Users who filled the registration form with User Name, Mobile Number, Location, and their visited <strong className="text-blue-700">Spot 1</strong> &amp; <strong className="text-purple-700">Spot 2</strong> restaurants and dishes.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <a
                  href={withBasePath('/api/admin/participants/export')}
                  download
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Export participants (.xls)</span>
                </a>
              </div>
            </div>

            {/* Search Filter Input */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Search in participants by user name, mobile number, Spot 1 / Spot 2 restaurant or dish..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {participantSearch && (
                <button
                  onClick={() => setParticipantSearch('')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2 py-0.5 rounded cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* participants Table with Spot 1 and Spot 2 columns */}
            <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 w-14">Sr.</th>
                    <th className="p-3.5">User Name</th>
                    <th className="p-3.5">Mobile Number</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5 min-w-[230px]">Spot 1 (Restaurant &amp; Dish)</th>
                    <th className="p-3.5 min-w-[230px]">Spot 2 (Restaurant &amp; Dish)</th>
                    <th className="p-3.5">Registered Date</th>
                    <th className="p-3.5 text-right">{isSuperAdmin ? 'Edit / Delete' : 'Access'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No participant records found.
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition align-top">
                        <td className="p-3.5 font-mono text-slate-500">
                          <div>{idx + 1}</div>
                          <div className="text-[10px] text-orange-600 font-bold">{p.participation_id}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-black text-slate-900 text-xs sm:text-sm capitalize">{p.name}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-bold text-xs">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{p.mobile}</span>
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-semibold text-xs">
                            <MapPin className="w-3 h-3 text-orange-600" />
                            <span>{p.city || 'Pune'}</span>
                          </span>
                        </td>

                        {/* SPOT 1 COLUMN */}
                        <td className="p-3.5">
                          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                                SPOT 1
                              </span>
                              <span className="text-[10px] text-blue-700 font-semibold">
                                📍 {p.spot1_location || p.city}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-xs mt-0.5">
                              🏨 {p.spot1_restaurant || '-'}
                            </div>
                            <div className="text-emerald-700 font-semibold text-[11px]">
                              🍽️ Dish: {p.spot1_dish || '-'}
                            </div>
                          </div>
                        </td>

                        {/* SPOT 2 COLUMN */}
                        <td className="p-3.5">
                          {p.spot2_restaurant && p.spot2_restaurant !== '-' ? (
                            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded bg-purple-600 text-white font-black text-[10px] uppercase tracking-wider">
                                  SPOT 2
                                </span>
                                <span className="text-[10px] text-purple-700 font-semibold">
                                  📍 {p.spot2_location || p.city}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs mt-0.5">
                                🏨 {p.spot2_restaurant}
                              </div>
                              <div className="text-emerald-700 font-semibold text-[11px]">
                                🍽️ Dish: {p.spot2_dish || '-'}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-[11px] italic">
                              Spot 2 not added (Visited 1 spot)
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(p.created_at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          {isSuperAdmin ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditParticipant(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Edit Participant"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteParticipant(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                                title="Delete Participant"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">View Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: SUPER ADMIN EDIT campaign_visits RECORD (White Base)
         ===================================================================== */}
      {isSuperAdmin && editingVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-600" />
                <span>Edit campaign_visits Record (#{editingVisit.id})</span>
              </h3>
              <button
                onClick={() => setEditingVisit(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitEdit} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">User Session ID</label>
                <input
                  type="text"
                  disabled
                  value={editingVisit.session_id}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Searched Restaurant Name</label>
                <input
                  type="text"
                  required
                  value={visitEditForm.restaurant_name}
                  onChange={(e) => setVisitEditForm({ ...visitEditForm, restaurant_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Restaurant Location (City)</label>
                <input
                  type="text"
                  required
                  value={visitEditForm.city}
                  onChange={(e) => setVisitEditForm({ ...visitEditForm, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Searched Dish Name</label>
                <input
                  type="text"
                  required
                  value={visitEditForm.dish_name}
                  onChange={(e) => setVisitEditForm({ ...visitEditForm, dish_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVisit}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingVisit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SUPER ADMIN EDIT participants RECORD (White Base)
         ===================================================================== */}
      {isSuperAdmin && editingParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-orange-600" />
                <span>Edit Participant ({editingParticipant.participation_id})</span>
              </h3>
              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipantEdit} className="flex flex-col gap-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">User Name</label>
                  <input
                    type="text"
                    required
                    value={participantEditForm.name}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Number (10 digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={participantEditForm.mobile}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, mobile: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location (City)</label>
                <input
                  type="text"
                  required
                  value={participantEditForm.city}
                  onChange={(e) => setParticipantEditForm({ ...participantEditForm, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900"
                />
              </div>

              {/* Spot 1 Fields */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col gap-2.5">
                <div className="text-[11px] font-black uppercase text-blue-700">Spot 1 Details</div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spot 1 — Visited Restaurant</label>
                  <input
                    type="text"
                    required
                    value={participantEditForm.spot1_restaurant}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, spot1_restaurant: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spot 1 — Dish Name</label>
                  <input
                    type="text"
                    required
                    value={participantEditForm.spot1_dish}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, spot1_dish: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              {/* Spot 2 Fields */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col gap-2.5">
                <div className="text-[11px] font-black uppercase text-purple-700">Spot 2 Details</div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spot 2 — Visited Restaurant</label>
                  <input
                    type="text"
                    value={participantEditForm.spot2_restaurant}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, spot2_restaurant: e.target.value })}
                    placeholder="Leave empty if only 1 spot visited"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spot 2 — Dish Name</label>
                  <input
                    type="text"
                    value={participantEditForm.spot2_dish}
                    onChange={(e) => setParticipantEditForm({ ...participantEditForm, spot2_dish: e.target.value })}
                    placeholder="Leave empty if only 1 spot visited"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingParticipant}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingParticipant ? 'Saving...' : 'Save Participant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
