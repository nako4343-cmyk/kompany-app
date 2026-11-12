import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Flame, Plus, Compass, ShieldCheck, Briefcase,
  MapPin, MessageSquare, CheckCircle2, RefreshCw, Star, Palette, Lock,
  Camera, Eye, ChevronLeft, ChevronRight, X, MessageSquareQuote, QrCode, Share2,
  Clock, XCircle, Navigation, UserPlus, Archive, CalendarCheck, Sparkles
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
import { InviteUsersModal } from './components/InviteUsersModal.tsx';
import { EventItem, UserProfile, AppNotification, UserReview } from './types/index.ts';
import { api } from './services/api.ts';
import { clientLocalStore } from './services/clientLocalStore.ts';
import { AppLanguage, UI_TEXT, translateCategory } from './i18n/translations.ts';

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'Все', label: 'Все события' },
  { id: 'Сегодня', label: 'Сегодня вечером' },
  { id: 'Сохраненные', label: 'Сохраненные' },
  { id: 'День рождения', label: 'День рождения' },
  { id: 'Свадьба', label: 'Свадьба' },
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
  'Свадьба',
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

// Helper function to test interest match for an event against user profile
const isEventInterestMatch = (ev: EventItem, user: UserProfile | null): boolean => {
  if (!user) return false;
  const userInterests = (user.interests || []).map(i => i.toLowerCase());
  const cat = (ev.category || '').toLowerCase();
  const title = (ev.title || '').toLowerCase();
  const desc = (ev.description || '').toLowerCase();
  const vibe = (ev.vibe || '').toLowerCase();
  return userInterests.some(i => 
    cat.includes(i) || i.includes(cat) || 
    title.includes(i) || 
    desc.includes(i) || 
    vibe.includes(i)
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => clientLocalStore.getMe());
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(() => clientLocalStore.getAvailableUsers());
  const [events, setEvents] = useState<EventItem[]>(() => clientLocalStore.getEvents());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => clientLocalStore.getNotifications());
  const [aiRecommendations, setAiRecommendations] = useState<Array<{ eventId: string; matchReason: string; matchScore: number }>>(() => clientLocalStore.aiGetRecommendations());
  
  // Color Palette State
  const [activePalette, setActivePalette] = useState<ColorPaletteId>(() => {
    try {
      const saved = localStorage.getItem('kompany_palette') as ColorPaletteId;
      return saved || 'sunset';
    } catch {
      return 'sunset';
    }
  });

  // Application Language State ('ru' | 'en')
  const [lang, setLang] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem('kompany_lang') as AppLanguage;
      return saved === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  });

  const handleChangeLang = (nextLang: AppLanguage) => {
    setLang(nextLang);
    try {
      localStorage.setItem('kompany_lang', nextLang);
    } catch {
      // ignore storage errors
    }
  };

  const t = UI_TEXT[lang];

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<NavTab>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedViewMode, setFeedViewMode] = useState<'cards' | 'map'>('cards');
  const [participationStatusFilter, setParticipationStatusFilter] = useState<'all' | 'accepted' | 'pending' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Seekers & Invite Modal State
  const [seekers, setSeekers] = useState<UserProfile[]>(() => clientLocalStore.getSeekers());
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteModalEventId, setInviteModalEventId] = useState<string | undefined>(undefined);
  const [inviteNoteDraft, setInviteNoteDraft] = useState<string>(
    () => clientLocalStore.getMe().openToInvitesNote || 'Открыта к приглашениям на настольные игры, гастро-ужины и интересные события!'
  );

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
  const [myReviews, setMyReviews] = useState<UserReview[]>(() => {
    const me = clientLocalStore.getMe();
    return me ? clientLocalStore.getUserProfile(me.id).reviews : [];
  });
  const [reportModalData, setReportModalData] = useState<{ targetType: 'user' | 'event'; targetId: string; targetTitle: string } | null>(null);
  const [showSafetyGuide, setShowSafetyGuide] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [showDemoShareModal, setShowDemoShareModal] = useState<boolean>(false);

  // Sync palette to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-palette', activePalette);
    try {
      localStorage.setItem('kompany_palette', activePalette);
    } catch {
      // ignore storage errors in private mode
    }
  }, [activePalette]);

  // Initial load
  const loadData = async () => {
    try {
      const [me, userList, notifs] = await Promise.all([
        api.getMe(),
        api.getAvailableUsers(),
        api.getNotifications(),
      ]);
      if (me) setCurrentUser(me);
      if (Array.isArray(userList)) setAvailableUsers(userList);
      if (Array.isArray(notifs)) setNotifications(notifs);

      if (me) {
        api.getUserProfile(me.id).then(res => setMyReviews(res.reviews || [])).catch(() => {});
      }

      const evList = await api.getEvents({
        category: (selectedCategory === 'Сегодня' || selectedCategory === 'Сохраненные') ? undefined : selectedCategory,
        onlyToday: selectedCategory === 'Сегодня' || activeTab === 'today',
        query: searchQuery || undefined,
      });
      if (Array.isArray(evList)) setEvents(evList);
      setSeekers(clientLocalStore.getSeekers());

      api.aiGetRecommendations().then(recs => {
        if (Array.isArray(recs)) setAiRecommendations(recs);
      }).catch(() => {});
    } catch (err) {
      console.warn('Initial load handled with fallback:', err);
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

  const handleToggleOpenToInvites = async (openToInvites: boolean) => {
    try {
      const updated = await api.updateProfile({
        openToInvites,
        openToInvitesNote: inviteNoteDraft,
      });
      setCurrentUser({ ...updated });
      setSeekers(clientLocalStore.getSeekers());
    } catch (err) {
      console.error('Failed to toggle openToInvites:', err);
    }
  };

  const handleSaveInvitePreferences = async (gender?: 'female' | 'male', note?: string) => {
    try {
      const updated = await api.updateProfile({
        gender: gender ?? currentUser.gender,
        openToInvitesNote: note ?? inviteNoteDraft,
        openToInvites: true,
      });
      setCurrentUser({ ...updated });
      setSeekers(clientLocalStore.getSeekers());
    } catch (err) {
      console.error('Failed to save invite preferences:', err);
    }
  };

  const handleInviteUserFromList = async (eventId: string, targetUserId: string, note?: string) => {
    await api.inviteUserToEvent(eventId, targetUserId, note);
    await loadData();
  };

  const handleRejectParticipation = async (eventId: string) => {
    await api.rejectMyParticipation(eventId);
    await loadData();
  };

  const handleRespondToApplication = async (appId: string, action: 'accept' | 'reject') => {
    await api.decideApplication(appId, action);
    await loadData();
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
      setInviteNoteDraft(res.user.openToInvitesNote || '');
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

  const handleMarkAllNotificationsRead = () => {
    notifications.forEach(n => {
      if (!n.isRead) api.markNotificationRead(n.id);
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Separate active upcoming/today events from past events that moved to Archive after their day passed
  const activeEvents = useMemo(() => events.filter(e => !e.isArchived), [events]);
  const archivedEvents = useMemo(() => events.filter(e => e.isArchived), [events]);

  const todayEvents = useMemo(() => activeEvents.filter(e => e.isToday), [activeEvents]);
  const savedEvents = useMemo(
    () => activeEvents.filter(e => currentUser?.savedEventIds?.includes(e.id)),
    [activeEvents, currentUser?.savedEventIds]
  );
  
  const baseFeedEvents = useMemo(() => {
    if (activeTab === 'today') return todayEvents;
    if (selectedCategory === 'Сохраненные') return savedEvents;
    return activeEvents;
  }, [activeTab, selectedCategory, todayEvents, savedEvents, activeEvents]);

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
      const nearbyList = list.filter(e => e.distanceKm <= 3.0);
      const target = nearbyList.length > 0 ? nearbyList : list;
      return target.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    if (quickFilter === 'popular') {
      return list.sort((a, b) => {
        const rateA = a.occupiedSpots / (a.totalSpots || 1);
        const rateB = b.occupiedSpots / (b.totalSpots || 1);
        if (b.occupiedSpots !== a.occupiedSpots) {
          return b.occupiedSpots - a.occupiedSpots;
        }
        return rateB - rateA;
      });
    }

    if (quickFilter === 'interests') {
      const userInterests = (currentUser?.interests || []).map(i => i.toLowerCase());

      const getScore = (ev: EventItem): number => {
        let score = 0;
        const cat = (ev.category || '').toLowerCase();
        const title = (ev.title || '').toLowerCase();
        const desc = (ev.description || '').toLowerCase();
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

  const activeUser = currentUser || clientLocalStore.getMe();
  const myOrganizedEvents = activeEvents.filter(e => e.organizerId === activeUser.id);
  const myParticipationEvents = activeEvents.filter(
    e =>
      e.organizerId !== activeUser.id &&
      ((e.approvedParticipantIds || []).includes(activeUser.id) ||
        e.myApplicationStatus === 'accepted' ||
        e.myApplicationStatus === 'pending' ||
        e.myApplicationStatus === 'rejected')
  );
  const getEventAppStatus = (ev: EventItem): 'accepted' | 'pending' | 'rejected' => {
    if (ev.myApplicationStatus === 'rejected') {
      return 'rejected';
    }
    if ((ev.approvedParticipantIds || []).includes(activeUser.id) || ev.myApplicationStatus === 'accepted') {
      return 'accepted';
    }
    return 'pending';
  };
  const participationCounts = {
    all: myParticipationEvents.length,
    accepted: myParticipationEvents.filter(ev => getEventAppStatus(ev) === 'accepted').length,
    pending: myParticipationEvents.filter(ev => getEventAppStatus(ev) === 'pending').length,
    rejected: myParticipationEvents.filter(ev => getEventAppStatus(ev) === 'rejected').length,
  };
  const filteredParticipationEvents = myParticipationEvents.filter(ev =>
    participationStatusFilter === 'all' ? true : getEventAppStatus(ev) === participationStatusFilter
  );

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

      {/* 2. HEADER WITH SINGLE RIGHT-ALIGNED THEME & LANGUAGE SWITCHERS */}
      <Header
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={handleSwitchUser}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onOpenSafetyGuide={() => setShowSafetyGuide(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenDemoShare={() => setShowDemoShareModal(true)}
        activePalette={activePalette}
        onChangePalette={setActivePalette}
        lang={lang}
        onChangeLang={handleChangeLang}
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
                  src="./assets/images/hero_community_event_1794332913246.jpg"
                  alt="Дружеская компания за ужином"
                  className="absolute inset-0 w-full h-full object-cover opacity-45 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-white/90 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t.heroKicker}</span>
                  </div>
                </div>

                <div className="relative z-10 max-w-xl space-y-4 my-auto pt-6">
                  <h1 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white leading-[1.15] text-balance">
                    {t.heroTitleLine1} {t.heroTitleHighlight}
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg">
                    {t.heroDescription}
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
                      <span>{t.heroFindMatchBtn}</span>
                    </button>

                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.heroCreateBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 4-col Bento Side Card: Tonight Spotlight & Yandex Maps Radar Quick Card */}
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
                      <span>{t.heroStatTonight}</span>
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {todayEvents.length}
                    </span>
                  </div>

                  <div className="my-3">
                    <h2
                      className="text-lg font-display font-bold leading-snug"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {lang === 'en' ? 'Free tonight?' : 'Свободны сегодня вечером?'}
                    </h2>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {lang === 'en'
                        ? 'Check out spontaneous bar hangouts, board game nights, and dinners starting in the next few hours.'
                        : 'Посмотрите спонтанные сборы в бары, на настолки и ужины, которые начнутся в ближайшие часы.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t text-xs font-bold" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>
                      {lang === 'en' ? 'Explore tonight’s plans' : 'Смотреть планы на вечер'}
                    </span>
                    <span style={{ color: 'var(--accent-primary)' }}>→</span>
                  </div>
                </div>

                {/* Interactive Yandex Maps Radar Quick-Launch Card */}
                <div
                  onClick={() => setFeedViewMode('map')}
                  className="p-5 rounded-3xl border space-y-2.5 cursor-pointer transition-all hover:shadow-lg group"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                      <Navigation className="w-3 h-3" />
                      <span>{t.radarCardBadge}</span>
                    </div>
                    <span className="text-[11px] font-bold text-red-500 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </div>

                  <div>
                    <h3
                      className="text-sm font-display font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {t.radarCardTitle}
                    </h3>
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {t.radarCardDesc}
                    </p>
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
                      <Compass className="w-4 h-4" />
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
                  placeholder={t.heroSearchPlaceholder}
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
                      {translateCategory(cat.label, lang)}
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
                    {activeTab === 'today' ? t.feedTodayTitle : t.feedAllTitle}
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
                    {t.viewCards}
                  </button>
                  <button
                    onClick={() => setFeedViewMode('map')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    style={{
                      backgroundColor: feedViewMode === 'map' ? 'var(--bg-surface)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>{t.viewRadar}</span>
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
                lang={lang}
              />

              {feedViewMode === 'map' ? (
                <MapView
                  events={displayEvents}
                  onSelectEvent={setSelectedEventForDetail}
                  lang={lang}
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
                    {t.emptyEventsTitle}
                  </p>
                  <p className="text-xs max-w-sm mx-auto mb-5" style={{ color: 'var(--text-secondary)' }}>
                    {t.emptyEventsDesc}
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
                        {t.resetFilter}
                      </button>
                    )}
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 text-white text-xs font-bold rounded-2xl cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      {t.createEventAction}
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
                      lang={lang}
                      isRecommended={quickFilter === 'interests' && isEventInterestMatch(event, currentUser)}
                      matchReason={
                        quickFilter === 'interests' && isEventInterestMatch(event, currentUser)
                          ? `${t.quickInterestsDesc} ${translateCategory(event.category, lang)}`
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
                {t.myEventsTitle}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {t.myEventsSubtitle}
              </p>
            </div>

            {/* Organized by me */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t.organizedByMeHeader} ({myOrganizedEvents.length})
                  </h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {t.inviteUsersSub}
                  </p>
                </div>

                {myOrganizedEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInviteModalEventId(myOrganizedEvents[0]?.id);
                      setShowInviteModal(true);
                    }}
                    className="px-4 py-2 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{t.inviteFromListBtn}</span>
                  </button>
                )}
              </div>

              {myOrganizedEvents.length === 0 ? (
                <div
                  className="p-6 rounded-3xl border text-center text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {lang === 'en' ? 'You have not created any events yet.' : 'Вы пока не создали ни одного мероприятия.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrganizedEvents.map(ev => {
                    const pendingGuestApps = clientLocalStore
                      .getEventApplications(ev.id)
                      .filter(a => a.status === 'pending' && !a.isInvitation);

                    return (
                      <div
                        key={ev.id}
                        className="p-4 rounded-3xl border shadow-xs space-y-3"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                                {ev.isToday ? t.todayWord : ev.date} · {ev.time} · {ev.approximateArea}
                              </span>
                              <span
                                className="text-xs font-bold block mt-1 tabular-nums"
                                style={{ color: 'var(--accent-primary)' }}
                              >
                                {ev.occupiedSpots} {t.spotsOf} {ev.totalSpots}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setInviteModalEventId(ev.id);
                                setShowInviteModal(true);
                              }}
                              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors hover:border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{t.inviteFromListBtn}</span>
                            </button>
                            <button
                              onClick={() => setSelectedEventForDetail(ev)}
                              className="px-3.5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
                              style={{
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {t.applicationsAndDetailsBtn}
                            </button>
                            <button
                              onClick={() => setActiveChatEventId(ev.id)}
                              className="px-3.5 py-2.5 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{t.openChatBtn}</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Pending Applications for Organizer to Accept or Reject directly */}
                        {pendingGuestApps.length > 0 && (
                          <div
                            className="pt-3 border-t space-y-2"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                              {lang === 'en'
                                ? `Incoming Requests (${pendingGuestApps.length})`
                                : `Новые заявки на участие (${pendingGuestApps.length})`}
                            </span>
                            {pendingGuestApps.map(app => (
                              <div
                                key={app.id}
                                className="p-2.5 px-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  borderColor: 'var(--border-subtle)',
                                }}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={app.user.avatarUrl}
                                    alt={app.user.name}
                                    referrerPolicy="no-referrer"
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 cursor-pointer"
                                    onClick={() => setInspectedUserId(app.user.id)}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                      {app.user.name}, {app.user.age} · ★ {app.user.reliability.score}
                                    </div>
                                    <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                                      «{app.note}»
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleRespondToApplication(app.id, 'accept')}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white cursor-pointer flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{t.acceptBtn}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRespondToApplication(app.id, 'reject')}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 cursor-pointer flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>{t.declineInviteBtn}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Joined / Applied / Invited */}
            <div className="space-y-3.5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t.joinedByMeHeader} ({myParticipationEvents.length})
                  </h2>
                </div>

                {/* Color-coded status filter tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setParticipationStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      participationStatusFilter === 'all'
                        ? 'text-white shadow-xs'
                        : 'hover:opacity-85'
                    }`}
                    style={
                      participationStatusFilter === 'all'
                        ? { backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }
                        : { backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
                    }
                  >
                    <span>{t.statusAll}</span>
                    <span className="opacity-80 tabular-nums">{participationCounts.all}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParticipationStatusFilter('accepted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      participationStatusFilter === 'accepted'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.statusApproved}</span>
                    <span className="opacity-85 tabular-nums">{participationCounts.accepted}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParticipationStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      participationStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.statusPending}</span>
                    <span className="opacity-85 tabular-nums">{participationCounts.pending}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParticipationStatusFilter('rejected')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      participationStatusFilter === 'rejected'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/15'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.statusRejected}</span>
                    <span className="opacity-85 tabular-nums">{participationCounts.rejected}</span>
                  </button>
                </div>
              </div>

              {filteredParticipationEvents.length === 0 ? (
                <div
                  className="p-6 rounded-3xl border text-center text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {myParticipationEvents.length === 0
                    ? 'Вы пока не подавали заявок ни в одно мероприятие. Выберите событие в ленте!'
                    : 'Нет заявок с выбранным статусом.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParticipationEvents.map(ev => {
                    const status = getEventAppStatus(ev);
                    const isInvitation = Boolean(ev.myApplicationIsInvitation && status === 'pending');
                    const statusConfig = {
                      accepted: {
                        label: t.statusApproved,
                        subtext: t.statusApprovedSub,
                        badgeClass:
                          'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                        accentBarClass: 'bg-emerald-500',
                        subtextClass: 'text-emerald-600 dark:text-emerald-400',
                        Icon: CheckCircle2,
                      },
                      pending: {
                        label: isInvitation ? t.statusInvited : t.statusPending,
                        subtext: isInvitation ? t.statusInvitedSub : t.statusPendingSub,
                        badgeClass:
                          'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30',
                        accentBarClass: 'bg-amber-500',
                        subtextClass: 'text-amber-600 dark:text-amber-400',
                        Icon: Clock,
                      },
                      rejected: {
                        label: t.statusRejected,
                        subtext: t.statusRejectedSub,
                        badgeClass:
                          'bg-rose-500/12 text-rose-600 dark:text-rose-400 border-rose-500/30',
                        accentBarClass: 'bg-rose-500',
                        subtextClass: 'text-rose-600 dark:text-rose-400',
                        Icon: XCircle,
                      },
                    }[status];
                    const StatusIcon = statusConfig.Icon;

                    return (
                      <motion.div
                        key={ev.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden p-4 sm:p-5 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-shadow hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {/* Left color-coded status indicator bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusConfig.accentBarClass}`}
                          aria-hidden="true"
                        />

                        <div
                          onClick={() => setSelectedEventForDetail(ev)}
                          className="flex items-start sm:items-center gap-3.5 cursor-pointer pl-1.5 min-w-0 flex-1"
                        >
                          <img
                            src={ev.imageUrl}
                            alt={ev.title}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover shrink-0 border"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Status Badge + Category Row */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border ${statusConfig.badgeClass}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                <span>{statusConfig.label}</span>
                              </span>
                              <span
                                className="text-[11px] font-medium truncate"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {translateCategory(ev.category, lang)} · {ev.approximateArea}
                              </span>
                            </div>

                            {/* Event Title */}
                            <span
                              className="text-sm font-bold block line-clamp-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {ev.title}
                            </span>

                            {/* Date, Time & Organizer */}
                            <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>
                              {ev.isToday ? t.todayWord : ev.date} · {ev.time} · Организатор: {ev.organizer.name}
                            </span>

                            {/* Status details */}
                            <div className={`text-xs font-semibold flex items-center gap-1.5 pt-0.5 ${statusConfig.subtextClass}`}>
                              <span>{statusConfig.subtext}</span>
                            </div>

                            {ev.myApplicationNote && (
                              <p
                                className="text-[11px] line-clamp-1 pt-0.5"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                «{ev.myApplicationNote}»
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pl-1.5 sm:pl-0 shrink-0">
                          {status === 'accepted' ? (
                            <>
                              <button
                                onClick={() => setSelectedEventForDetail(ev)}
                                className="px-3.5 py-2 rounded-2xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                Точный адрес
                              </button>
                              <button
                                onClick={() => setActiveChatEventId(ev.id)}
                                className="px-3.5 py-2 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Чат гостей</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectParticipation(ev.id)}
                                className="px-3 py-2 rounded-2xl text-xs font-bold bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1 cursor-pointer transition-colors hover:bg-rose-500/20"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{t.declineInviteBtn}</span>
                              </button>
                            </>
                          ) : status === 'pending' ? (
                            <>
                              {ev.myApplicationIsInvitation && ev.myApplicationId && (
                                <button
                                  type="button"
                                  onClick={() => handleRespondToApplication(ev.myApplicationId!, 'accept')}
                                  className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-500 text-white flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{t.acceptBtn}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRejectParticipation(ev.id)}
                                className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-rose-500/20"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{t.rejectApplicationBtn}</span>
                              </button>
                              <button
                                onClick={() => setSelectedEventForDetail(ev)}
                                className="px-3.5 py-2 rounded-2xl text-xs font-bold cursor-pointer"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {t.detailsBtn}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedEventForDetail(ev)}
                              className="px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-opacity hover:opacity-90"
                              style={{
                                backgroundColor: 'var(--bg-elevated)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              {t.detailsBtn}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Archive of Past Events (automatically archived after the day passes) */}
            {archivedEvents.length > 0 && (
              <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Archive className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    <span>{t.archivedEventsHeader} ({archivedEvents.length})</span>
                  </h2>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {lang === 'en'
                      ? 'Automatically moved after event date passed'
                      : 'Перенесены автоматически после завершения дня встречи'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {archivedEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventForDetail(ev)}
                      className="p-4 rounded-3xl border opacity-85 hover:opacity-100 transition-all cursor-pointer flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover grayscale-[35%] shrink-0"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-500/15 text-slate-600 dark:text-slate-300 border border-slate-500/25">
                            <Archive className="w-3 h-3" />
                            <span>{t.archivedBadge}</span>
                          </span>
                          <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {ev.title}
                          </div>
                          <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                            {ev.date} · {ev.time} · {ev.occupiedSpots}/{ev.totalSpots} {t.peopleShort}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: 'var(--accent-primary)' }}>
                        {t.detailsBtn} →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <span>{currentUser.occupation}</span>
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

              {/* Interactive Badge & Preferences: "Жду приглашений на мероприятие" */}
              <div
                className="p-4 sm:p-5 rounded-3xl border space-y-3.5"
                style={{
                  backgroundColor: currentUser.openToInvites
                    ? 'color-mix(in srgb, #10b981 8%, var(--bg-elevated))'
                    : 'var(--bg-elevated)',
                  borderColor: currentUser.openToInvites
                    ? 'rgba(16, 185, 129, 0.35)'
                    : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                        {lang === 'en'
                          ? 'Badge: "Open to Event Invitations"'
                          : 'Метка «Жду приглашений на мероприятие»'}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {lang === 'en'
                        ? 'When enabled, organizers can find you in the "Add from List" filter by age, gender, and interests and invite you to their meetup.'
                        : 'Когда метка включена, организаторы видят вас в разделе «Добавить из списка» по возрасту, полу и интересам и могут пригласить на встречу.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleOpenToInvites(!currentUser.openToInvites)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      currentUser.openToInvites
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'border'
                    }`}
                    style={
                      currentUser.openToInvites
                        ? undefined
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }
                    }
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {currentUser.openToInvites
                        ? lang === 'en'
                          ? 'Active ✓'
                          : 'Включена ✓'
                        : lang === 'en'
                        ? 'Enable'
                        : 'Включить'}
                    </span>
                  </button>
                </div>

                {currentUser.openToInvites && (
                  <div className="space-y-2.5 pt-2 border-t border-emerald-500/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {lang === 'en' ? 'Your gender for search filters:' : 'Ваш пол для фильтров подбора:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { id: 'female' as const, label: lang === 'en' ? 'Woman' : 'Девушка' },
                          { id: 'male' as const, label: lang === 'en' ? 'Man' : 'Мужчина' },
                        ].map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleSaveInvitePreferences(g.id, inviteNoteDraft)}
                            className="px-2.5 py-1 rounded-xl text-[11px] font-bold border cursor-pointer transition-all"
                            style={
                              currentUser.gender === g.id
                                ? {
                                    backgroundColor: 'var(--accent-primary)',
                                    borderColor: 'var(--accent-primary)',
                                    color: '#FFFFFF',
                                  }
                                : {
                                    backgroundColor: 'var(--bg-surface)',
                                    borderColor: 'var(--border-subtle)',
                                    color: 'var(--text-secondary)',
                                  }
                            }
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteNoteDraft}
                        onChange={e => setInviteNoteDraft(e.target.value)}
                        placeholder="Например: Свободна вечером, пойду на настолки или ужин..."
                        className="flex-1 p-2 rounded-xl border text-xs"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveInvitePreferences(currentUser.gender, inviteNoteDraft)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shrink-0"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {lang === 'en' ? 'Save' : 'Обновить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

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
        unreadNotificationCount={notifications.filter(n => !n.isRead).length}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllNotificationsRead}
        lang={lang}
      />

      {/* 4. MODALS & DRAWERS */}
      <AnimatePresence>
        {selectedEventForDetail && (
          <EventDetailModal
            key={selectedEventForDetail.id}
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
      </AnimatePresence>

      {showCreateModal && (
        <CreateEventModal
          currentUser={currentUser}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadData}
        />
      )}

      {showWizardModal && (
        <FindCompanyWizardModal
          events={activeEvents}
          onClose={() => setShowWizardModal(false)}
          onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
        />
      )}

      <AnimatePresence>
        {showInviteModal && (
          <InviteUsersModal
            myEvents={myOrganizedEvents}
            initialEventId={inviteModalEventId}
            seekers={seekers}
            onClose={() => setShowInviteModal(false)}
            onInviteUser={handleInviteUserFromList}
            onInspectUser={(uid) => {
              setShowInviteModal(false);
              setInspectedUserId(uid);
            }}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {activeChatEventId && (
        <ChatModal
          eventId={activeChatEventId}
          currentUser={currentUser}
          onClose={() => setActiveChatEventId(null)}
        />
      )}

      <AnimatePresence>
        {inspectedUserId && (
          <UserProfileModal
            key={inspectedUserId}
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
      </AnimatePresence>

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
          sharedUrl="https://nako4343-cmyk.github.io/kompany-app/"
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
