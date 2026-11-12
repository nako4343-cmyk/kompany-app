import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface ConfettiSpec {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  shape: 'circle' | 'square' | 'pill';
  delay: number;
  size: number;
}

const CONFETTI_SPECS: ConfettiSpec[] = [
  { id: 1, x: -72, y: -58, rotate: -140, color: '#F97316', shape: 'pill', delay: 0, size: 7 },
  { id: 2, x: -48, y: -76, rotate: 95, color: '#F59E0B', shape: 'circle', delay: 0.03, size: 6 },
  { id: 3, x: -24, y: -64, rotate: 180, color: '#10B981', shape: 'square', delay: 0.05, size: 6 },
  { id: 4, x: 0, y: -82, rotate: -90, color: '#EC4899', shape: 'pill', delay: 0.02, size: 7 },
  { id: 5, x: 26, y: -70, rotate: 135, color: '#6366F1', shape: 'circle', delay: 0.04, size: 6 },
  { id: 6, x: 52, y: -78, rotate: -160, color: '#38BDF8', shape: 'square', delay: 0.01, size: 6 },
  { id: 7, x: 76, y: -54, rotate: 110, color: '#F59E0B', shape: 'pill', delay: 0.06, size: 7 },
  { id: 8, x: -60, y: -36, rotate: 210, color: '#EC4899', shape: 'circle', delay: 0.07, size: 5 },
  { id: 9, x: -16, y: -44, rotate: -120, color: '#F97316', shape: 'square', delay: 0.04, size: 5 },
  { id: 10, x: 18, y: -48, rotate: 165, color: '#10B981', shape: 'pill', delay: 0.05, size: 6 },
  { id: 11, x: 62, y: -34, rotate: -195, color: '#6366F1', shape: 'circle', delay: 0.08, size: 5 },
  { id: 12, x: 38, y: -62, rotate: 85, color: '#F43F5E', shape: 'square', delay: 0.03, size: 6 },
];

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
  const [burstKey, setBurstKey] = useState(0);

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
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const months = lang === 'es' ? monthsEs : monthsRu;
    return `${day} ${months[d.getMonth()]}, ${timeStr}`;
  };

  const handleHoverStart = () => {
    setIsHovered(true);
    setBurstKey((prev) => prev + 1);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isHovered ? [1, 1.012, 1.006] : 1,
      }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.99 }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1],
        scale: isHovered
          ? { duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
          : { duration: 0.2 },
      }}
      onClick={() => onOpenDetails(event)}
      className="relative group rounded-3xl border transition-shadow duration-300 overflow-hidden cursor-pointer flex flex-col hover:shadow-2xl"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isHovered ? 'var(--accent-primary)' : 'var(--border-subtle)',
      }}
    >
      {/* Subtle Ambient Pulse Glow Overlay on Hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            key="hover-pulse-aura"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.12, 0.26, 0.12] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
            style={{
              boxShadow: 'inset 0 0 28px var(--accent-soft)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Confetti Burst Overlay on Hover / Tap */}
      <AnimatePresence>
        {isHovered && burstKey > 0 && (
          <div
            key={`confetti-burst-${burstKey}`}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-14 right-14 z-30 flex items-center justify-center"
          >
            {CONFETTI_SPECS.map((particle) => (
              <motion.span
                key={particle.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.2, rotate: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: particle.x,
                  y: [0, particle.y, particle.y + 24],
                  scale: [0.4, 1.15, 0.6],
                  rotate: particle.rotate,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.85,
                  delay: particle.delay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`absolute block shadow-xs ${
                  particle.shape === 'circle'
                    ? 'rounded-full'
                    : particle.shape === 'pill'
                    ? 'rounded-full'
                    : 'rounded-[2px]'
                }`}
                style={{
                  width:
                    particle.shape === 'pill'
                      ? `${particle.size * 1.6}px`
                      : `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Visual Media Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={event.imageUrl}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Measured Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />

        {/* Top Left Unboxed Kicker & Privacy + Bookmark Status */}
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
            <div className="flex items-center gap-1.5 text-[11px] font-semibold backdrop-blur-md bg-black/45 px-2.5 py-1.5 rounded-xl border border-white/15">
              {isOrganizer || isApproved ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">{t.addressUnlockedShort}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-amber-300" />
                  <span className="text-white/90">{t.addressHiddenShort}</span>
                </>
              )}
            </div>

            {onToggleSave && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setBurstKey((prev) => prev + 1);
                  setIsHovered(true);
                  onToggleSave(event.id);
                }}
                className="w-8 h-8 rounded-xl backdrop-blur-md bg-black/45 hover:bg-black/65 border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
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
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/90 tabular-nums">
            <span className="font-semibold text-white">
              {formatEventDate(event.date, event.isToday, event.time)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{translateDistrict(event.approximateArea, lang)}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 relative z-20">
        <div>
          {isRecommended && matchReason && (
            <div
              className="mb-3 flex items-center gap-2 text-xs p-2.5 rounded-2xl"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
              }}
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1 font-medium">{matchReason}</span>
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
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                <motion.span
                  animate={isHovered ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{ duration: 1.2, repeat: isHovered ? Infinity : 0 }}
                  className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.statusApproved}</span>
                </motion.span>
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
                  animate={isHovered ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                  transition={{
                    duration: 1.1,
                    repeat: isHovered ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setBurstKey((prev) => prev + 1);
                    onOpenDetails(event);
                  }}
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
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
