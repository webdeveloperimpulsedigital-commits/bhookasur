import type { Metadata } from "next";
import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { BasePathProvider } from "@/components/BasePathProvider";
import { DynamicTabTitle } from "@/components/DynamicTabTitle";
import { withBasePath } from "@/lib/basePath";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gastrium.in/bhookasur_ka_food_tour';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-NMJJ5D9LB6';

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
        
        {/* Google tag (gtag.js) */}
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
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-black text-white antialiased">
        <BasePathProvider>
          <DynamicTabTitle />
          {children}
        </BasePathProvider>
      </body>
    </html>
  );
}
