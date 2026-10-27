'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Volume2, VolumeX, Sparkles, Flame, Play, Pause, Clapperboard, Video, ArrowLeft } from 'lucide-react';
import { BakasurEatingStage } from './BakasurEatingStage';
import { getDishVisualAssets } from '@/lib/dishAssets';
import { getPreloadedUrl } from '@/lib/mediaPreloader';
import { withBasePath } from '@/lib/basePath';

export interface SpiceOption {
  id: string;
  name: string;
  level: string;
  icon: string;
  description?: string;
}

interface BakasurVideoPlayerProps {
  videoUrl: string;
  stageName: string;
  frameNumber?: number;
  feastingStage?: 1 | 2 | 3;
  dishName?: string;
  dishImage?: string;
  restaurantName?: string;
  spice?: SpiceOption;
  soundEnabled?: boolean;
  loop?: boolean;
  onToggleSound?: () => void;
  onVideoEnded?: () => void;
  onSelectDish?: (dish: { name: string; image?: string; price?: number }) => void;
  onBack?: () => void;
  stepIndicator?: string;
  posterImage?: string;
}

export interface DishMomentInfo {
  category: string;
  biteEmoji: string;
  biteLabel: string;
  munchSound: string;
  actionText: string;
  image: string;
  eatingScene: string;
}

// Preset popular food quick-picks for testing/dynamic preview
export const POPULAR_FOOD_PRESETS = [
  { name: 'Steamed Veg Momos', icon: '🥟', image: '/api/ai/dish-image?dish=Momos' },
  { name: 'Crispy Butter Masala Dosa', icon: '🥞', image: '/api/ai/dish-image?dish=Masala%20Dosa' },
  { name: 'Shahi Chicken Dum Biryani', icon: '🍗', image: '/api/ai/dish-image?dish=Chicken%20Biryani' },
  { name: 'Aslam Special Butter Chicken', icon: '🍗', image: '/api/ai/dish-image?dish=Butter%20Chicken' },
  { name: 'Sita Ram Chole Bhature', icon: '🫓', image: '/api/ai/dish-image?dish=Chole%20Bhature' },
  { name: 'Famous Creamy Dal Makhani', icon: '🍲', image: '/api/ai/dish-image?dish=Dal%20Makhani' },
  { name: 'Extra Butter Pav Bhaji', icon: '🍛', image: '/api/ai/dish-image?dish=Pav%20Bhaji' },
  { name: 'Spicy Katakirr Tarri Misal', icon: '🌶️', image: '/api/ai/dish-image?dish=Misal%20Pav' },
  { name: 'Mutton Keema Ghotala & Pav', icon: '🍳', image: '/api/ai/dish-image?dish=Keema%20Pav' },
  { name: 'Sajuk Tupatli Puran Poli', icon: '🧈', image: '/api/ai/dish-image?dish=Puran%20Poli' },
  { name: 'SPDP Chaat Crunch', icon: '🥣', image: '/api/ai/dish-image?dish=SPDP' }
];

export function getDishMomentDetails(dishName?: string, dishImage?: string): DishMomentInfo {
  const n = (dishName || '').toLowerCase().trim();
  const visual = getDishVisualAssets(dishName, dishImage);
  const resolvedImg = visual.plateImage;

  // 0. Momos / Dimsum / Dumpling
  if (n.includes('momo') || n.includes('dimsum') || n.includes('dumpling') || (dishImage && dishImage.includes('momo'))) {
    return {
      category: 'momos',
      biteEmoji: '🥟',
      biteLabel: 'Steamed Momos Feast',
      munchSound: 'CHOMP-CHOMP! Spicy Garlic Chutney 🥟',
      actionText: 'Bhookasur is gulping juicy Momos...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 0.8 Sabudana Vada / Sago
  if (n.includes('sabudana') || n.includes('sago')) {
    return {
      category: 'sabudana_vada',
      biteEmoji: '🥔',
      biteLabel: 'Crispy Sabudana Vada Feast',
      munchSound: 'CRUNCH-CRUNCH! Sweet Curd Delight 🤤',
      actionText: 'Bhookasur is crunching crispy Sabudana Vada...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 1. Vada Pav / Batata Vada / Kothimbir Vadi / Wada
  if (n.includes('vada') || n.includes('vadapav') || n.includes('wada') || n.includes('vadi') || n.includes('batata')) {
    return {
      category: 'vada_pav',
      biteEmoji: '🍔',
      biteLabel: 'Mumbai Vada Pav Feast',
      munchSound: 'CHOMP-CHOMP! Lasun Chutney Blast 💥',
      actionText: 'Bhookasur is devouring Mumbai Vada Pav...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 2. Puran Poli
  if (n.includes('puran poli') || n.includes('puran') || n.includes('poli')) {
    return {
      category: 'puran_poli',
      biteEmoji: '🧈',
      biteLabel: 'Ghee Puran Poli Feast',
      munchSound: 'SLURRP! Ghee Blast 🧈',
      actionText: 'Bhookasur is devouring Ghee Puran Poli...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 3. Idli / Thatte Idli / Medu Vada
  if (n.includes('idli') || n.includes('medu vada') || n.includes('sambar vada')) {
    return {
      category: 'idli',
      biteEmoji: '🥟',
      biteLabel: 'Soft Thatte Idli & Sambar',
      munchSound: 'SOFT & SPONGY SLURP! 🤤',
      actionText: 'Bhookasur is dipping soft Idli into hot Sambar...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 4. Dosa / Uttapam / South Indian
  if (n.includes('dosa') || n.includes('uttapam') || n.includes('mysore masala') || n.includes('rava dosa') || n.includes('set dosa') || n.includes('ghee roast') || n.includes('benne')) {
    return {
      category: 'dosa',
      biteEmoji: '🥞',
      biteLabel: 'Crispy Butter Dosa Feast',
      munchSound: 'CRUNCH-CRUNCH! 🤤',
      actionText: 'Bhookasur is chomping Crispy Dosa...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 5. Pav Bhaji / Masala Pav
  if (n.includes('pav bhaji') || (n.includes('bhaji') && n.includes('pav')) || n.includes('pavbhaji') || n.includes('masala pav')) {
    return {
      category: 'pav_bhaji',
      biteEmoji: '🍛',
      biteLabel: 'Butter Pav Bhaji Feast',
      munchSound: 'CHOMP-CHOMP! Extra Butter 🧈',
      actionText: 'Bhookasur is devouring Pav Bhaji...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 6. Pani Puri / Golgappa
  if (
    n.includes('pani puri') ||
    n.includes('panipuri') ||
    n.includes('golgappa') ||
    n.includes('gol gappe') ||
    n.includes('puchka') ||
    n.includes('gupchup')
  ) {
    return {
      category: 'pani_puri',
      biteEmoji: '🥣',
      biteLabel: 'Teekha Pani Puri Feast',
      munchSound: 'TEEKHA PANI CRUNCH! 💥',
      actionText: 'Bhookasur is gulping Teekha Pani Puri...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 6. SPDP / Chaat / Dahi Puri / Bhel
  if (n.includes('spdp') || n.includes('dahi puri') || n.includes('sev puri') || n.includes('bhel') || n.includes('chaat') || (n.includes('dahi') && !n.includes('vada') && !n.includes('sabudana')) || n.includes('sev') || n.includes('tikki')) {
    return {
      category: 'spdp',
      biteEmoji: '🥣',
      biteLabel: 'SPDP Chaat Blast',
      munchSound: 'CHATPATAA CRUNCH! 🥣',
      actionText: 'Bhookasur is crunching Sev Potato Dahi Puri...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 7. Masala Papad / Roasted Papad / Fry Papad
  if (n.includes('papad') || n.includes('appalam') || n.includes('papadum')) {
    return {
      category: 'masala_papad',
      biteEmoji: '🫓',
      biteLabel: 'Crispy Masala Papad Feast',
      munchSound: 'CRACKLE-CRUNCH! Chatpata Masala 🤤💥',
      actionText: 'Bhookasur is crunching crispy Masala Papad...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 7.5 Kaju Masala / Kaju Curry / Kaju Bhaji
  if (n.includes('kaju') || n.includes('cashew')) {
    return {
      category: 'kaju_masala',
      biteEmoji: '🍲',
      biteLabel: 'Shahi Kaju Masala Feast',
      munchSound: 'RICH CASHEW CRUNCH! Ghee Gravy 🤤🍛',
      actionText: 'Bhookasur is relishing rich Kaju Masala Bhaji...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 8. Misal / Katakirr / Spicy Curry
  if (n.includes('misal') || n.includes('katakirr') || n.includes('bedekar') || n.includes('tarri') || n.includes('rassa') || n.includes('kolhapuri') || n.includes('poha')) {
    return {
      category: 'misal',
      biteEmoji: '🌶️',
      biteLabel: 'Fiery Tarri Misal Feast',
      munchSound: 'HOT TARRI SPICE! 🔥',
      actionText: 'Bhookasur is slurping spicy Tarri Misal...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 9. Biryani
  if (n.includes('biryani') || (n.includes('pulao') && !n.includes('dosa')) || n.includes('dum') || n.includes('tahari')) {
    return {
      category: 'biryani',
      biteEmoji: '🍗',
      biteLabel: 'Shahi Dum Biryani Feast',
      munchSound: 'MUNCH-MUNCH! Saffron Aroma 🍗',
      actionText: 'Bhookasur is devouring Dum Biryani...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 10. Kebab / Galouti Kebab / Tikka
  if (n.includes('kebab') || n.includes('galouti') || n.includes('seekh') || n.includes('shami') || n.includes('tikka') || n.includes('tandoori') || n.includes('baida roti')) {
    return {
      category: 'kebab',
      biteEmoji: '🍢',
      biteLabel: 'Melt-in-Mouth Kebab Feast',
      munchSound: 'SUCCULENT MELT! 🤤',
      actionText: 'Bhookasur is relishing juicy Kebabs & Tandoori...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 11. Thali / Maharaja Thali
  if (n.includes('thali') || n.includes('maharaja') || n.includes('meals') || n.includes('bhojan')) {
    return {
      category: 'thali',
      biteEmoji: '👑',
      biteLabel: 'Royal Maharaja Thali Feast',
      munchSound: 'SHAHI BHOJAN! 🤤',
      actionText: 'Bhookasur is devouring Royal Maharaja Thali...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 12. Sweets / Desserts / Gulab Jamun / Shahi Tukda / Kheer / Jalebi / Halwa
  if (n.includes('tukda') || n.includes('gulab jamun') || n.includes('kheer') || n.includes('jalebi') || n.includes('halwa') || n.includes('rasgulla') || n.includes('sweet') || n.includes('mithai')) {
    return {
      category: 'sweets',
      biteEmoji: '🍮',
      biteLabel: `${dishName || 'Shahi Sweets'} Feast`,
      munchSound: 'MEETHA DHAMAKA! 🤤',
      actionText: `Bhookasur is savoring rich sweet ${dishName || 'mithai'}...`,
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 13. Falooda / Kulfi / Mastani / Ice Cream
  if (n.includes('falooda') || n.includes('kulfi') || n.includes('mastani') || n.includes('ice cream') || n.includes('custard') || n.includes('sundae')) {
    return {
      category: 'falooda',
      biteEmoji: '🍧',
      biteLabel: 'Royal Falooda & Kulfi Feast',
      munchSound: 'CHILLED SWEET CRUNCH! 🍨',
      actionText: `Bhookasur is relishing chilled ${dishName || 'Falooda'}...`,
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 14. Cold Coffee / Filter Coffee / Chai
  if (n.includes('coffee') || n.includes('frappe') || n.includes('latte')) {
    return {
      category: 'coffee',
      biteEmoji: '☕',
      biteLabel: 'Creamy Cold Coffee Chill',
      munchSound: 'CHILLED SLURP! ☕',
      actionText: `Bhookasur is chugging refreshing ${dishName || 'Cold Coffee'}...`,
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 14.5 Buttermilk / Taak / Chaas / Mattha / Majjiga
  if (
    (!n.includes('pancake') && !n.includes('waffle')) &&
    (n.includes('butter milk') || n.includes('buttermilk') || n.includes('taak') || n.includes('chaas') || n.includes('chhaas') || n.includes('mattha') || n.includes('majjiga'))
  ) {
    return {
      category: 'buttermilk',
      biteEmoji: '🥛',
      biteLabel: 'Chilled Spiced Buttermilk',
      munchSound: 'CHILLED COOL GULP! 🥛',
      actionText: `Bhookasur is gulping chilled spiced ${dishName || 'Buttermilk'}...`,
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 15. Bun Maska & Irani Chai
  if (n.includes('bun maska') || (n.includes('maska') && !n.includes('keema')) || n.includes('irani chai') || (n.includes('chai') && !n.includes('samosa'))) {
    return {
      category: 'bun_maska',
      biteEmoji: '☕',
      biteLabel: 'Buttery Bun Maska & Hot Irani Chai',
      munchSound: 'CRUNCH-SLURP! Irani Chai Butter Bun ☕',
      actionText: 'Bhookasur is dipping crispy Bun Maska into hot Irani Chai...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 16. Seafood / Fish / Crab / Prawns
  if (n.includes('crab') || n.includes('fish') || n.includes('prawn') || n.includes('bombil') || n.includes('surmai') || n.includes('seafood')) {
    return {
      category: 'seafood',
      biteEmoji: '🦀',
      biteLabel: 'Fresh Seafood Feast',
      munchSound: 'CRISPY SEAFOOD BITE! 🐟',
      actionText: `Bhookasur is feasting on ${dishName || 'Seafood'}...`,
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 17. Pizza
  if (n.includes('pizza') || n.includes('pasta') || n.includes('garlic bread')) {
    return {
      category: 'pizza',
      biteEmoji: '🍕',
      biteLabel: 'Cheesy Pizza Feast',
      munchSound: 'CHEESE PULL CRUNCH! 🧀',
      actionText: 'Bhookasur is chomping hot Cheesy Pizza...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 18. Burger / Fries / Fast Food
  if (n.includes('burger') || n.includes('fries') || n.includes('sandwich') || n.includes('wrap') || n.includes('frankie')) {
    return {
      category: 'burger',
      biteEmoji: '🍔',
      biteLabel: 'Crispy Burger Feast',
      munchSound: 'CRISPY PATTY CHOMP! 🍔',
      actionText: 'Bhookasur is biting into juicy Crispy Burger...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 19. Butter Chicken / Chicken Handi / Non-veg
  if (n.includes('butter chicken') || n.includes('chicken') || (n.includes('mutton') && !n.includes('keema')) || n.includes('handi') || n.includes('korma') || n.includes('curry')) {
    return {
      category: 'butter_chicken',
      biteEmoji: '🍗',
      biteLabel: 'Butter Chicken & Gravy Feast',
      munchSound: 'LICKING FINGERS! 🤤',
      actionText: 'Bhookasur is enjoying rich creamy gravy...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 20. Chole Bhature
  if (n.includes('chole') || n.includes('bhature') || n.includes('kulche') || n.includes('bhatura')) {
    return {
      category: 'chole_bhature',
      biteEmoji: '🫓',
      biteLabel: 'Fluffy Chole Bhature Feast',
      munchSound: 'CHOMP-CHOMP! Pure Punjabi Swag 🫓',
      actionText: 'Bhookasur is tearing hot fluffy Bhature...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 21. Dal Makhani
  if (n.includes('dal') || n.includes('makhani') || n.includes('tadka')) {
    return {
      category: 'dal_makhani',
      biteEmoji: '🍲',
      biteLabel: 'Creamy Dal Makhani Feast',
      munchSound: 'SLURRP! Creamy Butter 🧈',
      actionText: 'Bhookasur is devouring creamy Dal Makhani...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // 22. Keema Pav / Egg Bhurji
  if (n.includes('keema') || n.includes('bhurji') || n.includes('anda') || n.includes('egg') || n.includes('cutlet')) {
    return {
      category: 'keema_pav',
      biteEmoji: '🍳',
      biteLabel: 'Spicy Keema Pav Feast',
      munchSound: 'CHOMP-CHOMP! Bun Maska Kick 🍳',
      actionText: 'Bhookasur is gulping Keema Pav...',
      image: resolvedImg,
      eatingScene: resolvedImg
    };
  }

  // Default fallback (uses resolvedImg from getDishVisualAssets)
  return {
    category: 'dish',
    biteEmoji: '🍽️',
    biteLabel: `${dishName || 'Bhookasur'} Feast`,
    munchSound: 'CHOMP-CHOMP! 🤤',
    actionText: `Bhookasur is devouring ${dishName || 'food'}...`,
    image: resolvedImg,
    eatingScene: resolvedImg
  };
}

export function getDishImage(dishName?: string, dishImage?: string): string {
  return getDishMomentDetails(dishName, dishImage).image;
}

export const BakasurVideoPlayer: React.FC<BakasurVideoPlayerProps> = ({
  videoUrl,
  stageName,
  frameNumber = 1,
  feastingStage = 1,
  dishName,
  dishImage,
  restaurantName,
  spice,
  soundEnabled = true,
  loop = true,
  onToggleSound,
  onVideoEnded,
  onBack,
  stepIndicator,
  posterImage = "/images/bakasur_pass.jpg"
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(!soundEnabled);

  const isEating = (frameNumber === 5 && stageName !== 'trailer') || stageName === 'eating';
  const isHeartburn = frameNumber === 7 || frameNumber === 8 || stageName === 'heartburn' || feastingStage === 3;
  const isPass = frameNumber === 13 || stageName === 'pass';
  const isReliefDone = frameNumber === 10 || stageName === 'relief_done';

  const cleanDishTitle = dishName ? dishName.replace(/^Ready in |^Bakasur in |^Bhookasur in |^Feeding /i, '') : 'Signature Food';

  // Sync mute state
  useEffect(() => {
    setIsMuted(!soundEnabled);
    if (videoRef.current) {
      videoRef.current.muted = !soundEnabled;
    }
  }, [soundEnabled]);

  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  // Video resolution across 13 frames from design team:
  // - Frame 1 (Welcome): Pointing Downwards.mp4 (Bakasur points down to start food tour)
  // - Frame 2 (Restaurant Search): Desktop = Bakasur-Pointing-Rightside.mp4, Mobile = 2.mp4
  // - Frame 3 & 4 (Dish Selection / Manual Dish): Showing Empty Plate.mp4 (Holding empty plate ready for food)
  // - Frame 5 (Eating Begins): Full-screen eating stage
  // - Frame 6 (Trailer): Showing Love.mp4 / Food Tour spots (Dosa.mp4, Pav Bhaji.mp4, Biryani.mp4)
  // - Frame 7 & 8 (Acidity Overload): Fire on stomach.mp4 (Heartburn flames)
  // - Frame 9 (Gastrium Relief): Gastrium animation / relief video
  // - Frame 10 (Shukriya / Submitted): Thumbs Up.mp4 (Bakasur thumbs up!)
  // - Frame 11 (Live Map): Showing Love.mp4
  // - Frame 12 (Registration): Pointing Downwards.mp4 (Bakasur points down to registration form)
  // - Frame 13 (Pass Confirmed): Thumbs Up.mp4 (Bakasur thumbs up confirmation)
  const activeVideoSrc = useMemo(() => {
    let src = videoUrl || '/images/final-frames/1.mp4';
    if (frameNumber === 1) src = '/images/final-frames/1.mp4';
    else if (frameNumber === 2) {
      src = isDesktop
        ? '/images/final-frames/Bakasur-Pointing-Rightside.mp4'
        : '/images/final-frames/2.mp4';
    }
    else if (frameNumber === 3 || frameNumber === 4) src = '/images/final-frames/3.mp4';
    else if (frameNumber === 6) src = '/images/all-frames/Showing Love.mp4';
    else if (frameNumber === 7 || frameNumber === 8 || isHeartburn) src = '/images/final-frames/Acidity-and-Dakare.mp4';
    else if (frameNumber === 9) src = '/images/final-frames/Bhookasur-Drinking-Gastrium.mp4';
    else if (frameNumber === 10) src = '/images/all-frames/Thumbs Up.mp4';
    else if (frameNumber === 11) src = '/images/all-frames/Showing Love.mp4';
    else if (frameNumber === 12) src = '/images/all-frames/Showing Love.mp4';
    else if (frameNumber === 13) src = '/images/all-frames/Thumbs Up.mp4';

    return getPreloadedUrl(src);
  }, [frameNumber, isHeartburn, videoUrl, isDesktop]);

  const activePosterSrc = useMemo(() => {
    if (posterImage && posterImage !== '/images/bakasur_pass.jpg') return posterImage;
    if (frameNumber === 1) return '/images/final-frames/1_poster.jpg';
    if (frameNumber === 2) return '/images/final-frames/2_poster.jpg';
    if (frameNumber === 3 || frameNumber === 4) return '/images/final-frames/3_poster.jpg';
    if (frameNumber === 5) return '/images/final-frames/5_poster.jpg';
    if (frameNumber === 7 || frameNumber === 8 || isHeartburn) return '/images/final-frames/Acidity-and-Dakare_poster.jpg';
    return '/images/final-frames/1_poster.jpg';
  }, [frameNumber, isHeartburn, posterImage]);

  // Autoplay video smoothly on source change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isMounted = true;
    const playVideo = async () => {
      try {
        video.currentTime = 0;
        video.playbackRate = 1.0;
        video.muted = !soundEnabled;
        const p = video.play();
        if (p !== undefined) {
          await p;
        }
        if (isMounted) setIsPlaying(true);
      } catch {
        try {
          if (!isMounted || !video) return;
          video.muted = true;
          const retry = video.play();
          if (retry !== undefined) {
            await retry;
          }
          if (isMounted) setIsPlaying(true);
        } catch {
          if (isMounted) setIsPlaying(false);
        }
      }
    };

    playVideo();
    return () => {
      isMounted = false;
    };
  }, [activeVideoSrc, soundEnabled]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative w-full h-full min-h-full overflow-hidden bg-[#182858] flex items-center justify-center select-none">
      {/* Top Header Overlay: Top-Left Back Button & Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
        {onBack ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-black text-xs backdrop-blur-md border border-white/20 shadow-lg transition-all transform active:scale-95 cursor-pointer"
            aria-label="Previous Frame"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        <div />
      </div>

      {/* Main Stage Media Render */}
      {frameNumber === 10 ? (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#062c97]">
          <img
            src={withBasePath('/images/final-frames/thank-you-frame.jpg')}
            alt="Bhookasur Shukriya"
            className="w-full h-full object-contain object-center relative z-10"
          />
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#182858]">
          <video
            ref={videoRef}
            key={activeVideoSrc}
            src={activeVideoSrc}
            poster={withBasePath(activePosterSrc)}
            playsInline
            autoPlay
            loop
            muted={!soundEnabled}
            preload="auto"
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onCanPlay={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            onError={() => {
              if (videoRef.current && !videoRef.current.src.includes('1.mp4')) {
                videoRef.current.src = withBasePath('/images/final-frames/1.mp4');
                videoRef.current.load();
                videoRef.current.play().catch(() => {});
              }
            }}
            onTimeUpdate={(e) => {
              if (frameNumber === 9) {
                const video = e.currentTarget;
                if (video.currentTime >= 3.8) {
                  window.dispatchEvent(new CustomEvent('gastrium-stomach-revealed'));
                }
              }
            }}
            className="w-full h-full object-cover object-top relative z-10"
          />
          {(frameNumber === 7 || frameNumber === 8 || isHeartburn) && (
            <div className="absolute inset-0 bg-gradient-to-t from-red-600/40 via-orange-600/20 to-transparent pointer-events-none z-20 animate-flame-volcano" />
          )}
        </div>
      )}
    </div>
  );
};
