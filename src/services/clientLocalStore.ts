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

const LOCAL_STORAGE_KEY = 'kompany_client_store_v7';

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
    } catch (e) {
      console.error('Seeding error:', e);
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

    return {
      ...event,
      approvedParticipants: participants,
      exactVenue: hasFullAccess ? secret?.exactVenue : undefined,
      exactAddress: hasFullAccess ? secret?.exactAddress : undefined,
      organizerPhone: hasFullAccess && secret?.allowPhoneSharing ? secret?.organizerPhone : undefined,
      privateInstructions: hasFullAccess ? secret?.privateInstructions : undefined,
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
    if (action === 'accept') {
      const ev = this.events.get(app.eventId);
      if (ev) {
        ev.occupiedSpots = Math.min(ev.totalSpots, ev.occupiedSpots + 1);
        if (!ev.approvedParticipants) ev.approvedParticipants = [];
        ev.approvedParticipants.push({
          id: app.user.id,
          name: app.user.name,
          age: app.user.age,
          avatarUrl: app.user.avatarUrl,
          reliability: app.user.reliability,
        });
        if (!ev.approvedParticipantIds) ev.approvedParticipantIds = [];
        ev.approvedParticipantIds.push(app.user.id);
      }
    }
    this.save();
    return app;
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
    const newEvent: EventItem = {
      id: `ev-${Date.now()}`,
      title: data.title || 'Новая встреча',
      category: (data.category || 'Прогулка') as EventCategory,
      description: data.description || '',
      date: data.date || 'Сегодня',
      time: data.time || '19:00',
      approximateArea: data.approximateArea || 'Центр города, ~1.5 км от вас',
      distanceKm: 1.2,
      occupiedSpots: 1,
      totalSpots: data.totalSpots || 4,
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
      imageUrl: data.imageUrl || './assets/images/hero_community_event_1794332913246.jpg',
      isToday: true,
      status: 'open',
      requirements: data.requirements || 'Пунктуальность и хорошее настроение',
      rules: ['Безопасность', 'Взаимное уважение'],
      approvedParticipantIds: [this.activeUserId],
      createdAt: new Date().toISOString(),
    };
    this.events.set(newEvent.id, newEvent);
    this.save();
    return newEvent;
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
