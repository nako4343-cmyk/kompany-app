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

class ApiService {
  private currentUserId: string = 'user-anna';

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('kompany_user_id', id);
  }

  getUserId(): string {
    const saved = localStorage.getItem('kompany_user_id');
    if (saved) {
      this.currentUserId = saved;
    }
    return this.currentUserId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
    }

    return res.json();
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
