import fs from 'fs';
import path from 'path';
import { 
  UserProfile, 
  EventItem, 
  EventApplication, 
  ChatMessage, 
  UserReview, 
  SafetyReport, 
  AppNotification,
  EventQuestion,
  EventVibe
} from '../src/types/index.ts';

const DATA_FILE_PATH = path.resolve(process.cwd(), 'server', 'data.json');

// Persistent database store with automatic JSON file synchronization
export class DataStore {
  users: Map<string, UserProfile> = new Map();
  events: Map<string, EventItem> = new Map();
  rawEventsSecret: Map<string, { exactVenue: string; exactAddress: string; organizerPhone: string; privateInstructions: string; allowPhoneSharing: boolean }> = new Map();
  applications: Map<string, EventApplication> = new Map();
  chatMessages: Map<string, ChatMessage[]> = new Map(); // eventId -> messages
  questions: Map<string, EventQuestion[]> = new Map(); // eventId -> pre-approval Q&A
  reviews: Map<string, UserReview[]> = new Map(); // targetUserId -> reviews
  reports: Map<string, SafetyReport> = new Map();
  notifications: Map<string, AppNotification[]> = new Map(); // userId -> notifications
  activeUserId: string = 'user-anna';

  constructor() {
    if (!this.loadFromFile()) {
      this.seedData();
      this.seedExtendedCatalog();
      this.seedQuestions();
      this.seedReviews();
      this.saveToFile();
    } else {
      this.seedExtendedCatalog();
      this.seedReviews();
      this.saveToFile();
    }
  }

  loadFromFile(): boolean {
    try {
      if (!fs.existsSync(DATA_FILE_PATH)) return false;
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.users || !parsed.events) return false;

      this.users = new Map(parsed.users);
      this.events = new Map(parsed.events);
      this.rawEventsSecret = new Map(parsed.rawEventsSecret || []);
      this.applications = new Map(parsed.applications || []);
      this.chatMessages = new Map(parsed.chatMessages || []);
      this.questions = new Map(parsed.questions || []);
      this.reviews = new Map(parsed.reviews || []);
      this.reports = new Map(parsed.reports || []);
      this.notifications = new Map(parsed.notifications || []);
      this.activeUserId = parsed.activeUserId || 'user-anna';
      return true;
    } catch (e) {
      console.warn('Could not load server/data.json, seeding fresh data:', e);
      return false;
    }
  }

  saveToFile() {
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
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist store to server/data.json:', e);
    }
  }

  seedData() {
    // 1. Seed Users
    const anna: UserProfile = {
      id: 'user-anna',
      name: 'Анна Воронова',
      age: 28,
      city: 'Москва',
      occupation: 'Арт-директор & Бренд-дизайнер',
      companyOrIndustry: 'Креативное агентство',
      avatarUrl: '/src/assets/images/avatar_host_anna_1794332914629.jpg',
      photos: [
        '/src/assets/images/avatar_host_anna_1794332914629.jpg',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      ],
      bio: 'Люблю открывать новые гастрономические места, слушать джаз и собирать уютные душевные компании. Работаю в креативе.',
      interests: ['Рестораны / Бары', 'День рождения', 'Кино / Концерт', 'Искусство', 'Прогулка'],
      reliability: {
        score: 4.95,
        eventsAttended: 14,
        eventsOrganized: 6,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 18,
      },
      onlineStatus: 'online',
      lastSeen: 'Онлайн сейчас',
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: '+7 (916) 555-01-92',
      email: 'anna.voronova@example.com',
      role: 'user',
      status: 'active',
      blockedUserIds: [],
      favoriteCategories: ['День рождения', 'Ресторан / Бар', 'Пикник / Шашлыки'],
      savedEventIds: ['ev-2'],
    };

    const mikhail: UserProfile = {
      id: 'user-mikhail',
      name: 'Михаил Соколов',
      age: 29,
      city: 'Москва',
      occupation: 'Senior Backend Engineer',
      companyOrIndustry: 'FinTech / E-commerce',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      photos: [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      ],
      bio: 'Недавно переехал в Москву из Новосибирска. Увлекаюсь сложными настолками, хайкингом и хорошим кофе.',
      interests: ['Настольные игры', 'Квиз / Интеллект', 'Спорт', 'Путешествие', 'Кино / Концерт'],
      reliability: {
        score: 4.88,
        eventsAttended: 9,
        eventsOrganized: 2,
        cancellations: 1,
        noShows: 0,
        attendanceRate: 95,
        positiveReviewsCount: 10,
      },
      onlineStatus: 'recent',
      lastSeen: 'Был(а) 15 мин назад',
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: false,
      phoneNumber: '+7 (925) 444-12-88',
      email: 'mikhail.dev@example.com',
      role: 'user',
      status: 'active',
      blockedUserIds: [],
      favoriteCategories: ['Настольные игры', 'Спорт'],
      savedEventIds: ['ev-1'],
    };

    const elena: UserProfile = {
      id: 'user-elena',
      name: 'Елена Кузнецова',
      age: 26,
      city: 'Москва',
      occupation: 'Архитектор общественных пространств',
      companyOrIndustry: 'Архитектурное бюро',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      ],
      bio: 'Архитектор, обожаю выставки, виниловые пластинки и пикники в парках. Всегда за активные приключения!',
      interests: ['Пикник / Шашлыки', 'Кино / Концерт', 'Прогулка', 'Ресторан / Бар'],
      reliability: {
        score: 5.0,
        eventsAttended: 8,
        eventsOrganized: 1,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 9,
      },
      onlineStatus: 'online',
      lastSeen: 'Онлайн сейчас',
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: '+7 (903) 777-34-21',
      email: 'elena.arch@example.com',
      role: 'user',
      status: 'active',
      blockedUserIds: [],
      favoriteCategories: ['Пикник / Шашлыки', 'Кино / Концерт'],
      savedEventIds: [],
    };

    const admin: UserProfile = {
      id: 'user-admin',
      name: 'Служба доверия и безопасности',
      age: 35,
      city: 'Москва',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
      bio: 'Модератор платформы Kompany. Проверка объявлений и разрешение спорных ситуаций.',
      interests: [],
      reliability: {
        score: 5.0,
        eventsAttended: 50,
        eventsOrganized: 20,
        cancellations: 0,
        noShows: 0,
        attendanceRate: 100,
        positiveReviewsCount: 45,
      },
      isPhoneVerified: true,
      isEmailVerified: true,
      isIdentityVerified: true,
      phoneNumber: '+7 (800) 555-35-35',
      email: 'security@kompany.app',
      role: 'admin',
      status: 'active',
      blockedUserIds: [],
      favoriteCategories: [],
      savedEventIds: [],
    };

    this.users.set(anna.id, anna);
    this.users.set(mikhail.id, mikhail);
    this.users.set(elena.id, elena);
    this.users.set(admin.id, admin);

    // 2. Seed Events with Private Secrets stored safely
    const event1: EventItem = {
      id: 'ev-1',
      title: 'День рождения в ресторане: уютная компания и знакомства',
      category: 'День рождения',
      description: 'Мне исполняется 28 лет! Хочу собрать небольшую душевную компанию (5-6 человек), посидеть в приятном ресторане, вкусно поужинать, пообщаться и познакомиться с интересными людьми. Никаких формальностей — просто теплое общение.',
      date: new Date().toISOString().split('T')[0], // TODAY!
      time: '19:30',
      isToday: true,
      totalSpots: 6,
      occupiedSpots: 4,
      budget: '1 000–3 000 ₽',
      city: 'Москва',
      approximateArea: 'Хамовники, ~2.5 км от центра',
      distanceKm: 2.5,
      imageUrl: '/src/assets/images/hero_community_event_1794332913246.jpg',
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
      requirements: '23-35 лет, позитивный настрой, взаимное уважение, без алкогольных крайностей',
      rules: [
        'Счет делим поровну по чеку или каждый платит за свои блюда',
        'Уведомить минимум за 3 часа, если планы изменятся',
        'Быть готовым к легкому и дружелюбному диалогу'
      ],
      approvedParticipantIds: [elena.id, 'user-external-1', 'user-external-2'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      vibe: 'Праздничный вайб',
      musicOrMood: 'Теплый свет свечей, негромкий лаунж и авторская кухня',
      icebreakerQuestion: 'Какое событие за последний год запомнилось вам больше всего?',
    };

    this.rawEventsSecret.set(event1.id, {
      exactVenue: 'Ресторан "Горыныч", 2 этаж, веранда с панорамным видом',
      exactAddress: 'Рождественский бульвар, д. 1 (м. Трубная)',
      organizerPhone: '+7 (916) 555-01-92',
      privateInstructions: 'Стол забронирован на имя Анны. При входе администратору сказать пароль "Гости Анны". Вход через главный холл.',
      allowPhoneSharing: true,
    });

    const event2: EventItem = {
      id: 'ev-2',
      title: 'Настольные игры: Покорение Марса и Кодовые Имена',
      category: 'Настольные игры',
      description: 'Ищем 2-3 человек сыграть в атмосферные настолки! Правила объясним за 10 минут, опыт не важен — главное желание подумать и посмеяться. Заказали чайник чая и десерты.',
      date: new Date().toISOString().split('T')[0], // TODAY!
      time: '18:00',
      isToday: true,
      totalSpots: 5,
      occupiedSpots: 3,
      budget: 'до 1 000 ₽',
      city: 'Москва',
      approximateArea: 'Басманный район, ~1.8 км',
      distanceKm: 1.8,
      imageUrl: '/src/assets/images/event_board_games_1794332913325.jpg',
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
      status: 'open',
      requirements: 'Любой уровень подготовки, пунктуальность',
      rules: ['Оплата времени в антикафе (~300 руб/час)', 'Бережное отношение к компонентам игр'],
      approvedParticipantIds: ['user-external-3'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      vibe: 'Интеллектуальная игра',
      musicOrMood: 'Азартная стратегия, дружеские шутки и ароматный улун',
      icebreakerQuestion: 'В какую настолку или игру вы готовы играть всю ночь напролет?',
    };

    this.rawEventsSecret.set(event2.id, {
      exactVenue: 'Антикафе "CheckPoint", зал "Библиотека", стол №4',
      exactAddress: 'Лубянский проезд, 19, стр. 1 (м. Китай-город)',
      organizerPhone: '+7 (925) 444-12-88',
      privateInstructions: 'На ресепшене сказать "Игровой стол Михаила". У нас большой стол у окна с гирляндами.',
      allowPhoneSharing: true,
    });

    const event3: EventItem = {
      id: 'ev-3',
      title: 'Акустический вечер инди-музыки в уютном баре',
      category: 'Кино / Концерт',
      description: 'Выступает классный инди-дуэт с виолончелью и гитарой. Мои друзья не смогли пойти, а билет пропадает, да и одному скучно. Будем слушать живую музыку и пробовать авторские лимонады/напитки.',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      time: '20:00',
      isToday: false,
      totalSpots: 4,
      occupiedSpots: 2,
      budget: '1 000–3 000 ₽',
      city: 'Москва',
      approximateArea: 'Арбат, ~3.2 км',
      distanceKm: 3.2,
      imageUrl: '/src/assets/images/event_live_concert_1794332915302.jpg',
      organizerId: elena.id,
      organizer: {
        id: elena.id,
        name: elena.name,
        age: elena.age,
        avatarUrl: elena.avatarUrl,
        reliability: elena.reliability,
        isPhoneVerified: elena.isPhoneVerified,
        isEmailVerified: elena.isEmailVerified,
      },
      status: 'open',
      requirements: 'Любовь к хорошей живой музыке',
      rules: ['Входной билет 800 руб оплачивается на месте', 'Приходить без опозданий'],
      approvedParticipantIds: ['user-external-4'],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      vibe: 'Спокойная беседа',
      musicOrMood: 'Живая виолончель, инди-фолк и камерная акустика',
      icebreakerQuestion: 'Какой концерт в вашей жизни оставил самое сильное впечатление?',
    };

    this.rawEventsSecret.set(event3.id, {
      exactVenue: 'Клуб-бар "Powerhouse", малый зал',
      exactAddress: 'Гончарная ул., 7/4 (м. Таганская)',
      organizerPhone: '+7 (903) 777-34-21',
      privateInstructions: 'Встречаемся за 15 минут до начала у входа возле неоновой вывески.',
      allowPhoneSharing: false,
    });

    const event4: EventItem = {
      id: 'ev-4',
      title: 'Весенний пикник с грилем и фрисби в парке',
      category: 'Пикник / Шашлыки',
      description: 'Прогноз обещает солнце и +18! Берем пледы, портативный гриль, маршмеллоу, бургеры и тарелку фрисби. С нас организация и костер, продукты скидываемся вместе.',
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // In 2 days
      time: '14:00',
      isToday: false,
      totalSpots: 8,
      occupiedSpots: 5,
      budget: '1 000–3 000 ₽',
      city: 'Москва',
      approximateArea: 'Парк Горького / Нескучный сад, ~4.1 км',
      distanceKm: 4.1,
      imageUrl: '/src/assets/images/event_outdoor_picnic_1794332913731.jpg',
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
      requirements: 'Удобная обувь, теплая кофта на вечер, готовность активно двигаться',
      rules: ['Убираем за собой весь мусор', 'Сумму за продукты (~1 200 ₽) делим поровну в чате'],
      approvedParticipantIds: [elena.id, mikhail.id, 'user-external-5'],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      vibe: 'Активный движ',
      musicOrMood: 'Солнечная поляна, фрисби, гриль и инди-плейлист на колонке',
      icebreakerQuestion: 'Какое ваше идеальное место для короткого путешествия на выходные?',
    };

    this.rawEventsSecret.set(event4.id, {
      exactVenue: 'Нескучный сад, поляна возле Андреевских прудов',
      exactAddress: 'Ленинский проспект, 18 (вход через парковую аллею)',
      organizerPhone: '+7 (916) 555-01-92',
      privateInstructions: 'Геометка будет отправлена в групповой чат за 30 минут. Ищите большой бирюзовый плед и серый мангал.',
      allowPhoneSharing: true,
    });

    this.events.set(event1.id, event1);
    this.events.set(event2.id, event2);
    this.events.set(event3.id, event3);
    this.events.set(event4.id, event4);

    // 3. Seed Applications (Mikhail applied to Anna's Birthday, Elena already accepted)
    const app1: EventApplication = {
      id: 'app-1',
      eventId: event1.id,
      eventTitle: event1.title,
      userId: mikhail.id,
      user: {
        id: mikhail.id,
        name: mikhail.name,
        age: mikhail.age,
        avatarUrl: mikhail.avatarUrl,
        city: mikhail.city,
        bio: mikhail.bio,
        interests: mikhail.interests,
        reliability: mikhail.reliability,
        isPhoneVerified: mikhail.isPhoneVerified,
        isEmailVerified: mikhail.isEmailVerified,
      },
      note: 'Привет, Анна! Недавно переехал в Москву, пока круг общения небольшой. Обожаю вкусные рестораны и душевные разговоры. С удовольствием поздравлю и составлю компанию!',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      attendanceStatus: 'not_marked',
    };

    this.applications.set(app1.id, app1);

    // 4. Seed Chat Messages for Event 1 (Closed space)
    this.chatMessages.set(event1.id, [
      {
        id: 'msg-1',
        eventId: event1.id,
        senderId: anna.id,
        senderName: anna.name,
        senderAvatar: anna.avatarUrl,
        text: 'Всем привет! Спасибо, что присоединились. Стол подтвержден на 19:30, я буду чуть раньше встречать всех у гардероба на 2 этаже.',
        timestamp: '15:20',
        isSystemMessage: false,
      },
      {
        id: 'msg-2',
        eventId: event1.id,
        senderId: elena.id,
        senderName: elena.name,
        senderAvatar: elena.avatarUrl,
        text: 'Супер! С днем рождения заранее 🎂 Буду ровно вовремя!',
        timestamp: '15:25',
        isSystemMessage: false,
      },
      {
        id: 'msg-3',
        eventId: event1.id,
        senderId: 'system',
        senderName: 'Kompany Safety',
        senderAvatar: '',
        text: 'Напоминание о безопасности: точный адрес открыт только вам. Пожалуйста, не передавайте контакты третьим лицам.',
        timestamp: '15:26',
        isSystemMessage: true,
      }
    ]);

    // 5. Seed Reviews
    this.seedReviews();

    // 6. Seed Notifications
    this.notifications.set(anna.id, [
      {
        id: 'notif-1',
        userId: anna.id,
        title: 'Новая заявка на участие',
        message: 'Михаил Соколов (рейтинг 4.9, 95% посещений) хочет присоединиться к вашему мероприятию "День рождения".',
        type: 'application_received',
        relatedEventId: event1.id,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]);

    this.notifications.set(mikhail.id, [
      {
        id: 'notif-2',
        userId: mikhail.id,
        title: 'Заявка отправлена',
        message: 'Ваша заявка на "День рождения" отправлена организатору. Ожидайте ответа.',
        type: 'application_received',
        relatedEventId: event1.id,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]);
  }

  seedExtendedCatalog() {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const inTwoDaysStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    const inThreeDaysStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    const inFourDaysStr = new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0];

    // Seed additional realistic participant profiles so event participant lists look rich
    const extraUsers: UserProfile[] = [
      {
        id: 'user-external-1',
        name: 'Дмитрий Морозов',
        age: 30,
        city: 'Москва',
        occupation: 'Продуктовый менеджер',
        companyOrIndustry: 'IT / Маркетплейс',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        photos: [
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        ],
        bio: 'Люблю гастрономические открытия, сквош, падел и квизы по пятницам.',
        interests: ['Ресторан / Бар', 'Спорт', 'Квиз / Интеллект', 'Путешествие'],
        reliability: {
          score: 4.94,
          eventsAttended: 16,
          eventsOrganized: 4,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 15,
        },
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'dmitry.pm@example.com',
        role: 'user',
        status: 'active',
        blockedUserIds: [],
      },
      {
        id: 'user-external-2',
        name: 'София Лебедева',
        age: 25,
        city: 'Москва',
        occupation: 'Кинопродюсер & Фотограф',
        companyOrIndustry: 'Независимая студия',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        ],
        bio: 'Снимаю на пленку 35мм, коллекционирую винил и обожаю авторское кино и камерные концерты.',
        interests: ['Кино / Концерт', 'Прогулка', 'Искусство', 'Ресторан / Бар'],
        reliability: {
          score: 4.98,
          eventsAttended: 12,
          eventsOrganized: 5,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 14,
        },
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'sofia.film@example.com',
        role: 'user',
        status: 'active',
        blockedUserIds: [],
      },
      {
        id: 'user-external-3',
        name: 'Артём Громов',
        age: 27,
        city: 'Москва',
        occupation: 'Геймдизайнер',
        companyOrIndustry: 'Indie Game Studio',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
        ],
        bio: 'Мастер подземелий в D&D, фанат кооперативных настолок, велопрогулок и хорошего крафта.',
        interests: ['Настольные игры', 'Квиз / Интеллект', 'Прогулка', 'Пикник / Шашлыки'],
        reliability: {
          score: 4.91,
          eventsAttended: 19,
          eventsOrganized: 7,
          cancellations: 1,
          noShows: 0,
          attendanceRate: 97,
          positiveReviewsCount: 18,
        },
        onlineStatus: 'recent',
        lastSeen: 'Был(а) 10 мин назад',
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'artem.gamedev@example.com',
        role: 'user',
        status: 'active',
        blockedUserIds: [],
      },
      {
        id: 'user-external-4',
        name: 'Полина Романова',
        age: 26,
        city: 'Москва',
        occupation: 'Шеф-кондитер & Фуд-стилист',
        companyOrIndustry: 'Гастро-ателье',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        photos: [
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        ],
        bio: 'Знаю все секретные пекарни и винные бары города. Люблю бег по утрам и выезды на природу.',
        interests: ['Ресторан / Бар', 'Пикник / Шашлыки', 'Спорт', 'День рождения'],
        reliability: {
          score: 5.0,
          eventsAttended: 11,
          eventsOrganized: 3,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 12,
        },
        onlineStatus: 'online',
        lastSeen: 'Онлайн сейчас',
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'polina.pastry@example.com',
        role: 'user',
        status: 'active',
        blockedUserIds: [],
      },
      {
        id: 'user-external-5',
        name: 'Максим Волков',
        age: 31,
        city: 'Москва',
        occupation: 'Тревел-фотограф & Гид',
        companyOrIndustry: 'Авторские экспедиции',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
        photos: [
          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
        ],
        bio: 'Объехал 40 регионов России. Собираю компании на хайкинг, сап-борды и уикенды в малых исторических городах.',
        interests: ['Путешествие', 'Спорт', 'Пикник / Шашлыки', 'Прогулка'],
        reliability: {
          score: 4.97,
          eventsAttended: 22,
          eventsOrganized: 11,
          cancellations: 0,
          noShows: 0,
          attendanceRate: 100,
          positiveReviewsCount: 25,
        },
        onlineStatus: 'recent',
        lastSeen: 'Был(а) 25 мин назад',
        isPhoneVerified: true,
        isEmailVerified: true,
        isIdentityVerified: true,
        email: 'maxim.travel@example.com',
        role: 'user',
        status: 'active',
        blockedUserIds: [],
      },
    ];

    for (const u of extraUsers) {
      if (!this.users.has(u.id)) {
        this.users.set(u.id, u);
      }
    }

    const anna = this.users.get('user-anna')!;
    const mikhail = this.users.get('user-mikhail')!;
    const elena = this.users.get('user-elena')!;
    const dmitry = this.users.get('user-external-1')!;
    const sofia = this.users.get('user-external-2')!;
    const artem = this.users.get('user-external-3')!;
    const polina = this.users.get('user-external-4')!;
    const maxim = this.users.get('user-external-5')!;

    const toOrg = (u: UserProfile) => ({
      id: u.id,
      name: u.name,
      age: u.age,
      avatarUrl: u.avatarUrl,
      reliability: u.reliability,
      isPhoneVerified: u.isPhoneVerified,
      isEmailVerified: u.isEmailVerified,
    });

    // 20 Diverse Events across all categories and themes
    const extraEvents: Array<{
      event: EventItem;
      secret: { exactVenue: string; exactAddress: string; organizerPhone: string; privateInstructions: string; allowPhoneSharing: boolean };
    }> = [
      {
        event: {
          id: 'ev-5',
          title: 'Дегустация грузинских вин и хачапури из дровяной печи',
          category: 'Ресторан / Бар',
          description: 'Собираемся небольшой компанией любителей грузинской кухни! В программе лодочки по-аджарски, пхали, хинкали и сет из 4 автохтонных вин из квеври с рассказом сомелье.',
          date: todayStr,
          time: '20:00',
          isToday: true,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Чистые пруды, ~1.4 км',
          distanceKm: 1.4,
          imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: 'open',
          vibe: 'Гастро-вечер',
          musicOrMood: 'Грузинское многоголосие в современной обработке, аромат свежей выпечки',
          icebreakerQuestion: 'Какое блюдо вы готовы заказывать в каждом новом ресторане?',
          requirements: 'Любовь к грузинской кухне и душевным тостам',
          rules: ['Блюда в стол делим поровну', 'Подтверждение участия за 2 часа'],
          approvedParticipantIds: [anna.id, dmitry.id, sofia.id],
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        },
        secret: {
          exactVenue: 'Винный погребок "Мегобари", зал с камином',
          exactAddress: 'ул. Маросейка, 15 (м. Китай-город / Чистые пруды)',
          organizerPhone: '+7 (916) 210-45-11',
          privateInstructions: 'Стол №7 в дальнем зале у кирпичной арки, бронь на имя Полины.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-6',
          title: 'Вечерний падел-теннис для начинающих (корт забронирован)',
          category: 'Спорт',
          description: 'Забронировали крытый панорамный корт на 1.5 часа! Ищем еще одного-двух игроков для парной игры 2 на 2. Ракетки и мячи есть на месте, правила супер простые — втягиваешься за 5 минут.',
          date: todayStr,
          time: '21:00',
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Лужники, ~2.9 км',
          distanceKm: 2.9,
          imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80',
          organizerId: dmitry.id,
          organizer: toOrg(dmitry),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Динамичный спорт, смех и смузи после матча',
          icebreakerQuestion: 'Какой вид спорта вы давно хотели попробовать?',
          requirements: 'Кроссовки со светлой подошвой, спортивная форма',
          rules: ['Аренда корта делится на 4 игроков (~1 100 ₽ с человека)', 'Приходим за 15 минут на разминку'],
          approvedParticipantIds: [mikhail.id, maxim.id],
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        },
        secret: {
          exactVenue: 'Падел-клуб "Лужники", корт №3',
          exactAddress: 'Лужнецкая набережная, 24, стр. 4',
          organizerPhone: '+7 (926) 881-34-90',
          privateInstructions: 'Встречаемся у стойки ресепшена в 20:45. Раздевалки на 1 этаже.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-7',
          title: 'Вечерняя фотопрогулка по переулкам Китай-города (пленка и смартфон)',
          category: 'Прогулка',
          description: 'Гуляем по старым московским дворикам, палатам XVII века и атмосферным лестницам. Фотографируем друг друга на пленку и телефон, ловим золотой час и завершаем маршрут чаем в секретной чайной.',
          date: todayStr,
          time: '18:30',
          isToday: true,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: 'Бесплатно',
          city: 'Москва',
          approximateArea: 'Китай-город, ~1.1 км',
          distanceKm: 1.1,
          imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
          organizerId: sofia.id,
          organizer: toOrg(sofia),
          status: 'open',
          vibe: 'Спокойная беседа',
          musicOrMood: 'Щелчки затвора камеры, тихие дворики и эстетика старого города',
          icebreakerQuestion: 'Какой ваш самый любимый уголок или переулок в городе?',
          requirements: 'Любая камера или просто телефон, удобная обувь',
          rules: ['Прогулка бесплатная, чай в конце — по желанию'],
          approvedParticipantIds: [elena.id, anna.id, artem.id],
          createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        },
        secret: {
          exactVenue: 'Сквер у памятника Кириллу и Мефодию (выход №10)',
          exactAddress: 'Славянская площадь, д. 2 (м. Китай-город)',
          organizerPhone: '+7 (905) 334-12-77',
          privateInstructions: 'Я буду в бежевом тренче с пленочным фотоаппаратом Olympus на ремне.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-8',
          title: 'Кино-музыкальный квиз «Угадай саундтрек и кадр за 10 секунд»',
          category: 'Квиз / Интеллект',
          description: 'В нашей команде "Ночные совы" освободилось 2 места на сегодняшний кино-музыкальный квиз! 7 раундов про культовые фильмы, сериалы и хиты 90-х–2020-х. Без душной энциклопедичности — чистый кайф.',
          date: todayStr,
          time: '19:30',
          isToday: true,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: 'до 1 000 ₽',
          city: 'Москва',
          approximateArea: 'Тверская / Пушкинская, ~1.6 км',
          distanceKm: 1.6,
          imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: 'open',
          vibe: 'Интеллектуальная игра',
          musicOrMood: 'Азарт угадывания с первых нот, командный драйв и закуски',
          icebreakerQuestion: 'Какой фильм или сериал вы пересматривали больше трех раз?',
          requirements: 'Хорошее настроение и любовь к кино или музыке',
          rules: ['Взнос организаторам квиза — 700 ₽ с человека', 'Сбор за 15 минут до старта первого раунда'],
          approvedParticipantIds: [mikhail.id, dmitry.id, sofia.id, polina.id],
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        },
        secret: {
          exactVenue: 'Гастропаб "Крафт и Квиз", стол команды №12 "Ночные совы"',
          exactAddress: 'Страстной бульвар, 8А (м. Чеховская)',
          organizerPhone: '+7 (999) 114-56-23',
          privateInstructions: 'На входе хостес покажет стол №12 в центре зала возле экрана.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-9',
          title: 'Именинный бранч с панкейками и спешелти-кофе на веранде',
          category: 'День рождения',
          description: 'Праздную свой день рождения в формате утреннего солнечного бранча! Будем пить фильтр-кофе, есть бенедикты и воздушные панкейки с ягодами, болтать об искусстве, путешествиях и планах на лето.',
          date: tomorrowStr,
          time: '12:00',
          isToday: false,
          totalSpots: 5,
          occupiedSpots: 3,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Патриаршие пруды, ~2.1 км',
          distanceKm: 2.1,
          imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=900&q=80',
          organizerId: sofia.id,
          organizer: toOrg(sofia),
          status: 'open',
          vibe: 'Праздничный вайб',
          musicOrMood: 'Аромат свежеобжаренной арабики, цветы на столе и утреннее солнце',
          icebreakerQuestion: 'Из чего состоит ваш идеальный неспешный завтрак?',
          requirements: 'Легкость на подъем и любовь к долгим завтракам',
          rules: ['С меня праздничный торт для всех гостей, кофе и основные блюда — каждый за себя'],
          approvedParticipantIds: [anna.id, elena.id],
          createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
        },
        secret: {
          exactVenue: 'Кафе "Утро на Патриарших", светлый зал у панорамных окон',
          exactAddress: 'Малый Козихинский пер., 10',
          organizerPhone: '+7 (905) 334-12-77',
          privateInstructions: 'Круглый стол на 5 персон у окна с букетом пионов.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-10',
          title: 'Вечер психологических игр «Бункер» и «Нечто» в лофте',
          category: 'Настольные игры',
          description: 'Собираем большую компанию на дискуссионные настолки! В «Бункере» прокачиваем красноречие и убеждаем остальных, почему именно ваш персонаж спасет человечество. Будет пицца и лимонады!',
          date: todayStr,
          time: '20:30',
          isToday: true,
          totalSpots: 10,
          occupiedSpots: 8,
          budget: 'до 1 000 ₽',
          city: 'Москва',
          approximateArea: 'Красный Октябрь, ~2.3 км',
          distanceKm: 2.3,
          imageUrl: './assets/images/event_board_games_1794332913325.jpg',
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: 'open',
          vibe: 'Интеллектуальная игра',
          musicOrMood: 'Горячие дебаты, неожиданные сюжетные повороты и смех до слез',
          icebreakerQuestion: 'Какой самый необычный навык помог бы вам выжить на необитаемом острове?',
          requirements: 'Желание общаться и шутить',
          rules: ['Скидываемся по 800 ₽ на аренду лофта и горячую пиццу'],
          approvedParticipantIds: [mikhail.id, dmitry.id, elena.id, polina.id, maxim.id],
          createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
        },
        secret: {
          exactVenue: 'Игровой лофт "Мансарда", 3 этаж',
          exactAddress: 'Берсеневская наб., 6, стр. 3',
          organizerPhone: '+7 (999) 114-56-23',
          privateInstructions: 'Вход через арку со стороны набережной, код домофона 42#. Поднимайтесь на мансарду.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-11',
          title: 'Ретроспектива Хаяо Миядзаки на большом экране + обсуждение за раменом',
          category: 'Кино / Концерт',
          description: 'Идем смотреть «Унесенные призраками» в камерном кинозале на японском языке с русскими субтитрами, а сразу после сеанса заглянем в соседнюю раменную обсудить символизм фильма.',
          date: tomorrowStr,
          time: '19:45',
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Бауманская / Сад Баумана, ~2.7 км',
          distanceKm: 2.7,
          imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
          organizerId: elena.id,
          organizer: toOrg(elena),
          status: 'open',
          vibe: 'Спокойная беседа',
          musicOrMood: 'Волшебная музыка Дзё Хисаиси и уютная атмосфера старого кинотеатра',
          icebreakerQuestion: 'Какой мультфильм или фильм из детства до сих пор вдохновляет вас?',
          requirements: 'Не опаздывать к началу сеанса',
          rules: ['Билеты берем в одном ряду (600 ₽), рамен после кино — по желанию'],
          approvedParticipantIds: [mikhail.id, sofia.id, artem.id],
          createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
        },
        secret: {
          exactVenue: 'Кинотеатр в Саду им. Баумана, малый зал, ряд 5',
          exactAddress: 'ул. Старая Басманная, 15А',
          organizerPhone: '+7 (903) 777-34-21',
          privateInstructions: 'Встречаемся в фойе у кофейной стойки за 15 минут до показа.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-12',
          title: 'Выезд в Суздаль на выходные: сыроварня, сапы по Каменке и закаты',
          category: 'Путешествие',
          description: 'Едем на двух машинах в Суздаль на субботу и воскресенье! Забронировали большой деревянный гостевой дом с верандой. В планах: прогулка на сапах по реке с видом на монастыри, дегустация фермерских сыров и вечер у камина.',
          date: inTwoDaysStr,
          time: '08:30',
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: '5 000+ ₽',
          city: 'Москва',
          approximateArea: 'Сбор у м. Курская, ~2.6 км',
          distanceKm: 2.6,
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Роуд-трип плейлист в машине, туман над рекой и деревянное зодчество',
          icebreakerQuestion: 'Какая поездка на машине запомнилась вам больше всего?',
          requirements: 'Готовность к раннему выезду в субботу утром',
          rules: ['Бензин и аренду гостевого дома делим поровну (~5 500 ₽ с человека за всё)'],
          approvedParticipantIds: [anna.id, mikhail.id, polina.id],
          createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        },
        secret: {
          exactVenue: 'Парковка у ТЦ "Атриум" со стороны Земляного Вала',
          exactAddress: 'ул. Земляной Вал, 33 (м. Курская)',
          organizerPhone: '+7 (915) 602-88-19',
          privateInstructions: 'Синий кроссовер Subaru Outback, встречаемся у кофейни на 1 этаже перед выездом.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-13',
          title: 'Корейское барбекю и рамен-тур в аутентичном бистро',
          category: 'Ресторан / Бар',
          description: 'Ищем компанию из 4 человек, чтобы занять стол со встроенным корейским грилем! Будем сами жарить мраморные слайсы, заворачивать в листья салата с кимчи и пробовать домашний рамен.',
          date: todayStr,
          time: '19:00',
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Цветной бульвар, ~1.5 км',
          distanceKm: 1.5,
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
          organizerId: mikhail.id,
          organizer: toOrg(mikhail),
          status: 'open',
          vibe: 'Гастро-вечер',
          musicOrMood: 'Шипение гриля, неоновые вывески Сеула и пряные соусы',
          icebreakerQuestion: 'Любите ли вы острую азиатскую кухню от 1 до 10?',
          requirements: 'Аппетит и интерес к азиатской гастрономии',
          rules: ['Сет для гриля делим на всех участников стола'],
          approvedParticipantIds: [dmitry.id, artem.id],
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        secret: {
          exactVenue: 'Корейское бистро "Seoul Grill", гриль-стол №4',
          exactAddress: 'Цветной бульвар, 21, стр. 2',
          organizerPhone: '+7 (925) 444-12-88',
          privateInstructions: 'Бронь на имя Михаила. Заходите внутрь мимо неоновой вывески.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-14',
          title: 'Утренняя пробежка 5 км в разговорном темпе + фильтр-кофе и круассаны',
          category: 'Спорт',
          description: 'Бежим легкие 5 км по набережной в комфортном разговорном темпе (6:15–6:30 мин/км), делаем суставную разминку, а на финише идем пить спешелти-кофе со свежими миндальными круассанами.',
          date: tomorrowStr,
          time: '09:30',
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 5,
          budget: 'до 1 000 ₽',
          city: 'Москва',
          approximateArea: 'Парк Горького / Набережная, ~2.8 км',
          distanceKm: 2.8,
          imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=80',
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Свежий утренний воздух у воды, заряд бодрости и горячий кофе',
          icebreakerQuestion: 'Что помогает вам просыпаться по утрам в отличном настроении?',
          requirements: 'Темп спокойный — никто никого не бросает позади',
          rules: ['Пробежка бесплатная, кофе на финише по желанию'],
          approvedParticipantIds: [dmitry.id, maxim.id, elena.id, mikhail.id],
          createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        },
        secret: {
          exactVenue: 'Кофейный поинт у главного входа в Парк Горького (слева от арки)',
          exactAddress: 'ул. Крымский Вал, 9',
          organizerPhone: '+7 (916) 210-45-11',
          privateInstructions: 'Есть шкафчики для хранения вещей в беговом центре рядом со стартом.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-15',
          title: 'Закатный заплыв на сап-бордах и пикник с чаем на берегу',
          category: 'Пикник / Шашлыки',
          description: 'Плывем встречать закат по тихим живописным заливам! Инструктор выдаст устойчивые доски и спасательные жилеты, а после прогулки устроим пикник на деревянном пирсе с травяным чаем и ягодами.',
          date: inThreeDaysStr,
          time: '17:30',
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 5,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Серебряный Бор, ~5.4 км',
          distanceKm: 5.4,
          imageUrl: 'https://images.unsplash.com/photo-1526188717906-ab4a2f949f48?auto=format&fit=crop&w=900&q=80',
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Розовый закат на воде, сосны и полное ощущение отпуска',
          icebreakerQuestion: 'Море, горы или лесное озеро — где вы отдыхаете душой лучше всего?',
          requirements: 'Сменная одежда на всякий случай, умение плавать',
          rules: ['Прокат SUP-борда на 2 часа — 1 800 ₽, чай и угощения берем с собой'],
          approvedParticipantIds: [anna.id, elena.id, sofia.id, dmitry.id],
          createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        },
        secret: {
          exactVenue: 'Станция SUP-серфинга "Серебряный причал", пляж №3',
          exactAddress: '4-я линия Хорошёвского Серебряного Бора, вл. 19',
          organizerPhone: '+7 (915) 602-88-19',
          privateInstructions: 'Встречаемся у деревянного шатра проката, выдают гермомешки для телефонов.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-16',
          title: 'Прогулка по скрытым парадным и доходным домам эпохи модерна',
          category: 'Прогулка',
          description: 'Как архитектор, покажу вам 7 невероятных доходных домов начала XX века с витражами, метлахской плиткой и чугунными лестницами, мимо которых все обычно проходят не глядя.',
          date: tomorrowStr,
          time: '16:00',
          isToday: false,
          totalSpots: 7,
          occupiedSpots: 5,
          budget: 'Бесплатно',
          city: 'Москва',
          approximateArea: 'Сретенка / Чистые пруды, ~1.3 км',
          distanceKm: 1.3,
          imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=80',
          organizerId: elena.id,
          organizer: toOrg(elena),
          status: 'open',
          vibe: 'Спокойная беседа',
          musicOrMood: 'Вдохновляющая архитектура модерна, истории жильцов и кофе по пути',
          icebreakerQuestion: 'В доме какой эпохи вы бы хотели пожить хотя бы неделю?',
          requirements: 'Тишина и уважение к жителям внутри подъездов',
          rules: ['Некоммерческая дружеская прогулка, после зайдем в кофейню'],
          approvedParticipantIds: [anna.id, sofia.id, mikhail.id, dmitry.id],
          createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
        },
        secret: {
          exactVenue: 'У входа в театр Et Cetera во Фроловом переулке',
          exactAddress: 'Фролов пер., 2 (м. Тургеневская)',
          organizerPhone: '+7 (903) 777-34-21',
          privateInstructions: 'Встречаемся у главных колонн театра, маршрут займет около 1.5 часов.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-17',
          title: 'Боулинг, ретро-аркады и неаполитанская пицца в честь 30-летия!',
          category: 'День рождения',
          description: 'Отмечаю юбилей без скучных банкетов! Забронировал две дорожки боулинга, жетоны на ретро-автоматы (аэрохоккей, пинбол, гонки) и гору горячей пиццы из дровяной печи. Буду рад новым друзьям!',
          date: inTwoDaysStr,
          time: '20:00',
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Парк Культуры, ~2.4 км',
          distanceKm: 2.4,
          imageUrl: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=900&q=80',
          organizerId: dmitry.id,
          organizer: toOrg(dmitry),
          status: 'open',
          vibe: 'Праздничный вайб',
          musicOrMood: 'Страйки, неоновый свет аркадных автоматов и фанк-музыка',
          icebreakerQuestion: 'В какой аркадной игре вам нет равных?',
          requirements: 'Азарт и праздничное настроение',
          rules: ['Дорожки боулинга с меня как с именинника, напитки и кухня — в складчину'],
          approvedParticipantIds: [anna.id, mikhail.id, artem.id, polina.id, elena.id],
          createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
        },
        secret: {
          exactVenue: 'Боулинг-лаунж "Страйк & Пицца", дорожки №5 и №6',
          exactAddress: 'Комсомольский проспект, 28 (м. Фрунзенская / Парк Культуры)',
          organizerPhone: '+7 (926) 881-34-90',
          privateInstructions: 'Спускайтесь на -1 этаж к зоне неонового бара, дорожки прямо напротив.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-18',
          title: 'Ваншот Dungeons & Dragons для новичков (готовые герои и кубики)',
          category: 'Настольные игры',
          description: 'Провожу атмосферное детективное приключение в мире D&D на один вечер (4 часа). Ничего учить заранее не нужно: я подготовил красивых персонажей, миниатюры, карты, звуковое сопровождение и наборы кубиков!',
          date: inTwoDaysStr,
          time: '15:00',
          isToday: false,
          totalSpots: 5,
          occupiedSpots: 4,
          budget: 'до 1 000 ₽',
          city: 'Москва',
          approximateArea: 'Менделеевская / Новослободская, ~2.2 км',
          distanceKm: 2.2,
          imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=900&q=80',
          organizerId: artem.id,
          organizer: toOrg(artem),
          status: 'open',
          vibe: 'Интеллектуальная игра',
          musicOrMood: 'Фэнтези-саундтрек, броски двадцатигранного кубика и командное приключение',
          icebreakerQuestion: 'Кем бы вы были в фэнтези-мире: магом, следопытом, бардом или плутом?',
          requirements: 'Фантазия и уважение к ходу других игроков',
          rules: ['Оплата только за комнату в клубе (~600 ₽ с человека), чай и печенье включены'],
          approvedParticipantIds: [mikhail.id, sofia.id, elena.id],
          createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
        },
        secret: {
          exactVenue: 'Клуб ролевых игр "Таверна Восьмигранник", VIP-комната "Замок"',
          exactAddress: 'ул. Новослободская, 36/1, стр. 1',
          organizerPhone: '+7 (999) 114-56-23',
          privateInstructions: '2 этаж, дверь с деревянной вывеской дракона.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-19',
          title: 'Джаз при свечах в тропической оранжерее: саксофон и рояль',
          category: 'Кино / Концерт',
          description: 'Вечер классического нью-йоркского джаза среди живых пальм, орхидей и сотен свечей. Идем красивой компанией насладиться живым звуком, сделать фотографии в саду и после концерта выпить какао.',
          date: todayStr,
          time: '20:00',
          isToday: true,
          totalSpots: 4,
          occupiedSpots: 3,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Проспект Мира, ~2.8 км',
          distanceKm: 2.8,
          imageUrl: './assets/images/event_live_concert_1794332915302.jpg',
          organizerId: anna.id,
          organizer: toOrg(anna),
          status: 'open',
          vibe: 'Праздничный вайб',
          musicOrMood: 'Мягкий саксофон, тропическая зелень и мерцание свечей',
          icebreakerQuestion: 'Какая музыка мгновенно поднимает вам настроение после рабочего дня?',
          requirements: 'Коктейльный или smart-casual стиль приветствуется',
          rules: ['Билеты в партер (1 900 ₽), встречаемся за 25 минут чтобы погулять по саду'],
          approvedParticipantIds: [sofia.id, dmitry.id],
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        secret: {
          exactVenue: 'Тропическая оранжерея Ботанического сада, исторический павильон',
          exactAddress: 'Проспект Мира, 26, стр. 1',
          organizerPhone: '+7 (916) 555-01-92',
          privateInstructions: 'Вход через стеклянный атриум оранжереи, встречаемся у фонтана внутри.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-20',
          title: 'Однодневный хайкинг вдоль берега Оки и обед на костре в сосновом бору',
          category: 'Путешествие',
          description: 'Проходим живописный лесной маршрут 14 км по песчаным тропам вдоль высокого берега Оки, заходим в заповедник и устраиваем большой привал с походным супом и кофе в гейзерной турке на горелке.',
          date: inThreeDaysStr,
          time: '08:45',
          isToday: false,
          totalSpots: 8,
          occupiedSpots: 6,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Выезд с Курского вокзала, ~2.5 км',
          distanceKm: 2.5,
          imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80',
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Запах сосновой хвои, панорама реки и горячий кофе из кружки',
          icebreakerQuestion: 'Самое красивое природное место, которое вы видели своими глазами?',
          requirements: 'Треккинговые ботинки или кроссовки с протектором, термос с водой',
          rules: ['Электричка-экспресс + общие продукты на привал (~1 400 ₽ с человека)'],
          approvedParticipantIds: [mikhail.id, elena.id, dmitry.id, artem.id, polina.id],
          createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
        },
        secret: {
          exactVenue: 'Курский вокзал, зал ожидания экспрессов у выхода к платформам',
          exactAddress: 'ул. Земляной Вал, 29',
          organizerPhone: '+7 (915) 602-88-19',
          privateInstructions: 'Берем билеты во 2 вагон экспресса на Серпухов. Я с зеленым туристическим рюкзаком Osprey.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-21',
          title: 'Секретный спикизи-бар за книжным шкафом: дегустация авторских миксов',
          category: 'Ресторан / Бар',
          description: 'Идем в атмосферный бар без вывески, вход в который спрятан за старинным книжным шкафом. В меню как сложные ботанические безалкогольные миксы, так и авторская классика + тапас.',
          date: todayStr,
          time: '21:00',
          isToday: true,
          totalSpots: 5,
          occupiedSpots: 3,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Покровка / Маросейка, ~0.9 км',
          distanceKm: 0.9,
          imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80',
          organizerId: anna.id,
          organizer: toOrg(anna),
          status: 'open',
          vibe: 'Гастро-вечер',
          musicOrMood: 'Виниловый фанк, приглушенный свет и камерные разговоры',
          icebreakerQuestion: 'Если бы вы открыли свое заведение, каким бы оно было?',
          requirements: '21+, уважительное общение',
          rules: ['Каждый оплачивает свой заказ по меню'],
          approvedParticipantIds: [dmitry.id, polina.id],
          createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        secret: {
          exactVenue: 'Спикизи-гостиная "Кабинет Архивариуса"',
          exactAddress: 'ул. Покровка, 17 (вход через букинистическую лавку)',
          organizerPhone: '+7 (916) 555-01-92',
          privateInstructions: 'Внутри лавки потяните за том энциклопедии на третьей полке слева. Бронь на Анну.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-22',
          title: 'Боулдеринг на скалодроме для любого уровня + пуэр в чайной зоне',
          category: 'Спорт',
          description: 'Лазаем простые и средние трассы на невысоком скалодроме с мягкими матами (страховка веревками не нужна). Очень весело разгадывать трассы вместе и подсказывать зацепки!',
          date: tomorrowStr,
          time: '19:30',
          isToday: false,
          totalSpots: 6,
          occupiedSpots: 4,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Савеловская / Динамо, ~3.6 км',
          distanceKm: 3.6,
          imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=900&q=80',
          organizerId: mikhail.id,
          organizer: toOrg(mikhail),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Спортивный азарт, поддержка команды и китайский чай после тренировки',
          icebreakerQuestion: 'Боитесь ли вы высоты или наоборот любите забираться повыше?',
          requirements: 'Удобные спортивные штаны и футболка, скальные туфли дают в прокате',
          rules: ['Вход на скалодром и прокат скальников (~1 200 ₽)'],
          approvedParticipantIds: [maxim.id, elena.id, artem.id],
          createdAt: new Date(Date.now() - 3600000 * 11).toISOString(),
        },
        secret: {
          exactVenue: 'Скалодром "Limestone", зона отдыха у чайного бара',
          exactAddress: 'Ленинградский проспект, 36, стр. 29',
          organizerPhone: '+7 (925) 444-12-88',
          privateInstructions: 'Встречаемся в 19:20 у ресепшена, после разминки идем к сектору "Новичок".',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-23',
          title: 'Гриль-пикник в лесной беседке у озера: халуми, стейки и гитара',
          category: 'Пикник / Шашлыки',
          description: 'Арендовали уютную деревянную беседку с мангалом на берегу лесного озера! Жарим сыр халуми, овощи на гриле, стейки, завариваем облепиховый чай и поем любимые песни под акустическую гитару.',
          date: inFourDaysStr,
          time: '14:30',
          isToday: false,
          totalSpots: 10,
          occupiedSpots: 7,
          budget: '1 000–3 000 ₽',
          city: 'Москва',
          approximateArea: 'Мещерский парк, ~6.2 км',
          distanceKm: 6.2,
          imageUrl: './assets/images/event_outdoor_picnic_1794332913731.jpg',
          organizerId: polina.id,
          organizer: toOrg(polina),
          status: 'open',
          vibe: 'Праздничный вайб',
          musicOrMood: 'Треск углей, сосновый лес, гитара и авторские соусы от шефа',
          icebreakerQuestion: 'Какую песню у костра вы знаете наизусть от начала до конца?',
          requirements: 'Теплый свитер на вечер и отличное настроение',
          rules: ['Закупку продуктов и аренду беседки делим поровну (~1 600 ₽ с человека)'],
          approvedParticipantIds: [anna.id, mikhail.id, elena.id, dmitry.id, sofia.id, maxim.id],
          createdAt: new Date(Date.now() - 3600000 * 35).toISOString(),
        },
        secret: {
          exactVenue: 'Пикниковая зона "Лесная бухта", беседка №4 у воды',
          exactAddress: 'Мещерский парк, вход со стороны Новомещерского проезда, 15',
          organizerPhone: '+7 (916) 210-45-11',
          privateInstructions: 'От парковки 400 метров по деревянному настилу вдоль берега озера.',
          allowPhoneSharing: true,
        },
      },
      {
        event: {
          id: 'ev-24',
          title: 'Вечерний велозаезд по огням набережных от Сити до Зарядья',
          category: 'Прогулка',
          description: 'Катим неспешным прогулочным темпом по самым красивым освещенным велодорожкам вдоль Москвы-реки! Можно на своем велосипеде или взять городской электровелосипед в прокате прямо на старте.',
          date: todayStr,
          time: '21:30',
          isToday: true,
          totalSpots: 8,
          occupiedSpots: 5,
          budget: 'Бесплатно',
          city: 'Москва',
          approximateArea: 'Пресненская наб. / Лужники, ~3.1 км',
          distanceKm: 3.1,
          imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80',
          organizerId: maxim.id,
          organizer: toOrg(maxim),
          status: 'open',
          vibe: 'Активный движ',
          musicOrMood: 'Огни ночного города в воде, теплый ветер и остановки на смотровых',
          icebreakerQuestion: 'Ваш любимый маршрут для вечерней прогулки по городу?',
          requirements: 'Велосипед или городской велопрокат, передний/задний фонарик',
          rules: ['Едем аккуратно колонной, ждем всех на светофорах и мостах'],
          approvedParticipantIds: [mikhail.id, dmitry.id, artem.id, sofia.id],
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        secret: {
          exactVenue: 'Смотровая площадка у моста "Багратион" со стороны Пресненской набережной',
          exactAddress: 'Пресненская набережная, 2',
          organizerPhone: '+7 (915) 602-88-19',
          privateInstructions: 'Рядом со станцией городского велопроката №142 у спуска к воде.',
          allowPhoneSharing: true,
        },
      },
    ];

    for (const item of extraEvents) {
      if (!this.events.has(item.event.id)) {
        this.events.set(item.event.id, item.event);
      }
      if (!this.rawEventsSecret.has(item.event.id)) {
        this.rawEventsSecret.set(item.event.id, item.secret);
      }
    }
  }

  // --- PRIVACY SANITIZATION (The Core Security Law) ---
  sanitizeEvent(event: EventItem, viewerUserId?: string): EventItem {
    const isOrganizer = viewerUserId && event.organizerId === viewerUserId;
    const isApprovedParticipant = viewerUserId && event.approvedParticipantIds.includes(viewerUserId);
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

    const sanitized: EventItem = {
      ...event,
      approvedParticipants: participants,
      // Always available public summary
      exactVenue: hasFullAccess ? this.rawEventsSecret.get(event.id)?.exactVenue : undefined,
      exactAddress: hasFullAccess ? this.rawEventsSecret.get(event.id)?.exactAddress : undefined,
      organizerPhone: hasFullAccess && this.rawEventsSecret.get(event.id)?.allowPhoneSharing 
        ? this.rawEventsSecret.get(event.id)?.organizerPhone 
        : undefined,
      privateInstructions: hasFullAccess ? this.rawEventsSecret.get(event.id)?.privateInstructions : undefined,
    };

    return sanitized;
  }

  getEvents(viewerUserId?: string, filters?: {
    category?: string;
    city?: string;
    onlyToday?: boolean;
    query?: string;
    maxBudget?: string;
  }): EventItem[] {
    const activeViewer = viewerUserId ? this.users.get(viewerUserId) : undefined;
    const blockedIds = activeViewer?.blockedUserIds || [];

    let list = Array.from(this.events.values())
      .filter(ev => ev.status !== 'cancelled' || ev.organizerId === viewerUserId)
      .filter(ev => !blockedIds.includes(ev.organizerId));

    if (filters?.category && filters.category !== 'Все') {
      list = list.filter(ev => ev.category === filters.category);
    }

    if (filters?.onlyToday) {
      list = list.filter(ev => ev.isToday);
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(ev => 
        ev.title.toLowerCase().includes(q) || 
        ev.description.toLowerCase().includes(q) ||
        ev.approximateArea.toLowerCase().includes(q) ||
        ev.category.toLowerCase().includes(q)
      );
    }

    return list.map(ev => this.sanitizeEvent(ev, viewerUserId));
  }

  getEventById(id: string, viewerUserId?: string): EventItem | null {
    const ev = this.events.get(id);
    if (!ev) return null;
    return this.sanitizeEvent(ev, viewerUserId);
  }

  createEvent(data: {
    title: string;
    category: any;
    description: string;
    date: string;
    time: string;
    totalSpots: number;
    budget: any;
    city: string;
    approximateArea: string;
    exactVenue: string;
    exactAddress: string;
    organizerPhone: string;
    privateInstructions: string;
    requirements: string;
    rules: string[];
    allowPhoneSharing: boolean;
    imageUrl?: string;
    organizerId: string;
    vibe?: EventVibe;
    musicOrMood?: string;
    icebreakerQuestion?: string;
  }): EventItem {
    const organizer = this.users.get(data.organizerId);
    if (!organizer) throw new Error('Пользователь не найден');

    const id = `ev-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = data.date === todayStr;

    // Pick dynamic high-quality image if not provided
    let fallbackImg = '/src/assets/images/hero_community_event_1794332913246.jpg';
    if (data.category === 'Настольные игры') fallbackImg = '/src/assets/images/event_board_games_1794332913325.jpg';
    else if (data.category === 'Пикник / Шашлыки') fallbackImg = '/src/assets/images/event_outdoor_picnic_1794332913731.jpg';
    else if (data.category === 'Кино / Концерт') fallbackImg = '/src/assets/images/event_live_concert_1794332915302.jpg';

    const newEvent: EventItem = {
      id,
      title: data.title,
      category: data.category,
      description: data.description,
      date: data.date,
      time: data.time,
      isToday,
      totalSpots: Number(data.totalSpots) || 4,
      occupiedSpots: 1, // Organizer is spot 1
      budget: data.budget,
      city: data.city || 'Москва',
      approximateArea: data.approximateArea || 'Центр, ~2 км',
      distanceKm: 2.0,
      imageUrl: data.imageUrl || fallbackImg,
      organizerId: organizer.id,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        age: organizer.age,
        avatarUrl: organizer.avatarUrl,
        reliability: organizer.reliability,
        isPhoneVerified: organizer.isPhoneVerified,
        isEmailVerified: organizer.isEmailVerified,
      },
      status: 'open',
      requirements: data.requirements || 'Дружелюбие и пунктуальность',
      rules: data.rules || ['Уведомить при изменении планов'],
      approvedParticipantIds: [],
      createdAt: new Date().toISOString(),
      vibe: data.vibe || 'Спокойная беседа',
      musicOrMood: data.musicOrMood || 'Уютная дружелюбная атмосфера',
      icebreakerQuestion: data.icebreakerQuestion || '',
    };

    // Store secret data strictly separate
    this.rawEventsSecret.set(id, {
      exactVenue: data.exactVenue,
      exactAddress: data.exactAddress,
      organizerPhone: data.organizerPhone || organizer.phoneNumber || '',
      privateInstructions: data.privateInstructions || '',
      allowPhoneSharing: data.allowPhoneSharing ?? true,
    });

    this.events.set(id, newEvent);

    // Initial system message in closed chat space
    this.chatMessages.set(id, [{
      id: `msg-${Date.now()}`,
      eventId: id,
      senderId: 'system',
      senderName: 'Kompany',
      senderAvatar: '',
      text: 'Мероприятие создано. Закрытый чат и точные контакты доступны только вам и подтвержденным участникам.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystemMessage: true,
    }]);

    // Update organizer stats
    organizer.reliability.eventsOrganized += 1;
    this.saveToFile();

    return this.sanitizeEvent(newEvent, data.organizerId);
  }

  applyToEvent(eventId: string, userId: string, note: string): EventApplication {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    const user = this.users.get(userId);
    if (!user) throw new Error('Пользователь не найден');

    if (event.organizerId === userId) {
      throw new Error('Вы являетесь организатором этого мероприятия');
    }

    if (event.approvedParticipantIds.includes(userId)) {
      throw new Error('Вы уже являетесь подтвержденным участником');
    }

    // Check existing application
    const existing = Array.from(this.applications.values())
      .find(a => a.eventId === eventId && a.userId === userId && a.status === 'pending');
    if (existing) {
      throw new Error('Вы уже подали заявку на это мероприятие');
    }

    const app: EventApplication = {
      id: `app-${Date.now()}`,
      eventId,
      eventTitle: event.title,
      userId,
      user: {
        id: user.id,
        name: user.name,
        age: user.age,
        avatarUrl: user.avatarUrl,
        city: user.city,
        bio: user.bio,
        interests: user.interests,
        reliability: user.reliability,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
      },
      note: note.trim() || 'Хочу познакомиться и провести время вместе!',
      status: 'pending',
      createdAt: new Date().toISOString(),
      attendanceStatus: 'not_marked',
    };

    this.applications.set(app.id, app);

    // Send notification to Organizer
    const userNotifications = this.notifications.get(event.organizerId) || [];
    userNotifications.unshift({
      id: `notif-${Date.now()}`,
      userId: event.organizerId,
      title: 'Новая заявка на мероприятие',
      message: `${user.name} хочет присоединиться к "${event.title}": "${app.note.slice(0, 70)}..."`,
      type: 'application_received',
      relatedEventId: event.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    this.notifications.set(event.organizerId, userNotifications);
    this.saveToFile();

    return app;
  }

  handleApplication(appId: string, organizerId: string, action: 'accept' | 'reject'): EventApplication {
    const app = this.applications.get(appId);
    if (!app) throw new Error('Заявка не найдена');
    const event = this.events.get(app.eventId);
    if (!event) throw new Error('Мероприятие не найдено');

    if (event.organizerId !== organizerId) {
      throw new Error('Только организатор может подтверждать заявки');
    }

    if (action === 'accept') {
      if (event.occupiedSpots >= event.totalSpots) {
        throw new Error('Все места уже заняты');
      }

      app.status = 'accepted';
      if (!event.approvedParticipantIds.includes(app.userId)) {
        event.approvedParticipantIds.push(app.userId);
        event.occupiedSpots = Math.min(event.totalSpots, event.occupiedSpots + 1);
        if (event.occupiedSpots >= event.totalSpots) {
          event.status = 'full';
        }
      }

      // Add system message to event chat
      const chat = this.chatMessages.get(event.id) || [];
      chat.push({
        id: `msg-${Date.now()}`,
        eventId: event.id,
        senderId: 'system',
        senderName: 'Kompany',
        senderAvatar: '',
        text: `К компании присоединился(лась) ${app.user.name}! Теперь ему(ей) открыт точный адрес встречи.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystemMessage: true,
      });
      this.chatMessages.set(event.id, chat);

      // Notify Participant
      const notifs = this.notifications.get(app.userId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: app.userId,
        title: 'Заявка одобрена! 🎉',
        message: `Организатор подтвердил ваше участие в "${event.title}". Теперь вам доступен точный адрес и групповой чат!`,
        type: 'application_accepted',
        relatedEventId: event.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      this.notifications.set(app.userId, notifs);

    } else {
      app.status = 'rejected';

      const notifs = this.notifications.get(app.userId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: app.userId,
        title: 'Статус заявки обновлен',
        message: `К сожалению, на мероприятие "${event.title}" мест больше нет или заявка была отклонена организатором.`,
        type: 'application_rejected',
        relatedEventId: event.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      this.notifications.set(app.userId, notifs);
    }

    this.saveToFile();
    return app;
  }

  cancelEvent(eventId: string, organizerId: string, reason?: string): EventItem {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    if (event.organizerId !== organizerId) {
      throw new Error('Только организатор может отменить мероприятие');
    }

    event.status = 'cancelled';
    event.cancelledReason = reason || 'Отменено организатором';

    // Notify all approved participants
    for (const participantId of event.approvedParticipantIds) {
      const notifs = this.notifications.get(participantId) || [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        userId: participantId,
        title: 'Мероприятие отменено',
        message: `Организатор отменил мероприятие "${event.title}": ${event.cancelledReason}`,
        type: 'event_cancelled',
        relatedEventId: event.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      this.notifications.set(participantId, notifs);
    }

    // Record organizer cancellation in reputation
    const org = this.users.get(organizerId);
    if (org) {
      org.reliability.cancellations += 1;
    }

    this.saveToFile();
    return this.sanitizeEvent(event, organizerId);
  }

  sendChatMessage(eventId: string, senderId: string, text: string): ChatMessage {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    const user = this.users.get(senderId);
    if (!user) throw new Error('Пользователь не найден');

    // Security check: only organizer or approved participant can participate in closed event chat
    const isApproved = event.organizerId === senderId || event.approvedParticipantIds.includes(senderId);
    if (!isApproved) {
      throw new Error('Доступ к закрытому чату открывается только после подтверждения заявки');
    }

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      eventId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatarUrl,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const list = this.chatMessages.get(eventId) || [];
    list.push(msg);
    this.chatMessages.set(eventId, list);
    this.saveToFile();

    return msg;
  }

  markAttendance(eventId: string, organizerId: string, participantId: string, status: 'attended' | 'no_show') {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    if (event.organizerId !== organizerId) throw new Error('Недостаточно прав');

    const participant = this.users.get(participantId);
    if (!participant) throw new Error('Участник не найден');

    if (status === 'attended') {
      participant.reliability.eventsAttended += 1;
    } else {
      participant.reliability.noShows += 1;
    }

    const total = participant.reliability.eventsAttended + participant.reliability.noShows;
    participant.reliability.attendanceRate = total > 0 
      ? Math.round((participant.reliability.eventsAttended / total) * 100) 
      : 100;

    this.saveToFile();
    return participant;
  }

  submitReview(data: {
    eventId: string;
    authorId: string;
    targetUserId: string;
    rating: number;
    tags: string[];
    text: string;
  }): UserReview {
    const author = this.users.get(data.authorId);
    const target = this.users.get(data.targetUserId);
    const event = this.events.get(data.eventId);
    if (!author || !target || !event) throw new Error('Некорректные данные для отзыва');

    const rev: UserReview = {
      id: `rev-${Date.now()}`,
      eventId: data.eventId,
      eventTitle: event.title,
      authorId: author.id,
      authorName: author.name,
      authorAvatar: author.avatarUrl,
      targetUserId: target.id,
      rating: Math.min(5, Math.max(1, data.rating)),
      tags: data.tags || [],
      text: data.text.trim(),
      createdAt: 'Только что',
    };

    const targetReviews = this.reviews.get(target.id) || [];
    targetReviews.unshift(rev);
    this.reviews.set(target.id, targetReviews);

    // Update target rating
    const avg = targetReviews.reduce((sum, r) => sum + r.rating, 0) / targetReviews.length;
    target.reliability.score = Math.round(avg * 100) / 100;
    if (rev.rating >= 4) {
      target.reliability.positiveReviewsCount += 1;
    }

    this.saveToFile();
    return rev;
  }

  submitReport(data: {
    reporterId: string;
    targetType: 'user' | 'event';
    targetId: string;
    reason: any;
    details: string;
  }): SafetyReport {
    const reporter = this.users.get(data.reporterId);
    if (!reporter) throw new Error('Пользователь не найден');

    let targetTitle = '';
    if (data.targetType === 'event') {
      targetTitle = this.events.get(data.targetId)?.title || 'Мероприятие';
    } else {
      targetTitle = this.users.get(data.targetId)?.name || 'Пользователь';
    }

    const report: SafetyReport = {
      id: `rep-${Date.now()}`,
      reporterId: reporter.id,
      reporterName: reporter.name,
      targetType: data.targetType,
      targetId: data.targetId,
      targetTitle,
      reason: data.reason,
      details: data.details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.reports.set(report.id, report);
    this.saveToFile();
    return report;
  }

  blockUser(userId: string, targetUserId: string) {
    const user = this.users.get(userId);
    if (!user) throw new Error('Пользователь не найден');
    if (!user.blockedUserIds) user.blockedUserIds = [];
    if (!user.blockedUserIds.includes(targetUserId)) {
      user.blockedUserIds.push(targetUserId);
    }
    this.saveToFile();
    return user;
  }

  seedQuestions() {
    this.questions.set('ev-1', [
      {
        id: 'qa-1',
        eventId: 'ev-1',
        askerId: 'user-mikhail',
        askerName: 'Михаил Соколов',
        askerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        question: 'Подскажите, какой примерно формат кухни в ресторане и есть ли дресс-код?',
        answer: 'Средиземноморская и авторская кухня, печь на дровах! Дресс-код свободный (smart casual), главное чтобы вам было комфортно.',
        createdAt: '14:10',
        answeredAt: '14:22',
      }
    ]);

    this.questions.set('ev-2', [
      {
        id: 'qa-2',
        eventId: 'ev-2',
        askerId: 'user-elena',
        askerName: 'Елена Кузнецова',
        askerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        question: 'Если я раньше не играла в «Покорение Марса», не буду ли я тормозить партию?',
        answer: 'Совсем нет! Мы первые 15 минут подробно разбираем правила и играем первую эпоху в открытую с подсказками.',
        createdAt: '13:05',
        answeredAt: '13:15',
      }
    ]);
  }

  seedReviews() {
    const anna = this.users.get('user-anna');
    const mikhail = this.users.get('user-mikhail');
    const elena = this.users.get('user-elena');

    // Reviews for Anna
    if (anna && (!this.reviews.has(anna.id) || (this.reviews.get(anna.id)?.length || 0) < 3)) {
      this.reviews.set(anna.id, [
        {
          id: 'rev-1',
          eventId: 'ev-past-1',
          eventTitle: 'Поход на джазовый концерт',
          authorId: 'user-elena',
          authorName: elena?.name || 'Елена Кузнецова',
          authorAvatar: elena?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
          targetUserId: anna.id,
          rating: 5,
          tags: ['Отличная организация', 'Легко общаться', 'Пунктуальный'],
          text: 'Анна — невероятный организатор! Собрала классных людей, все прошло тепло и без заминок. Обязательно пойду еще!',
          createdAt: '2 недели назад',
        },
        {
          id: 'rev-2',
          eventId: 'ev-past-2',
          eventTitle: 'Бранч на Патриарших',
          authorId: 'user-mikhail',
          authorName: mikhail?.name || 'Михаил Соколов',
          authorAvatar: mikhail?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          targetUserId: anna.id,
          rating: 5,
          tags: ['Душа компании', 'Приятный собеседник', 'Отличная организация'],
          text: 'Было очень комфортно, будто знакомы сто лет. Анна потрясающе чувствует атмосферу встречи и легко объединяет незнакомых людей.',
          createdAt: 'Месяц назад',
        },
        {
          id: 'rev-3',
          eventId: 'ev-4',
          eventTitle: 'Весенний пикник в Нескучном саду',
          authorId: 'user-dimitry',
          authorName: 'Дмитрий Морозов',
          authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
          targetUserId: anna.id,
          rating: 5,
          tags: ['Отличная организация', 'Внимательность', 'Дружелюбная'],
          text: 'Прекрасно провели время на свежем воздухе! Анна позаботилась обо всех деталях, никто не чувствовал себя одиноко.',
          createdAt: '1.5 месяца назад',
        }
      ]);
    }

    // Reviews for Mikhail
    if (mikhail && (!this.reviews.has(mikhail.id) || (this.reviews.get(mikhail.id)?.length || 0) === 0)) {
      this.reviews.set(mikhail.id, [
        {
          id: 'rev-m-1',
          eventId: 'ev-2',
          eventTitle: 'Настольные игры: Покорение Марса',
          authorId: 'user-anna',
          authorName: anna?.name || 'Анна Воронова',
          authorAvatar: anna?.avatarUrl || '/src/assets/images/avatar_host_anna_1794332914629.jpg',
          targetUserId: mikhail.id,
          rating: 5,
          tags: ['Пунктуальный', 'Легко общаться', 'Душа компании'],
          text: 'Михаил — потрясающий участник встреч! Пришел вовремя, за 10 минут объяснил сложные правила стратегии и весь вечер шутил. С удовольствием пойду на любое его мероприятие!',
          createdAt: '3 недели назад',
        },
        {
          id: 'rev-m-2',
          eventId: 'ev-past-quiz',
          eventTitle: 'Интеллектуальный квиз в центре',
          authorId: 'user-elena',
          authorName: elena?.name || 'Елена Кузнецова',
          authorAvatar: elena?.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
          targetUserId: mikhail.id,
          rating: 5,
          tags: ['Командный игрок', 'Приятный собеседник', 'Эрудированный'],
          text: 'Играли вместе в одной команде на квизе. Михаил очень тактичный, эрудированный и позитивный, принес нам победу в научном раунде!',
          createdAt: '1 месяц назад',
        }
      ]);
    }

    // Reviews for Elena
    if (elena && (!this.reviews.has(elena.id) || (this.reviews.get(elena.id)?.length || 0) === 0)) {
      this.reviews.set(elena.id, [
        {
          id: 'rev-e-1',
          eventId: 'ev-3',
          eventTitle: 'Акустический вечер инди-музыки',
          authorId: 'user-anna',
          authorName: anna?.name || 'Анна Воронова',
          authorAvatar: anna?.avatarUrl || '/src/assets/images/avatar_host_anna_1794332914629.jpg',
          targetUserId: elena.id,
          rating: 5,
          tags: ['Отличный вкус', 'Легко общаться', 'Пунктуальная'],
          text: 'Елена — невероятно чуткий и открытый человек! Было безумно интересно обсудить музыку и архитектуру, вечер пролетел на одном дыхании.',
          createdAt: '10 дней назад',
        },
        {
          id: 'rev-e-2',
          eventId: 'ev-4',
          eventTitle: 'Весенний пикник в Нескучном саду',
          authorId: 'user-mikhail',
          authorName: mikhail?.name || 'Михаил Соколов',
          authorAvatar: mikhail?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
          targetUserId: elena.id,
          rating: 5,
          tags: ['Инициативная', 'Душа компании', 'Надежный участник'],
          text: 'Елена приготовила для всей компании авторский лимонад и поддержала любые активности от фрисби до душевных разговоров у костра.',
          createdAt: '3 недели назад',
        }
      ]);
    }
  }

  toggleSaveEvent(userId: string, eventId: string): UserProfile {
    const user = this.users.get(userId);
    if (!user) throw new Error('Пользователь не найден');
    if (!user.savedEventIds) user.savedEventIds = [];

    if (user.savedEventIds.includes(eventId)) {
      user.savedEventIds = user.savedEventIds.filter(id => id !== eventId);
    } else {
      user.savedEventIds.push(eventId);
    }
    this.saveToFile();
    return user;
  }

  private maskContactsInPublicText(text: string): string {
    // Automatically mask phone numbers or @handles in pre-approval Q&A
    return text
      .replace(/(\+7|8)[\s\-()]?\d{3}[\s\-()]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g, '[Номер скрыт защитой Kompany]')
      .replace(/@[a-zA-Z0-9_]{3,}/g, '[Контакт скрыт до одобрения]');
  }

  getQuestions(eventId: string): EventQuestion[] {
    return this.questions.get(eventId) || [];
  }

  askQuestion(eventId: string, userId: string, questionText: string): EventQuestion {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    const user = this.users.get(userId);
    if (!user) throw new Error('Пользователь не найден');

    const safeQuestion = this.maskContactsInPublicText(questionText.trim());
    const q: EventQuestion = {
      id: `qa-${Date.now()}`,
      eventId,
      askerId: user.id,
      askerName: user.name,
      askerAvatar: user.avatarUrl,
      question: safeQuestion,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const list = this.questions.get(eventId) || [];
    list.push(q);
    this.questions.set(eventId, list);
    this.saveToFile();
    return q;
  }

  answerQuestion(eventId: string, questionId: string, organizerId: string, answerText: string): EventQuestion {
    const event = this.events.get(eventId);
    if (!event) throw new Error('Мероприятие не найдено');
    if (event.organizerId !== organizerId) {
      throw new Error('Только организатор может отвечать на вопросы');
    }

    const list = this.questions.get(eventId) || [];
    const q = list.find(item => item.id === questionId);
    if (!q) throw new Error('Вопрос не найден');

    q.answer = this.maskContactsInPublicText(answerText.trim());
    q.answeredAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.saveToFile();
    return q;
  }
}

export const store = new DataStore();

