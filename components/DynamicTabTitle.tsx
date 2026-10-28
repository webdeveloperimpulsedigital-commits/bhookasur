'use client';

import { useEffect } from 'react';

const MAIN_TITLE = 'Bhookasur Ka Food Tour';
const ROTATING_TITLES = [
  '👀 Oye! Khana kaun khilayega?',
  '🤤 Bhookasur wait kar raha hai...',
  '🍽️ Food Tour abhi baaki hai!',
  MAIN_TITLE,
];

export function DynamicTabTitle() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let currentIndex = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is inactive / user switched tabs -> cycle through funny titles
        currentIndex = 0;
        document.title = ROTATING_TITLES[currentIndex];

        intervalId = setInterval(() => {
          currentIndex = (currentIndex + 1) % ROTATING_TITLES.length;
          document.title = ROTATING_TITLES[currentIndex];
        }, 3000);
      } else {
        // Tab is active again -> clear interval and reset to main title immediately
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        document.title = MAIN_TITLE;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}

