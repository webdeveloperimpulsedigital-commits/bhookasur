'use client';

export type ConsentLanguage = 'en' | 'hi' | 'mr';

export type ConsentCategory = 'necessary' | 'location' | 'interaction' | 'campaign';

export interface CookieConsentState {
  version: number;
  hasInteracted: boolean;
  necessary: boolean; // Always true
  location: boolean; // City and location selections
  interaction: boolean; // Restaurant search & menu interactions
  campaign: boolean; // Campaign performance & Google Analytics
  consentedAt: string | null;
  consentMethod: 'accept_all' | 'necessary_only' | 'custom' | 'withdrawn' | null;
  language: ConsentLanguage;
}

export const COOKIE_CONSENT_STORAGE_KEY = 'bhookasur_cookie_consent_v1';
export const COOKIE_CONSENT_COOKIE_NAME = 'bhookasur_consent';
export const COOKIE_LOCATION_STORAGE_KEY = 'bhookasur_saved_location_v1';
export const CONSENT_UPDATED_EVENT = 'bhookasur:consent-updated';

export const DEFAULT_CONSENT_STATE: CookieConsentState = {
  version: 1,
  hasInteracted: false,
  necessary: true,
  location: false,
  interaction: false,
  campaign: false,
  consentedAt: null,
  consentMethod: null,
  language: 'en',
};

/**
 * Read current cookie consent state from localStorage or browser cookie
 */
export function getCookieConsent(): CookieConsentState {
  if (typeof window === 'undefined') {
    return DEFAULT_CONSENT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
      return {
        ...DEFAULT_CONSENT_STATE,
        ...parsed,
        necessary: true,
      };
    }
  } catch {
    // Ignore storage read errors
  }

  return DEFAULT_CONSENT_STATE;
}

/**
 * Check if a specific consent category is currently allowed by the user.
 * Note: Strictly necessary is always true. Non-essential categories require explicit consent.
 */
export function hasConsentFor(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  if (typeof window === 'undefined') return false;

  const state = getCookieConsent();
  if (!state.hasInteracted) {
    return false;
  }
  return Boolean(state[category]);
}

/**
 * Synchronize user consent choices with Google Tag Manager / Google Analytics Consent Mode
 */
export function syncGoogleConsentMode(state: CookieConsentState): void {
  if (typeof window === 'undefined') return;

  const w = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  const analyticsGranted = state.hasInteracted && state.campaign ? 'granted' : 'denied';
  const functionalityGranted = state.hasInteracted && state.location ? 'granted' : 'denied';
  const personalizationGranted = state.hasInteracted && state.interaction ? 'granted' : 'denied';

  try {
    if (typeof w.gtag === 'function') {
      w.gtag('consent', 'update', {
        analytics_storage: analyticsGranted,
        ad_storage: analyticsGranted,
        ad_user_data: analyticsGranted,
        ad_personalization: personalizationGranted,
        functionality_storage: functionalityGranted,
        personalization_storage: personalizationGranted,
        security_storage: 'granted',
      });
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event: 'cookie_consent_update',
        consent_necessary: true,
        consent_location: state.location,
        consent_interaction: state.interaction,
        consent_campaign: state.campaign,
        consent_method: state.consentMethod,
      });
    }
  } catch {
    // Ignore GTM errors
  }
}

/**
 * Clean up non-essential stored data if consent for a category is disabled or withdrawn
 */
export function enforceDataCleanup(state: CookieConsentState): void {
  if (typeof window === 'undefined') return;

  try {
    if (!state.location) {
      window.localStorage.removeItem(COOKIE_LOCATION_STORAGE_KEY);
    }
    if (!state.interaction && !state.campaign) {
      window.localStorage.removeItem('bakasur_user_sessions');
      window.localStorage.removeItem('bakasur_user_id');
    }
  } catch {
    // Ignore storage cleanup errors
  }
}

/**
 * Save user cookie consent preferences to localStorage and HTTP cookie
 */
export function saveCookieConsent(
  preferences: Partial<Omit<CookieConsentState, 'version' | 'necessary'>>,
  method: CookieConsentState['consentMethod'] = 'custom'
): CookieConsentState {
  const current = getCookieConsent();
  const nextState: CookieConsentState = {
    version: 1,
    hasInteracted: preferences.hasInteracted ?? true,
    necessary: true,
    location: preferences.location ?? current.location,
    interaction: preferences.interaction ?? current.interaction,
    campaign: preferences.campaign ?? current.campaign,
    consentedAt: new Date().toISOString(),
    consentMethod: method,
    language: preferences.language ?? current.language,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore localStorage quota errors
    }

    try {
      const compactCookie = encodeURIComponent(
        JSON.stringify({
          v: nextState.version,
          n: 1,
          l: nextState.location ? 1 : 0,
          i: nextState.interaction ? 1 : 0,
          c: nextState.campaign ? 1 : 0,
          m: nextState.consentMethod,
          t: nextState.consentedAt,
        })
      );
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${compactCookie}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // Ignore cookie write errors
    }

    enforceDataCleanup(nextState);
    syncGoogleConsentMode(nextState);

    window.dispatchEvent(
      new CustomEvent<CookieConsentState>(CONSENT_UPDATED_EVENT, { detail: nextState })
    );
  }

  return nextState;
}

/**
 * Withdraw previously granted consent and reset to necessary-only
 */
export function withdrawCookieConsent(language?: ConsentLanguage): CookieConsentState {
  return saveCookieConsent(
    {
      hasInteracted: true,
      location: false,
      interaction: false,
      campaign: false,
      language: language ?? getCookieConsent().language,
    },
    'withdrawn'
  );
}

/**
 * Save user's city/location selection if location consent is granted
 */
export function saveConsentedLocation(city: string, coords?: { lat: number; lng: number } | null): void {
  if (typeof window === 'undefined' || !hasConsentFor('location')) return;
  try {
    window.localStorage.setItem(
      COOKIE_LOCATION_STORAGE_KEY,
      JSON.stringify({
        city,
        coords: coords || null,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load user's saved city/location selection if location consent is granted
 */
export function getConsentedLocation(): { city?: string; coords?: { lat: number; lng: number } | null } | null {
  if (typeof window === 'undefined' || !hasConsentFor('location')) return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

