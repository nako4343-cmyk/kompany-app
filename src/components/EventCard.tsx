import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Unlock,
  Compass,
  ArrowUpRight,
  Bookmark,
  Star,
  Radio,
  Clock,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import { EventItem, UserProfile } from '../types/index.ts';
import { EventSlotsTimeline } from './EventSlotsTimeline.tsx';
import {
  AppLanguage,
  UI_TEXT,
  translateCategory,
  translateDistrict,
  translateVibe,
} from '../i18n/translations.ts';

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
  const [isHovered, setIsHovered] = useState(false);

  const isOrganizer = currentUser.id === event.organizerId;
  const isApproved = event.approvedParticipantIds.includes(currentUser.id);
  const appStatus = isApproved ? 'accepted' : event.myApplicationStatus ?? null;
  const isSaved = currentUser.savedEventIds?.includes(event.id) ?? false;
  const isFull = event.occupiedSpots >= event.totalSpots;
  const availableSpots = Math.max(0, event.totalSpots - event.occupiedSpots);
  const fillPercent = Math.min(
    100,
    Math.round((event.occupiedSpots / event.totalSpots) * 100)
  );

  const formatEventDate = (dateStr: string, isToday: boolean, timeStr: string) => {
    if (isToday) return `${t.todayWord}, ${timeStr}`;
    const d = new Date(dateStr);
    const day = d.getDate();
    const monthsRu = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = lang === 'en' ? monthsEn : monthsRu;
    return `${day} ${months[d.getMonth()]}, ${timeStr}`;
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onOpenDetails(event)}
      className="relative group rounded-3xl border studio-card studio-card-hover overflow-hidden cursor-pointer flex flex-col"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
      }}
    >
      {/* Visual Media Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
        <img
          src={event.imageUrl}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Measured Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />

        {/* Top Row: Unboxed Category Kicker & Privacy + Bookmark */}
        <div className="absolute top-3.5 left-4 right-3.5 flex items-center justify-between text-xs text-white/95">
          <div className="flex items-center gap-1.5 font-semibold drop-shadow-xs">
            <span>{translateCategory(event.category, lang)}</span>
            {event.isToday && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-amber-300">{t.tonightBadge}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-black/55 px-2.5 py-1.5 rounded-xl border border-white/15">
              {isOrganizer || isApproved ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">{t.addressUnlockedShort}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span className="text-white/95">{t.addressHiddenShort}</span>
                </>
              )}
            </div>

            {onToggleSave && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(event.id);
                }}
                aria-label="Сохранить мероприятие"
                className="w-8 h-8 rounded-xl bg-black/55 hover:bg-black/75 border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Bookmark
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'
                  }`}
                />
              </motion.button>
            )}
          </div>
        </div>

        {/* Bottom Media Metadata */}
        <div className="absolute bottom-3.5 left-4 right-4 text-white">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/90 font-mono-num">
            <span className="font-semibold font-sans text-white">
              {formatEventDate(event.date, event.isToday, event.time)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-sans">{translateDistrict(event.approximateArea, lang)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 relative z-10">
        <div>
          {isRecommended && matchReason && (
            <div
              className="mb-2.5 flex items-center gap-2 text-xs font-semibold"
              style={{ color: 'var(--accent-primary)' }}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{matchReason}</span>
            </div>
          )}

          {/* Event Headline */}
          <h3
            className="text-base font-display font-bold leading-snug line-clamp-2 transition-colors"
            style={{
              color: isHovered ? 'var(--accent-primary)' : 'var(--text-primary)',
            }}
          >
            {event.title}
          </h3>

          {/* Vibe Check Unboxed Kicker */}
          {event.vibe && (
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--accent-text)' }}
            >
              <Radio className="w-3 h-3 shrink-0" />
              <span>{translateVibe(event.vibe, lang)}</span>
              {event.musicOrMood && (
                <>
                  <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
                    ·
                  </span>
                  <span
                    className="truncate font-normal"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {event.musicOrMood}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Description */}
          <p
            className="mt-2 text-xs leading-relaxed line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {event.description}
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Organizer & Budget Row */}
          <div
            className="pt-3.5 border-t flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={event.organizer.avatarUrl}
                alt={event.organizer.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover shrink-0 border"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
              <div className="text-xs min-w-0">
                <div
                  className="font-bold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.organizer.name}, {event.organizer.age}
                </div>
                <div
                  className="text-[11px] flex items-center gap-1 tabular-nums mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{event.organizer.reliability.score}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {event.organizer.reliability.attendanceRate}% {t.attendanceRateLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className="text-xs font-bold block tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {event.budget}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {t.budgetHint}
              </span>
            </div>
          </div>

          {/* Visual Slots Timeline & Event Schedule */}
          <EventSlotsTimeline
            event={event}
            compact={true}
            isOrganizer={isOrganizer}
            onSlotClick={() => onOpenDetails(event)}
          />

          {/* Capacity Progress & Interactive Button */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-xs tabular-nums">
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {event.occupiedSpots} {t.spotsOf} {event.totalSpots} {t.peopleShort}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {isFull
                    ? t.spotsFull
                    : `${t.spotsAvailablePrefix} ${availableSpots}`}
                </span>
              </div>
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-elevated)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercent}%` }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: isFull ? '#94a3b8' : 'var(--accent-primary)',
                  }}
                />
              </div>
            </div>

            <div className="shrink-0">
              {isOrganizer ? (
                <span
                  className="px-3.5 py-2 rounded-2xl text-xs font-bold inline-block whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {t.youAreHost}
                </span>
              ) : appStatus === 'accepted' ? (
                <span
                  className="px-3.5 py-2 rounded-2xl text-xs font-bold border inline-flex items-center gap-1.5 whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    borderColor: 'color-mix(in srgb, var(--accent-primary) 26%, transparent)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                  <span>{t.statusApproved}</span>
                </span>
              ) : appStatus === 'pending' ? (
                <span className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.statusPending}</span>
                </span>
              ) : appStatus === 'rejected' ? (
                <span className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 inline-flex items-center gap-1.5 whitespace-nowrap">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.statusRejected}</span>
                </span>
              ) : isFull ? (
                <span
                  className="px-3.5 py-2 rounded-2xl text-xs font-medium inline-block whitespace-nowrap"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {t.fullBadge}
                </span>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails(event);
                  }}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>{t.joinCompanyBtn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
