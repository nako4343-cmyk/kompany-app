import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Bookmark,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Compass,
  Flame,
  Sparkles,
  Users,
  Calendar,
} from 'lucide-react';
import { EventItem, UserProfile } from '../types/index.ts';
import {
  AppLanguage,
  UI_TEXT,
  translateCategory,
  translateDistrict,
} from '../i18n/translations.ts';
import {
  extractDistrictName,
  formatAgeRangeLabel,
  getEventAvailabilityStatus,
} from '../utils/eventMatching.ts';

interface EventCardProps {
  event: EventItem;
  currentUser: UserProfile;
  onOpenDetails: (event: EventItem) => void;
  onToggleSave?: (eventId: string) => void;
  onQuickApply?: (event: EventItem) => void;
  isRecommended?: boolean;
  matchReason?: string;
  lang?: AppLanguage;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  currentUser,
  onOpenDetails,
  onToggleSave,
  isRecommended,
  matchReason,
  lang = 'ru',
}) => {
  const t = UI_TEXT[lang];
  const isEn = lang === 'en';
  const [isHovered, setIsHovered] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOrganizer = currentUser.id === event.organizerId;
  const isApproved = event.approvedParticipantIds.includes(currentUser.id);
  const appStatus = isApproved ? 'accepted' : event.myApplicationStatus ?? null;
  const isSaved = currentUser.savedEventIds?.includes(event.id) ?? false;
  const isFull = event.occupiedSpots >= event.totalSpots;
  const availableSpots = Math.max(0, event.totalSpots - event.occupiedSpots);
  const fillPercent = Math.min(
    100,
    Math.round((event.occupiedSpots / Math.max(1, event.totalSpots)) * 100)
  );

  const availabilityStatus = getEventAvailabilityStatus(event);
  const ageRangeLabel = useMemo(
    () => formatAgeRangeLabel(event.requirements),
    [event.requirements]
  );
  const districtLabel = useMemo(
    () => translateDistrict(extractDistrictName(event.approximateArea), lang),
    [event.approximateArea, lang]
  );

  // Build deduplicated participant avatar stack (organizer + approved participants)
  const participantAvatars = useMemo(() => {
    const list: Array<{ id: string; name: string; avatarUrl: string }> = [];
    const seen = new Set<string>();

    if (event.organizer?.avatarUrl) {
      seen.add(event.organizer.id);
      list.push({
        id: event.organizer.id,
        name: event.organizer.name,
        avatarUrl: event.organizer.avatarUrl,
      });
    }

    if (Array.isArray(event.approvedParticipants)) {
      for (const p of event.approvedParticipants) {
        if (!seen.has(p.id) && p.avatarUrl) {
          seen.add(p.id);
          list.push({ id: p.id, name: p.name, avatarUrl: p.avatarUrl });
        }
      }
    }

    return list;
  }, [event.organizer, event.approvedParticipants]);

  const visibleAvatars = participantAvatars.slice(0, 4);
  const extraCount = Math.max(0, event.occupiedSpots - visibleAvatars.length);

  const formatEventDate = (dateStr: string, isToday: boolean, timeStr: string) => {
    if (isToday) return `${t.todayWord}, ${timeStr}`;
    const d = new Date(dateStr);
    const day = d.getDate();
    const monthsRu = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = isEn ? monthsEn : monthsRu;
    return `${day} ${months[d.getMonth()]}, ${timeStr}`;
  };

  const statusMeta = {
    open: {
      label: isEn ? 'Spots open' : 'Есть места',
      bg: 'rgba(255, 255, 255, 0.94)',
      text: '#162946',
      icon: <Users className="w-3 h-3 text-[#E4482A]" />,
    },
    almost_full: {
      label: isEn ? 'Almost full' : 'Почти заполнено',
      bg: '#E4482A',
      text: '#FFFFFF',
      icon: <Flame className="w-3 h-3 text-white" />,
    },
    new: {
      label: isEn ? 'New' : 'Новое',
      bg: '#162946',
      text: '#FFFFFF',
      icon: <Sparkles className="w-3 h-3 text-[#F06A4B]" />,
    },
    full: {
      label: isEn ? 'Full' : 'Мест нет',
      bg: 'rgba(22, 41, 70, 0.84)',
      text: '#FFFFFF',
      icon: null,
    },
  }[availabilityStatus];

  const isFree = event.budget === 'Бесплатно';
  const budgetLabel = isFree ? (isEn ? 'Free' : 'Бесплатно') : event.budget;
  const hasLongDescription = (event.description || '').length > 105;

  const formatAvailableSpotsText = () => {
    if (isFull) return isEn ? 'Full' : 'мест нет';
    if (isEn) return `${availableSpots} left`;
    if (availableSpots === 1) return 'осталось 1 место';
    if (availableSpots >= 2 && availableSpots <= 4) return `осталось ${availableSpots} места`;
    return `осталось ${availableSpots} мест`;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onOpenDetails(event)}
      className="relative group rounded-[26px] border overflow-hidden cursor-pointer flex flex-col transition-shadow duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isHovered
          ? 'color-mix(in srgb, var(--accent-primary) 45%, var(--border-subtle))'
          : 'var(--border-subtle)',
        boxShadow: isHovered
          ? '0 18px 38px -12px rgba(22, 41, 70, 0.14), 0 4px 12px -2px rgba(22, 41, 70, 0.05)'
          : '0 4px 18px -6px rgba(22, 41, 70, 0.07), 0 1px 3px rgba(22, 41, 70, 0.03)',
      }}
    >
      {/* 1. HERO PHOTOGRAPH */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#162946]">
        {!imageError && event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white/90"
            style={{
              background: 'linear-gradient(135deg, #162946 0%, #243C61 60%, #E8614D 100%)',
            }}
          >
            <Calendar className="w-8 h-8 mb-2 opacity-80" />
            <span className="text-xs font-semibold opacity-90">
              {translateCategory(event.category, lang)}
            </span>
          </div>
        )}

        {/* Measured Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/22 to-black/15" />

        {/* Top Row: Event Status + Bookmark */}
        <div className="absolute top-3 left-3.5 right-3 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold shadow-sm backdrop-blur-md"
            style={{
              backgroundColor: statusMeta.bg,
              color: statusMeta.text,
            }}
          >
            {statusMeta.icon}
            <span>{statusMeta.label}</span>
          </span>

          {onToggleSave && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={e => {
                e.stopPropagation();
                onToggleSave(event.id);
              }}
              aria-label={isSaved ? 'Убрать из сохранённых' : 'Сохранить мероприятие'}
              className="w-10 h-10 -mr-1 -mt-1 flex items-center justify-center cursor-pointer"
            >
              <span className="w-9 h-9 rounded-xl bg-black/48 hover:bg-black/68 backdrop-blur-md border border-white/15 flex items-center justify-center transition-colors">
                <Bookmark
                  className={`w-4 h-4 transition-colors ${
                    isSaved ? 'fill-[#F06A4B] text-[#F06A4B]' : 'text-white'
                  }`}
                />
              </span>
            </motion.button>
          )}
        </div>

        {/* Bottom Scrim Row: Date/Time + Distance (left) & Cost/Free (right) */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[13px] font-bold leading-tight drop-shadow-xs tabular-nums">
              <span>{formatEventDate(event.date, event.isToday, event.time)}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-white/88 tabular-nums">
              <MapPin className="w-3 h-3 text-[#F06A4B] shrink-0" />
              <span>
                {event.distanceKm} {isEn ? 'km away' : 'км от вас'}
              </span>
            </div>
          </div>

          <span
            className="px-2.5 py-1 rounded-xl text-xs font-extrabold tabular-nums shrink-0 backdrop-blur-md"
            style={
              isFree
                ? { backgroundColor: '#F06A4B', color: '#FFFFFF' }
                : {
                    backgroundColor: 'rgba(22, 41, 70, 0.78)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.16)',
                  }
            }
          >
            {budgetLabel}
          </span>
        </div>
      </div>

      {/* 2. EDITORIAL CARD BODY */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
        <div className="space-y-2">
          {/* Unboxed Metadata Line: Category · District / Venue · Age Range */}
          <div
            className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] font-medium leading-snug"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
              {translateCategory(event.category, lang)}
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {event.exactVenue ? `${districtLabel}, ${event.exactVenue}` : districtLabel}
            </span>
            {ageRangeLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {ageRangeLabel}
                </span>
              </>
            )}
          </div>

          {/* Full Readable Event Title (never cuts off important words) */}
          <h3
            className="text-[17px] sm:text-[18px] font-display font-extrabold leading-[1.28] text-balance transition-colors"
            style={{
              color: isHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            {event.title}
          </h3>

          {/* Concise Description with Optional Expand */}
          <div>
            <p
              className={`text-[13px] leading-relaxed ${
                isDescriptionExpanded ? '' : 'line-clamp-2'
              }`}
              style={{ color: 'var(--text-secondary)' }}
            >
              {event.description}
            </p>
            {hasLongDescription && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setIsDescriptionExpanded(prev => !prev);
                }}
                className="mt-0.5 text-[12px] font-bold cursor-pointer hover:underline"
                style={{ color: 'var(--accent-text)' }}
              >
                {isDescriptionExpanded
                  ? isEn
                    ? 'Show less'
                    : 'Свернуть'
                  : isEn
                  ? 'Read more'
                  : 'Читать полностью'}
              </button>
            )}
          </div>

          {/* Optional Intelligent Match Reason */}
          {isRecommended && matchReason && (
            <div
              className="pt-0.5 flex items-center gap-1.5 text-[12px] font-semibold"
              style={{ color: 'var(--accent-text)' }}
            >
              <Compass
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: 'var(--accent-primary)' }}
              />
              <span className="leading-snug">{matchReason}</span>
            </div>
          )}
        </div>

        {/* 3. FOOTER: PARTICIPANT AVATARS + SPOTS + PRIMARY ACTION */}
        <div
          className="pt-3.5 border-t flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Left: Overlapping Avatars + Spots Counter + Progress */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Participant Avatars Stack */}
              <div className="flex items-center -space-x-2 shrink-0">
                {visibleAvatars.map(person => (
                  <img
                    key={person.id}
                    src={person.avatarUrl}
                    alt={person.name}
                    title={person.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-2"
                    style={{
                      borderColor: 'var(--bg-surface)',
                      ['--tw-ring-color' as any]: 'var(--bg-surface)',
                    }}
                  />
                ))}
                {extraCount > 0 && (
                  <span
                    className="w-7 h-7 rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 tabular-nums"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      ['--tw-ring-color' as any]: 'var(--bg-surface)',
                    }}
                  >
                    +{extraCount}
                  </span>
                )}
              </div>

              {/* Spots Summary */}
              <div className="min-w-0 leading-tight">
                <div
                  className="text-[12px] font-bold tabular-nums truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.occupiedSpots} {t.spotsOf} {event.totalSpots}
                </div>
                <div
                  className="text-[11px] font-medium truncate"
                  style={{
                    color:
                      availabilityStatus === 'almost_full'
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                  }}
                >
                  {formatAvailableSpotsText()}
                </div>
              </div>
            </div>

            {/* Subtle Slim Fill Bar */}
            <div
              className="w-full max-w-[148px] h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--bg-elevated)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: isFull ? '#94A3B8' : 'var(--accent-primary)',
                }}
              />
            </div>
          </div>

          {/* Right: Prominent Action CTA (44px+ touch target) */}
          <div className="shrink-0">
            {isOrganizer ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-4 rounded-2xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{
                  backgroundColor: '#162946',
                  color: '#FFFFFF',
                }}
              >
                <span>{isEn ? 'Manage' : 'Подробнее'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F06A4B]" />
              </button>
            ) : appStatus === 'accepted' ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-3.5 rounded-2xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'color-mix(in srgb, var(--accent-primary) 28%, transparent)',
                  color: 'var(--accent-text)',
                }}
              >
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span>{isEn ? 'Joined' : 'Вы идёте'}</span>
              </button>
            ) : appStatus === 'pending' ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-3.5 rounded-2xl text-xs font-bold bg-amber-500/12 text-amber-700 border border-amber-500/25 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? 'Pending' : 'Заявка'}</span>
              </button>
            ) : appStatus === 'rejected' ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-3.5 rounded-2xl text-xs font-bold bg-rose-500/12 text-rose-700 border border-rose-500/25 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t.statusRejected}</span>
              </button>
            ) : isFull ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-4 rounded-2xl text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {isEn ? 'Details' : 'Подробнее'}
              </button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={e => {
                  e.stopPropagation();
                  onOpenDetails(event);
                }}
                className="min-h-[44px] px-4 rounded-2xl text-xs font-display font-bold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
                style={{
                  background: 'linear-gradient(180deg, #F0593B 0%, #DE4326 100%)',
                  boxShadow: '0 8px 18px -6px rgba(228, 72, 42, 0.42)',
                }}
              >
                <span>{isEn ? 'Join' : 'Присоединиться'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
