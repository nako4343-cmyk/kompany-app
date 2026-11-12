import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, UserPlus, CheckCircle2, ChevronDown, 
  Calendar, Crown, Check, Star, Briefcase, UserCheck, UserX
} from 'lucide-react';
import { EventItem } from '../types/index.ts';
import { OnlineStatusBadge } from './OnlineStatusBadge.tsx';

interface EventSlotsTimelineProps {
  event: EventItem;
  compact?: boolean;
  isOrganizer?: boolean;
  onSlotClick?: (slotIndex: number, participant?: any) => void;
  onMarkAttendance?: (participantId: string, status: 'attended' | 'no_show') => void;
}

export const EventSlotsTimeline: React.FC<EventSlotsTimelineProps> = ({
  event,
  compact = false,
  isOrganizer = false,
  onSlotClick,
  onMarkAttendance,
}) => {
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);

  const totalSpots = Math.max(2, event.totalSpots || 4);
  const occupiedSpots = Math.min(totalSpots, Math.max(1, event.occupiedSpots || 1));
  const availableSpots = Math.max(0, totalSpots - occupiedSpots);
  const fillRate = Math.round((occupiedSpots / totalSpots) * 100);

  const calculateTimelineTimes = (startTimeStr: string) => {
    try {
      const [hStr, mStr] = (startTimeStr || '19:00').split(':');
      const startH = parseInt(hStr, 10) || 19;
      const startM = parseInt(mStr, 10) || 0;

      const formatTime = (h: number, m: number) => {
        const normH = ((h % 24) + 24) % 24;
        const normM = ((m % 60) + 60) % 60;
        return `${String(normH).padStart(2, '0')}:${String(normM).padStart(2, '0')}`;
      };

      return [
        {
          time: formatTime(startH, startM),
          phase: 'Сбор и знакомство',
          desc: 'Встреча у входа, приветствие участников и быстрый старт общения',
          status: 'start',
        },
        {
          time: formatTime(startH, startM + 30),
          phase: 'Основная программа',
          desc: event.vibe ? `Формат встречи: ${event.vibe}` : 'Основная часть встречи, ужин, игра или мероприятие',
          status: 'main',
        },
        {
          time: formatTime(startH + 2, startM),
          phase: 'Свободное общение',
          desc: 'Обмен впечатлениями, контактами и совместными фото в чате',
          status: 'end',
        },
      ];
    } catch {
      return [
        { time: event.time || '19:00', phase: 'Сбор участников', desc: 'Встреча в условленном месте', status: 'start' },
        { time: '19:30', phase: 'Основная активность', desc: 'Общая программа встречи', status: 'main' },
        { time: '21:00', phase: 'Финал и общение', desc: 'Свободная беседа и обмен контактами', status: 'end' },
      ];
    }
  };

  const schedulePhases = calculateTimelineTimes(event.time);

  const slots = Array.from({ length: totalSpots }).map((_, index) => {
    if (index === 0) {
      return {
        index,
        userId: event.organizerId,
        isOccupied: true,
        isOrganizer: true,
        name: event.organizer.name,
        age: event.organizer.age,
        avatarUrl: event.organizer.avatarUrl,
        label: 'Организатор',
        occupation: (event.organizer as any).occupation || 'Автор встречи',
        rating: event.organizer.reliability?.score || 5.0,
        onlineStatus: (event.organizer as any).onlineStatus || 'online',
        lastSeen: (event.organizer as any).lastSeen,
      };
    }

    const participant = event.approvedParticipants && event.approvedParticipants[index - 1];
    if (participant) {
      return {
        index,
        userId: participant.id,
        isOccupied: true,
        isOrganizer: false,
        name: participant.name,
        age: participant.age,
        avatarUrl: participant.avatarUrl,
        label: 'Участник',
        occupation: participant.occupation || 'В компании',
        rating: participant.reliability?.score || 5.0,
        onlineStatus: participant.onlineStatus || 'recent',
        lastSeen: participant.lastSeen,
      };
    }

    if (index < occupiedSpots) {
      return {
        index,
        userId: event.approvedParticipantIds?.[index - 1] || `slot-${index}`,
        isOccupied: true,
        isOrganizer: false,
        name: `Участник #${index + 1}`,
        age: undefined,
        avatarUrl: '',
        label: 'Подтверждён',
        occupation: 'Одобренная заявка',
        rating: 5.0,
        onlineStatus: 'recent' as const,
        lastSeen: undefined,
      };
    }

    return {
      index,
      userId: null,
      isOccupied: false,
      isOrganizer: false,
      name: `Свободный слот #${index + 1}`,
      age: undefined,
      avatarUrl: '',
      label: 'Свободно',
      occupation: 'Открыт для заявки',
      rating: null,
      onlineStatus: undefined,
      lastSeen: undefined,
    };
  });

  const maxVisibleCompactSlots = 8;
  const maxVisibleDetailSlots = Math.max(occupiedSpots + 4, 10);
  const compactVisibleSlots = slots.slice(0, maxVisibleCompactSlots);
  const compactExtraCount = Math.max(0, slots.length - compactVisibleSlots.length);
  const detailVisibleSlots = slots.slice(0, maxVisibleDetailSlots);
  const detailExtraCount = Math.max(0, slots.length - detailVisibleSlots.length);

  // COMPACT VIEW FOR FEED CARDS
  if (compact) {
    return (
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>Состав компании</span>
            <span className="tabular-nums font-normal" style={{ color: 'var(--text-muted)' }}>
              · {occupiedSpots} из {totalSpots}
            </span>
          </div>

          <span
            className="text-[11px] font-semibold tabular-nums"
            style={{
              color: availableSpots === 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
            }}
          >
            {availableSpots === 0
              ? 'Группа набрана'
              : `Свободно ${availableSpots} ${availableSpots === 1 ? 'место' : availableSpots < 5 ? 'места' : 'мест'}`}
          </span>
        </div>

        <div
          className="p-2.5 rounded-2xl border transition-colors"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            {compactVisibleSlots.map((slot) => {
              if (slot.isOccupied) {
                return (
                  <motion.div
                    key={slot.index}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      if (onSlotClick) {
                        e.stopPropagation();
                        onSlotClick(slot.index, slot);
                      }
                    }}
                    title={`${slot.name} (${slot.label})`}
                    className="relative group/slot flex-1 min-w-[36px] max-w-[52px] flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <div className="relative">
                      {slot.avatarUrl ? (
                        <img
                          src={slot.avatarUrl}
                          alt={slot.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-xl object-cover border transition-transform"
                          style={{
                            borderColor: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          }}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-bold text-white"
                          style={{
                            backgroundColor: slot.isOrganizer ? 'var(--accent-primary)' : '#64748b',
                            borderColor: 'var(--bg-surface)',
                          }}
                        >
                          {slot.name.charAt(0)}
                        </div>
                      )}

                      {slot.isOrganizer ? (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                          title="Организатор"
                        >
                          <Crown className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900"
                          title="Подтверждён"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <span
                      className="text-[10px] font-medium truncate max-w-full block"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {slot.isOrganizer ? 'Хост' : slot.name.split(' ')[0]}
                    </span>
                  </motion.div>
                );
              }

              return (
                <div
                  key={slot.index}
                  className="flex-1 min-w-[36px] max-w-[52px] flex flex-col items-center gap-1 group/empty"
                >
                  <div
                    className="w-8 h-8 rounded-xl border border-dashed flex items-center justify-center transition-colors"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                    title={`Слот #${slot.index + 1} свободен`}
                  >
                    <UserPlus className="w-3.5 h-3.5 opacity-50 group-hover/empty:opacity-100 transition-opacity" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    #{slot.index + 1}
                  </span>
                </div>
              );
            })}
            {compactExtraCount > 0 && (
              <div className="flex-1 min-w-[40px] max-w-[56px] flex flex-col items-center gap-1">
                <div
                  className="w-8 h-8 rounded-xl border flex items-center justify-center text-[10px] font-bold tabular-nums"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--accent-primary)',
                  }}
                  title={`Ещё ${compactExtraCount} мест`}
                >
                  +{compactExtraCount}
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  ещё
                </span>
              </div>
            )}
          </div>

          {/* Quick Schedule Footer in Compact Mode */}
          <div
            className="mt-2.5 pt-2 border-t flex items-center justify-between text-[11px]"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{event.time}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{schedulePhases[0].phase}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowScheduleDetails(!showScheduleDetails);
              }}
              className="font-semibold flex items-center gap-1 shrink-0 hover:opacity-80 cursor-pointer transition-opacity"
              style={{ color: 'var(--accent-primary)' }}
            >
              <span>{showScheduleDetails ? 'Скрыть' : 'Тайминг'}</span>
              <motion.span
                animate={{ rotate: showScheduleDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showScheduleDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="mt-2.5 pt-2.5 border-t space-y-2"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  {schedulePhases.map((phase, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <span
                        className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded-lg shrink-0 tabular-nums"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {phase.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold block text-[11px]" style={{ color: 'var(--text-primary)' }}>
                          {phase.phase}
                        </span>
                        <span className="text-[11px] line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                          {phase.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // DETAILED VIEW FOR EVENT DETAIL MODAL
  return (
    <div className="space-y-6">
      {/* Section 1: Occupancy Overview & Progress */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              Участники и свободные слоты
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Нажмите на карточку участника, чтобы открыть подробный профиль и отзывы
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            <span>Занято {occupiedSpots} из {totalSpots}</span>
            <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: availableSpots === 0 ? '#10b981' : 'var(--accent-primary)' }}>
              {fillRate}%
            </span>
          </div>
        </div>

        {/* Animated Progress Track */}
        <div className="space-y-1.5">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fillRate}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{
                backgroundColor: availableSpots === 0 ? '#10b981' : 'var(--accent-primary)',
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Организатор подтверждён</span>
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: availableSpots === 0 ? '#10b981' : 'var(--text-secondary)' }}>
              {availableSpots === 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Все слоты заполнены</span>
                </>
              ) : (
                <span>Свободно слотов: {availableSpots}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Section 2: Clean Unified Grid of Slots (Replaces duplicate roster) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {detailVisibleSlots.map((slot, i) => {
          if (slot.isOccupied) {
            return (
              <motion.div
                key={slot.index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                onClick={() => onSlotClick && onSlotClick(slot.index, slot)}
                className={`p-3.5 rounded-2xl border transition-shadow flex flex-col justify-between gap-3 ${
                  onSlotClick ? 'cursor-pointer hover:shadow-md' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {slot.avatarUrl ? (
                        <img
                          src={slot.avatarUrl}
                          alt={slot.name}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-2xl object-cover border"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
                          style={{ backgroundColor: slot.isOrganizer ? 'var(--accent-primary)' : '#64748b' }}
                        >
                          {slot.name.charAt(0)}
                        </div>
                      )}

                      {slot.isOrganizer ? (
                        <span
                          className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center text-white ring-2 ring-white dark:ring-slate-900"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                          title="Организатор встречи"
                        >
                          <Crown className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900"
                          title="Участие подтверждено"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {slot.name}{slot.age ? `, ${slot.age}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <Briefcase className="w-3 h-3 shrink-0 opacity-70" />
                        <span className="truncate">{slot.occupation}</span>
                      </div>
                    </div>
                  </div>

                  {slot.rating && (
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 tabular-nums shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{slot.rating}</span>
                    </div>
                  )}
                </div>

                <div
                  className="pt-2.5 border-t flex items-center justify-between gap-2 text-xs"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="font-semibold"
                      style={{ color: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                    >
                      {slot.label}
                    </span>
                    <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                    <OnlineStatusBadge
                      status={slot.onlineStatus}
                      lastSeen={slot.lastSeen}
                      size="sm"
                    />
                  </div>

                  {/* Organizer Attendance Controls directly inside the participant card */}
                  {isOrganizer && !slot.isOrganizer && slot.userId && onMarkAttendance && (
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(slot.userId!, 'attended')}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Отметить явку"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Был</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(slot.userId!, 'no_show')}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Отметить неявку"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Не был</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }

          // Available Open Slot
          return (
            <motion.div
              key={slot.index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
              className="p-3.5 rounded-2xl border border-dashed flex items-center justify-between gap-3 transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl border border-dashed flex items-center justify-center shrink-0"
                  style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-elevated)' }}
                >
                  <UserPlus className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div>
                  <span className="text-sm font-bold block" style={{ color: 'var(--text-secondary)' }}>
                    Свободный слот #{slot.index + 1}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Открыт для новых участников
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                Место #{slot.index + 1}
              </span>
            </motion.div>
          );
        })}
        {detailExtraCount > 0 && (
          <div
            className="p-3.5 rounded-2xl border border-dashed flex items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums"
                style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
              >
                +{detailExtraCount}
              </div>
              <div>
                <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Ещё {detailExtraCount} свободных мест
                </span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Всего предусмотрено {totalSpots} мест для гостей
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Chronological Schedule / Milestones */}
      <div
        className="pt-5 border-t space-y-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-display font-bold" style={{ color: 'var(--text-primary)' }}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span>План и тайминг встречи</span>
          </div>
          <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {event.date} · старт в {event.time}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {schedulePhases.map((phase, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 + idx * 0.06 }}
              className="p-3.5 rounded-2xl border flex flex-col justify-between gap-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg tabular-nums"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  {phase.time}
                </span>
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  Этап 0{idx + 1}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {phase.phase}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {phase.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
