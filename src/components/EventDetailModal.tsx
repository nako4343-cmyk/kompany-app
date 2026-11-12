import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Clock, Users, Shield, Lock, Unlock, Phone, 
  MessageSquare, AlertTriangle, Check, CheckCircle2, Copy, 
  Flag, Music, CalendarPlus, Receipt, Radio, UserCheck, 
  ShieldCheck, Star, ArrowUpRight, Send, MessageCircle, Trash2
} from 'lucide-react';
import { EventItem, UserProfile, EventApplication, EventQuestion } from '../types/index.ts';
import { api } from '../services/api.ts';
import { SafetyShareModal } from './SafetyShareModal.tsx';
import { BillSplitterModal } from './BillSplitterModal.tsx';
import { EventSlotsTimeline } from './EventSlotsTimeline.tsx';

interface EventDetailModalProps {
  event: EventItem;
  currentUser: UserProfile;
  onClose: () => void;
  onOpenChat: (eventId: string) => void;
  onOpenUserProfile: (userId: string) => void;
  onOpenReport: (targetType: 'event' | 'user', targetId: string, targetTitle: string) => void;
  onEventUpdated: () => void;
}

type DetailSectionTab = 'overview' | 'schedule' | 'qa';

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  currentUser,
  onClose,
  onOpenChat,
  onOpenUserProfile,
  onOpenReport,
  onEventUpdated,
}) => {
  const [activeEvent, setActiveEvent] = useState<EventItem>(event);
  const [activeTab, setActiveTab] = useState<DetailSectionTab>('overview');
  const [myApplication, setMyApplication] = useState<EventApplication | null>(null);
  const [organizerApplications, setOrganizerApplications] = useState<EventApplication[]>([]);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [applyNote, setApplyNote] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSafetyShare, setShowSafetyShare] = useState(false);
  const [showBillSplitter, setShowBillSplitter] = useState(false);

  const isOrganizer = currentUser.id === activeEvent.organizerId;
  const isApproved = activeEvent.approvedParticipantIds.includes(currentUser.id);
  const isPending = myApplication?.status === 'pending';
  const hasFullAccess = isOrganizer || isApproved;
  const pendingAppsCount = organizerApplications.filter(a => a.status === 'pending').length;

  const loadDetails = async () => {
    try {
      const [data, qaList] = await Promise.all([
        api.getEvent(activeEvent.id),
        api.getEventQuestions(activeEvent.id),
      ]);
      setActiveEvent(data.event);
      setMyApplication(data.myApplication);
      setQuestions(qaList);

      if (currentUser.id === data.event.organizerId) {
        const apps = await api.getEventApplications(data.event.id);
        setOrganizerApplications(apps);
      }
    } catch (err: any) {
      console.error('Failed to load event details:', err);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [activeEvent.id, currentUser.id]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    try {
      const created = await api.askEventQuestion(activeEvent.id, newQuestionText);
      setQuestions(prev => [...prev, created]);
      setNewQuestionText('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось отправить вопрос');
    }
  };

  const handleAnswerQuestion = async (questionId: string) => {
    const text = answerDrafts[questionId];
    if (!text || !text.trim()) return;
    try {
      const updated = await api.answerEventQuestion(activeEvent.id, questionId, text);
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      setAnswerDrafts(prev => ({ ...prev, [questionId]: '' }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось отправить ответ');
    }
  };

  const handleApply = async () => {
    setErrorMsg('');
    setIsApplying(true);
    try {
      const app = await api.applyToEvent(activeEvent.id, applyNote);
      setMyApplication(app);
      setApplyNote('');
      setShowApplyForm(false);
      await loadDetails();
      onEventUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось отправить заявку');
    } finally {
      setIsApplying(false);
    }
  };

  const handleDecision = async (appId: string, action: 'accept' | 'reject') => {
    setIsSubmittingDecision(true);
    try {
      await api.decideApplication(appId, action);
      await loadDetails();
      onEventUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка обработки заявки');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleCopyAddress = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleExportCalendar = () => {
    const cleanDate = (activeEvent.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
    const cleanTime = (activeEvent.time || '19:00').replace(':', '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kompany App//RU',
      'BEGIN:VEVENT',
      `SUMMARY:${activeEvent.title}`,
      `DESCRIPTION:${activeEvent.description.replace(/\n/g, ' ')} \\nЛокация: ${activeEvent.exactVenue || ''} \\nИнструкция: ${activeEvent.privateInstructions || ''}`,
      `LOCATION:${activeEvent.exactAddress || activeEvent.approximateArea}`,
      `DTSTART:${cleanDate}T${cleanTime}00`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_${activeEvent.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCancelEvent = async () => {
    try {
      await api.cancelEvent(activeEvent.id, cancelReason);
      await loadDetails();
      onEventUpdated();
      setShowCancelPrompt(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отмены мероприятия');
    }
  };

  const handleMarkAttendance = async (participantId: string, status: 'attended' | 'no_show') => {
    try {
      await api.markAttendance(activeEvent.id, participantId, status);
      await loadDetails();
      onEventUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отметки посещения');
    }
  };

  const tabs: Array<{ id: DetailSectionTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Обзор встречи' },
    {
      id: 'schedule',
      label: 'Слоты и тайминг',
      count: isOrganizer && pendingAppsCount > 0 ? pendingAppsCount : activeEvent.occupiedSpots,
    },
    { id: 'qa', label: 'Вопросы', count: questions.length > 0 ? questions.length : undefined },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[93vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* 1. HERO MEDIA HEADER */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900 shrink-0">
          <motion.img
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            src={activeEvent.imageUrl}
            alt={activeEvent.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-black/35" />

          {/* Top Bar Controls */}
          <div className="absolute top-4 left-5 right-4 flex items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2 text-xs text-white/95 font-semibold">
              <span>{activeEvent.category}</span>
              {activeEvent.isToday && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300 font-bold">Сегодня вечером</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCalendar}
                title="Сохранить в календарь (.ics)"
                className="h-9 px-3 rounded-xl bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">В календарь</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenReport('event', activeEvent.id, activeEvent.title)}
                title="Пожаловаться на событие"
                className="w-9 h-9 rounded-xl bg-black/45 hover:bg-rose-500/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Flag className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                title="Закрыть"
                className="w-9 h-9 rounded-xl bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Bottom Title & Metadata inside Hero */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <h2 className="text-lg sm:text-2xl font-display font-bold leading-snug line-clamp-2">
              {activeEvent.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-200 tabular-nums">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeEvent.isToday ? `Сегодня в ${activeEvent.time}` : `${activeEvent.date} в ${activeEvent.time}`}</span>
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeEvent.approximateArea}</span>
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="font-bold text-amber-300">
                {activeEvent.budget}
              </span>
            </div>
          </div>
        </div>

        {/* 2. SEGMENTED NAVIGATION BAR */}
        <div
          className="px-5 pt-3 pb-2 border-b flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="flex items-center gap-1 p-1 rounded-2xl w-full sm:w-auto"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="relative flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                  style={{
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="eventDetailActiveTab"
                      transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                      className="absolute inset-0 rounded-xl shadow-xs"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className="relative z-10 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums"
                      style={{
                        backgroundColor:
                          tab.id === 'schedule' && isOrganizer && pendingAppsCount > 0
                            ? 'var(--accent-primary)'
                            : 'var(--bg-elevated)',
                        color:
                          tab.id === 'schedule' && isOrganizer && pendingAppsCount > 0
                            ? '#FFFFFF'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Privacy Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold shrink-0">
            {hasFullAccess ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Unlock className="w-3.5 h-3.5" />
                <span>Точный адрес открыт</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Координаты после одобрения</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. SCROLLABLE BODY CONTENT */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Organizer Notification if Pending Applications exist */}
                {isOrganizer && pendingAppsCount > 0 && (
                  <div
                    className="p-4 rounded-2xl border flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                          У вас {pendingAppsCount} {pendingAppsCount === 1 ? 'новая заявка' : 'новых заявки'} на участие
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Проверьте анкеты кандидатов и подтвердите слоты
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shrink-0 cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Открыть заявки
                    </button>
                  </div>
                )}

                {/* Event Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    О встрече
                  </h3>
                  <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
                    {activeEvent.description}
                  </p>
                </div>

                {/* Vibe & Icebreaker Strip */}
                {(activeEvent.vibe || activeEvent.musicOrMood || activeEvent.icebreakerQuestion) && (
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        <Radio className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        <span>Атмосфера и формат общения</span>
                      </div>
                      {activeEvent.vibe && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                          {activeEvent.vibe}
                        </span>
                      )}
                    </div>

                    {activeEvent.musicOrMood && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Music className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                        <span><strong style={{ color: 'var(--text-primary)' }}>Музыка и фон:</strong> {activeEvent.musicOrMood}</span>
                      </div>
                    )}

                    {activeEvent.icebreakerQuestion && (
                      <div
                        className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                            <MessageCircle className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                            <span>Тема для начала разговора:</span>
                          </span>
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            «{activeEvent.icebreakerQuestion}»
                          </p>
                        </div>
                        {!isOrganizer && !isApproved && !isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setApplyNote(prev =>
                                prev
                                  ? prev
                                  : `Привет! По вашей теме встречи («${activeEvent.icebreakerQuestion}»): с радостью поделюсь своей историей за столом!`
                              );
                              setShowApplyForm(true);
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-transform active:scale-95"
                            style={{
                              backgroundColor: 'var(--accent-soft)',
                              color: 'var(--accent-text)',
                            }}
                          >
                            Ответить в заявке
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Who we expect & Rules */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="p-4 rounded-2xl border space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      <UserCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span>Кого ждём в компании</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {activeEvent.requirements || 'Любой желающий с открытым и позитивным настроем'}
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-2xl border space-y-1.5"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span>Договорённости встречи</span>
                    </div>
                    <ul className="text-xs space-y-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {activeEvent.rules?.map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>{rule}</span>
                        </li>
                      )) || <li>Взаимное уважение и пунктуальность</li>}
                    </ul>
                  </div>
                </div>

                {/* Organizer Card */}
                <div
                  className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    onClick={() => onOpenUserProfile(activeEvent.organizer.id)}
                    className="flex items-center gap-3.5 cursor-pointer group min-w-0"
                  >
                    <img
                      src={activeEvent.organizer.avatarUrl}
                      alt={activeEvent.organizer.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border shrink-0 transition-transform group-hover:scale-105"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold truncate group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                          {activeEvent.organizer.name}, {activeEvent.organizer.age}
                        </span>
                        {activeEvent.organizer.isPhoneVerified && (
                          <span title="Профиль подтверждён" className="inline-flex">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{activeEvent.organizer.reliability.score}</span>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{activeEvent.organizer.reliability.eventsOrganized} организовано</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {activeEvent.organizer.reliability.attendanceRate}% явка
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenUserProfile(activeEvent.organizer.id)}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>Профиль</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Location & Private Access Block */}
                <div
                  className="p-4 sm:p-5 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: hasFullAccess ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-elevated)',
                    borderColor: hasFullAccess ? 'rgba(16, 185, 129, 0.28)' : 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          hasFullAccess ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                        }`}
                      >
                        {hasFullAccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                          {hasFullAccess ? 'Точное место встречи открыто' : 'Точный адрес доступен участникам'}
                        </h4>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {hasFullAccess
                            ? 'Вы в подтверждённом составе компании. Вам доступны точная геолокация на Яндекс Картах, инструкции организатора и инструменты встречи.'
                            : `Сейчас виден только ориентир (${activeEvent.approximateArea}). Точное название заведения и адрес откроются автоматически после подтверждения вашей заявки.`}
                        </p>
                      </div>
                    </div>

                    <a
                      href={
                        hasFullAccess
                          ? activeEvent.yandexMapsUrl ||
                            `https://yandex.ru/maps/?text=${encodeURIComponent(
                              `${activeEvent.city || 'Москва'}, ${activeEvent.exactAddress || activeEvent.exactVenue || activeEvent.approximateArea}`
                            )}`
                          : `https://yandex.ru/maps/?text=${encodeURIComponent(
                              `${activeEvent.city || 'Москва'}, ${activeEvent.approximateArea}`
                            )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#FC3F1D] hover:bg-[#e03516] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                    >
                      <span className="w-4 h-4 rounded bg-white text-[#FC3F1D] font-extrabold text-[10px] flex items-center justify-center">
                        Я
                      </span>
                      <span className="hidden sm:inline">Яндекс Карты</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {hasFullAccess && (
                    <div
                      className="pt-4 border-t space-y-3.5"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] font-medium block" style={{ color: 'var(--text-muted)' }}>
                            Заведение / локация
                          </span>
                          <span className="text-sm font-bold block mt-0.5" style={{ color: 'var(--text-primary)' }}>
                            {activeEvent.exactVenue || 'Указано организатором'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-medium block" style={{ color: 'var(--text-muted)' }}>
                            Точный адрес
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                              {activeEvent.exactAddress || activeEvent.approximateArea}
                            </span>
                            {activeEvent.exactAddress && (
                              <button
                                type="button"
                                onClick={() => handleCopyAddress(activeEvent.exactAddress!)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  borderColor: 'var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                {copiedAddress ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedAddress ? 'Скопировано' : 'Копировать'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Embedded Interactive Yandex Map Widget for Approved Participants / Organizer */}
                      <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                        <iframe
                          src={
                            activeEvent.coordinates
                              ? `https://yandex.ru/map-widget/v1/?ll=${activeEvent.coordinates.lon}%2C${activeEvent.coordinates.lat}&z=16&pt=${activeEvent.coordinates.lon}%2C${activeEvent.coordinates.lat}%2Cpm2rdm`
                              : `https://yandex.ru/map-widget/v1/?ll=37.6225%2C55.7672&z=14&pt=37.6225%2C55.7672%2Cpm2rdm`
                          }
                          title="Точное место на Яндекс Картах"
                          className="w-full h-full border-0"
                          loading="lazy"
                          allowFullScreen
                        />
                        <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-white backdrop-blur-xs font-medium truncate max-w-[70%]">
                            {activeEvent.exactVenue ? `${activeEvent.exactVenue} · ` : ''}{activeEvent.exactAddress || activeEvent.approximateArea}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-[#FC3F1D] text-white font-bold shrink-0">
                            Яндекс Карты
                          </span>
                        </div>
                      </div>

                      {activeEvent.privateInstructions && (
                        <div
                          className="p-3 rounded-xl border text-xs"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <span className="font-bold block mb-0.5" style={{ color: 'var(--text-primary)' }}>
                            Как найти компанию на месте:
                          </span>
                          {activeEvent.privateInstructions}
                        </div>
                      )}

                      {activeEvent.organizerPhone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span style={{ color: 'var(--text-secondary)' }}>Связь с организатором:</span>
                          <a href={`tel:${activeEvent.organizerPhone}`} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline tabular-nums">
                            {activeEvent.organizerPhone}
                          </a>
                        </div>
                      )}

                      {/* Clean Action Utilities Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onOpenChat(activeEvent.id)}
                          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Чат компании</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowBillSplitter(true)}
                          className="py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <Receipt className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                          <span>Разделить счёт</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSafetyShare(true)}
                          className="py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span>Карточка близким</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer Event Cancellation Control */}
                {isOrganizer && activeEvent.status !== 'cancelled' && (
                  <div
                    className="pt-3 border-t flex items-center justify-between text-xs"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Управление статусом встречи</span>
                    {!showCancelPrompt ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(true)}
                        className="text-rose-500 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Отменить встречу</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Причина отмены..."
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          className="p-1.5 px-2.5 border rounded-xl text-xs"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleCancelEvent}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Подтвердить
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelPrompt(false)}
                          className="text-xs cursor-pointer"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          Назад
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'schedule' && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Organizer Pending Applications Section */}
                {isOrganizer && (
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--accent-text)' }}>
                        <Users className="w-4 h-4" />
                        <span>Заявки на рассмотрении ({pendingAppsCount})</span>
                      </h4>
                    </div>

                    {pendingAppsCount === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        Новых заявок на рассмотрении сейчас нет.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {organizerApplications.filter(a => a.status === 'pending').map(app => (
                          <div
                            key={app.id}
                            className="p-3.5 rounded-2xl border space-y-2.5"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div
                                onClick={() => onOpenUserProfile(app.user.id)}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <img
                                  src={app.user.avatarUrl}
                                  alt={app.user.name}
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                                <div>
                                  <span className="text-xs font-bold block group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                                    {app.user.name}, {app.user.age}
                                  </span>
                                  <div className="text-[11px] flex items-center gap-1.5 tabular-nums mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    <span className="inline-flex items-center gap-0.5 text-amber-500 font-semibold">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      <span>{app.user.reliability.score}</span>
                                    </span>
                                    <span>·</span>
                                    <span>{app.user.reliability.attendanceRate}% явка ({app.user.reliability.eventsAttended} встреч)</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSubmittingDecision}
                                  onClick={() => handleDecision(app.id, 'accept')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Принять</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmittingDecision}
                                  onClick={() => handleDecision(app.id, 'reject')}
                                  className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer"
                                  style={{
                                    backgroundColor: 'var(--bg-elevated)',
                                    borderColor: 'var(--border-subtle)',
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  Отклонить
                                </button>
                              </div>
                            </div>

                            {app.note && (
                              <div
                                className="p-2.5 rounded-xl text-xs"
                                style={{
                                  backgroundColor: 'var(--bg-elevated)',
                                  color: 'var(--text-secondary)',
                                }}
                              >
                                «{app.note}»
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Unified Visual Slots & Timeline Component */}
                <EventSlotsTimeline
                  event={activeEvent}
                  compact={false}
                  isOrganizer={isOrganizer}
                  onMarkAttendance={handleMarkAttendance}
                  onSlotClick={(slotIndex, slot) => {
                    if (slot?.isOccupied) {
                      if (slot.isOrganizer) {
                        onOpenUserProfile(activeEvent.organizerId);
                      } else if (slot.userId) {
                        onOpenUserProfile(slot.userId);
                      } else {
                        const p = activeEvent.approvedParticipants?.[slotIndex - 1];
                        if (p) onOpenUserProfile(p.id);
                      }
                    }
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'qa' && (
              <motion.div
                key="qa"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                      Вопросы организатору ({questions.length})
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Уточните детали формата, дресс-кода или меню до отправки заявки
                    </p>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div
                    className="p-8 rounded-2xl border text-center space-y-2"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <MessageSquare className="w-6 h-6 mx-auto opacity-50" style={{ color: 'var(--accent-primary)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Пока никто не задавал вопросов
                    </p>
                    <p className="text-xs max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                      Спросите организатора о любых деталях встречи — ответ увидят все заинтересованные участники.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map(q => (
                      <div
                        key={q.id}
                        className="p-4 rounded-2xl border text-xs space-y-2.5"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={q.askerAvatar} alt={q.askerName} className="w-6 h-6 rounded-full object-cover" />
                            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{q.askerName}</span>
                          </div>
                          <span className="text-[11px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{q.createdAt}</span>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                          «{q.question}»
                        </p>

                        {q.answer ? (
                          <div
                            className="p-3 rounded-xl border"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-primary)',
                            }}
                          >
                            <span className="text-[11px] font-bold block mb-0.5" style={{ color: 'var(--accent-primary)' }}>
                              Ответ организатора ({activeEvent.organizer.name.split(' ')[0]}):
                            </span>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{q.answer}</p>
                          </div>
                        ) : isOrganizer ? (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={answerDrafts[q.id] || ''}
                              onChange={e => setAnswerDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Напишите ответ кандидату..."
                              className="flex-1 p-2.5 rounded-xl border text-xs focus:outline-none"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--text-primary)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleAnswerQuestion(q.id)}
                              className="px-3.5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                              Ответить
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                            Ожидает ответа организатора...
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isOrganizer && (
                  <form onSubmit={handleAskQuestion} className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={newQuestionText}
                      onChange={e => setNewQuestionText(e.target.value)}
                      placeholder="Задать вопрос организатору..."
                      className="flex-1 p-3 rounded-2xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!newQuestionText.trim()}
                      className="px-4 py-3 rounded-2xl disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Спросить</span>
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. STICKY BOTTOM ACTION BAR */}
        <div
          className="p-4 sm:px-6 border-t shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {isOrganizer ? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Вы организатор этой встречи
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Заполнено {activeEvent.occupiedSpots} из {activeEvent.totalSpots} мест
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChat(activeEvent.id)}
                className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Открыть чат компании</span>
              </button>
            </div>
          ) : isApproved ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Вы в составе участников! Точный адрес открыт.</span>
              </div>
              <button
                type="button"
                onClick={() => onOpenChat(activeEvent.id)}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                В чат встречи
              </button>
            </div>
          ) : isPending ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-amber-500 font-bold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Заявка отправлена и ожидает подтверждения организатора</span>
              </div>
            </div>
          ) : activeEvent.occupiedSpots >= activeEvent.totalSpots ? (
            <div className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)' }}>
              Все слоты на эту встречу уже заняты
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {showApplyForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold" style={{ color: 'var(--text-primary)' }}>
                        Короткое сообщение для организатора:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApplyForm(false)}
                        className="text-[11px] hover:underline cursor-pointer"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Свернуть
                      </button>
                    </div>
                    <textarea
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      placeholder="Напишите пару слов о себе: почему вам близка эта встреча и чем увлекаетесь..."
                      className="w-full h-20 p-3 rounded-2xl border text-xs focus:outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between gap-3">
                {!showApplyForm ? (
                  <>
                    <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Организатор увидит ваш профиль и индекс надёжности</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowApplyForm(true)}
                      className="w-full sm:w-auto sm:ml-auto px-6 py-3 rounded-2xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <span>Присоединиться к компании</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    disabled={isApplying}
                    onClick={handleApply}
                    className="w-full py-3 rounded-2xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isApplying ? 'Отправка заявки...' : 'Подтвердить и отправить заявку'}</span>
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {showSafetyShare && (
        <SafetyShareModal
          event={activeEvent}
          onClose={() => setShowSafetyShare(false)}
        />
      )}

      {showBillSplitter && (
        <BillSplitterModal
          totalParticipants={activeEvent.occupiedSpots}
          onClose={() => setShowBillSplitter(false)}
        />
      )}
    </div>
  );
};
