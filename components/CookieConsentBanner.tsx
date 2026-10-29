'use client';

import React, { useEffect, useState } from 'react';
import { withBasePath } from '@/lib/basePath';
import {
  ConsentLanguage,
  CookieConsentState,
  DEFAULT_CONSENT_STATE,
  getCookieConsent,
  saveCookieConsent,
  withdrawCookieConsent,
  syncGoogleConsentMode,
  CONSENT_UPDATED_EVENT,
} from '@/lib/cookieConsent';

interface TranslationContent {
  langLabel: string;
  bannerTextPart1: string;
  bannerTextPart2: string;
  policyLinkText: string;
  acceptAll: string;
  acceptNecessary: string;
  preferenceCentre: string;
  prefTitle: string;
  prefSubtitle: string;
  savePreferences: string;
  withdrawConsent: string;
  alwaysActive: string;
  categories: {
    necessary: { title: string; desc: string };
    location: { title: string; desc: string };
    interaction: { title: string; desc: string };
    campaign: { title: string; desc: string };
  };
}

const TRANSLATIONS: Record<ConsentLanguage, TranslationContent> = {
  en: {
    langLabel: 'English',
    bannerTextPart1:
      'We use cookies and digital trackers to remember your city and location selections, analyse how you search restaurants and interact with menus, and evaluate our campaign performance. By clicking \u201cAccept All\u201d, you consent to our processing of this interaction data. You can choose \u201cAccept only Necessary\u201d or visit our \u201cPreference Centre\u201d to manage specific purposes or withdraw consent at any time. For further details and grievance redressal, please read our ',
    bannerTextPart2: '',
    policyLinkText: 'Privacy & Cookie Policy',
    acceptAll: 'Accept All',
    acceptNecessary: 'Accept only Necessary',
    preferenceCentre: 'Preference Centre',
    prefTitle: 'Privacy & Cookie Preference Centre',
    prefSubtitle:
      'Manage how cookies and digital trackers are used during your experience. You can enable or disable specific purposes below or withdraw your consent at any time.',
    savePreferences: 'Save My Preferences',
    withdrawConsent: 'Withdraw Consent',
    alwaysActive: 'Always Active',
    categories: {
      necessary: {
        title: 'Strictly Necessary Cookies & Trackers',
        desc: 'Essential for core website functionality, active tour session continuity, security, and remembering your privacy consent choices. These cannot be switched off.',
      },
      location: {
        title: 'City & Location Selections',
        desc: 'Remembers your selected city, neighbourhood, and location coordinates so we can show relevant nearby restaurants and local food stops.',
      },
      interaction: {
        title: 'Restaurant Search & Menu Interactions',
        desc: 'Analyses how you search for restaurants, browse dish options, and interact with menus during the food tour to improve recommendations and user experience.',
      },
      campaign: {
        title: 'Campaign Performance & Analytics',
        desc: 'Evaluates campaign effectiveness, journey step completion rates, and aggregate visitor metrics using internal telemetry and Google Analytics (GA4 / GTM).',
      },
    },
  },
  hi: {
    langLabel: 'हिंदी',
    bannerTextPart1:
      'हम आपके शहर और लोकेशन के चयन को याद रखने, आप रेस्तरां कैसे खोजते हैं और मेन्यू के साथ कैसे इंटरैक्ट करते हैं इसका विश्लेषण करने, और हमारे अभियान के प्रदर्शन का मूल्यांकन करने के लिए कुकीज़ और डिजिटल ट्रैकर्स का उपयोग करते हैं। \u201cAccept All\u201d पर क्लिक करके, आप इस इंटरैक्शन डेटा के प्रसंस्करण के लिए अपनी सहमति देते हैं। आप किसी भी समय विशिष्ट उद्देश्यों को प्रबंधित करने या सहमति वापस लेने के लिए \u201cAccept only Necessary\u201d चुन सकते हैं या हमारे \u201cPreference Centre\u201d पर जा सकते हैं। अधिक जानकारी और शिकायत निवारण के लिए, कृपया हमारी ',
    bannerTextPart2: ' पढ़ें।',
    policyLinkText: 'Privacy & Cookie Policy',
    acceptAll: 'Accept All',
    acceptNecessary: 'Accept only Necessary',
    preferenceCentre: 'Preference Centre',
    prefTitle: 'गोपनीयता और कुकी प्रेफरेंस सेंटर',
    prefSubtitle:
      'नियंत्रित करें कि आपके अनुभव के दौरान कुकीज़ और डिजिटल ट्रैकर्स का उपयोग कैसे किया जाता है। आप नीचे दिए गए विशिष्ट उद्देश्यों को चालू या बंद कर सकते हैं या किसी भी समय अपनी सहमति वापस ले सकते हैं।',
    savePreferences: 'मेरी प्राथमिकताएं सहेजें',
    withdrawConsent: 'सहमति वापस लें',
    alwaysActive: 'हमेशा सक्रिय',
    categories: {
      necessary: {
        title: 'अति आवश्यक कुकीज़ और ट्रैकर्स',
        desc: 'मुख्य वेबसाइट कार्यक्षमता, सुरक्षा और आपकी गोपनीयता सहमति प्राथमिकताओं को सहेजने के लिए आवश्यक। इन्हें बंद नहीं किया जा सकता।',
      },
      location: {
        title: 'शहर और लोकेशन चयन',
        desc: 'आपके चुने गए शहर और लोकेशन को याद रखता है ताकि आस-पास के रेस्तरां और फूड स्टॉप दिखाए जा सकें।',
      },
      interaction: {
        title: 'रेस्तरां खोज और मेन्यू इंटरैक्शन',
        desc: 'आप रेस्तरां कैसे खोजते हैं और मेन्यू व डिश विकल्पों के साथ कैसे इंटरैक्ट करते हैं, इसका विश्लेषण करता है।',
      },
      campaign: {
        title: 'अभियान प्रदर्शन और एनालिटिक्स',
        desc: 'Google Analytics और आंतरिक मेट्रिक्स के माध्यम से अभियान के प्रदर्शन और उपयोगकर्ता यात्रा का मूल्यांकन करता है।',
      },
    },
  },
  mr: {
    langLabel: 'मराठी',
    bannerTextPart1:
      'आम्ही तुमचे शहर आणि लोकेशनची निवड लक्षात ठेवण्यासाठी, तुम्ही रेस्टॉरंट्स कसे शोधता आणि मेन्यूशी कसा संवाद साधता याचे विश्लेषण करण्यासाठी आणि आमच्या मोहिमेच्या कामगिरीचे मूल्यांकन करण्यासाठी कुकीज आणि डिजिटल ट्रॅकर्स वापरतो. \u201cAccept All\u201d वर क्लिक करून, तुम्ही या डेटा प्रक्रियेस तुमची संमती देता. तुम्ही विशिष्ट उद्दिष्टे व्यवस्थापित करण्यासाठी किंवा कोणत्याही वेळी संमती मागे घेण्यासाठी \u201cAccept only Necessary\u201d निवडू शकता किंवा आमच्या \u201cPreference Centre\u201d ला भेट देऊ शकता. अधिक तपशील आणि तक्रार निवारणासाठी, कृपया आमचे ',
    bannerTextPart2: ' वाचा.',
    policyLinkText: 'Privacy & Cookie Policy',
    acceptAll: 'Accept All',
    acceptNecessary: 'Accept only Necessary',
    preferenceCentre: 'Preference Centre',
    prefTitle: 'गोपनीयता आणि कुकी प्रेफरन्स सेंटर',
    prefSubtitle:
      'तुमच्या अनुभवादरम्यान कुकीज आणि डिजिटल ट्रॅकर्स कसे वापरले जातात ते व्यवस्थापित करा. तुम्ही खालील विशिष्ट उद्दिष्टे सक्षम किंवा अक्षम करू शकता किंवा कधीही तुमची संमती मागे घेऊ शकता.',
    savePreferences: 'माझ्या पसंती जतन करा',
    withdrawConsent: 'संमती मागे घ्या',
    alwaysActive: 'नेहमी सक्रिय',
    categories: {
      necessary: {
        title: 'अत्यावश्यक कुकीज आणि ट्रॅकर्स',
        desc: 'वेबसाइटची मुख्य कार्यक्षमता, सुरक्षा आणि तुमच्या संमती निवडी लक्षात ठेवण्यासाठी आवश्यक. हे बंद केले जाऊ शकत नाहीत.',
      },
      location: {
        title: 'शहर आणि लोकेशन निवड',
        desc: 'तुमचे निवडलेले शहर आणि लोकेशन लक्षात ठेवते जेणेकरून जवळपासची रेस्टॉरंट्स दाखवता येतील.',
      },
      interaction: {
        title: 'रेस्टॉरंट शोध आणि मेन्यू संवाद',
        desc: 'तुम्ही रेस्टॉरंट्स कसे शोधता आणि मेन्यू पर्यायांशी कसा संवाद साधता याचे विश्लेषण करते.',
      },
      campaign: {
        title: 'मोहीम कामगिरी आणि अॅनालिटिक्स',
        desc: 'Google Analytics आणि अंतर्गत मेट्रिक्सद्वारे मोहिमेच्या कामगिरीचे मूल्यांकन करते.',
      },
    },
  },
};

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [consentState, setConsentState] = useState<CookieConsentState>(DEFAULT_CONSENT_STATE);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Draft toggle states inside Preference Centre modal
  const [draftLocation, setDraftLocation] = useState(true);
  const [draftInteraction, setDraftInteraction] = useState(true);
  const [draftCampaign, setDraftCampaign] = useState(true);

  const privacyPolicyUrl = withBasePath('/privacy-policy');

  useEffect(() => {
    setMounted(true);
    const stored = getCookieConsent();
    setConsentState(stored);
    syncGoogleConsentMode(stored);

    if (!stored.hasInteracted) {
      setShowBanner(true);
      setDraftLocation(true);
      setDraftInteraction(true);
      setDraftCampaign(true);
    } else {
      setShowBanner(false);
      setDraftLocation(stored.location);
      setDraftInteraction(stored.interaction);
      setDraftCampaign(stored.campaign);
    }

    const handleConsentEvent = (e: Event) => {
      const customEvent = e as CustomEvent<CookieConsentState>;
      if (customEvent.detail) {
        setConsentState(customEvent.detail);
      }
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, handleConsentEvent);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, handleConsentEvent);
  }, []);

  if (!mounted) return null;

  const lang = consentState.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleLanguageChange = (newLang: ConsentLanguage) => {
    setLangMenuOpen(false);
    const updated = { ...consentState, language: newLang };
    setConsentState(updated);
    if (consentState.hasInteracted) {
      saveCookieConsent({ language: newLang }, consentState.consentMethod || 'custom');
    }
  };

  const handleAcceptAll = () => {
    const next = saveCookieConsent(
      {
        hasInteracted: true,
        location: true,
        interaction: true,
        campaign: true,
        language: lang,
      },
      'accept_all'
    );
    setConsentState(next);
    setDraftLocation(true);
    setDraftInteraction(true);
    setDraftCampaign(true);
    setShowBanner(false);
    setShowPreferenceModal(false);
  };

  const handleAcceptNecessaryOnly = () => {
    const next = saveCookieConsent(
      {
        hasInteracted: true,
        location: false,
        interaction: false,
        campaign: false,
        language: lang,
      },
      'necessary_only'
    );
    setConsentState(next);
    setDraftLocation(false);
    setDraftInteraction(false);
    setDraftCampaign(false);
    setShowBanner(false);
    setShowPreferenceModal(false);
  };

  const handleSaveCustomPreferences = () => {
    const next = saveCookieConsent(
      {
        hasInteracted: true,
        location: draftLocation,
        interaction: draftInteraction,
        campaign: draftCampaign,
        language: lang,
      },
      'custom'
    );
    setConsentState(next);
    setShowBanner(false);
    setShowPreferenceModal(false);
  };

  const handleWithdrawConsent = () => {
    const next = withdrawCookieConsent(lang);
    setConsentState(next);
    setDraftLocation(false);
    setDraftInteraction(false);
    setDraftCampaign(false);
    setShowPreferenceModal(false);
    setShowBanner(true);
  };

  const openPreferenceCentre = () => {
    if (consentState.hasInteracted) {
      setDraftLocation(consentState.location);
      setDraftInteraction(consentState.interaction);
      setDraftCampaign(consentState.campaign);
    }
    setShowPreferenceModal(true);
  };

  return (
    <>
      {/* Bottom Cookie Consent Banner (Matches Uploaded Screenshot) */}
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie Consent Banner"
          className="fixed bottom-0 left-0 right-0 z-[9990] bg-[#F7F5EE] text-[#1F2320] border-t border-[#DCD8C6] shadow-[0_-6px_28px_rgba(0,0,0,0.22)] transition-all duration-300"
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-7 py-3.5 sm:py-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-8">
            {/* Left Column: Language Selector + Consent Copy */}
            <div className="flex-1 max-w-[840px]">
              {/* [ English ▼ ] Selector */}
              <div className="relative inline-block mb-2.5">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-[#555550] hover:text-[#1F2320] focus:outline-none select-none tracking-tight cursor-pointer"
                  aria-expanded={langMenuOpen}
                  aria-label="Select Cookie Banner Language"
                >
                  <span>[</span>
                  <span className="px-0.5">{t.langLabel}</span>
                  <span className="text-[10px] leading-none">▼</span>
                  <span>]</span>
                </button>

                {langMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-1.5 w-36 bg-white border border-[#CFCBC0] rounded shadow-lg py-1 z-[9999]">
                    {(
                      [
                        { code: 'en', label: 'English' },
                        { code: 'hi', label: 'हिंदी (Hindi)' },
                        { code: 'mr', label: 'मराठी (Marathi)' },
                      ] as { code: ConsentLanguage; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleLanguageChange(item.code)}
                        className={`w-full text-left px-3 py-1.5 text-[12.5px] transition-colors cursor-pointer ${
                          lang === item.code
                            ? 'bg-[#F0EDE2] font-semibold text-[#1F2320]'
                            : 'text-[#3B3B38] hover:bg-[#F7F5EE]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Consent Paragraph */}
              <p className="text-[13px] sm:text-[13.5px] leading-[1.48] text-[#222522] font-normal">
                {t.bannerTextPart1}
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A62B8] hover:text-[#124B8F] hover:underline font-normal inline cursor-pointer focus:outline-none"
                >
                  {t.policyLinkText}
                </a>
                {t.bannerTextPart2}
              </p>
            </div>

            {/* Right Column: Accept All | Accept only Necessary | Preference Centre */}
            <div className="flex flex-wrap items-center gap-2.5 lg:self-start lg:pt-0.5 shrink-0">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="bg-white hover:bg-[#EFECE2] text-[#222222] border border-[#3B3B3B] px-4 py-[7px] text-[12.5px] font-medium leading-tight transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A62B8]/40"
              >
                {t.acceptAll}
              </button>

              <button
                type="button"
                onClick={handleAcceptNecessaryOnly}
                className="bg-white hover:bg-[#EFECE2] text-[#222222] border border-[#3B3B3B] px-4 py-[7px] text-[12.5px] font-medium leading-tight transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1A62B8]/40"
              >
                {t.acceptNecessary}
              </button>

              <button
                type="button"
                onClick={openPreferenceCentre}
                className="inline-flex items-center gap-1.5 text-[#1A62B8] hover:text-[#124B8F] hover:underline px-2 py-[7px] text-[13px] font-medium transition-colors cursor-pointer focus:outline-none"
              >
                {/* Vertical Sliders Icon matching screenshot */}
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 text-[#1A62B8]"
                  aria-hidden="true"
                >
                  <line x1="3" y1="2" x2="3" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="13" y1="2" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="3" cy="5.5" r="1.8" fill="#F7F5EE" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="10.5" r="1.8" fill="#F7F5EE" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="13" cy="6.5" r="1.8" fill="#F7F5EE" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>{t.preferenceCentre}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preference Centre Modal */}
      {showPreferenceModal && (
        <div
          className="fixed inset-0 z-[9995] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pref-centre-title"
        >
          <div className="bg-[#F7F5EE] text-[#1F2320] border border-[#D5D0BE] rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#EFECE1] border-b border-[#DCD8C6] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0 text-[#1A62B8]"
                >
                  <line x1="3" y1="2" x2="3" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="13" y1="2" x2="13" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="3" cy="5.5" r="1.8" fill="#EFECE1" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="8" cy="10.5" r="1.8" fill="#EFECE1" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="13" cy="6.5" r="1.8" fill="#EFECE1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <h2 id="pref-centre-title" className="text-base sm:text-lg font-bold text-[#1F2320]">
                  {t.prefTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPreferenceModal(false)}
                className="text-[#555550] hover:text-[#1F2320] p-1 rounded transition-colors cursor-pointer"
                aria-label="Close Preference Centre"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              <p className="text-[13.5px] leading-relaxed text-[#383C38]">
                {t.prefSubtitle}{' '}
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A62B8] hover:underline font-medium cursor-pointer"
                >
                  {t.policyLinkText}
                </a>
              </p>

              {/* Current Consent Status Banner */}
              {consentState.hasInteracted && (
                <div className="bg-white border border-[#DCD8C6] rounded-md p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#454945]">
                  <div>
                    <span className="font-semibold text-[#1F2320]">Current Consent Status: </span>
                    <span className="uppercase tracking-wide font-medium text-[#1A62B8]">
                      {consentState.consentMethod === 'accept_all'
                        ? 'All Purposes Accepted'
                        : consentState.consentMethod === 'necessary_only'
                        ? 'Strictly Necessary Only'
                        : consentState.consentMethod === 'withdrawn'
                        ? 'Consent Withdrawn (Necessary Only)'
                        : 'Custom Preferences'}
                    </span>
                    {consentState.consentedAt && (
                      <span className="block text-[11px] text-[#6E726E] mt-0.5">
                        Last updated: {new Date(consentState.consentedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleWithdrawConsent}
                    className="text-[#B42318] hover:bg-[#FEF3F2] border border-[#FECDCA] px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer"
                  >
                    {t.withdrawConsent}
                  </button>
                </div>
              )}

              {/* Purpose Toggles */}
              <div className="space-y-3">
                {/* 1. Strictly Necessary */}
                <div className="bg-white border border-[#DCD8C6] rounded-md p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2320]">{t.categories.necessary.title}</h3>
                    <p className="text-xs text-[#4D524D] mt-1 leading-relaxed">{t.categories.necessary.desc}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider bg-[#E8F1FC] text-[#1A62B8] px-2.5 py-1 rounded">
                    {t.alwaysActive}
                  </span>
                </div>

                {/* 2. City & Location Selections */}
                <div className="bg-white border border-[#DCD8C6] rounded-md p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2320]">{t.categories.location.title}</h3>
                    <p className="text-xs text-[#4D524D] mt-1 leading-relaxed">{t.categories.location.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={draftLocation}
                      onChange={(e) => setDraftLocation(e.target.checked)}
                      className="sr-only peer"
                      aria-label={t.categories.location.title}
                    />
                    <div className="w-11 h-6 bg-[#CFCBC0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A62B8]"></div>
                  </label>
                </div>

                {/* 3. Restaurant Search & Menu Interactions */}
                <div className="bg-white border border-[#DCD8C6] rounded-md p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2320]">{t.categories.interaction.title}</h3>
                    <p className="text-xs text-[#4D524D] mt-1 leading-relaxed">{t.categories.interaction.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={draftInteraction}
                      onChange={(e) => setDraftInteraction(e.target.checked)}
                      className="sr-only peer"
                      aria-label={t.categories.interaction.title}
                    />
                    <div className="w-11 h-6 bg-[#CFCBC0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A62B8]"></div>
                  </label>
                </div>

                {/* 4. Campaign Performance & Analytics */}
                <div className="bg-white border border-[#DCD8C6] rounded-md p-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1F2320]">{t.categories.campaign.title}</h3>
                    <p className="text-xs text-[#4D524D] mt-1 leading-relaxed">{t.categories.campaign.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={draftCampaign}
                      onChange={(e) => setDraftCampaign(e.target.checked)}
                      className="sr-only peer"
                      aria-label={t.categories.campaign.title}
                    />
                    <div className="w-11 h-6 bg-[#CFCBC0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A62B8]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#EFECE1] border-t border-[#DCD8C6] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="bg-white hover:bg-[#E5E1D4] text-[#222222] border border-[#3B3B3B] px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t.acceptAll}
                </button>
                <button
                  type="button"
                  onClick={handleAcceptNecessaryOnly}
                  className="bg-white hover:bg-[#E5E1D4] text-[#222222] border border-[#3B3B3B] px-4 py-2 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t.acceptNecessary}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveCustomPreferences}
                className="bg-[#1A62B8] hover:bg-[#144E94] text-white px-5 py-2 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                {t.savePreferences}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
