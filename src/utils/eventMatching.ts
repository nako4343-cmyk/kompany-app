import { EventItem, EventVibe, UserProfile } from '../types/index.ts';

export type QuickCategoryId =
  | 'all'
  | 'today'
  | 'nearby'
  | 'restaurants'
  | 'parties'
  | 'walks'
  | 'cinema'
  | 'games'
  | 'saved'
  | 'other';

export interface FeedFiltersState {
  date: 'all' | 'today' | 'tomorrow' | 'weekend' | 'week';
  time: 'all' | 'morning' | 'day' | 'evening' | 'night';
  maxDistanceKm: number | null;
  category: string; // 'Все' or specific EventCategory
  budget: 'all' | 'free' | 'up_to_1000' | '1000_3000' | '3000_plus';
  ageRange: 'all' | 'my_age' | '18_25' | '25_35' | '35_plus';
  groupSize: 'all' | 'small' | 'medium' | 'large';
  format: 'all' | EventVibe;
  onlyOpenSpots: boolean;
}

export const DEFAULT_FEED_FILTERS: FeedFiltersState = {
  date: 'all',
  time: 'all',
  maxDistanceKm: null,
  category: 'Все',
  budget: 'all',
  ageRange: 'all',
  groupSize: 'all',
  format: 'all',
  onlyOpenSpots: false,
};

export interface SmartRecommendation {
  event: EventItem;
  score: number;
  reason: string;
}

/**
 * Parses an organizer-specified age range from `event.requirements`, e.g.
 * "23-35 лет", "25–35 лет", "от 21 года", "18+".
 */
export function parseAgeRange(requirements?: string): { min: number; max: number } | null {
  if (!requirements) return null;
  const rangeMatch = requirements.match(/(\d{2})\s*[-–—]\s*(\d{2})/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (min >= 18 && max <= 99 && min <= max) {
      return { min, max };
    }
  }
  const fromMatch = requirements.match(/(?:от\s*)?(\d{2})\s*\+|от\s*(\d{2})/i);
  if (fromMatch) {
    const min = Number(fromMatch[1] || fromMatch[2]);
    if (min >= 18 && min <= 80) {
      return { min, max: 99 };
    }
  }
  return null;
}

export function formatAgeRangeLabel(requirements?: string): string | null {
  const parsed = parseAgeRange(requirements);
  if (!parsed) return null;
  if (parsed.max >= 90) return `${parsed.min}+ лет`;
  return `${parsed.min}–${parsed.max} лет`;
}

/**
 * Cleans up district name by stripping inline distance suffixes like ", ~2.5 км от центра"
 * so distance can be shown cleanly as its own metric.
 */
export function extractDistrictName(approximateArea: string): string {
  if (!approximateArea) return '';
  const cleaned = approximateArea
    .replace(/,?\s*~?\d+(?:[.,]\d+)?\s*км.*$/i, '')
    .trim();
  return cleaned || approximateArea;
}

/**
 * Classifies event time (HH:MM) into human time-of-day buckets.
 */
export function getTimeBucket(timeStr?: string): 'morning' | 'day' | 'evening' | 'night' {
  if (!timeStr) return 'evening';
  const hourMatch = timeStr.match(/^(\d{1,2})/);
  const hour = hourMatch ? Number(hourMatch[1]) : 19;
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export type EventAvailabilityBadge = 'open' | 'almost_full' | 'new' | 'full';

/**
 * Determines the primary visual status badge for an event card.
 */
export function getEventAvailabilityStatus(event: EventItem): EventAvailabilityBadge {
  const available = Math.max(0, event.totalSpots - event.occupiedSpots);
  if (available === 0 || event.status === 'full') return 'full';

  const fillRatio = event.occupiedSpots / Math.max(1, event.totalSpots);
  if (available <= 1 || fillRatio >= 0.75) return 'almost_full';

  const createdMs = Date.parse(event.createdAt);
  const isRecentlyCreated =
    !Number.isNaN(createdMs) && Date.now() - createdMs < 48 * 60 * 60 * 1000;
  if (event.occupiedSpots <= 1 || isRecentlyCreated) return 'new';

  return 'open';
}

export function countActiveFeedFilters(filters: FeedFiltersState): number {
  let count = 0;
  if (filters.date !== 'all') count++;
  if (filters.time !== 'all') count++;
  if (filters.maxDistanceKm !== null) count++;
  if (filters.category !== 'Все') count++;
  if (filters.budget !== 'all') count++;
  if (filters.ageRange !== 'all') count++;
  if (filters.groupSize !== 'all') count++;
  if (filters.format !== 'all') count++;
  if (filters.onlyOpenSpots) count++;
  return count;
}

function matchesQuickCategory(
  event: EventItem,
  quickCategory: QuickCategoryId,
  savedIds: string[]
): boolean {
  if (quickCategory === 'all') return true;
  if (quickCategory === 'today') return event.isToday;
  if (quickCategory === 'nearby') return event.distanceKm <= 3.5;
  if (quickCategory === 'saved') return savedIds.includes(event.id);

  const cat = event.category;
  switch (quickCategory) {
    case 'restaurants':
      return cat === 'Ресторан / Бар';
    case 'parties':
      return cat === 'Вечеринка' || cat === 'День рождения' || cat === 'Свадьба';
    case 'walks':
      return cat === 'Прогулка' || cat === 'Пикник / Шашлыки' || cat === 'Путешествие';
    case 'cinema':
      return cat === 'Кино / Концерт';
    case 'games':
      return cat === 'Настольные игры' || cat === 'Квиз / Интеллект';
    case 'other':
      return cat === 'Спорт' || cat === 'Другое';
    default:
      return true;
  }
}

function matchesDateFilter(event: EventItem, dateFilter: FeedFiltersState['date']): boolean {
  if (dateFilter === 'all') return true;
  if (dateFilter === 'today') return event.isToday;

  const eventDate = new Date(`${event.date}T12:00:00`);
  if (Number.isNaN(eventDate.getTime())) return true;

  // Use today's baseline or anchor relative to the earliest "isToday" event in the dataset
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const diffDays = Math.round((eventDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));

  if (dateFilter === 'tomorrow') {
    if (event.isToday) return false;
    return diffDays === 1 || (!event.isToday && diffDays >= 0 && diffDays <= 2);
  }
  if (dateFilter === 'weekend') {
    const dow = eventDate.getDay();
    return dow === 0 || dow === 5 || dow === 6;
  }
  if (dateFilter === 'week') {
    return event.isToday || (diffDays >= 0 && diffDays <= 7);
  }
  return true;
}

function matchesBudgetFilter(event: EventItem, budgetFilter: FeedFiltersState['budget']): boolean {
  if (budgetFilter === 'all') return true;
  const b = event.budget;
  switch (budgetFilter) {
    case 'free':
      return b === 'Бесплатно';
    case 'up_to_1000':
      return b === 'Бесплатно' || b === 'до 1 000 ₽';
    case '1000_3000':
      return b === '1 000–3 000 ₽';
    case '3000_plus':
      return b === '3 000–5 000 ₽' || b === '5 000+ ₽';
    default:
      return true;
  }
}

function matchesAgeFilter(
  event: EventItem,
  ageFilter: FeedFiltersState['ageRange'],
  userAge: number
): boolean {
  if (ageFilter === 'all') return true;
  const parsed = parseAgeRange(event.requirements);
  if (!parsed) return true; // Open to all ages

  if (ageFilter === 'my_age') {
    return userAge >= parsed.min && userAge <= parsed.max;
  }
  if (ageFilter === '18_25') {
    return parsed.min <= 25 && parsed.max >= 18;
  }
  if (ageFilter === '25_35') {
    return parsed.min <= 35 && parsed.max >= 25;
  }
  if (ageFilter === '35_plus') {
    return parsed.max >= 35;
  }
  return true;
}

function matchesGroupSize(event: EventItem, groupSize: FeedFiltersState['groupSize']): boolean {
  if (groupSize === 'all') return true;
  if (groupSize === 'small') return event.totalSpots <= 4;
  if (groupSize === 'medium') return event.totalSpots >= 5 && event.totalSpots <= 8;
  if (groupSize === 'large') return event.totalSpots >= 9;
  return true;
}

/**
 * Applies quick category, text search, and all 8 Bottom Sheet filters cleanly over real events.
 */
export function applyFeedFilters(
  events: EventItem[],
  filters: FeedFiltersState,
  currentUser: UserProfile,
  quickCategory: QuickCategoryId,
  searchQuery: string
): EventItem[] {
  const savedIds = currentUser.savedEventIds || [];
  const q = searchQuery.trim().toLowerCase();

  let list = events.filter(ev => {
    if (!matchesQuickCategory(ev, quickCategory, savedIds)) return false;

    if (q) {
      const hay = [
        ev.title,
        ev.description,
        ev.category,
        ev.approximateArea,
        ev.exactVenue || '',
        ev.vibe || '',
        ev.musicOrMood || '',
        ev.organizer.name,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (!matchesDateFilter(ev, filters.date)) return false;
    if (filters.time !== 'all' && getTimeBucket(ev.time) !== filters.time) return false;
    if (filters.maxDistanceKm !== null && ev.distanceKm > filters.maxDistanceKm) return false;
    if (filters.category !== 'Все' && ev.category !== filters.category) return false;
    if (!matchesBudgetFilter(ev, filters.budget)) return false;
    if (!matchesAgeFilter(ev, filters.ageRange, currentUser.age || 27)) return false;
    if (!matchesGroupSize(ev, filters.groupSize)) return false;
    if (filters.format !== 'all' && ev.vibe !== filters.format) return false;
    if (filters.onlyOpenSpots && ev.occupiedSpots >= ev.totalSpots) return false;

    return true;
  });

  if (quickCategory === 'nearby' || filters.maxDistanceKm !== null) {
    list = [...list].sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return list;
}

/**
 * Matches user interests against an event and returns the matched human-readable interest labels.
 */
function findMatchedInterests(event: EventItem, user: UserProfile): string[] {
  const userInterests = user.interests || [];
  if (userInterests.length === 0) return [];

  const cat = (event.category || '').toLowerCase();
  const title = (event.title || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  const vibe = (event.vibe || '').toLowerCase();

  const matches: string[] = [];

  for (const interest of userInterests) {
    const clean = interest.trim();
    if (!clean) continue;
    const tokens = clean
      .toLowerCase()
      .split(/[\s/,]+/)
      .filter(tok => tok.length >= 4);

    const directHit =
      cat.includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(cat) ||
      tokens.some(tok => {
        const stem = tok.slice(0, Math.min(tok.length, 6));
        return (
          cat.includes(stem) ||
          title.includes(stem) ||
          desc.includes(stem) ||
          vibe.includes(stem)
        );
      });

    if (directHit) {
      matches.push(clean.toLowerCase());
    }
  }

  return Array.from(new Set(matches));
}

/**
 * Real multi-signal recommendation engine over actual active events:
 * Considers interests, distance, date/time, budget, age compatibility, popularity & open spots.
 */
export function computeSmartRecommendations(
  events: EventItem[],
  currentUser: UserProfile,
  lang: 'ru' | 'en' = 'ru'
): SmartRecommendation[] {
  const candidates = events.filter(
    ev => !ev.isArchived && ev.status !== 'cancelled' && ev.occupiedSpots < ev.totalSpots
  );

  const scored: SmartRecommendation[] = candidates.map(ev => {
    let score = 0;
    const matchedInterests = findMatchedInterests(ev, currentUser);
    const availableSpots = Math.max(0, ev.totalSpots - ev.occupiedSpots);
    const fillRatio = ev.occupiedSpots / Math.max(1, ev.totalSpots);
    const parsedAge = parseAgeRange(ev.requirements);
    const fitsAge =
      parsedAge !== null &&
      currentUser.age >= parsedAge.min &&
      currentUser.age <= parsedAge.max;

    // 1. User interests (strongest weight)
    if (matchedInterests.length > 0) {
      score += 36 + Math.min(20, (matchedInterests.length - 1) * 10);
    }

    // 2. Distance proximity
    if (ev.distanceKm <= 2.0) score += 20;
    else if (ev.distanceKm <= 3.5) score += 12;
    else if (ev.distanceKm <= 5.0) score += 6;

    // 3. Date & time urgency (today / upcoming)
    if (ev.isToday) score += 16;

    // 4. Age preference match
    if (fitsAge) score += 12;

    // 5. Budget accessibility
    if (ev.budget === 'Бесплатно' || ev.budget === 'до 1 000 ₽') score += 8;
    else if (ev.budget === '1 000–3 000 ₽') score += 5;

    // 6. Popularity & healthy availability (not empty, not full)
    if (ev.occupiedSpots >= 2 && fillRatio >= 0.4 && fillRatio < 0.9) score += 10;
    if (availableSpots === 1) score += 4;

    // 7. Organizer reliability boost
    if (ev.organizer.reliability.score >= 4.8) score += 6;

    // Build honest, specific explanation grounded in real matched factors
    let reason = '';
    if (lang === 'en') {
      if (matchedInterests.length >= 2) {
        reason = `Matches your interests: ${matchedInterests.slice(0, 2).join(' & ')}`;
      } else if (matchedInterests.length === 1 && ev.distanceKm <= 3.0) {
        reason = `Matches «${matchedInterests[0]}» · ${ev.distanceKm} km away`;
      } else if (matchedInterests.length === 1) {
        reason = `Matches your interest: ${matchedInterests[0]}`;
      } else if (ev.isToday && ev.distanceKm <= 3.0) {
        reason = `Tonight at ${ev.time} · just ${ev.distanceKm} km away`;
      } else if (fitsAge && parsedAge) {
        reason = `Your age group (${parsedAge.min}–${parsedAge.max}) · ${availableSpots} spot${availableSpots === 1 ? '' : 's'} left`;
      } else {
        reason = `Popular meetup · ${ev.organizer.reliability.score}★ host`;
      }
    } else {
      if (matchedInterests.length >= 2) {
        reason = `Подходит вашим интересам: ${matchedInterests.slice(0, 2).join(' и ')}`;
      } else if (matchedInterests.length === 1 && ev.distanceKm <= 3.0) {
        reason = `По интересам: ${matchedInterests[0]} · рядом ${ev.distanceKm} км`;
      } else if (matchedInterests.length === 1 && ev.isToday) {
        reason = `Подходит вашим интересам: ${matchedInterests[0]} · сегодня в ${ev.time}`;
      } else if (matchedInterests.length === 1) {
        reason = `Подходит вашим интересам: ${matchedInterests[0]}`;
      } else if (ev.isToday && ev.distanceKm <= 3.0) {
        reason = `Сегодня в ${ev.time} · всего в ${ev.distanceKm} км от вас`;
      } else if (fitsAge && parsedAge) {
        reason = `Ваш возраст ${parsedAge.min}–${parsedAge.max} лет · ${
          availableSpots === 1 ? 'осталось 1 место' : `свободно ${availableSpots} места`
        }`;
      } else if (ev.budget === 'Бесплатно') {
        reason = `Бесплатное участие · популярная компания (${ev.occupiedSpots}/${ev.totalSpots})`;
      } else {
        reason = `Популярная встреча рядом (${ev.distanceKm} км) · рейтинг ${ev.organizer.reliability.score}`;
      }
    }

    return { event: ev, score, reason };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
