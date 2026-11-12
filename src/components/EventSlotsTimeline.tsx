import React, { useState } from 'react';
import { 
  Users, Clock, UserCheck, UserPlus, 
  Sparkles, CheckCircle2, ChevronDown, ChevronUp, 
  Calendar, ShieldCheck, Flame
} from 'lucide-react';
import { EventItem } from '../types/index.ts';

interface EventSlotsTimelineProps {
  event: EventItem;
  compact?: boolean;
  isOrganizer?: boolean;
  onSlotClick?: (slotIndex: number, participant?: any) => void;
}

export const EventSlotsTimeline: React.FC<EventSlotsTimelineProps> = ({
  event,
  compact = false,
  isOrganizer = false,
  onSlotClick,
}) => {
  const [showScheduleDetails, setShowScheduleDetails] = useState(false);

  const totalSpots = Math.max(2, event.totalSpots || 4);
  const occupiedSpots = Math.min(totalSpots, Math.max(1, event.occupiedSpots || 1));
  const availableSpots = Math.max(0, totalSpots - occupiedSpots);
  const fillRate = Math.round((occupiedSpots / totalSpots) * 100);

  // Helper to calculate milestone times
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
          desc: 'Встреча у входа, заказ напитков, представление участников',
          status: 'start',
        },
        {
          time: formatTime(startH, startM + 30),
          phase: 'Основная программа',
          desc: event.vibe ? `Активность в атмосфере: ${event.vibe}` : 'Обсуждение, ужин, настольная игра или концерт',
          status: 'main',
        },
        {
          time: formatTime(startH + 2, startM),
          phase: 'Свободное общение',
          desc: 'Обмен впечатлениями, контактами и фото в чате компании',
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

  // Prepare slot array
  // Slot 0 is organizer, next slots are approved participants, rest are open slots
  const slots = Array.from({ length: totalSpots }).map((_, index) => {
    if (index === 0) {
      return {
        index,
        isOccupied: true,
        isOrganizer: true,
        name: event.organizer.name,
        avatarUrl: event.organizer.avatarUrl,
        label: 'Организатор',
        occupation: (event.organizer as any).occupation || 'Хост встречи',
        rating: event.organizer.reliability?.score || 5.0,
      };
    }

    const participant = event.approvedParticipants && event.approvedParticipants[index - 1];
    if (participant) {
      return {
        index,
        isOccupied: true,
        isOrganizer: false,
        name: participant.name,
        avatarUrl: participant.avatarUrl,
        label: 'Участник',
        occupation: participant.occupation || 'В компании',
        rating: participant.reliability?.score || 5.0,
      };
    }

    // Remaining occupied without full profile metadata
    if (index < occupiedSpots) {
      return {
        index,
        isOccupied: true,
        isOrganizer: false,
        name: `Участник #${index + 1}`,
        avatarUrl: '',
        label: 'Подтвержден',
        occupation: 'Одобренная заявка',
        rating: 5.0,
      };
    }

    // Free available slot
    return {
      index,
      isOccupied: false,
      isOrganizer: false,
      name: `Свободный слот #${index + 1}`,
      avatarUrl: '',
      label: 'Свободно',
      occupation: 'Ждет заявку',
      rating: null,
    };
  });

  // COMPACT VIEW FOR FEED CARDS
  if (compact) {
    return (
      <div className="space-y-2 pt-1">
        {/* Header line with occupancy stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            <span>График слотов ({occupiedSpots}/{totalSpots})</span>
          </div>

          <span
            className="text-[11px] font-bold tabular-nums"
            style={{
              color: availableSpots === 0 ? 'var(--text-muted)' : 'var(--accent-primary)',
            }}
          >
            {availableSpots === 0 ? 'Группа набрана' : `Осталось ${availableSpots} ${availableSpots === 1 ? 'место' : availableSpots < 5 ? 'места' : 'мест'}`}
          </span>
        </div>

        {/* Visual Slots Timeline Track */}
        <div
          className="p-2 sm:p-2.5 rounded-2xl border transition-all"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-0.5 no-scrollbar">
            {slots.map((slot) => {
              if (slot.isOccupied) {
                return (
                  <div
                    key={slot.index}
                    onClick={(e) => {
                      if (onSlotClick) {
                        e.stopPropagation();
                        onSlotClick(slot.index, slot);
                      }
                    }}
                    title={`${slot.name} (${slot.label})`}
                    className="relative group/slot flex-1 min-w-[32px] max-w-[48px] flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <div className="relative">
                      {slot.avatarUrl ? (
                        <img
                          src={slot.avatarUrl}
                          alt={slot.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 transition-transform group-hover/slot:scale-110 shadow-xs"
                          style={{
                            borderColor: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          }}
                        />
                      ) : (
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white transition-transform group-hover/slot:scale-110 shadow-xs"
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
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold ring-1 ring-white"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                          title="Организатор"
                        >
                          ★
                        </span>
                      ) : (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full flex items-center justify-center bg-emerald-500 text-white text-[8px] ring-1 ring-white"
                          title="Подтвержден"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    <span
                      className="text-[9px] font-medium truncate max-w-full block"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {slot.isOrganizer ? 'Орг' : slot.name.split(' ')[0]}
                    </span>
                  </div>
                );
              }

              // Empty Slot Box
              return (
                <div
                  key={slot.index}
                  className="flex-1 min-w-[32px] max-w-[48px] flex flex-col items-center gap-1 group/empty"
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed flex items-center justify-center transition-colors"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                    title={`Слот #${slot.index + 1} свободен`}
                  >
                    <UserPlus className="w-3 h-3 text-slate-400 group-hover/empty:text-orange-500 transition-colors" />
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    #{slot.index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Schedule Footer in Compact Mode */}
          <div
            className="mt-2 pt-2 border-t flex items-center justify-between text-[11px]"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
              <Clock className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-semibold text-slate-700 dark:text-slate-200">{event.time}</span>
              <span className="truncate">· {schedulePhases[0].phase}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowScheduleDetails(!showScheduleDetails);
              }}
              className="font-bold flex items-center gap-0.5 shrink-0 hover:underline cursor-pointer transition-colors"
              style={{ color: 'var(--accent-primary)' }}
            >
              <span>{showScheduleDetails ? 'Скрыть план' : 'Расписание'}</span>
              {showScheduleDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Inline Collapsible Schedule Details for Card */}
          {showScheduleDetails && (
            <div
              className="mt-2.5 pt-2.5 border-t space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ borderColor: 'var(--border-subtle)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {schedulePhases.map((phase, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs">
                  <span
                    className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md shrink-0 tabular-nums"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--accent-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {phase.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block text-[11px]" style={{ color: 'var(--text-primary)' }}>
                      {phase.phase}
                    </span>
                    <span className="text-[10px] line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                      {phase.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // DETAILED VIEW FOR EVENT DETAIL MODAL
  return (
    <section
      className="p-4 sm:p-5 rounded-3xl border space-y-4"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Title & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
            }}
          >
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Расписание и занятость слотов</span>
              {isOrganizer && (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-purple-600"
                >
                  Организатор
                </span>
              )}
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Индикатор подтвержденных гостей и хронометраж встречи
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <span
            className="px-3 py-1 rounded-full border text-[11px]"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: availableSpots === 0 ? '#10b981' : 'var(--text-primary)',
            }}
          >
            {occupiedSpots} из {totalSpots} мест занято ({fillRate}%)
          </span>
        </div>
      </div>

      {/* Progress Track Bar */}
      <div className="space-y-1.5">
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${fillRate}%`,
              backgroundColor: availableSpots === 0 ? '#10b981' : 'var(--accent-primary)',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          <span>Хост подтвержден</span>
          <span>
            {availableSpots === 0
              ? '🎉 Все слоты заполнены'
              : `Осталось свободных слотов: ${availableSpots}`}
          </span>
        </div>
      </div>

      {/* Grid of Slots Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
        {slots.map((slot) => {
          if (slot.isOccupied) {
            return (
              <div
                key={slot.index}
                onClick={() => onSlotClick && onSlotClick(slot.index, slot)}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-2xs ${
                  onSlotClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
                }`}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    {slot.avatarUrl ? (
                      <img
                        src={slot.avatarUrl}
                        alt={slot.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover border"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                        style={{ backgroundColor: slot.isOrganizer ? 'var(--accent-primary)' : '#64748b' }}
                      >
                        {slot.name.charAt(0)}
                      </div>
                    )}

                    {slot.isOrganizer ? (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-bold ring-2 ring-white"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        ★
                      </span>
                    ) : (
                      <span
                        className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-emerald-500 text-white text-[9px] ring-2 ring-white"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold block truncate" style={{ color: 'var(--text-primary)' }}>
                      {slot.name}
                    </span>
                    <span
                      className="text-[10px] font-semibold truncate block"
                      style={{ color: slot.isOrganizer ? 'var(--accent-primary)' : 'var(--accent-text)' }}
                    >
                      {slot.label}
                    </span>
                  </div>
                </div>

                <div
                  className="pt-1.5 border-t flex items-center justify-between text-[10px]"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
                >
                  <span className="truncate">{slot.occupation}</span>
                  {slot.rating && (
                    <span className="font-bold text-amber-500 tabular-nums shrink-0">
                      ★ {slot.rating}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          // Available slot
          return (
            <div
              key={slot.index}
              className="p-3 rounded-2xl border border-dashed flex flex-col justify-between items-center text-center gap-2 group/emptySlot transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl border border-dashed flex items-center justify-center transition-colors"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <UserPlus className="w-4 h-4 text-slate-400 group-hover/emptySlot:text-orange-500 transition-colors" />
              </div>

              <div>
                <span className="text-xs font-bold block" style={{ color: 'var(--text-secondary)' }}>
                  Слот #{slot.index + 1}
                </span>
                <span className="text-[10px] text-emerald-500 font-semibold block">
                  Свободен
                </span>
              </div>

              <span
                className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-muted)',
                }}
              >
                Ждет участника
              </span>
            </div>
          );
        })}
      </div>

      {/* Visual Timeline of Event Milestones */}
      <div
        className="pt-3 border-t space-y-3"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
          <span>Хронометраж и этапы встречи ({event.date}, старт в {event.time})</span>
        </div>

        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {schedulePhases.map((phase, idx) => (
            <div key={idx} className="relative flex items-start gap-3 text-xs">
              {/* Dot */}
              <div
                className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-xs"
                style={{
                  backgroundColor: idx === 0 ? 'var(--accent-primary)' : idx === 1 ? '#3b82f6' : '#10b981',
                }}
              >
                {idx + 1}
              </div>

              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs tabular-nums text-slate-800 dark:text-slate-100">
                    {phase.time}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {phase.phase}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {phase.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
