import type { Metadata } from "next";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { BasePathProvider } from "@/components/BasePathProvider";
import { DynamicTabTitle } from "@/components/DynamicTabTitle";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { withBasePath } from "@/lib/basePath";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gastrium.in/bhookasur_ka_food_tour';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-YMMWN9DQR6';
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-K99QFHFN';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Bhookasur Ka Food Tour",
  description: "Travel across iconic Indian restaurants with Bhookasur! Feed his legendary appetite, fill the food meter, experience the Gastrium moment, and participate in the grand campaign.",
  keywords: ["Bhookasur", "Food Tour", "Gastrium", "Indian Food", "Pune", "Mumbai", "Delhi", "Food Campaign"],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "Bhookasur Ka Food Tour",
    description: "Maine Bhookasur ke saath Food Tour kiya! Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!",
    type: "website",
    url: appUrl,
    siteName: "Bhookasur Ka Food Tour",
    images: [
      {
        url: `${appUrl}/images/final-frames/food-tour-img-gastrium.jpg`,
        width: 360,
        height: 360,
        alt: "Bhookasur Ka Food Tour"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bhookasur Ka Food Tour",
    description: "Maine Bhookasur ke saath Food Tour kiya! Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!",
    images: [`${appUrl}/images/final-frames/food-tour-img-gastrium.jpg`]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon & Web Icons */}
        <link rel="icon" href={withBasePath('/favicon.ico')} sizes="any" />
        <link rel="icon" href={withBasePath('/favicon-32x32.png')} type="image/png" sizes="32x32" />
        <link rel="icon" href={withBasePath('/favicon-16x16.png')} type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href={withBasePath('/apple-touch-icon.png')} sizes="180x180" />
        
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />

        {/* Google tag (gtag.js) with Consent Mode v2 default */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                functionality_storage: 'denied',
                personalization_storage: 'denied',
                security_storage: 'granted'
              });
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
              {/* Fail-Safe Button Tracking Helper for GTM & GA4 */}
        <Script
          id="gtm-button-click-helper"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('click', function(e) {
                var target = e.target;
                var btn = target && target.closest ? target.closest('button[id^="btn-"], a[id^="btn-"]') : null;
                if (btn && btn.id) {
                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                    event: 'bhookasur_button_click',
                    button_id: btn.id,
                    button_text: (btn.innerText || btn.getAttribute('aria-label') || '').trim()
                  });
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <BasePathProvider>
          <DynamicTabTitle />
          {children}
          <CookieConsentBanner />
        </BasePathProvider>
      </body>
    </html>
  );
}
