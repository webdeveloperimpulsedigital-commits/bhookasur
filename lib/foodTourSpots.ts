export interface FoodTourCopy {
  line1: string;
  line2Prefix: string;
  highlight: string;
  line2Suffix?: string;
}

export interface FoodTourSpot {
  id: string;
  dishName: string;
  spotName: string;
  city: string;
  // Can be a static video (.mp4/.webm) or high-res image (.png/.jpg/.webp)
  eatingMedia: string;
  emptyMedia: string;
  eatingCopy: FoodTourCopy;
  emptyCopy: FoodTourCopy;
}

export const FOOD_TOUR_SPOTS: FoodTourSpot[] = [
  // 1. Giant Dosa (Video from Design Team)
  {
    id: 'dosa',
    dishName: 'Crispy Butter Masala Dosa',
    spotName: 'Sri Krishna Dosa Corner',
    city: 'Pune',
    eatingMedia: '/images/all-frames/Dosa.mp4',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Dosa table se bada tha.',
      line2Prefix: 'Bakasur ki ',
      highlight: 'bhookh',
      line2Suffix: ' se nahi.'
    },
    emptyCopy: {
      line1: 'Dosa ne table bhar diya.',
      line2Prefix: 'Bakasur ka ',
      highlight: 'quota',
      line2Suffix: ' nahi.'
    }
  },

  // 2. Extra Butter Pav Bhaji (Video from Design Team)
  {
    id: 'pav_bhaji',
    dishName: 'Extra Butter Pav Bhaji',
    spotName: 'Shivaji Chowk Famous Pav Bhaji',
    city: 'Pune',
    eatingMedia: '/images/all-frames/Pav Bhaji.mp4',
    emptyMedia: '/images/all-frames/Showing Empty Plate.mp4',
    eatingCopy: {
      line1: 'Amul butter ka swimming pool tha.',
      line2Prefix: 'Bakasur ne ',
      highlight: 'pura saaf',
      line2Suffix: ' kar diya.'
    },
    emptyCopy: {
      line1: 'Pav khatam, bhaji gayab.',
      line2Prefix: 'Bakasur bola: ',
      highlight: 'ek round aur',
      line2Suffix: ' banta hai!'
    }
  }
];

export function getRandomFoodSpot(excludeIds: string[] = []): FoodTourSpot {
  const available = FOOD_TOUR_SPOTS.filter((s) => !excludeIds.includes(s.id));
  if (available.length > 0) return available[0];
  return FOOD_TOUR_SPOTS[0];
}
