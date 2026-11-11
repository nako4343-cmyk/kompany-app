import { 
  UserProfile, 
  EventItem, 
  EventApplication, 
  ChatMessage, 
  UserReview, 
  SafetyReport, 
  AppNotification,
  EventQuestion
} from '../types/index.ts';
import { clientLocalStore } from './clientLocalStore.ts';

// Check if app is hosted statically without a live Express server (e.g. GitHub Pages)
const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  window.location.hostname.includes('netlify.app') ||
  window.location.hostname.includes('surge.sh') ||
  window.location.hostname.includes('vercel.app') ||
  window.location.protocol === 'file:'
);

class ApiService {
  private currentUserId: string = 'user-anna';

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('kompany_user_id', id);
    clientLocalStore.activeUserId = id;
  }

  getUserId(): string {
    const saved = localStorage.getItem('kompany_user_id');
    if (saved) {
      this.currentUserId = saved;
    }
    return this.currentUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (isStaticHost) {
      return this.dispatchStatic(endpoint, options) as Promise<T>;
    }

    try {
      const headers = new Headers(options.headers || {});
      headers.set('x-user-id', this.getUserId());
      if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
      }

      const res = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (!res.ok) {
        // If server returned 404 on API endpoint, fall back to local store
        if (res.status === 404 || res.status === 502) {
          return this.dispatchStatic(endpoint, options) as Promise<T>;
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
      }

      return res.json();
    } catch (err) {
      // In case of any network failure (CORS/offline), use local store fallback
      console.warn(`API call ${endpoint} failed, using local store fallback:`, err);
      return this.dispatchStatic(endpoint, options) as Promise<T>;
    }
  }

  private async dispatchStatic(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = new URL(endpoint, 'http://localhost');
    const path = url.pathname;
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body as string) : {};

    // 1. Auth & Users
    if (path === '/api/auth/me') return clientLocalStore.getMe();
    if (path === '/api/auth/available-users') return clientLocalStore.getAvailableUsers();
    if (path === '/api/auth/switch-user') return clientLocalStore.switchUser(body.userId);
    if (path === '/api/auth/update-profile') return clientLocalStore.updateProfile(body);
    if (path.startsWith('/api/users/')) {
      const id = path.replace('/api/users/', '');
      return clientLocalStore.getUserProfile(id);
    }

    // 2. Events
    if (path === '/api/events') {
      if (method === 'POST') return clientLocalStore.createEvent(body);
      const category = url.searchParams.get('category') || undefined;
      const city = url.searchParams.get('city') || undefined;
      const onlyToday = url.searchParams.get('onlyToday') === 'true';
      const query = url.searchParams.get('q') || undefined;
      return clientLocalStore.getEvents({ category, city, onlyToday, query });
    }
    if (path.endsWith('/toggle-save')) {
      const eventId = path.split('/')[3];
      return clientLocalStore.toggleSaveEvent(eventId);
    }
    if (path.endsWith('/cancel')) {
      const eventId = path.split('/')[3];
      return clientLocalStore.cancelEvent(eventId, body.reason);
    }
    if (path.endsWith('/questions')) {
      const eventId = path.split('/')[3];
      if (method === 'POST') return clientLocalStore.askEventQuestion(eventId, body.question);
      return clientLocalStore.getEventQuestions(eventId);
    }
    if (path.includes('/questions/') && path.endsWith('/answer')) {
      const parts = path.split('/');
      const eventId = parts[3];
      const qId = parts[5];
      return clientLocalStore.answerEventQuestion(eventId, qId, body.answer);
    }
    if (path.endsWith('/apply')) {
      const eventId = path.split('/')[3];
      return clientLocalStore.applyToEvent(eventId, body.note);
    }
    if (path.endsWith('/applications')) {
      const eventId = path.split('/')[3];
      return clientLocalStore.getEventApplications(eventId);
    }
    if (path.startsWith('/api/applications/') && path.endsWith('/decision')) {
      const appId = path.split('/')[3];
      return clientLocalStore.decideApplication(appId, body.action);
    }
    if (path.endsWith('/chat')) {
      const eventId = path.split('/')[3];
      if (method === 'POST') return clientLocalStore.sendChatMessage(eventId, body.text);
      return clientLocalStore.getChatMessages(eventId);
    }
    if (path.endsWith('/attendance')) {
      const eventId = path.split('/')[3];
      return clientLocalStore.markAttendance(eventId, body.participantId, body.status);
    }
    if (path.startsWith('/api/events/')) {
      const id = path.replace('/api/events/', '');
      return clientLocalStore.getEvent(id);
    }

    // 3. Reviews & Reports
    if (path === '/api/reviews') return clientLocalStore.submitReview(body);
    if (path === '/api/reports') return clientLocalStore.submitReport(body);
    if (path === '/api/blocks') return clientLocalStore.blockUser(body.targetUserId);

    // 4. Notifications
    if (path === '/api/notifications') return clientLocalStore.getNotifications();
    if (path.startsWith('/api/notifications/') && path.endsWith('/read')) {
      const id = path.split('/')[3];
      return clientLocalStore.markNotificationRead(id);
    }

    // 5. AI Helpers
    if (path === '/api/ai/describe') return clientLocalStore.aiDescribeEvent(body);
    if (path === '/api/ai/recommendations') return clientLocalStore.aiGetRecommendations();

    // 6. Admin
    if (path === '/api/admin/overview') return clientLocalStore.getAdminOverview();
    if (path.includes('/admin/reports/') && path.endsWith('/action')) {
      return { success: true };
    }

    return {};
  }

  // Auth & User
  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/auth/me');
  }

  async getAvailableUsers(): Promise<UserProfile[]> {
    return this.request<UserProfile[]>('/api/auth/available-users');
  }

  async switchUser(userId: string): Promise<{ success: boolean; user: UserProfile }> {
    this.setUserId(userId);
    return this.request('/api/auth/switch-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return this.request('/api/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserProfile(id: string): Promise<{ profile: UserProfile; reviews: UserReview[] }> {
    return this.request(`/api/users/${id}`);
  }

  // Events
  async getEvents(filters?: {
    category?: string;
    city?: string;
    onlyToday?: boolean;
    query?: string;
  }): Promise<EventItem[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.city) params.set('city', filters.city);
    if (filters?.onlyToday) params.set('onlyToday', 'true');
    if (filters?.query) params.set('q', filters.query);

    return this.request(`/api/events?${params.toString()}`);
  }

  async getEvent(id: string): Promise<{ event: EventItem; myApplication: EventApplication | null }> {
    return this.request(`/api/events/${id}`);
  }

  async createEvent(data: any): Promise<EventItem> {
    return this.request('/api/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelEvent(id: string, reason?: string): Promise<EventItem> {
    return this.request(`/api/events/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async toggleSaveEvent(eventId: string): Promise<UserProfile> {
    return this.request(`/api/events/${eventId}/toggle-save`, {
      method: 'POST',
    });
  }

  async getEventQuestions(eventId: string): Promise<EventQuestion[]> {
    return this.request(`/api/events/${eventId}/questions`);
  }

  async askEventQuestion(eventId: string, question: string): Promise<EventQuestion> {
    return this.request(`/api/events/${eventId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async answerEventQuestion(eventId: string, questionId: string, answer: string): Promise<EventQuestion> {
    return this.request(`/api/events/${eventId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  // Applications
  async applyToEvent(eventId: string, note: string): Promise<EventApplication> {
    return this.request(`/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  async getEventApplications(eventId: string): Promise<EventApplication[]> {
    return this.request(`/api/events/${eventId}/applications`);
  }

  async decideApplication(appId: string, action: 'accept' | 'reject'): Promise<EventApplication> {
    return this.request(`/api/applications/${appId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Chat
  async getChatMessages(eventId: string): Promise<ChatMessage[]> {
    return this.request(`/api/events/${eventId}/chat`);
  }

  async sendChatMessage(eventId: string, text: string): Promise<ChatMessage> {
    return this.request(`/api/events/${eventId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Attendance & Reviews
  async markAttendance(eventId: string, participantId: string, status: 'attended' | 'no_show'): Promise<UserProfile> {
    return this.request(`/api/events/${eventId}/attendance`, {
      method: 'POST',
      body: JSON.stringify({ participantId, status }),
    });
  }

  async submitReview(data: {
    eventId: string;
    targetUserId: string;
    rating: number;
    tags: string[];
    text: string;
  }): Promise<UserReview> {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Safety & Reports
  async submitReport(data: {
    targetType: 'user' | 'event';
    targetId: string;
    reason: string;
    details: string;
  }): Promise<SafetyReport> {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async blockUser(targetUserId: string): Promise<UserProfile> {
    return this.request('/api/blocks', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
  }

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    return this.request('/api/notifications');
  }

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  // AI Helpers
  async aiDescribeEvent(params: {
    category: string;
    title: string;
    budget: string;
    targetParticipants: number;
    notes?: string;
  }) {
    return this.request<{
      description: string;
      suggestedAgenda: string[];
      suggestedIcebreaker: string;
      safetyTip: string;
    }>('/api/ai/describe', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async aiGetRecommendations(): Promise<Array<{ eventId: string; matchReason: string; matchScore: number }>> {
    return this.request('/api/ai/recommendations', {
      method: 'POST',
    });
  }

  // Admin
  async getAdminOverview(): Promise<any> {
    return this.request('/api/admin/overview');
  }

  async adminReportAction(reportId: string, action: 'dismiss' | 'block_user' | 'delete_event'): Promise<any> {
    return this.request(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }
}

export const api = new ApiService();
