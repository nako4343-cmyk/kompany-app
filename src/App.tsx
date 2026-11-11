import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Flame, Plus, Sparkles, ShieldCheck, 
  MapPin, MessageSquare, CheckCircle2, RefreshCw, Star, Palette, Lock,
  Camera, Eye, ChevronLeft, ChevronRight, X, MessageSquareQuote, QrCode, Share2
} from 'lucide-react';
import { Header, ColorPaletteId } from './components/Header.tsx';
import { BottomNav, NavTab } from './components/BottomNav.tsx';
import { EventCard } from './components/EventCard.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { CreateEventModal } from './components/CreateEventModal.tsx';
import { FindCompanyWizardModal } from './components/FindCompanyWizardModal.tsx';
import { ChatModal } from './components/ChatModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { MeetingReviewsSection } from './components/MeetingReviewsSection.tsx';
import { QuickFiltersBar, QuickFilterType } from './components/QuickFiltersBar.tsx';
import { DemoShareModal } from './components/DemoShareModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { SafetyGuideModal } from './components/SafetyGuideModal.tsx';
import { AdminPanelModal } from './components/AdminPanelModal.tsx';
import { MapView } from './components/MapView.tsx';
import { OnlineStatusBadge } from './components/OnlineStatusBadge.tsx';
import { EventItem, UserProfile, AppNotification, UserReview } from './types/index.ts';
import { api } from './services/api.ts';

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'Все', label: 'Все события' },
  { id: 'Сегодня', label: 'Сегодня вечером' },
  { id: 'Сохраненные', label: 'Сохраненные ★' },
  { id: 'День рождения', label: 'День рождения' },
  { id: 'Ресторан / Бар', label: 'Ресторан / Бар' },
  { id: 'Настольные игры', label: 'Настольные игры' },
  { id: 'Кино / Концерт', label: 'Кино / Концерт' },
  { id: 'Пикник / Шашлыки', label: 'Пикник / Шашлыки' },
  { id: 'Спорт', label: 'Спорт' },
  { id: 'Прогулка', label: 'Прогулка' },
  { id: 'Путешествие', label: 'Путешествие' },
];

const ALL_INTEREST_OPTIONS = [
  'Рестораны / Бары',
  'День рождения',
  'Настольные игры',
  'Кино / Концерт',
  'Пикник / Шашлыки',
  'Спорт',
  'Прогулка',
  'Путешествие',
  'Искусство',
  'Квиз / Интеллект',
  'Музыка',
  'Технологии',
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<Array<{ eventId: string; matchReason: string; matchScore: number }>>([]);
  
  // Color Palette State
  const [activePalette, setActivePalette] = useState<ColorPaletteId>(() => {
    const saved = localStorage.getItem('kompany_palette') as ColorPaletteId;
    return saved || 'sunset';
  });

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedViewMode, setFeedViewMode] = useState<'cards' | 'map'>('cards');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editBio, setEditBio] = useState<string>('');
  const [editCity, setEditCity] = useState<string>('');
  const [editOccupation, setEditOccupation] = useState<string>('');
  const [editCompanyOrIndustry, setEditCompanyOrIndustry] = useState<string>('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [activeProfilePhotoIndex, setActiveProfilePhotoIndex] = useState<number | null>(null);
  const [editInterests, setEditInterests] = useState<string[]>([]);

  // Modals state
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<EventItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showWizardModal, setShowWizardModal] = useState<boolean>(false);
  const [activeChatEventId, setActiveChatEventId] = useState<string | null>(null);
  const [inspectedUserId, setInspectedUserId] = useState<string | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{ eventId: string; targetUserId: string; targetUserName: string; eventName?: string } | null>(null);
  const [myReviews, setMyReviews] = useState<UserReview[]>([]);
  const [reportModalData, setReportModalData] = useState<{ targetType: 'user' | 'event'; targetId: string; targetTitle: string } | null>(null);
  const [showSafetyGuide, setShowSafetyGuide] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showDemoShareModal, setShowDemoShareModal] = useState<boolean>(false);

  // Sync palette to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', activePalette);
    localStorage.setItem('kompany_palette', activePalette);
  }, [activePalette]);

  // Initial load
  const loadData = async () => {
    try {
      const [me, userList, notifs] = await Promise.all([
        api.getMe(),
        api.getAvailableUsers(),
        api.getNotifications(),
      ]);
      setCurrentUser(me);
      setAvailableUsers(userList);
      setNotifications(notifs);

      if (me) {
        api.getUserProfile(me.id).then(res => setMyReviews(res.reviews || [])).catch(() => {});
      }

      const evList = await api.getEvents({
        category: (selectedCategory === 'Сегодня' || selectedCategory === 'Сохраненные') ? undefined : selectedCategory,
        onlyToday: selectedCategory === 'Сегодня' || activeTab === 'today',
        query: searchQuery || undefined,
      });
      setEvents(evList);

      api.aiGetRecommendations().then(recs => setAiRecommendations(recs)).catch(() => {});
    } catch (err) {
      console.error('Initial load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, activeTab, searchQuery]);

  const handleToggleSaveEvent = async (eventId: string) => {
    try {
      const updatedUser = await api.toggleSaveEvent(eventId);
      setCurrentUser(updatedUser);
    } catch (err) {
      console.error('Failed to toggle save event:', err);
    }
  };

  const handleStartEditProfile = () => {
    if (!currentUser) return;
    setEditBio(currentUser.bio || '');
    setEditCity(currentUser.city || 'Москва');
    setEditOccupation(currentUser.occupation || '');
    setEditCompanyOrIndustry(currentUser.companyOrIndustry || '');
    setEditPhotos(currentUser.photos && currentUser.photos.length > 0 ? currentUser.photos : [currentUser.avatarUrl]);
    setNewPhotoUrl('');
    setEditInterests(currentUser.interests || []);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await api.updateProfile({
        bio: editBio,
        city: editCity,
        occupation: editOccupation,
        companyOrIndustry: editCompanyOrIndustry,
        photos: editPhotos,
        interests: editInterests,
      });
      setCurrentUser(updated);
      setIsEditingProfile(false);
      api.aiGetRecommendations().then(recs => setAiRecommendations(recs)).catch(() => {});
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setIsLoading(true);
    setIsEditingProfile(false);
    try {
      const res = await api.switchUser(userId);
      setCurrentUser(res.user);
      await loadData();
    } catch (err) {
      console.error('Switch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    api.markNotificationRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (notif.relatedEventId) {
      api.getEvent(notif.relatedEventId).then(data => {
        setSelectedEventForDetail(data.event);
      });
    }
  };

  if (!currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)' }}
      >
        <div className="flex items-center gap-3 text-sm font-medium">
          <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span>Загрузка Kompany...</span>
        </div>
      </div>
    );
  }

  const todayEvents = useMemo(() => events.filter(e => e.isToday), [events]);
  const savedEvents = useMemo(() => events.filter(e => currentUser.savedEventIds?.includes(e.id)), [events, currentUser.savedEventIds]);
  
  const baseFeedEvents = useMemo(() => {
    if (activeTab === 'today') return todayEvents;
    if (selectedCategory === 'Сохраненные') return savedEvents;
    return events;
  }, [activeTab, selectedCategory, todayEvents, savedEvents, events]);

  // Helper function to test interest match for an event against user profile
  const isEventInterestMatch = (ev: EventItem, user: UserProfile): boolean => {
    const userInterests = (user.interests || []).map(i => i.toLowerCase());
    const cat = ev.category.toLowerCase();
    const title = ev.title.toLowerCase();
    const desc = ev.description.toLowerCase();
    const vibe = (ev.vibe || '').toLowerCase();
    return userInterests.some(i => 
      cat.includes(i) || i.includes(cat) || 
      title.includes(i) || 
      desc.includes(i) || 
      vibe.includes(i)
    );
  };

  // Pre-calculate counts for quick filters
  const quickFilterCounts = useMemo(() => {
    const nearbyCount = baseFeedEvents.filter(e => e.distanceKm <= 3.0).length;
    const popularCount = baseFeedEvents.filter(e => e.occupiedSpots >= 2).length;
    const interestsCount = baseFeedEvents.filter(e => isEventInterestMatch(e, currentUser)).length;

    return {
      all: baseFeedEvents.length,
      nearby: nearbyCount > 0 ? nearbyCount : baseFeedEvents.length,
      popular: popularCount > 0 ? popularCount : baseFeedEvents.length,
      interests: interestsCount > 0 ? interestsCount : baseFeedEvents.length,
    };
  }, [baseFeedEvents, currentUser]);

  // Filtered and sorted displayEvents according to quickFilter
  const displayEvents = useMemo(() => {
    let list = [...baseFeedEvents];

    if (quickFilter === 'nearby') {
      // 'только поблизости': events within 3.0 km or closest first
      const nearbyList = list.filter(e => e.distanceKm <= 3.0);
      const target = nearbyList.length > 0 ? nearbyList : list;
      return target.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    if (quickFilter === 'popular') {
      // 'самые популярные': sort by number of occupied spots and occupancy rate
      return list.sort((a, b) => {
        const rateA = a.occupiedSpots / a.totalSpots;
        const rateB = b.occupiedSpots / b.totalSpots;
        if (b.occupiedSpots !== a.occupiedSpots) {
          return b.occupiedSpots - a.occupiedSpots;
        }
        return rateB - rateA;
      });
    }

    if (quickFilter === 'interests') {
      // 'наиболее подходящие по интересам': match against user.interests & AI recommendations
      const userInterests = (currentUser.interests || []).map(i => i.toLowerCase());

      const getScore = (ev: EventItem): number => {
        let score = 0;
        const cat = ev.category.toLowerCase();
        const title = ev.title.toLowerCase();
        const desc = ev.description.toLowerCase();
        const vibe = (ev.vibe || '').toLowerCase();

        for (const interest of userInterests) {
          if (cat.includes(interest) || interest.includes(cat)) score += 10;
          if (title.includes(interest) || desc.includes(interest)) score += 4;
          if (vibe.includes(interest)) score += 3;
        }

        const rec = aiRecommendations.find(r => r.eventId === ev.id);
        if (rec) score += 8;

        return score;
      };

      const matched = list.filter(e => isEventInterestMatch(e, currentUser));
      const target = matched.length > 0 ? matched : list;
      return target.sort((a, b) => getScore(b) - getScore(a));
    }

    return list;
  }, [baseFeedEvents, quickFilter, currentUser, aiRecommendations]);

  const myOrganizedEvents = events.filter(e => e.organizerId === currentUser.id);
  const myJoinedEvents = events.filter(e => e.approvedParticipantIds.includes(currentUser.id));

  return (
    <div
      id="top"
      className="min-h-screen pb-28 font-sans antialiased transition-colors duration-250"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* 1. COMPACT ROLE SWITCHER BAR FOR TESTING */}
      <aside
        aria-label="Панель переключения ролей"
        className="text-white text-[11px] py-2 px-4 border-b border-white/10"
        style={{ backgroundColor: 'var(--hero-grad-from)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white/80">
            <span className="font-bold text-white">Тест ролей и приватности:</span>
            <span className="hidden sm:inline text-white/60">
              Переключайте аккаунт, чтобы проверить скрытие адреса до одобрения заявки
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {availableUsers.map(u => (
              <button
                key={u.id}
                onClick={() => handleSwitchUser(u.id)}
                className="px-3 py-1 rounded-xl text-xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: u.id === currentUser.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  fontWeight: u.id === currentUser.id ? 700 : 500,
                }}
              >
                {u.id === 'user-anna' ? 'Анна (Организатор)' : 
                 u.id === 'user-mikhail' ? 'Михаил (Кандидат)' :
                 u.id === 'user-elena' ? 'Елена (Гость)' : 'Модератор'}
              </button>
            ))}

            <button
              onClick={() => setShowDemoShareModal(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-white/20 hover:bg-white/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ml-1 shadow-xs active:scale-95"
              title="Поделиться демо с друзьями"
            >
              <QrCode className="w-3.5 h-3.5 text-amber-300" />
              <span>Показать друзьям (QR)</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. HEADER WITH LIVE PALETTE SWITCHER */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onOpenSafetyGuide={() => setShowSafetyGuide(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenDemoShare={() => setShowDemoShareModal(true)}
        activePalette={activePalette}
        onChangePalette={setActivePalette}
      />

      <main className="max-w-6xl mx-auto px-4 pt-5 sm:pt-7">
        <AnimatePresence mode="wait">
          {/* VIEW 1: FEED OR TODAY TAB */}
          {(activeTab === 'feed' || activeTab === 'today') && (
            <motion.div
              key="feed-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-7"
            >
            {/* MODERN EDITORIAL BENTO HERO */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Left 8-col Main Hero Visual Card */}
              <div
                className="lg:col-span-8 relative rounded-3xl overflow-hidden text-white shadow-xl min-h-[300px] sm:min-h-[340px] flex flex-col justify-between p-6 sm:p-9"
                style={{
                  background: `linear-gradient(135deg, var(--hero-grad-from) 0%, var(--hero-grad-via) 100%)`,
                }}
              >
                <img
                  src="/src/assets/images/hero_community_event_1794332913246.jpg"
                  alt="Дружеская компания за ужином"
                  className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white/90 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Приватный поиск компании</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white/70">Без дейтинга</span>
                  </div>
                </div>

                <div className="relative z-10 max-w-xl space-y-4 my-auto pt-6">
                  <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white leading-[1.15] text-balance">
                    Своя компания на любой праздник и вечер
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg">
                    Собирайте людей в ресторан, на день рождения, концерт или настольные игры. Точный адрес и контакты открываются только тем, кого вы лично одобрите.
                  </p>

                  {/* Primary Action Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowWizardModal(true)}
                      className="px-5 py-3.5 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        boxShadow: '0 10px 25px -5px var(--badge-glow)',
                      }}
                    >
                      <Search className="w-4 h-4" />
                      <span>Найти компанию</span>
                    </button>

                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Создать событие</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 4-col Bento Side Card: Tonight Spotlight & Color Vibe Selector */}
              <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                {/* Tonight Card */}
                <div
                  onClick={() => setActiveTab('today')}
                  className="flex-1 p-6 rounded-3xl border cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <Flame className="w-4 h-4" />
                      <span>Компания на сегодня</span>
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {todayEvents.length} активных
                    </span>
                  </div>

                  <div className="my-3">
                    <h2
                      className="text-lg font-display font-bold leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Свободны сегодня вечером?
                    </h2>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Посмотрите спонтанные сборы в бары, на настолки и ужины, которые начнутся в ближайшие часы.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t text-xs font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Смотреть планы на вечер</span>
                    <span style={{ color: 'var(--accent-primary)' }}>→</span>
                  </div>
                </div>

                {/* Interactive Color Theme Playground Card */}
                <div
                  className="p-5 rounded-3xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Цветовая атмосфера интерфейса
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sunset' as ColorPaletteId, label: 'Терракота', color: '#E04F33', sub: 'Уютная' },
                      { id: 'cobalt' as ColorPaletteId, label: 'Кобальт', color: '#3B44F6', sub: 'Свежая' },
                      { id: 'midnight' as ColorPaletteId, label: 'Лаунж', color: '#161922', sub: 'Темная' },
                    ].map((theme) => {
                      const isActive = activePalette === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => setActivePalette(theme.id)}
                          className="p-2.5 rounded-2xl border text-left transition-all cursor-pointer"
                          style={{
                            backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                            borderColor: isActive ? 'var(--accent-primary)' : 'transparent',
                          }}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: theme.color }}
                            />
                            <span
                              className="text-xs font-bold truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {theme.label}
                            </span>
                          </div>
                          <span
                            className="text-[10px] block"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {theme.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* AI SMART MATCHES */}
            {aiRecommendations.length > 0 && activeTab === 'feed' && (
              <section
                aria-labelledby="ai-recommendations-heading"
                className="p-5 sm:p-6 rounded-3xl border shadow-xs"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-2xl text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2
                        id="ai-recommendations-heading"
                        className="text-sm font-display font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Персональный подбор для вас
                      </h2>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        На основе ваших интересов: {currentUser.interests.join(' · ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {aiRecommendations.map(rec => {
                    const matchedEvent = events.find(e => e.id === rec.eventId);
                    if (!matchedEvent) return null;
                    return (
                      <div
                        key={rec.eventId}
                        onClick={() => setSelectedEventForDetail(matchedEvent)}
                        className="p-3.5 rounded-2xl border cursor-pointer transition-all hover:shadow-md flex items-center gap-3.5"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <img
                          src={matchedEvent.imageUrl}
                          alt={matchedEvent.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-xs font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {matchedEvent.title}
                          </div>
                          <div
                            className="text-[11px] font-medium line-clamp-1 mt-0.5"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            {rec.matchReason}
                          </div>
                          <div
                            className="text-[11px] mt-1 tabular-nums"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {matchedEvent.approximateArea} · {matchedEvent.budget}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SEARCH & INTERACTIVE FILTER SEGMENT BAR */}
            <div className="space-y-3.5">
              <div className="relative">
                <Search
                  className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по событиям, району (Хамовники, Арбат) или формату..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border text-xs font-medium focus:outline-none transition-colors shadow-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Interactive Category Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (cat.id === 'Сегодня') setActiveTab('today');
                        else if (activeTab === 'today') setActiveTab('feed');
                      }}
                      className="px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EVENTS GRID / MAP VIEW */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2.5">
                  <h2
                    className="text-lg font-display font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activeTab === 'today' ? 'Планы на сегодня вечером' : 'Ближайшие компании'}
                  </h2>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    · {displayEvents.length}
                  </span>
                </div>

                {/* View Mode Segmented Switcher */}
                <div
                  className="flex items-center p-1 rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <button
                    onClick={() => setFeedViewMode('cards')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: feedViewMode === 'cards' ? 'var(--bg-surface)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Карточки
                  </button>
                  <button
                    onClick={() => setFeedViewMode('map')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: feedViewMode === 'map' ? 'var(--bg-surface)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    <span>Радар карты</span>
                  </button>
                </div>
              </div>

              {/* Quick Filters Bar directly above events grid */}
              <QuickFiltersBar
                activeFilter={quickFilter}
                onChangeFilter={setQuickFilter}
                counts={quickFilterCounts}
                currentUserInterests={currentUser.interests}
                totalEventsCount={baseFeedEvents.length}
                filteredCount={displayEvents.length}
              />

              {feedViewMode === 'map' ? (
                <MapView
                  events={displayEvents}
                  onSelectEvent={setSelectedEventForDetail}
                />
              ) : displayEvents.length === 0 ? (
                <div
                  className="p-12 text-center rounded-3xl border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <p className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Мероприятия не найдены
                  </p>
                  <p className="text-xs max-w-sm mx-auto mb-5" style={{ color: 'var(--text-secondary)' }}>
                    {quickFilter !== 'all'
                      ? 'В выбранном фильтре нет событий. Попробуйте сбросить быстрый фильтр или создать собственную встречу!'
                      : 'Попробуйте выбрать другую категорию или создайте собственную встречу за 1 минуту!'}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {quickFilter !== 'all' && (
                      <button
                        onClick={() => setQuickFilter('all')}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Сбросить фильтр
                      </button>
                    )}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 text-white text-xs font-bold rounded-2xl cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Создать мероприятие
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUser={currentUser}
                      onOpenDetails={setSelectedEventForDetail}
                      onToggleSave={handleToggleSaveEvent}
                      isRecommended={quickFilter === 'interests' && isEventInterestMatch(event, currentUser)}
                      matchReason={
                        quickFilter === 'interests' && isEventInterestMatch(event, currentUser)
                          ? `Совпадает с вашими интересами (${event.category})`
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MY EVENTS & CHATS TAB */}
        {activeTab === 'chats' && (
          <motion.div
            key="chats-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div>
              <h1
                className="text-xl font-display font-bold mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Мои события и закрытые чаты
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Доступ к чату и точному адресу открыт только организатору и подтвержденным участникам.
              </p>
            </div>

            {/* Organized by me */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Я организую ({myOrganizedEvents.length})
              </h2>

              {myOrganizedEvents.length === 0 ? (
                <div
                  className="p-6 rounded-3xl border text-center text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Вы пока не создали ни одного мероприятия.
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrganizedEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div
                        onClick={() => setSelectedEventForDetail(ev)}
                        className="flex items-center gap-3.5 cursor-pointer"
                      >
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover shrink-0"
                        />
                        <div>
                          <span
                            className="text-sm font-bold block line-clamp-1"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {ev.title}
                          </span>
                          <span className="text-xs block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {ev.isToday ? 'Сегодня' : ev.date} в {ev.time} · {ev.approximateArea}
                          </span>
                          <span
                            className="text-xs font-bold block mt-1 tabular-nums"
                            style={{ color: 'var(--accent-primary)' }}
                          >
                            Участников: {ev.occupiedSpots} из {ev.totalSpots}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEventForDetail(ev)}
                          className="px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Заявки и детали
                        </button>
                        <button
                          onClick={() => setActiveChatEventId(ev.id)}
                          className="px-4 py-2.5 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Открыть чат</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Joined by me */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Я участвую ({myJoinedEvents.length})
              </h2>

              {myJoinedEvents.length === 0 ? (
                <div
                  className="p-6 rounded-3xl border text-center text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Вы пока не подтверждены ни в одном мероприятии. Подайте заявку в ленте!
                </div>
              ) : (
                <div className="space-y-3">
                  {myJoinedEvents.map(ev => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div
                        onClick={() => setSelectedEventForDetail(ev)}
                        className="flex items-center gap-3.5 cursor-pointer"
                      >
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-2xl object-cover shrink-0"
                        />
                        <div>
                          <span
                            className="text-sm font-bold block line-clamp-1"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {ev.title}
                          </span>
                          <span className="text-xs block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {ev.isToday ? 'Сегодня' : ev.date} в {ev.time} · Орг: {ev.organizer.name}
                          </span>
                          <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Точный адрес и чат доступны
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedEventForDetail(ev)}
                          className="px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Точный адрес
                        </button>
                        <button
                          onClick={() => setActiveChatEventId(ev.id)}
                          className="px-4 py-2.5 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Чат гостей</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: PROFILE TAB */}
        {activeTab === 'profile' && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="max-w-xl mx-auto space-y-6"
          >
            <div
              className="p-6 rounded-3xl border shadow-xs space-y-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"
                    title="Онлайн сейчас"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1
                      className="text-xl font-display font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentUser.name}, {currentUser.age}
                    </h1>
                    <OnlineStatusBadge
                      status="online"
                      lastSeen="Онлайн сейчас"
                      size="sm"
                    />
                  </div>
                  {currentUser.occupation && (
                    <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
                      <span>💼 {currentUser.occupation}</span>
                      {currentUser.companyOrIndustry && (
                        <>
                          <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{currentUser.companyOrIndustry}</span>
                        </>
                      )}
                    </div>
                  )}
                  <span className="text-xs block mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {currentUser.city} · {currentUser.email}
                  </span>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    {currentUser.isPhoneVerified && (
                      <span className="font-semibold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Телефон подтвержден
                      </span>
                    )}
                    {currentUser.isIdentityVerified && (
                      <span className="font-semibold text-sky-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Проверенный профиль
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {currentUser.bio && (
                <div
                  className="p-4 rounded-2xl text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  "{currentUser.bio}"
                </div>
              )}

              {/* My Photos Gallery */}
              {(() => {
                const photos = currentUser.photos && currentUser.photos.length > 0
                  ? currentUser.photos
                  : [currentUser.avatarUrl];

                return (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Camera className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Мои фотографии ({photos.length})</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleStartEditProfile}
                        className="text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        + Добавить фото
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photos.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveProfilePhotoIndex(idx)}
                          className="group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer hover:opacity-95 transition-all shadow-xs"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <img
                            src={p}
                            alt={`Фото ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="w-5 h-5 text-white drop-shadow-md" />
                          </div>
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                              Главное
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Factual Reliability Metrics */}
              <div
                className="p-5 rounded-3xl border space-y-3.5"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    <span>Репутация и фактическая явка</span>
                  </span>
                  <div className="flex items-center gap-1 text-sm font-extrabold text-amber-500 tabular-nums">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{currentUser.reliability.score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div
                    className="p-3 rounded-2xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span
                      className="text-xl font-display font-bold block tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentUser.reliability.attendanceRate}%
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Явка на встречи
                    </span>
                  </div>

                  <div
                    className="p-3 rounded-2xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span
                      className="text-xl font-display font-bold block tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentUser.reliability.eventsAttended}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Посещено
                    </span>
                  </div>

                  <div
                    className="p-3 rounded-2xl border"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span
                      className="text-xl font-display font-bold block tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentUser.reliability.eventsOrganized}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Организовано
                    </span>
                  </div>
                </div>

                <div className="text-[11px] flex justify-between px-1 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  <span>Отмен: <b>{currentUser.reliability.cancellations}</b></span>
                  <span>Неявок: <b>{currentUser.reliability.noShows}</b></span>
                  <span>Положительных отзывов: <b>{currentUser.reliability.positiveReviewsCount}</b></span>
                </div>
              </div>

              {/* Interests & Profile Editor */}
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                      Интересы для умных рекомендаций:
                    </span>
                    <button
                      type="button"
                      onClick={handleStartEditProfile}
                      className="text-xs font-bold hover:underline cursor-pointer"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      Изменить профиль и интересы
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {currentUser.interests.join(' · ')}
                  </div>
                </div>
              ) : (
                <div
                  className="p-4 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Редактирование профиля и интересов
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Город
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={e => setEditCity(e.target.value)}
                        className="w-full p-2.5 rounded-xl border text-xs"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Чем занимаетесь / Профессия
                      </label>
                      <input
                        type="text"
                        value={editOccupation}
                        onChange={e => setEditOccupation(e.target.value)}
                        placeholder="Например: Product Manager, Архитектор, Студент"
                        className="w-full p-2.5 rounded-xl border text-xs"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Сфера деятельности или компания (опционально)
                    </label>
                    <input
                      type="text"
                      value={editCompanyOrIndustry}
                      onChange={e => setEditCompanyOrIndustry(e.target.value)}
                      placeholder="Например: IT / Стартапы, Дизайн, Медицина"
                      className="w-full p-2.5 rounded-xl border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Edit Photos Manager */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                      Фотографии профиля ({editPhotos.length})
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={newPhotoUrl}
                        onChange={e => setNewPhotoUrl(e.target.value)}
                        placeholder="Вставьте ссылку на фото (https://...)"
                        className="flex-1 p-2.5 rounded-xl border text-xs"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPhotoUrl.trim()) return;
                          setEditPhotos(prev => [...prev, newPhotoUrl.trim()]);
                          setNewPhotoUrl('');
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-transform active:scale-95"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        + Добавить
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {editPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-16 rounded-xl overflow-hidden border group"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        >
                          <img
                            src={photo}
                            alt={`Фото ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {editPhotos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setEditPhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Удалить фото"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      О себе (чтобы людям было легко познакомиться)
                    </label>
                    <textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      className="w-full h-20 p-2.5 rounded-xl border text-xs resize-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Выберите интересы (влияют на AI-подбор):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_INTEREST_OPTIONS.map(opt => {
                        const selected = editInterests.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setEditInterests(prev =>
                                prev.includes(opt) ? prev.filter(i => i !== opt) : [...prev, opt]
                              );
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
                            style={{
                              backgroundColor: selected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              color: selected ? '#FFFFFF' : 'var(--text-secondary)',
                              borderColor: selected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Events Quick Access */}
              <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Сохраненные мероприятия ({savedEvents.length})
                </span>
                {savedEvents.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Нажмите на иконку закладки на любой карточке, чтобы сохранить событие на потом.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEventForDetail(ev)}
                        className="p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-xs"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={ev.imageUrl} alt={ev.title} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate" style={{ color: 'var(--text-primary)' }}>
                              {ev.title}
                            </span>
                            <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>
                              {ev.isToday ? 'Сегодня' : ev.date} в {ev.time} · {ev.approximateArea}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: 'var(--accent-primary)' }}>
                          Открыть →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meeting Reviews Section in user's own profile */}
              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <MeetingReviewsSection
                  reviews={myReviews}
                  targetUserName={currentUser.name}
                  targetUserId={currentUser.id}
                  isCurrentUser={true}
                  onSelectAuthor={(authorId) => setInspectedUserId(authorId)}
                />
              </div>

              {/* Action to leave review for a fellow participant */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => setReviewModalData({
                    eventId: 'ev-1',
                    targetUserId: currentUser.id === 'user-anna' ? 'user-mikhail' : 'user-anna',
                    targetUserName: currentUser.id === 'user-anna' ? 'Михаила' : 'Анны',
                    eventName: 'День рождения в ресторане',
                  })}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <MessageSquareQuote className="w-4 h-4" />
                  <span>Оставить отзыв об участнике совместной встречи</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* 3. FLOATING BOTTOM NAVIGATION DOCK */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'create') setShowCreateModal(true);
          else setActiveTab(tab);
        }}
        unreadChatCount={notifications.filter(n => !n.isRead && n.type === 'chat_message').length}
      />

      {/* 4. MODALS & DRAWERS */}
      {selectedEventForDetail && (
        <EventDetailModal
          event={selectedEventForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedEventForDetail(null)}
          onOpenChat={(id) => {
            setSelectedEventForDetail(null);
            setActiveChatEventId(id);
          }}
          onOpenUserProfile={(id) => setInspectedUserId(id)}
          onOpenReport={(type, id, title) => setReportModalData({ targetType: type, targetId: id, targetTitle: title })}
          onEventUpdated={loadData}
        />
      )}

      {showCreateModal && (
        <CreateEventModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
      )}

      {showWizardModal && (
        <FindCompanyWizardModal
          events={events}
          onClose={() => setShowWizardModal(false)}
          onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
        />
      )}

      {activeChatEventId && (
        <ChatModal
          eventId={activeChatEventId}
          currentUser={currentUser}
          onClose={() => setActiveChatEventId(null)}
        />
      )}

      {inspectedUserId && (
        <UserProfileModal
          userId={inspectedUserId}
          currentUserId={currentUser.id}
          onClose={() => setInspectedUserId(null)}
          onOpenReport={(type, id, title) => setReportModalData({ targetType: type, targetId: id, targetTitle: title })}
          onUserBlocked={loadData}
          onOpenReview={(targetUserId, targetUserName) => {
            setReviewModalData({
              eventId: 'ev-1',
              targetUserId,
              targetUserName,
              eventName: 'Совместное мероприятие',
            });
          }}
          onSelectUser={(userId) => {
            setInspectedUserId(userId);
          }}
        />
      )}

      {reviewModalData && (
        <ReviewModal
          eventId={reviewModalData.eventId}
          targetUserId={reviewModalData.targetUserId}
          targetUserName={reviewModalData.targetUserName}
          eventName={reviewModalData.eventName}
          onClose={() => setReviewModalData(null)}
          onSubmitted={() => {
            if (currentUser) {
              api.getUserProfile(currentUser.id).then(r => setMyReviews(r.reviews || [])).catch(() => {});
            }
            loadData();
          }}
        />
      )}

      {reportModalData && (
        <ReportModal
          targetType={reportModalData.targetType}
          targetId={reportModalData.targetId}
          targetTitle={reportModalData.targetTitle}
          onClose={() => setReportModalData(null)}
        />
      )}

      {showSafetyGuide && (
        <SafetyGuideModal
          onClose={() => setShowSafetyGuide(false)}
        />
      )}

      {showAdminModal && (
        <AdminPanelModal
          onClose={() => setShowAdminModal(false)}
          onActionComplete={loadData}
        />
      )}

      {showDemoShareModal && (
        <DemoShareModal
          onClose={() => setShowDemoShareModal(false)}
          sharedUrl="https://ais-pre-bnkp6fp5swj47aabsnu4xo-113973127590.europe-west2.run.app"
        />
      )}

      {/* Fullscreen Photo Lightbox Modal for My Profile Photos */}
      {activeProfilePhotoIndex !== null && (() => {
        const photoList = (currentUser.photos && currentUser.photos.length > 0)
          ? currentUser.photos
          : [currentUser.avatarUrl];
        const currentPhoto = photoList[activeProfilePhotoIndex] || photoList[0];

        return (
          <div
            className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setActiveProfilePhotoIndex(null)}
          >
            {/* Top Lightbox Bar */}
            <div
              className="flex items-center justify-between text-white text-xs max-w-4xl mx-auto w-full pt-1"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <div>
                  <span className="font-bold block">{currentUser.name}</span>
                  <span className="text-[11px] text-white/70 tabular-nums">
                    Фотография {activeProfilePhotoIndex + 1} из {photoList.length}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveProfilePhotoIndex(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage Image & Navigation */}
            <div
              className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-4"
              onClick={e => e.stopPropagation()}
            >
              {photoList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveProfilePhotoIndex((activeProfilePhotoIndex - 1 + photoList.length) % photoList.length)}
                  className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Предыдущее фото"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black/40">
                <img
                  src={currentPhoto}
                  alt={`${currentUser.name} полноразмерное фото`}
                  referrerPolicy="no-referrer"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
                />
              </div>

              {photoList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveProfilePhotoIndex((activeProfilePhotoIndex + 1) % photoList.length)}
                  className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Следующее фото"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {photoList.length > 1 && (
              <div
                className="flex items-center justify-center gap-2 max-w-4xl mx-auto w-full overflow-x-auto py-2"
                onClick={e => e.stopPropagation()}
              >
                {photoList.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveProfilePhotoIndex(idx)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeProfilePhotoIndex === idx
                        ? 'border-white scale-105 shadow-md'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Миниатюра ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
