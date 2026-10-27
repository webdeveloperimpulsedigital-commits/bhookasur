import type { Metadata } from 'next';
import Link from 'next/link';
import { withBasePath } from '@/lib/basePath';

export const metadata: Metadata = {
  title: 'Maine Bhookasur ke saath Food Tour kiya! 🍔🔥',
  description: 'Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye! Powered by Gastrium.',
  openGraph: {
    title: 'Maine Bhookasur ke saath Food Tour kiya! 🍔🔥',
    description: 'Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye! Powered by Gastrium.',
    images: [
      {
        url: '/images/final-frames/food-tour-img-gastrium.jpg',
        width: 360,
        height: 360,
        alt: 'Bhookasur Food Tour'
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maine Bhookasur ke saath Food Tour kiya! 🍔🔥',
    description: 'Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!',
    images: ['/images/final-frames/food-tour-img-gastrium.jpg']
  }
};

export default function PassPage() {
  return (
    <main className="min-h-screen bg-[#071746] flex flex-col items-center justify-center p-4 sm:p-6 text-white text-center">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/30 flex flex-col items-center text-slate-900 p-4 gap-4 animate-in fade-in duration-300">
        {/* Pure Food Tour Photo (No baked-in text) */}
        <div className="w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 aspect-square bg-slate-100">
          <img
            src={withBasePath('/images/final-frames/food-tour-img-gastrium.jpg')}
            alt="Bhookasur Food Tour"
            className="w-full h-full object-cover block"
          />
        </div>

        {/* Message in text format */}
        <div className="flex flex-col items-center text-center gap-1.5 px-2">
          <h1 className="text-lg sm:text-xl font-black text-[#0B1B48] leading-tight">
            Maine Bhookasur ke saath Food Tour kiya!
          </h1>
          <p className="text-xs sm:text-sm font-bold text-[#D4380D] leading-snug">
            Aap bhi Bhookasur ke saath Food Tour kijiye aur apna food spot share kijiye!
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/"
          className="w-full py-3.5 px-6 rounded-2xl bg-[#D4380D] hover:bg-[#ba300a] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg active:scale-95 transition-all text-center no-underline mt-1"
        >
          Join Bhookasur Food Tour 🚀
        </Link>
      </div>
    </main>
  );
}
