import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, Clock, Users, Shield, Lock, Unlock, Phone, 
  MessageSquare, AlertTriangle, Check, CheckCircle2, Copy, 
  Sparkles, Flag, Music
} from 'lucide-react';
import { EventItem, UserProfile, EventApplication, EventQuestion } from '../types/index.ts';
import { api } from '../services/api.ts';
import { SafetyShareModal } from './SafetyShareModal.tsx';
import { BillSplitterModal } from './BillSplitterModal.tsx';
import { OnlineStatusBadge } from './OnlineStatusBadge.tsx';

interface EventDetailModalProps {
  event: EventItem;
  currentUser: UserProfile;
  onClose: () => void;
  onOpenChat: (eventId: string) => void;
  onOpenUserProfile: (userId: string) => void;
  onOpenReport: (targetType: 'event' | 'user', targetId: string, targetTitle: string) => void;
  onEventUpdated: () => void;
}

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
  const [myApplication, setMyApplication] = useState<EventApplication | null>(null);
  const [organizerApplications, setOrganizerApplications] = useState<EventApplication[]>([]);
  const [questions, setQuestions] = useState<EventQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [applyNote, setApplyNote] = useState('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Header */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden bg-slate-900 shrink-0">
          <img
            src={activeEvent.imageUrl}
            alt={activeEvent.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-black/40" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Kicker */}
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-white font-semibold">
            <span className="px-3 py-1 rounded-xl bg-black/50 backdrop-blur-md border border-white/15">
              {activeEvent.category}
            </span>
            {activeEvent.isToday && (
              <span
                className="px-3 py-1 rounded-xl text-white font-bold shadow-sm"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                Сегодня вечером
              </span>
            )}
          </div>

          {/* Bottom Title on Image */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-lg sm:text-xl font-display font-bold leading-tight line-clamp-2">
              {activeEvent.title}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-200 tabular-nums">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {activeEvent.isToday ? `Сегодня в ${activeEvent.time}` : `${activeEvent.date} в ${activeEvent.time}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {activeEvent.approximateArea}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-300">
                {activeEvent.budget}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. SAFETY & PRIVACY STATUS BANNER */}
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              hasFullAccess
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  hasFullAccess ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                }`}
              >
                {hasFullAccess ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                  {hasFullAccess ? 'Точные координаты открыты' : 'Защита личных данных активна'}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {hasFullAccess
                    ? 'Вы подтвержденный участник или организатор. Вам открыты точное название заведения, адрес и прямой закрытый чат встречи.'
                    : 'Для безопасности точный адрес и телефон организатора скрыты от посторонних. Они автоматически откроются вам сразу после того, как организатор подтвердит вашу заявку.'}
                </p>

                {/* UNLOCKED PRIVATE SPACE CONTENT */}
                {hasFullAccess && (
                  <div
                    className="mt-4 p-3.5 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wide block" style={{ color: 'var(--text-muted)' }}>
                        Точное заведение / локация:
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                        {activeEvent.exactVenue || 'Указано организатором'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wide block" style={{ color: 'var(--text-muted)' }}>
                        Точный адрес:
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {activeEvent.exactAddress || activeEvent.approximateArea}
                        </span>
                        {activeEvent.exactAddress && (
                          <button
                            onClick={() => handleCopyAddress(activeEvent.exactAddress!)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors cursor-pointer"
                            style={{
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <Copy className="w-3 h-3" />
                            {copiedAddress ? 'Скопировано!' : 'Копировать'}
                          </button>
                        )}
                      </div>
                    </div>

                    {activeEvent.privateInstructions && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wide block" style={{ color: 'var(--text-muted)' }}>
                          Инструкции по прибытию:
                        </span>
                        <p
                          className="text-xs mt-1 p-2.5 rounded-xl border"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {activeEvent.privateInstructions}
                        </p>
                      </div>
                    )}

                    {activeEvent.organizerPhone && (
                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold">Телефон организатора:</span>
                        <a href={`tel:${activeEvent.organizerPhone}`} className="text-emerald-500 font-bold hover:underline tabular-nums">
                          {activeEvent.organizerPhone}
                        </a>
                      </div>
                    )}

                    {/* Tools for confirmed members: Chat, Safety Share, Bill Splitter, Calendar */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenChat(activeEvent.id)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Закрытый чат</span>
                      </button>

                      <button
                        onClick={() => setShowSafetyShare(true)}
                        className="py-2.5 px-3 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Отправить близким</span>
                      </button>

                      <button
                        onClick={() => setShowBillSplitter(true)}
                        className="py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>🧮 Сплит счета</span>
                      </button>

                      <button
                        onClick={handleExportCalendar}
                        className="py-2.5 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span>📅 В календарь (.ics)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 1.5 VIBE CHECK SECTION (Атмосфера и темп встречи) */}
          {(activeEvent.vibe || activeEvent.musicOrMood || activeEvent.icebreakerQuestion) && (
            <div
              className="p-4 rounded-2xl border space-y-2.5"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
                  <Sparkles className="w-4 h-4" />
                  <span>Vibe Check · Атмосфера встречи</span>
                </div>
                {activeEvent.vibe && (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-xl"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    ✦ {activeEvent.vibe}
                  </span>
                )}
              </div>

              {activeEvent.musicOrMood && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Music className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-text)' }} />
                  <span><strong style={{ color: 'var(--text-primary)' }}>Настроение и фон:</strong> {activeEvent.musicOrMood}</span>
                </div>
              )}

              {activeEvent.icebreakerQuestion && (
                <div
                  className="p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Тема для легкого знакомства (Icebreaker):
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      «{activeEvent.icebreakerQuestion}»
                    </span>
                  </div>
                  {!isOrganizer && !isApproved && !isPending && (
                    <button
                      type="button"
                      onClick={() => {
                        setApplyNote(prev =>
                          prev
                            ? prev
                            : `Привет! По вашей теме дня («${activeEvent.icebreakerQuestion}»): с радостью поделюсь своей историей за встречей!`
                        );
                      }}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 cursor-pointer transition-transform active:scale-95"
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

          {/* 2. DESCRIPTION & DETAILS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              О мероприятии
            </h3>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-primary)' }}>
              {activeEvent.description}
            </p>
          </div>

          {/* Requirements & Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="p-3.5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                Кого ждем:
              </span>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {activeEvent.requirements || 'Любой желающий с позитивным настроем'}
              </p>
            </div>

            <div
              className="p-3.5 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                Правила встречи:
              </span>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                {activeEvent.rules?.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent-primary)' }} />
                    <span>{rule}</span>
                  </li>
                )) || <li>Взаимное уважение и пунктуальность</li>}
              </ul>
            </div>
          </div>

          {/* 3. ORGANIZER PROFILE PREVIEW */}
          <div
            className="p-4 rounded-2xl border flex items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              onClick={() => onOpenUserProfile(activeEvent.organizer.id)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={activeEvent.organizer.avatarUrl}
                alt={activeEvent.organizer.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <span>{activeEvent.organizer.name}, {activeEvent.organizer.age}</span>
                  {activeEvent.organizer.isPhoneVerified && (
                    <span title="Телефон подтвержден" className="inline-flex">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </span>
                  )}
                </div>
                <div className="text-xs flex flex-wrap items-center gap-1.5 mt-0.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-amber-500 font-bold">★ {activeEvent.organizer.reliability.score}</span>
                  <span>·</span>
                  <span>{activeEvent.organizer.reliability.eventsOrganized} встреч создано</span>
                  <span>·</span>
                  <span className="text-emerald-500 font-semibold">{activeEvent.organizer.reliability.attendanceRate}% явка</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenUserProfile(activeEvent.organizer.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Профиль
            </button>
          </div>

          {/* 4. PARTICIPANTS ROSTER */}
          <div>
            <div className="flex items-center justify-between mb-2 tabular-nums">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Участники ({activeEvent.occupiedSpots}/{activeEvent.totalSpots})
              </h3>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Свободно {Math.max(0, activeEvent.totalSpots - activeEvent.occupiedSpots)} мест
              </span>
            </div>

            <div className="space-y-2">
              {/* Organizer Row */}
              <div
                className="flex items-center justify-between p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeEvent.organizer.avatarUrl}
                    alt={activeEvent.organizer.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <div>
                    <span className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                      {activeEvent.organizer.name}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-text)' }}>
                      Организатор
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500 tabular-nums">
                  ★ {activeEvent.organizer.reliability.score}
                </span>
              </div>

              {/* Other approved members */}
              {activeEvent.approvedParticipants && activeEvent.approvedParticipants.length > 0 ? (
                activeEvent.approvedParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div
                      onClick={() => onOpenUserProfile(participant.id)}
                      className="flex items-center gap-3 cursor-pointer group min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={participant.avatarUrl}
                          alt={participant.name}
                          className="w-9 h-9 rounded-xl object-cover border"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            participant.onlineStatus === 'online'
                              ? 'bg-emerald-500'
                              : participant.onlineStatus === 'recent'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold group-hover:underline flex items-center gap-1.5 truncate" style={{ color: 'var(--text-primary)' }}>
                          <span>{participant.name}, {participant.age}</span>
                          <OnlineStatusBadge
                            status={participant.onlineStatus || 'recent'}
                            lastSeen={participant.lastSeen}
                            size="sm"
                          />
                        </div>
                        <div className="text-[11px] font-medium flex items-center gap-1 truncate" style={{ color: 'var(--accent-text)' }}>
                          <span>💼 {participant.occupation || 'Участник'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-amber-500 tabular-nums">
                        ★ {participant.reliability?.score || 5.0}
                      </span>
                      {isOrganizer && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMarkAttendance(participant.id, 'attended')}
                            className="p-1 px-2 text-[10px] font-semibold rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 cursor-pointer"
                            title="Отметить: Пришел на встречу"
                          >
                            Пришел
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(participant.id, 'no_show')}
                            className="p-1 px-2 text-[10px] font-semibold rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 cursor-pointer"
                            title="Отметить: Не явился"
                          >
                            Не явился
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                activeEvent.approvedParticipantIds.map(pId => (
                  <div
                    key={pId}
                    className="flex items-center justify-between p-2.5 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Подтвержденный участник</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 5. ORGANIZER APPLICATIONS REVIEW SECTION */}
          {isOrganizer && (
            <div
              className="p-4 rounded-2xl border space-y-3"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
                  <Users className="w-4 h-4" />
                  <span>Заявки на рассмотрение ({organizerApplications.filter(a => a.status === 'pending').length})</span>
                </h4>
              </div>

              {organizerApplications.filter(a => a.status === 'pending').length === 0 ? (
                <p className="text-xs py-1" style={{ color: 'var(--text-secondary)' }}>
                  Пока нет новых заявок на рассмотрении.
                </p>
              ) : (
                <div className="space-y-3">
                  {organizerApplications.filter(a => a.status === 'pending').map(app => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl border space-y-2"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => onOpenUserProfile(app.user.id)}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <img
                            src={app.user.avatarUrl}
                            alt={app.user.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                              {app.user.name}, {app.user.age}
                            </span>
                            <div className="text-[11px] flex items-center gap-1.5 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                              <span className="text-amber-500 font-semibold">★ {app.user.reliability.score}</span>
                              <span>·</span>
                              <span>{app.user.reliability.attendanceRate}% явка ({app.user.reliability.eventsAttended} встреч)</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={isSubmittingDecision}
                            onClick={() => handleDecision(app.id, 'accept')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Принять
                          </button>
                          <button
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

                      <div
                        className="p-2.5 rounded-xl text-xs border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <span className="font-semibold block text-[10px] uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
                          Почему хочет присоединиться:
                        </span>
                        «{app.note}»
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5.5 PRE-APPROVAL Q&A SECTION */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span>Вопросы организатору ({questions.length})</span>
              </h4>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Доступно до подачи заявки · Контакты маскируются
              </span>
            </div>

            {questions.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Пока никто не задавал уточняющих вопросов. Спросите о формате, меню или правилах!
              </p>
            ) : (
              <div className="space-y-2.5">
                {questions.map(q => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl border text-xs space-y-2"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={q.askerAvatar} alt={q.askerName} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{q.askerName}</span>
                      </div>
                      <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>{q.createdAt}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>«{q.question}»</p>

                    {q.answer ? (
                      <div
                        className="p-2.5 rounded-xl border"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase block mb-0.5" style={{ color: 'var(--accent-text)' }}>
                          Ответ организатора ({activeEvent.organizer.name.split(' ')[0]}):
                        </span>
                        <p>{q.answer}</p>
                      </div>
                    ) : isOrganizer ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={answerDrafts[q.id] || ''}
                          onChange={e => setAnswerDrafts(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Напишите ответ кандидату..."
                          className="flex-1 p-2 rounded-lg border text-xs focus:outline-none"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAnswerQuestion(q.id)}
                          className="px-3 py-2 rounded-lg text-white text-xs font-bold cursor-pointer"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          Ответить
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] italic block" style={{ color: 'var(--text-muted)' }}>
                        Ожидает ответа организатора...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isOrganizer && (
              <form onSubmit={handleAskQuestion} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Задать короткий вопрос организатору без раскрытия контактов..."
                  className="flex-1 p-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newQuestionText.trim()}
                  className="px-4 py-2.5 rounded-xl disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  Спросить
                </button>
              </form>
            )}
          </div>

          {/* 6. APPLICANT INTERACTION CTA */}
          {!isOrganizer && (
            <div className="pt-2">
              {isApproved ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Вы в списке участников! До встречи на событии.</span>
                  </div>
                  <button
                    onClick={() => onOpenChat(activeEvent.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    В чат
                  </button>
                </div>
              ) : isPending ? (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs">
                  <div className="font-bold mb-1 flex items-center gap-2 text-amber-500">
                    <Clock className="w-4 h-4" />
                    <span>Ваша заявка отправлена и ожидает одобрения организатора</span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    Организатор проверит ваш профиль и примет решение. Как только заявка будет принята, точный адрес и закрытый чат откроются автоматически.
                  </p>
                </div>
              ) : activeEvent.occupiedSpots >= activeEvent.totalSpots ? (
                <div
                  className="p-4 rounded-2xl text-center text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Все места на это мероприятие уже заняты
                </div>
              ) : (
                <div
                  className="p-4 rounded-2xl border shadow-xs space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Хотите присоединиться? Напишите организатору пару слов:
                    </label>
                    <textarea
                      value={applyNote}
                      onChange={(e) => setApplyNote(e.target.value)}
                      placeholder="Например: Недавно переехал в город, увлекаюсь кино и настолками, буду рад познакомиться и составить компанию!"
                      className="w-full h-20 p-3 rounded-xl border text-xs focus:outline-none resize-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <button
                    disabled={isApplying}
                    onClick={handleApply}
                    className="w-full py-3 rounded-xl text-white text-xs font-bold shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {isApplying ? 'Отправка...' : 'Отправить заявку на участие'}
                  </button>
                  <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
                    🔒 Организатор увидит ваш профиль и рейтинг надёжности перед принятием решения.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Safety & Cancellation Actions */}
          <div
            className="pt-4 border-t flex items-center justify-between text-xs"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => onOpenReport('event', activeEvent.id, activeEvent.title)}
              className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Пожаловаться</span>
            </button>

            {isOrganizer && activeEvent.status !== 'cancelled' && (
              <div>
                {!showCancelPrompt ? (
                  <button
                    onClick={() => setShowCancelPrompt(true)}
                    className="text-rose-500 hover:underline text-xs cursor-pointer"
                  >
                    Отменить мероприятие
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Причина отмены"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      className="p-1 px-2 border rounded-lg text-xs"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={handleCancelEvent}
                      className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Подтвердить
                    </button>
                    <button
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
          </div>
        </div>
      </div>

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
