import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UserPlus,
  SlidersHorizontal,
  Search,
  Star,
  CheckCircle2,
  Briefcase,
  Send,
  Users,
  Calendar,
} from 'lucide-react';
import { EventItem, UserProfile } from '../types/index.ts';
import { AppLanguage, translateCategory } from '../i18n/translations.ts';

interface InviteUsersModalProps {
  myEvents: EventItem[];
  initialEventId?: string;
  seekers: UserProfile[];
  onClose: () => void;
  onInviteUser: (eventId: string, targetUserId: string, note?: string) => Promise<void>;
  onInspectUser?: (userId: string) => void;
  lang?: AppLanguage;
}

const INTEREST_FILTERS = [
  'Все',
  'Настольные игры',
  'Рестораны / Бары',
  'День рождения',
  'Свадьба',
  'Кино / Концерт',
  'Квиз / Интеллект',
  'Пикник / Шашлыки',
  'Спорт',
  'Прогулка',
  'Путешествие',
  'Искусство',
  'Музыка',
];

export const InviteUsersModal: React.FC<InviteUsersModalProps> = ({
  myEvents,
  initialEventId,
  seekers,
  onClose,
  onInviteUser,
  onInspectUser,
  lang = 'ru',
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || myEvents[0]?.id || ''
  );
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male'>('female');
  const [minAge, setMinAge] = useState<number>(25);
  const [maxAge, setMaxAge] = useState<number>(35);
  const [interestFilter, setInterestFilter] = useState<string>('Настольные игры');
  const [onlyOpenToInvites, setOnlyOpenToInvites] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customInviteNote, setCustomInviteNote] = useState<string>('');
  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});
  const [sendingUserId, setSendingUserId] = useState<string | null>(null);

  const selectedEvent = useMemo(
    () => myEvents.find((e) => e.id === selectedEventId) || myEvents[0] || null,
    [myEvents, selectedEventId]
  );

  const filteredSeekers = useMemo(() => {
    return seekers.filter((u) => {
      if (onlyOpenToInvites && !u.openToInvites) return false;
      if (genderFilter !== 'all' && u.gender !== genderFilter) return false;
      if (u.age < minAge || u.age > maxAge) return false;

      if (interestFilter !== 'Все') {
        const target = interestFilter.toLowerCase();
        const hasInterest = (u.interests || []).some(
          (i) =>
            i.toLowerCase().includes(target) ||
            target.includes(i.toLowerCase()) ||
            (target.includes('настол') && i.toLowerCase().includes('настол'))
        );
        const inBio =
          (u.bio || '').toLowerCase().includes(target) ||
          (u.openToInvitesNote || '').toLowerCase().includes(target);
        if (!hasInterest && !inBio) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${u.name} ${u.occupation || ''} ${u.bio || ''} ${(u.interests || []).join(' ')} ${u.openToInvitesNote || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [seekers, onlyOpenToInvites, genderFilter, minAge, maxAge, interestFilter, searchQuery]);

  const handleApplyPreset = (
    gender: 'all' | 'female' | 'male',
    min: number,
    max: number,
    interest: string
  ) => {
    setGenderFilter(gender);
    setMinAge(min);
    setMaxAge(max);
    setInterestFilter(interest);
  };

  const handleSendInvite = async (user: UserProfile) => {
    if (!selectedEvent) return;
    setSendingUserId(user.id);
    try {
      const note =
        customInviteNote.trim() ||
        `Привет, ${user.name.split(' ')[0]}! Нашли ваш профиль по интересам (${interestFilter !== 'Все' ? interestFilter : 'общие темы'}) и приглашаем присоединиться к нашей встрече «${selectedEvent.title}»!`;
      await onInviteUser(selectedEvent.id, user.id, note);
      setInvitedMap((prev) => ({ ...prev, [`${selectedEvent.id}:${user.id}`]: true }));
    } finally {
      setSendingUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Top Modal Header */}
        <div
          className="p-4 sm:p-6 border-b flex items-start justify-between gap-4"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/12 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>
                {lang === 'en'
                  ? 'Participant Finder · Open to Invites'
                  : 'Подбор участников из списка · «Жду приглашений»'}
              </span>
            </div>
            <h2
              className="text-lg sm:text-xl font-display font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {lang === 'en'
                ? 'Invite People Looking for Company'
                : 'Добавить участников из списка желающих'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'en'
                ? 'Configure filters by gender, age range, and interests (e.g. Women · 25–35 · Board Games) and send personal invitations.'
                : 'Настройте фильтры по полу, возрасту и интересам (например: Девушки · 25–35 лет · Настолки) и отправьте приглашение на вашу встречу.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Target Event Selector */}
          <div
            className="p-3.5 rounded-2xl border space-y-2"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <label
              className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>
                {lang === 'en'
                  ? '1. Select your event to invite guests to:'
                  : '1. Выберите ваше мероприятие для приглашения:'}
              </span>
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              {myEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.isToday ? 'Сегодня' : ev.date} в {ev.time} · мест: {ev.occupiedSpots}/{ev.totalSpots})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Quick Filter Presets + Detailed Filters */}
          <div
            className="p-4 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-xs font-bold flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {lang === 'en' ? '2. Candidate Filters' : '2. Параметры подбора кандидатов'}
                </span>
              </span>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('female', 25, 35, 'Настольные игры')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      genderFilter === 'female' &&
                      minAge === 25 &&
                      maxAge === 35 &&
                      interestFilter === 'Настольные игры'
                        ? 'var(--accent-primary)'
                        : 'var(--bg-surface)',
                    color:
                      genderFilter === 'female' &&
                      minAge === 25 &&
                      maxAge === 35 &&
                      interestFilter === 'Настольные игры'
                        ? '#FFFFFF'
                        : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  ★ Девушки 25–35 · Настолки
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all', 18, 50, 'Все')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {lang === 'en' ? 'Show All' : 'Сбросить фильтры'}
                </button>
              </div>
            </div>

            {/* Gender & Age Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Gender Selector */}
              <div className="sm:col-span-5 space-y-1">
                <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                  {lang === 'en' ? 'Gender' : 'Пол участников'}
                </span>
                <div
                  className="grid grid-cols-3 p-1 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {[
                    { id: 'all' as const, label: lang === 'en' ? 'All' : 'Все' },
                    { id: 'female' as const, label: lang === 'en' ? 'Women' : 'Девушки' },
                    { id: 'male' as const, label: lang === 'en' ? 'Men' : 'Мужчины' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGenderFilter(g.id)}
                      className="py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      style={
                        genderFilter === g.id
                          ? { backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }
                          : { color: 'var(--text-secondary)' }
                      }
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Range Selector */}
              <div className="sm:col-span-7 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {lang === 'en' ? 'Age range (years)' : 'Возраст (лет)'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: '18–25', min: 18, max: 25 },
                      { label: '25–35', min: 25, max: 35 },
                      { label: '30–45', min: 30, max: 45 },
                      { label: '18–60', min: 18, max: 60 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setMinAge(preset.min);
                          setMaxAge(preset.max);
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer"
                        style={
                          minAge === preset.min && maxAge === preset.max
                            ? {
                                backgroundColor: 'var(--accent-soft)',
                                borderColor: 'var(--accent-primary)',
                                color: 'var(--accent-text)',
                              }
                            : {
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--text-muted)',
                              }
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>от</span>
                    <input
                      type="number"
                      min={18}
                      max={70}
                      value={minAge}
                      onChange={(e) => setMinAge(Math.max(18, Number(e.target.value) || 18))}
                      className="w-full text-xs font-bold bg-transparent focus:outline-none tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>—</span>
                  <div className="flex-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>до</span>
                    <input
                      type="number"
                      min={18}
                      max={80}
                      value={maxAge}
                      onChange={(e) => setMaxAge(Math.max(minAge, Number(e.target.value) || 35))}
                      className="w-full text-xs font-bold bg-transparent focus:outline-none tabular-nums"
                      style={{ color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interests Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
                {lang === 'en' ? 'Topic / Interest:' : 'Интерес / Формат встречи:'}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {INTEREST_FILTERS.map((interest) => {
                  const isSelected = interestFilter === interest;
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => setInterestFilter(interest)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer shrink-0"
                      style={
                        isSelected
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
                      {interest === 'Настольные игры'
                        ? lang === 'en'
                          ? 'Board Games'
                          : 'Настольные игры (Настолки)'
                        : translateCategory(interest, lang)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search & Only Open To Invites Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="relative flex-1">
                <Search
                  className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search by name, profession, or bio...'
                      : 'Поиск по имени, профессии или играм...'
                  }
                  className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={onlyOpenToInvites}
                  onChange={(e) => setOnlyOpenToInvites(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
                <span style={{ color: 'var(--text-primary)' }}>
                  {lang === 'en'
                    ? 'Only with "Open to Invites" badge'
                    : 'Только с меткой «Жду приглашений»'}
                </span>
              </label>
            </div>
          </div>

          {/* Optional Custom Invite Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold block" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'en'
                ? 'Personal note with invitation (optional):'
                : 'Сообщение к приглашению (опционально):'}
            </label>
            <input
              type="text"
              value={customInviteNote}
              onChange={(e) => setCustomInviteNote(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Hi! We are gathering a group for board games tonight, would love for you to join!'
                  : 'Привет! Собираем классную компанию на вечер, будем рады видеть тебя с нами!'
              }
              className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 3. Matched Users List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {lang === 'en'
                    ? `Matches found (${filteredSeekers.length})`
                    : `Найдено совпадений (${filteredSeekers.length})`}
                </span>
              </span>
            </div>

            {filteredSeekers.length === 0 ? (
              <div
                className="p-8 rounded-3xl border text-center space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {lang === 'en'
                    ? 'No users match these exact filters'
                    : 'По выбранным фильтрам совпадений не найдено'}
                </p>
                <p className="text-xs">
                  {lang === 'en'
                    ? 'Try expanding the age range or selecting another interest category.'
                    : 'Попробуйте расширить возрастной диапазон или выбрать другую тему.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence initial={false}>
                  {filteredSeekers.map((candidate) => {
                    const alreadyApproved =
                      selectedEvent?.approvedParticipantIds?.includes(candidate.id) ?? false;
                    const alreadyInvited =
                      Boolean(selectedEvent && invitedMap[`${selectedEvent.id}:${candidate.id}`]);

                    return (
                      <motion.div
                        key={candidate.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-shadow hover:shadow-md"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            onClick={() => onInspectUser?.(candidate.id)}
                            className="relative shrink-0 cursor-pointer"
                          >
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-2xl object-cover border"
                              style={{ borderColor: 'var(--border-subtle)' }}
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[var(--bg-surface)] ${
                                candidate.onlineStatus === 'online'
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-400'
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onInspectUser?.(candidate.id)}
                                className="text-sm font-bold hover:underline cursor-pointer"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {candidate.name}, {candidate.age}
                              </button>

                              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-500 tabular-nums">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {candidate.reliability.score}
                              </span>

                              {candidate.openToInvites && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    {lang === 'en'
                                      ? 'Open to Invites'
                                      : 'Жду приглашений на мероприятие'}
                                  </span>
                                </span>
                              )}
                            </div>

                            {candidate.occupation && (
                              <div
                                className="text-xs flex items-center gap-1.5"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                <Briefcase className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                                <span className="truncate">
                                  {candidate.occupation}
                                  {candidate.companyOrIndustry ? ` · ${candidate.companyOrIndustry}` : ''}
                                </span>
                              </div>
                            )}

                            {candidate.openToInvitesNote && (
                              <p
                                className="text-xs italic line-clamp-2"
                                style={{ color: 'var(--accent-text)' }}
                              >
                                «{candidate.openToInvitesNote}»
                              </p>
                            )}

                            <div className="flex flex-wrap gap-1 pt-1">
                              {(candidate.interests || []).map((interest) => {
                                const isMatch =
                                  interestFilter !== 'Все' &&
                                  interest.toLowerCase().includes(interestFilter.toLowerCase());
                                return (
                                  <span
                                    key={interest}
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold border"
                                    style={
                                      isMatch
                                        ? {
                                            backgroundColor: 'var(--accent-soft)',
                                            borderColor: 'var(--accent-primary)',
                                            color: 'var(--accent-text)',
                                          }
                                        : {
                                            backgroundColor: 'var(--bg-elevated)',
                                            borderColor: 'var(--border-subtle)',
                                            color: 'var(--text-secondary)',
                                          }
                                    }
                                  >
                                    {translateCategory(interest, lang)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          {alreadyApproved ? (
                            <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? 'In Group' : 'Уже в компании'}</span>
                            </span>
                          ) : alreadyInvited ? (
                            <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white inline-flex items-center gap-1.5 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? 'Invited ✓' : 'Приглашен(а) ✓'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={sendingUserId === candidate.id || !selectedEvent}
                              onClick={() => handleSendInvite(candidate)}
                              className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-sm disabled:opacity-50"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                              {sendingUserId === candidate.id ? (
                                <span>...</span>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <Send className="w-3 h-3 hidden sm:inline" />
                                  <span>
                                    {lang === 'en' ? 'Invite to Event' : 'Пригласить на встречу'}
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
