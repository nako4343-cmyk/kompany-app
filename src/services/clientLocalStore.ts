import { 
  UserProfile, 
  EventItem, 
  EventApplication, 
  ChatMessage, 
  UserReview, 
  SafetyReport, 
  AppNotification,
  EventQuestion,
  EventCategory,
  EventBudgetTier
} from '../types/index.ts';
import { initialData } from './mockData.ts';

const LOCAL_STORAGE_KEY = 'kompany_client_store_v10';

export class ClientLocalStore {
  users: Map<string, UserProfile> = new Map();
  events: Map<string, EventItem> = new Map();
  rawEventsSecret: Map<string, any> = new Map();
  applications: Map<string, EventApplication> = new Map();
  chatMessages: Map<string, ChatMessage[]> = new Map();
  questions: Map<string, EventQuestion[]> = new Map();
  reviews: Map<string, UserReview[]> = new Map();
  reports: Map<string, SafetyReport> = new Map();
  notifications: Map<string, AppNotification[]> = new Map();
  activeUserId: string = 'user-anna';

  constructor() {
    this.init();
  }

  resetToInitial() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem('kompany_client_store_v7');
        localStorage.removeItem('kompany_client_store_v6');
        localStorage.removeItem('kompany_client_store_v5');
        localStorage.removeItem('kompany_user_id');
      }
    } catch {
      // ignore
    }
    this.seedFromInitial();
    this.save();
  }

  private init() {
    if (typeof window === 'undefined') {
      this.seedFromInitial();
      return;
    }

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          this.users = new Map(parsed.users);
        } else {
          this.users = new Map(initialData.users as any);
        }

        if (Array.isArray(parsed.events) && parsed.events.length > 0) {
          this.events = new Map(parsed.events);
        } else {
          this.events = new Map(initialData.events as any);
        }

        this.rawEventsSecret = new Map(Array.isArray(parsed.rawEventsSecret) ? parsed.rawEventsSecret : initialData.rawEventsSecret as any);
        this.applications = new Map(Array.isArray(parsed.applications) ? parsed.applications : initialData.applications as any);
        this.chatMessages = new Map(Array.isArray(parsed.chatMessages) ? parsed.chatMessages : initialData.chatMessages as any);
        this.questions = new Map(Array.isArray(parsed.questions) ? parsed.questions : initialData.questions as any);
        this.reviews = new Map(Array.isArray(parsed.reviews) ? parsed.reviews : initialData.reviews as any);
        this.reports = new Map(Array.isArray(parsed.reports) ? parsed.reports : initialData.reports as any);
        this.notifications = new Map(Array.isArray(parsed.notifications) ? parsed.notifications : initialData.notifications as any);
        this.activeUserId = parsed.activeUserId || 'user-anna';

        this.ensureDemoApplications();

        if (this.users.size === 0 || this.events.size < 20 || !this.users.has(this.activeUserId)) {
          this.seedFromInitial();
          this.save();
        }
      } else {
        this.seedFromInitial();
        this.save();
      }
    } catch (e) {
      console.warn('Failed to parse client store, reseeding:', e);
      this.seedFromInitial();
      this.save();
    }
  }

  private seedFromInitial() {
    try {
      this.users = new Map(initialData.users as any);
      this.events = new Map(initialData.events as any);
      this.rawEventsSecret = new Map(initialData.rawEventsSecret as any);
      this.applications = new Map(initialData.applications as any);
      this.chatMessages = new Map(initialData.chatMessages as any);
      this.questions = new Map(initialData.questions as any);
      this.reviews = new Map(initialData.reviews as any);
      this.reports = new Map(initialData.reports as any);
      this.notifications = new Map(initialData.notifications as any);
      this.activeUserId = (initialData.activeUserId as any) || 'user-anna';
      this.ensureDemoApplications();
    } catch (e) {
      console.error('Seeding error:', e);
    }
  }

  private ensureDemoApplications() {
    const seedApp = (
      id: string,
      eventId: string,
      userId: string,
      status: 'pending' | 'accepted' | 'rejected',
      note: string
    ) => {
      if (this.applications.has(id)) return;
      const ev = this.events.get(eventId);
      const u = this.users.get(userId);
      if (!ev || !u) return;

      this.applications.set(id, {
        id,
        eventId: ev.id,
        eventTitle: ev.title,
        userId: u.id,
        user: {
          id: u.id,
          name: u.name,
          age: u.age,
          avatarUrl: u.avatarUrl,
          city: u.city,
          bio: u.bio,
          interests: u.interests,
          reliability: u.reliability,
          isPhoneVerified: u.isPhoneVerified,
          isEmailVerified: u.isEmailVerified,
        },
        note,
        status,
        createdAt: '2026-11-11T15:30:00.000Z',
        attendanceStatus: 'not_marked',
      });
    };

    // Demo applications for Anna (Pending + Rejected; Accepted already in ev-5, ev-7)
    seedApp(
      'app-demo-anna-pending',
      'ev-3',
      'user-anna',
      'pending',
      'Привет, Елена! Обожаю камерную инди-музыку и живой звук, с радостью составлю компанию на вечер!'
    );
    seedApp(
      'app-demo-anna-rejected',
      'ev-6',
      'user-anna',
      'rejected',
      'Хотела бы попробовать падел-теннис впервые, если еще осталось место на корте!'
    );

    // Demo applications for Mikhail (Rejected; Pending already on ev-1; Accepted on ev-4, ev-6, ev-8)
    seedApp(
      'app-demo-mikhail-rejected',
      'ev-3',
      'user-mikhail',
      'rejected',
      'Привет! Буду рядом после работы, с удовольствием послушаю акустический сет.'
    );

    // Demo applications for Elena (Pending + Rejected; Accepted on ev-1, ev-4, ev-7)
    seedApp(
      'app-demo-elena-pending',
      'ev-2',
      'user-elena',
      'pending',
      'Привет, Михаил! Очень хочу сыграть партию в «Покорение Марса», быстро схватываю правила.'
    );
    seedApp(
      'app-demo-elena-rejected',
      'ev-8',
      'user-elena',
      'rejected',
      'Обожаю музыкальные квизы и саундтреки из кино, возьмете в команду?'
    );

    // 1. Enrich existing users with gender & openToInvites and seed candidate seekers (e.g. women 25-35 into board games)
    const femaleNames = ['анна', 'елена', 'мария', 'дарья', 'алина', 'ксения', 'полина', 'софия', 'ольга', 'виктория', 'екатерина'];
    for (const u of this.users.values()) {
      const firstLower = u.name.split(' ')[0].toLowerCase();
      if (!u.gender) {
        u.gender = femaleNames.some(fn => firstLower.includes(fn)) ? 'female' : 'male';
      }
      if (u.openToInvites === undefined) {
        u.openToInvites = true;
      }
      if (!u.openToInvitesNote) {
        u.openToInvitesNote =
          u.gender === 'female'
            ? 'Открыта к приглашениям на настольные игры, гастро-ужины и камерные вечера в центре.'
            : 'С удовольствием присоединюсь к хорошей компании на вечер или выходные.';
      }
    }

    const extraSeekers: UserProfile[] = [
      {
        id: 'user-seeker-maria',
        name: 'Мария Соколова',
        age: 27,
        gender: 'female',
        city: 'Москва',
        occupation: 'UX/UI Дизайнер',
        companyOrIndustry: 'Яндекс · Продуктовый дизайн',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio: 'Обожаю стратегические настолки («Колонизаторы», «Покорение Марса», «Имаджинариум»), уютные бары и новые знакомства.',
        interests: ['Настольные игры', 'Рестораны / Бары', 'Квиз / Интеллект', 'Искусство'],
        openToInvites: true,
        openToInvitesNote: 'Ищу компанию на настолки сегодня или в выходные! Легко включаюсь в новые игры.',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: 4.96,
          eventsAttended: 19,
          eventsOrganized: 4,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 17,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'maria.s@example.com',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-seeker-daria',
        name: 'Дарья Лебедева',
        age: 29,
        gender: 'female',
        city: 'Москва',
        occupation: 'Маркетинг-директор',
        companyOrIndustry: 'Digital & Lifestyle',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        bio: 'Люблю вечерние партии в настольные игры, мафию, квизы и камерные ужины в районе Патриарших и Хамовников.',
        interests: ['Настольные игры', 'День рождения', 'Рестораны / Бары', 'Кино / Концерт'],
        openToInvites: true,
        openToInvitesNote: 'Жду приглашений на настольные игры, квизы или душевный ужин в компании 4–8 человек.',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: 4.92,
          eventsAttended: 14,
          eventsOrganized: 3,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 98,
          positiveReviewsCount: 12,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'daria.l@example.com',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-seeker-alina',
        name: 'Алина Морозова',
        age: 31,
        gender: 'female',
        city: 'Москва',
        occupation: 'Архитектор',
        companyOrIndustry: 'Бюро современной архитектуры',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
        bio: 'Коллекционирую редкие настолки, люблю камерные вечеринки, джаз и гастрономические открытия.',
        interests: ['Настольные игры', 'Свадьба', 'Рестораны / Бары', 'Прогулка', 'Искусство'],
        openToInvites: true,
        openToInvitesNote: 'С радостью приму приглашение на настольные игры, арт-вечер или камерное торжество.',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: 4.98,
          eventsAttended: 24,
          eventsOrganized: 6,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 21,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'alina.m@example.com',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-seeker-ksenia',
        name: 'Ксения Волкова',
        age: 26,
        gender: 'female',
        city: 'Москва',
        occupation: 'Product Analyst',
        companyOrIndustry: 'FinTech',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        bio: 'Фанат кооперативных настолок, Catan, Ticket to Ride и интеллектуальных квизов по вечерам.',
        interests: ['Настольные игры', 'Квиз / Интеллект', 'Спорт', 'Путешествие'],
        openToInvites: true,
        openToInvitesNote: 'Свободна после 19:00, ищу компанию на настолки или квиз!',
        onlineStatus: 'recent',
        lastSeen: 'Была 10 мин назад',
        reliability: {
          score: 4.89,
          eventsAttended: 11,
          eventsOrganized: 1,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 96,
          positiveReviewsCount: 9,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'ksenia.v@example.com',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-seeker-polina',
        name: 'Полина Романова',
        age: 34,
        gender: 'female',
        city: 'Москва',
        occupation: 'Продюсер спецпроектов',
        companyOrIndustry: 'Медиа & Ивенты',
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
        bio: 'Люблю красивые ужины, живую музыку, настольные игры с друзьями и загородные выезды.',
        interests: ['Настольные игры', 'Рестораны / Бары', 'Свадьба', 'Пикник / Шашлыки', 'Музыка'],
        openToInvites: true,
        openToInvitesNote: 'Открыта к приглашениям на настолки, ужины и праздничные выезды.',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: 4.94,
          eventsAttended: 18,
          eventsOrganized: 5,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 99,
          positiveReviewsCount: 15,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'polina.r@example.com',
        role: 'user',
        status: 'active',
      },
      {
        id: 'user-seeker-artem',
        name: 'Артём Громов',
        age: 30,
        gender: 'male',
        city: 'Москва',
        occupation: 'Tech Lead',
        companyOrIndustry: 'AI & Cloud',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        bio: 'Играю в падел, собираю компании на сложные настолки и гастрономические дегустации.',
        interests: ['Настольные игры', 'Спорт', 'Рестораны / Бары', 'Технологии'],
        openToInvites: true,
        openToInvitesNote: 'Готов ворваться на настолки, падел-теннис или барный тур.',
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        reliability: {
          score: 4.91,
          eventsAttended: 16,
          eventsOrganized: 4,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 97,
          positiveReviewsCount: 13,
        },
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'artem.g@example.com',
        role: 'user',
        status: 'active',
      },
    ];

    for (const seeker of extraSeekers) {
      if (!this.users.has(seeker.id)) {
        this.users.set(seeker.id, seeker);
      }
    }

    // 2. Keep active seed events on today/future dates, and seed dedicated past events that went to Archive
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const addDays = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    let idx = 0;
    for (const [evId, ev] of this.events.entries()) {
      if (evId.startsWith('ev-archive-')) continue;
      // If it's one of the standard seed events, keep its date fresh on today or upcoming days
      if (ev.isToday) {
        ev.date = todayStr;
      } else if (ev.date < todayStr && !ev.isArchived) {
        ev.date = addDays(1 + (idx % 4));
      }
      idx++;
    }

    // Ensure demo Wedding event exists
    if (!this.events.has('ev-wedding-1')) {
      const anna = this.users.get('user-anna');
      if (anna) {
        const weddingEvent: EventItem = {
          id: 'ev-wedding-1',
          title: 'Камерная свадьба-вечеринка на террасе в Серебряном Бору',
          category: 'Свадьба',
          description:
            'Празднуем нашу камерную свадьбу в формате тёплой летней вечеринки у воды без официоза! Приглашаем друзей и открытых творческих ребят разделить с нами этот вечер: живой джаз-бэнд, фуршет, танцы на пирсе и бенгальские огни.',
          date: todayStr,
          time: '18:30',
          isToday: true,
          totalSpots: 24,
          occupiedSpots: 5,
          budget: '3 000–5 000 ₽',
          city: 'Москва',
          approximateArea: 'Серебряный Бор, берег реки, ~4.5 км',
          distanceKm: 4.5,
          imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
          organizerId: anna.id,
          organizer: {
            id: anna.id,
            name: anna.name,
            age: anna.age,
            avatarUrl: anna.avatarUrl,
            reliability: anna.reliability,
            isPhoneVerified: anna.isPhoneVerified,
            isEmailVerified: anna.isEmailVerified,
          },
          status: 'open',
          vibe: 'Праздничный вайб',
          musicOrMood: 'Живой джаз, гирлянды у воды, шампанское и танцы',
          icebreakerQuestion: 'Какой самый необычный или трогательный тост вы слышали в жизни?',
          requirements: '23-38 лет, праздничное настроение, smart casual / коктейльный дресс-код',
          rules: ['Подтвердить участие заранее', 'Позитивный настрой и уважение к гостям'],
          approvedParticipantIds: ['user-elena', 'user-mikhail', 'user-seeker-maria', 'user-seeker-alina'],
          createdAt: new Date().toISOString(),
        };
        this.events.set(weddingEvent.id, weddingEvent);
        this.rawEventsSecret.set(weddingEvent.id, {
          exactVenue: 'Банкетный шатёр и пирс «Серебряный Бор»',
          exactAddress: 'Таманская ул., д. 46, стр. 1',
          yandexMapsUrl: 'https://yandex.ru/maps/?ll=37.4342%2C55.7789&z=16&pt=37.4342%2C55.7789%2Cpm2rdm',
          coordinates: { lat: 55.7789, lon: 37.4342 },
          organizerPhone: anna.phoneNumber || '+7 (916) 555-01-92',
          privateInstructions: 'Вход через центральную аллею к пирсу №2, ориентир — белая арка с ретро-гирляндами.',
          allowPhoneSharing: true,
        });
      }
    }

    // 3. Seed 2 realistic past events whose day has passed -> automatically in Archive
    if (!this.events.has('ev-archive-1')) {
      const anna = this.users.get('user-anna');
      const mikhail = this.users.get('user-mikhail');
      if (anna && mikhail) {
        const pastEvent1: EventItem = {
          id: 'ev-archive-1',
          title: 'Вечер настольных игр: Колонизаторы и Каркассон на Покровке',
          category: 'Настольные игры',
          description: 'Провели отличный вечер за классическими стратегиями, чаем и пиццей. Встреча завершена и перенесена в архив после окончания дня.',
          date: addDays(-1),
          time: '19:30',
          isToday: false,
          isArchived: true,
          totalSpots: 6,
          occupiedSpots: 6,
          budget: 'до 1 000 ₽',
          city: 'Москва',
          approximateArea: 'Чистые пруды, ~1.8 км от вас',
          distanceKm: 1.8,
          imageUrl: './assets/images/event_board_games_1794332913325.jpg',
          organizerId: anna.id,
          organizer: {
            id: anna.id,
            name: anna.name,
            age: anna.age,
            avatarUrl: anna.avatarUrl,
            reliability: anna.reliability,
            isPhoneVerified: anna.isPhoneVerified,
            isEmailVerified: anna.isEmailVerified,
          },
          status: 'completed',
          vibe: 'Интеллектуальная игра',
          musicOrMood: 'Азартная дружеская атмосфера',
          requirements: '25–35 лет, любовь к настолкам',
          rules: ['Без опозданий'],
          approvedParticipantIds: ['user-mikhail', 'user-elena', 'user-seeker-maria', 'user-seeker-daria'],
          createdAt: addDays(-2),
        };
        this.events.set(pastEvent1.id, pastEvent1);

        const pastEvent2: EventItem = {
          id: 'ev-archive-2',
          title: 'Винная дегустация и ужин при свечах на Патриарших',
          category: 'Ресторан / Бар',
          description: 'Камерный гастро-ужин в компании 6 человек. День мероприятия прошёл, встреча находится в архиве.',
          date: addDays(-3),
          time: '20:00',
          isToday: false,
          isArchived: true,
          totalSpots: 6,
          occupiedSpots: 6,
          budget: '3 000–5 000 ₽',
          city: 'Москва',
          approximateArea: 'Патриаршие пруды, ~1.4 км от вас',
          distanceKm: 1.4,
          imageUrl: './assets/images/hero_community_event_1794332913246.jpg',
          organizerId: mikhail.id,
          organizer: {
            id: mikhail.id,
            name: mikhail.name,
            age: mikhail.age,
            avatarUrl: mikhail.avatarUrl,
            reliability: mikhail.reliability,
            isPhoneVerified: mikhail.isPhoneVerified,
            isEmailVerified: mikhail.isEmailVerified,
          },
          status: 'completed',
          vibe: 'Гастро-вечер',
          musicOrMood: 'Лаунж и живое общение',
          requirements: 'Открытость к общению',
          rules: ['Уважение к участникам'],
          approvedParticipantIds: ['user-anna', 'user-elena', 'user-seeker-alina'],
          createdAt: addDays(-4),
        };
        this.events.set(pastEvent2.id, pastEvent2);
      }
    }
  }

  save() {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        users: Array.from(this.users.entries()),
        events: Array.from(this.events.entries()),
        rawEventsSecret: Array.from(this.rawEventsSecret.entries()),
        applications: Array.from(this.applications.entries()),
        chatMessages: Array.from(this.chatMessages.entries()),
        questions: Array.from(this.questions.entries()),
        reviews: Array.from(this.reviews.entries()),
        reports: Array.from(this.reports.entries()),
        notifications: Array.from(this.notifications.entries()),
        activeUserId: this.activeUserId,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save client store to localStorage:', e);
    }
  }

  sanitizeEvent(event: EventItem, viewerUserId?: string): EventItem {
    const uid = viewerUserId || this.activeUserId;
    const isOrganizer = Boolean(uid && event.organizerId === uid);
    const isApprovedParticipant = Boolean(uid && (event.approvedParticipantIds || []).includes(uid));
    const hasFullAccess = isOrganizer || isApprovedParticipant;

    const participants = (event.approvedParticipantIds || [])
      .map(id => this.users.get(id))
      .filter((u): u is UserProfile => Boolean(u))
      .map(u => ({
        id: u.id,
        name: u.name,
        age: u.age,
        avatarUrl: u.avatarUrl,
        occupation: u.occupation || 'Участник',
        onlineStatus: u.onlineStatus || (u.id === this.activeUserId ? 'online' : 'recent'),
        lastSeen: u.lastSeen || (u.id === this.activeUserId ? 'Онлайн сейчас' : 'Был(а) недавно'),
        reliability: u.reliability,
      }));

    const secret = this.rawEventsSecret.get(event.id);

    const existingApp = uid
      ? Array.from(this.applications.values()).find(a => a.eventId === event.id && a.userId === uid)
      : undefined;

    let myApplicationStatus: 'pending' | 'accepted' | 'rejected' | null = null;
    if (existingApp && existingApp.status === 'rejected') {
      myApplicationStatus = 'rejected';
    } else if (isApprovedParticipant) {
      myApplicationStatus = 'accepted';
    } else if (existingApp) {
      if (existingApp.status === 'accepted') myApplicationStatus = 'accepted';
      else if (existingApp.status === 'pending') myApplicationStatus = 'pending';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isArchived = Boolean(
      event.isArchived ||
      event.status === 'completed' ||
      (event.date && /^\d{4}-\d{2}-\d{2}$/.test(event.date) && event.date < todayStr)
    );

    return {
      ...event,
      isArchived,
      isToday: !isArchived && (event.isToday || event.date === todayStr),
      approvedParticipants: participants,
      exactVenue: hasFullAccess ? secret?.exactVenue : undefined,
      exactAddress: hasFullAccess ? secret?.exactAddress : undefined,
      yandexMapsUrl: hasFullAccess ? secret?.yandexMapsUrl : undefined,
      coordinates: hasFullAccess ? secret?.coordinates : undefined,
      organizerPhone: hasFullAccess && secret?.allowPhoneSharing ? secret?.organizerPhone : undefined,
      privateInstructions: hasFullAccess ? secret?.privateInstructions : undefined,
      myApplicationId: existingApp?.id,
      myApplicationStatus,
      myApplicationNote: existingApp?.note,
      myApplicationIsInvitation: existingApp?.isInvitation,
    };
  }

  getMe(): UserProfile {
    let u = this.users.get(this.activeUserId);
    if (!u && this.users.size > 0) {
      u = Array.from(this.users.values())[0];
      if (u) this.activeUserId = u.id;
    }
    if (!u) {
      this.seedFromInitial();
      u = this.users.get(this.activeUserId) || Array.from(this.users.values())[0];
    }
    if (!u) {
      const fallback = initialData.users[0]?.[1] as unknown as UserProfile;
      return fallback;
    }
    return u;
  }

  getAvailableUsers(): UserProfile[] {
    const demoIds = ['user-anna', 'user-mikhail', 'user-elena', 'user-admin'];
    return Array.from(this.users.values()).filter(u => demoIds.includes(u.id));
  }

  getSeekers(): UserProfile[] {
    return Array.from(this.users.values()).filter(
      u => u.id !== this.activeUserId && u.role !== 'admin' && u.status === 'active'
    );
  }

  switchUser(userId: string): { success: boolean; user: UserProfile } {
    if (this.users.has(userId)) {
      this.activeUserId = userId;
      this.save();
      return { success: true, user: this.users.get(userId)! };
    }
    return { success: false, user: this.getMe() };
  }

  updateProfile(data: Partial<UserProfile>): UserProfile {
    const user = this.getMe();
    if (user) {
      Object.assign(user, data);
      this.save();
      return user;
    }
    return user;
  }

  getUserProfile(id: string): { profile: UserProfile; reviews: UserReview[] } {
    const profile = this.users.get(id) || this.getMe();
    const reviews = this.reviews.get(id) || [];
    return { profile, reviews };
  }

  getEvents(filters?: { category?: string; city?: string; onlyToday?: boolean; query?: string }): EventItem[] {
    let list = Array.from(this.events.values());
    if (filters?.category && filters.category !== 'Все') {
      list = list.filter(e => e.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.city) {
      list = list.filter(e => e.city.toLowerCase() === filters.city?.toLowerCase());
    }
    if (filters?.onlyToday) {
      list = list.filter(e => e.isToday);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.approximateArea.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return list.map(ev => this.sanitizeEvent(ev, this.activeUserId));
  }

  getEvent(id: string): { event: EventItem; myApplication: EventApplication | null } {
    const rawEvent = this.events.get(id);
    if (!rawEvent) throw new Error('Мероприятие не найдено');
    const event = this.sanitizeEvent(rawEvent, this.activeUserId);
    const myApp = Array.from(this.applications.values()).find(a => a.eventId === id && a.userId === this.activeUserId) || null;
    return { event, myApplication: myApp };
  }

  toggleSaveEvent(eventId: string): UserProfile {
    const user = this.getMe();
    if (user) {
      const saved = new Set(user.savedEventIds || []);
      if (saved.has(eventId)) {
        saved.delete(eventId);
      } else {
        saved.add(eventId);
      }
      user.savedEventIds = Array.from(saved);
      this.save();
    }
    return user;
  }

  getEventQuestions(eventId: string): EventQuestion[] {
    return this.questions.get(eventId) || [];
  }

  askEventQuestion(eventId: string, question: string): EventQuestion {
    const qList = this.questions.get(eventId) || [];
    const newQ: EventQuestion = {
      id: `q-${Date.now()}`,
      eventId,
      askerId: this.activeUserId,
      askerName: this.getMe().name,
      askerAvatar: this.getMe().avatarUrl,
      question,
      createdAt: new Date().toISOString(),
    };
    qList.unshift(newQ);
    this.questions.set(eventId, qList);
    this.save();
    return newQ;
  }

  answerEventQuestion(eventId: string, questionId: string, answer: string): EventQuestion {
    const qList = this.questions.get(eventId) || [];
    const q = qList.find(x => x.id === questionId);
    if (q) {
      q.answer = answer;
      q.answeredAt = new Date().toISOString();
      this.save();
      return q;
    }
    throw new Error('Вопрос не найден');
  }

  applyToEvent(eventId: string, note: string): EventApplication {
    const ev = this.events.get(eventId);
    if (!ev) throw new Error('Мероприятие не найдено');

    const me = this.getMe();
    const app: EventApplication = {
      id: `app-${Date.now()}`,
      eventId,
      eventTitle: ev.title,
      userId: this.activeUserId,
      status: 'pending',
      note,
      createdAt: new Date().toISOString(),
      user: {
        id: me.id,
        name: me.name,
        age: me.age,
        avatarUrl: me.avatarUrl,
        city: me.city,
        bio: me.bio,
        interests: me.interests,
        reliability: me.reliability,
        isPhoneVerified: me.isPhoneVerified,
        isEmailVerified: me.isEmailVerified,
      },
    };
    this.applications.set(app.id, app);
    this.save();
    return app;
  }

  getEventApplications(eventId: string): EventApplication[] {
    return Array.from(this.applications.values()).filter(a => a.eventId === eventId);
  }

  decideApplication(appId: string, action: 'accept' | 'reject'): EventApplication {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Заявка не найдена');
    app.status = action === 'accept' ? 'accepted' : 'rejected';
    const ev = this.events.get(app.eventId);
    if (action === 'accept' && ev) {
      if (!ev.approvedParticipantIds) ev.approvedParticipantIds = [];
      if (!ev.approvedParticipantIds.includes(app.userId)) {
        ev.approvedParticipantIds.push(app.userId);
        ev.occupiedSpots = Math.min(ev.totalSpots, ev.occupiedSpots + 1);
      }
    } else if (action === 'reject' && ev) {
      if (ev.approvedParticipantIds && ev.approvedParticipantIds.includes(app.userId)) {
        ev.approvedParticipantIds = ev.approvedParticipantIds.filter(id => id !== app.userId);
        ev.occupiedSpots = Math.max(1, ev.occupiedSpots - 1);
      }
    }
    this.save();
    return app;
  }

  inviteUserToEvent(eventId: string, targetUserId: string, note?: string): EventApplication {
    const ev = this.events.get(eventId);
    if (!ev) throw new Error('Мероприятие не найдено');
    const targetUser = this.users.get(targetUserId);
    if (!targetUser) throw new Error('Пользователь не найден');
    const me = this.getMe();

    const existing = Array.from(this.applications.values()).find(
      a => a.eventId === eventId && a.userId === targetUserId
    );
    if (existing) {
      existing.status = 'pending';
      existing.isInvitation = true;
      existing.note = note || `Приглашение от организатора (${me.name}) присоединиться к компании!`;
      this.save();
      return existing;
    }

    const appId = `app-inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const app: EventApplication = {
      id: appId,
      eventId: ev.id,
      eventTitle: ev.title,
      userId: targetUser.id,
      isInvitation: true,
      status: 'pending',
      note: note || `Приглашение от организатора (${me.name}): будем рады видеть вас в нашей компании!`,
      createdAt: new Date().toISOString(),
      user: {
        id: targetUser.id,
        name: targetUser.name,
        age: targetUser.age,
        gender: targetUser.gender,
        avatarUrl: targetUser.avatarUrl,
        city: targetUser.city,
        bio: targetUser.bio,
        interests: targetUser.interests,
        reliability: targetUser.reliability,
        isPhoneVerified: targetUser.isPhoneVerified,
        isEmailVerified: targetUser.isEmailVerified,
      },
    };
    this.applications.set(app.id, app);

    // Notify invited user
    const targetNotifs = this.notifications.get(targetUser.id) || [];
    targetNotifs.unshift({
      id: `notif-${Date.now()}`,
      userId: targetUser.id,
      title: 'Вас пригласили на встречу!',
      message: `${me.name} приглашает вас на мероприятие «${ev.title}» (${ev.date} в ${ev.time}).`,
      type: 'application_received',
      relatedEventId: ev.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    this.notifications.set(targetUser.id, targetNotifs);

    this.save();
    return app;
  }

  rejectMyParticipation(eventId: string): EventItem {
    const ev = this.events.get(eventId);
    if (!ev) throw new Error('Мероприятие не найдено');
    const uid = this.activeUserId;
    const me = this.getMe();

    // Remove from approvedParticipantIds if present
    if (ev.approvedParticipantIds && ev.approvedParticipantIds.includes(uid)) {
      ev.approvedParticipantIds = ev.approvedParticipantIds.filter(id => id !== uid);
      ev.occupiedSpots = Math.max(1, ev.occupiedSpots - 1);
    }

    // Update or create application entry marked as 'rejected'
    const existing = Array.from(this.applications.values()).find(
      a => a.eventId === eventId && a.userId === uid
    );
    if (existing) {
      existing.status = 'rejected';
    } else {
      const appId = `app-rej-${Date.now()}`;
      this.applications.set(appId, {
        id: appId,
        eventId: ev.id,
        eventTitle: ev.title,
        userId: uid,
        status: 'rejected',
        note: 'Заявка отклонена пользователем',
        createdAt: new Date().toISOString(),
        user: {
          id: me.id,
          name: me.name,
          age: me.age,
          gender: me.gender,
          avatarUrl: me.avatarUrl,
          city: me.city,
          bio: me.bio,
          interests: me.interests,
          reliability: me.reliability,
          isPhoneVerified: me.isPhoneVerified,
          isEmailVerified: me.isEmailVerified,
        },
      });
    }

    this.save();
    return this.sanitizeEvent(ev, uid);
  }

  getChatMessages(eventId: string): ChatMessage[] {
    return this.chatMessages.get(eventId) || [];
  }

  sendChatMessage(eventId: string, text: string): ChatMessage {
    const messages = this.chatMessages.get(eventId) || [];
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      eventId,
      senderId: this.activeUserId,
      senderName: this.getMe().name,
      senderAvatar: this.getMe().avatarUrl,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    messages.push(msg);
    this.chatMessages.set(eventId, messages);
    this.save();
    return msg;
  }

  markAttendance(eventId: string, participantId: string, status: 'attended' | 'no_show'): UserProfile {
    const user = this.users.get(participantId);
    if (user && user.reliability) {
      if (status === 'attended') {
        user.reliability.eventsAttended += 1;
      } else {
        user.reliability.noShows += 1;
      }
      this.save();
      return user;
    }
    return this.getMe();
  }

  submitReview(data: { eventId: string; targetUserId: string; rating: number; tags: string[]; text: string }): UserReview {
    const list = this.reviews.get(data.targetUserId) || [];
    const ev = this.events.get(data.eventId);
    const review: UserReview = {
      id: `rev-${Date.now()}`,
      eventId: data.eventId,
      eventTitle: ev?.title || 'Встреча в компании',
      authorId: this.activeUserId,
      authorName: this.getMe().name,
      authorAvatar: this.getMe().avatarUrl,
      targetUserId: data.targetUserId,
      rating: data.rating,
      tags: data.tags,
      text: data.text,
      createdAt: 'Только что',
    };
    list.unshift(review);
    this.reviews.set(data.targetUserId, list);
    this.save();
    return review;
  }

  submitReport(data: { targetType: 'user' | 'event'; targetId: string; reason: string; details: string }): SafetyReport {
    const validReason = (['scam', 'harassment', 'illegal', 'commercial_spam', 'discrimination', 'other'].includes(data.reason) 
      ? data.reason 
      : 'other') as SafetyReport['reason'];

    const report: SafetyReport = {
      id: `rep-${Date.now()}`,
      targetType: data.targetType,
      targetId: data.targetId,
      targetTitle: data.targetType === 'event' ? (this.events.get(data.targetId)?.title || 'Событие') : 'Пользователь',
      reporterId: this.activeUserId,
      reporterName: this.getMe().name,
      reason: validReason,
      details: data.details,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    this.reports.set(report.id, report);
    this.save();
    return report;
  }

  blockUser(targetUserId: string): UserProfile {
    const me = this.getMe();
    if (!me.blockedUserIds) me.blockedUserIds = [];
    if (!me.blockedUserIds.includes(targetUserId)) {
      me.blockedUserIds.push(targetUserId);
    }
    this.save();
    return me;
  }

  getNotifications(): AppNotification[] {
    return this.notifications.get(this.activeUserId) || [];
  }

  markNotificationRead(id: string): { success: boolean } {
    const list = this.notifications.get(this.activeUserId) || [];
    const notif = list.find(n => n.id === id);
    if (notif) notif.isRead = true;
    this.save();
    return { success: true };
  }

  createEvent(data: any): EventItem {
    const me = this.getMe();
    const id = `ev-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = !data.date || data.date === 'Сегодня' || data.date === todayStr;

    let fallbackImg = './assets/images/hero_community_event_1794332913246.jpg';
    if (data.category === 'Свадьба') {
      fallbackImg = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80';
    } else if (data.category === 'Настольные игры') {
      fallbackImg = './assets/images/event_board_games_1794332913325.jpg';
    } else if (data.category === 'Пикник / Шашлыки') {
      fallbackImg = './assets/images/event_outdoor_picnic_1794332913731.jpg';
    } else if (data.category === 'Кино / Концерт') {
      fallbackImg = './assets/images/event_live_concert_1794332915302.jpg';
    }

    const spotsCount = Math.max(2, Number(data.totalSpots) || 6);

    const newEvent: EventItem = {
      id,
      title: data.title || 'Новая встреча',
      category: (data.category || 'Прогулка') as EventCategory,
      description: data.description || '',
      date: data.date || todayStr,
      time: data.time || '19:00',
      approximateArea: data.approximateArea || 'Центр города, ~1.5 км от вас',
      distanceKm: 1.5,
      occupiedSpots: 1,
      totalSpots: spotsCount,
      budget: (data.budget || '1 000–3 000 ₽') as EventBudgetTier,
      city: data.city || 'Москва',
      organizerId: this.activeUserId,
      organizer: {
        id: me.id,
        name: me.name,
        age: me.age,
        avatarUrl: me.avatarUrl,
        reliability: me.reliability,
        isPhoneVerified: me.isPhoneVerified,
        isEmailVerified: me.isEmailVerified,
      },
      imageUrl: data.imageUrl || fallbackImg,
      isToday,
      status: 'open',
      vibe: data.vibe || 'Спокойная беседа',
      musicOrMood: data.musicOrMood || 'Уютная дружелюбная атмосфера',
      icebreakerQuestion: data.icebreakerQuestion || '',
      requirements: data.requirements || 'Пунктуальность и хорошее настроение',
      rules: data.rules || ['Безопасность', 'Взаимное уважение'],
      approvedParticipantIds: [],
      createdAt: new Date().toISOString(),
    };

    this.rawEventsSecret.set(id, {
      exactVenue: data.exactVenue || 'Указано организатором',
      exactAddress: data.exactAddress || data.approximateArea || 'Москва',
      yandexMapsUrl:
        data.yandexMapsUrl ||
        `https://yandex.ru/maps/?text=${encodeURIComponent(
          `${data.city || 'Москва'}, ${data.exactAddress || data.exactVenue || data.approximateArea || ''}`
        )}`,
      coordinates: data.coordinates || { lat: 55.7558, lon: 37.6173 },
      organizerPhone: data.organizerPhone || me.phoneNumber || '',
      privateInstructions: data.privateInstructions || '',
      allowPhoneSharing: data.allowPhoneSharing ?? true,
    });

    this.events.set(newEvent.id, newEvent);
    this.chatMessages.set(id, [
      {
        id: `msg-${Date.now()}`,
        eventId: id,
        senderId: 'system',
        senderName: 'Kompany',
        senderAvatar: '',
        text: 'Мероприятие создано. Закрытый чат и точные контакты доступны только вам и подтвержденным участникам.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystemMessage: true,
      },
    ]);
    this.save();
    return this.sanitizeEvent(newEvent, this.activeUserId);
  }

  cancelEvent(id: string, reason?: string): EventItem {
    const ev = this.events.get(id);
    if (ev) {
      ev.status = 'cancelled';
      ev.cancelledReason = reason;
      this.save();
      return ev;
    }
    throw new Error('Мероприятие не найдено');
  }

  aiDescribeEvent(params: any) {
    return {
      description: `Приглашаю собраться душевной компанией на "${params.title}". Пообщаемся, приятно проведем время и найдем общие темы для беседы!`,
      suggestedAgenda: [
        '19:00 — Сбор и знакомство участников',
        '19:30 — Основная программа и обсуждение',
        '21:00 — Свободное общение и обмен контактами'
      ],
      suggestedIcebreaker: 'Расскажите о своем самом запоминающемся событии за этот год!',
      safetyTip: 'Точный адрес встречи откроется только одобренным участникам за 2 часа до начала.',
    };
  }

  aiGetRecommendations() {
    return [
      { eventId: 'ev-1', matchReason: 'Подходит по вашим интересам к ресторанам и душевным встречам', matchScore: 94 },
      { eventId: 'ev-2', matchReason: 'Любите настолки? В этой компании уже есть участники со схожим профилем', matchScore: 89 },
    ];
  }

  getAdminOverview() {
    return {
      eventsCount: this.events.size,
      usersCount: this.users.size,
      reportsCount: this.reports.size,
    };
  }
}

export const clientLocalStore = new ClientLocalStore();
