export interface UserReliability {
  score: number; // e.g. 4.9
  eventsAttended: number;
  eventsOrganized: number;
  cancellations: number;
  noShows: number;
  attendanceRate: number; // e.g. 98%
  positiveReviewsCount: number;
}

export type UserOnlineStatus = 'online' | 'recent' | 'offline';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  occupation?: string; // e.g. "Арт-директор", "IT-разработчик", "Архитектор"
  companyOrIndustry?: string; // e.g. "Fintech / Дизайн", "Студент ВШЭ"
  avatarUrl: string;
  photos?: string[]; // Gallery of personal/lifestyle photos
  bio: string;
  interests: string[];
  reliability: UserReliability;
  onlineStatus?: UserOnlineStatus; // 'online' | 'recent' | 'offline'
  lastSeen?: string; // e.g. 'Онлайн сейчас', 'Был(а) 15 мин назад'
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  phoneNumber?: string; // Private
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  blockedUserIds?: string[];
  favoriteCategories?: string[];
  savedEventIds?: string[];
}

export type EventBudgetTier = 
  | 'Бесплатно' 
  | 'до 1 000 ₽' 
  | '1 000–3 000 ₽' 
  | '3 000–5 000 ₽' 
  | '5 000+ ₽' 
  | 'Бюджет обсуждается';

export type EventCategory =
  | 'День рождения'
  | 'Ресторан / Бар'
  | 'Настольные игры'
  | 'Кино / Концерт'
  | 'Спорт'
  | 'Пикник / Шашлыки'
  | 'Прогулка'
  | 'Путешествие'
  | 'Вечеринка'
  | 'Квиз / Интеллект'
  | 'Другое';

export type EventStatus = 'draft' | 'open' | 'full' | 'started' | 'completed' | 'cancelled';

export type EventVibe =
  | 'Спокойная беседа'
  | 'Гастро-вечер'
  | 'Интеллектуальная игра'
  | 'Активный движ'
  | 'Праздничный вайб';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isToday: boolean;
  totalSpots: number;
  occupiedSpots: number;
  budget: EventBudgetTier;
  city: string;
  approximateArea: string; // e.g. "Хамовники, ~2.5 км от вас"
  distanceKm: number;
  imageUrl: string;
  organizerId: string;
  organizer: {
    id: string;
    name: string;
    age: number;
    avatarUrl: string;
    reliability: UserReliability;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
  };
  status: EventStatus;
  vibe?: EventVibe;
  musicOrMood?: string;
  icebreakerQuestion?: string;
  requirements: string;
  rules: string[];
  approvedParticipantIds: string[];
  approvedParticipants?: Array<{
    id: string;
    name: string;
    age: number;
    avatarUrl: string;
    occupation?: string;
    onlineStatus?: UserOnlineStatus;
    lastSeen?: string;
    reliability: UserReliability;
  }>;
  cancelledReason?: string;
  createdAt: string;

  // STRICT PRIVACY FIELDS - only present if requester is organizer or approved participant!
  exactVenue?: string; // e.g. "Ресторан 'Горыныч', 2 этаж"
  exactAddress?: string; // e.g. "Рождественский бульвар, д. 1"
  organizerPhone?: string; // e.g. "+7 (999) 123-45-67"
  privateInstructions?: string; // e.g. "Столик забронирован на имя Анны, домофон 14"
  allowPhoneSharing?: boolean;
}

export interface EventApplication {
  id: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  user: {
    id: string;
    name: string;
    age: number;
    avatarUrl: string;
    city: string;
    bio: string;
    interests: string[];
    reliability: UserReliability;
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
  };
  note: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled_by_user';
  createdAt: string;
  attendanceStatus?: 'attended' | 'no_show' | 'not_marked';
}

export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  isSystemMessage?: boolean;
}

export interface UserReview {
  id: string;
  eventId: string;
  eventTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  targetUserId: string;
  rating: number; // 1-5
  tags: string[]; // e.g. ["Пунктуальный", "Легко общаться", "Душа компании"]
  text: string;
  createdAt: string;
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'event';
  targetId: string;
  targetTitle: string;
  reason: 'scam' | 'harassment' | 'illegal' | 'commercial_spam' | 'discrimination' | 'other';
  details: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 
    | 'application_received' 
    | 'application_accepted' 
    | 'application_rejected' 
    | 'chat_message' 
    | 'event_reminder' 
    | 'event_cancelled' 
    | 'review_received';
  relatedEventId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface EventQuestion {
  id: string;
  eventId: string;
  askerId: string;
  askerName: string;
  askerAvatar: string;
  question: string;
  answer?: string;
  createdAt: string;
  answeredAt?: string;
}

