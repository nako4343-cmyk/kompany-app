import React, { useState } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { EventItem } from '../types/index.ts';

interface FindCompanyWizardModalProps {
  events: EventItem[];
  onClose: () => void;
  onSelectEvent: (event: EventItem) => void;
}

export const FindCompanyWizardModal: React.FC<FindCompanyWizardModalProps> = ({
  events,
  onClose,
  onSelectEvent,
}) => {
  const [step, setStep] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [selectedWhen, setSelectedWhen] = useState<'today' | 'weekend' | 'any'>('today');
  const [selectedBudget, setSelectedBudget] = useState<string>('any');

  const activities = [
    { id: 'Ресторан / Бар', label: 'Ресторан или бар' },
    { id: 'Настольные игры', label: 'Настольные игры' },
    { id: 'День рождения', label: 'День рождения / Праздник' },
    { id: 'Кино / Концерт', label: 'Кино или концерт' },
    { id: 'Пикник / Шашлыки', label: 'Пикник или шашлыки' },
    { id: 'all', label: 'Любая интересная идея' },
  ];

  const filteredEvents = events.filter(e => {
    if (selectedActivity !== 'all' && e.category !== selectedActivity) return false;
    if (selectedWhen === 'today' && !e.isToday) return false;
    if (selectedBudget === 'free' && e.budget !== 'Бесплатно') return false;
    if (selectedBudget === 'low' && e.budget !== 'Бесплатно' && e.budget !== 'до 1 000 ₽') return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="p-2 rounded-xl"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
              }}
            >
              <Search className="w-4 h-4" />
            </span>
            <h2 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              Подобрать компанию
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-wider block mb-1 tabular-nums"
                  style={{ color: 'var(--accent-text)' }}
                >
                  Вопрос 1 из 3
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Что хотите делать?
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activities.map(act => {
                  const active = selectedActivity === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => {
                        setSelectedActivity(act.id);
                        setStep(2);
                      }}
                      className="p-3.5 rounded-2xl text-left border text-xs transition-all cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: active ? 'var(--accent-text)' : 'var(--text-primary)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {act.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-wider block mb-1 tabular-nums"
                  style={{ color: 'var(--accent-text)' }}
                >
                  Вопрос 2 из 3
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Когда вы свободны?
                </h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { id: 'today' as const, title: 'Прямо сегодня вечером 🔥', desc: 'Хочу найти компанию на сегодняшнее время' },
                  { id: 'weekend' as const, title: 'В эти выходные', desc: 'Суббота или воскресенье' },
                  { id: 'any' as const, title: 'В любой удобный день', desc: 'Посмотреть все ближайшие варианты' },
                ].map(opt => {
                  const active = selectedWhen === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setSelectedWhen(opt.id);
                        setStep(3);
                      }}
                      className="w-full p-3.5 rounded-2xl text-left border text-xs transition-all cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{opt.title}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-wider block mb-1 tabular-nums"
                  style={{ color: 'var(--accent-text)' }}
                >
                  Вопрос 3 из 3
                </span>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Какой комфортный бюджет?
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'any', label: 'Любой бюджет' },
                  { id: 'free', label: 'Бесплатно' },
                  { id: 'low', label: 'До 1 000 ₽' },
                  { id: 'mid', label: '1 000–3 000 ₽' },
                ].map(b => {
                  const active = selectedBudget === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBudget(b.id);
                        setStep(4);
                      }}
                      className="p-3.5 rounded-2xl text-left border text-xs transition-all cursor-pointer tabular-nums"
                      style={{
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: active ? 'var(--accent-text)' : 'var(--text-primary)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    Найдено предложений: {filteredEvents.length}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    События, подходящие под ваши параметры
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-text)' }}
                >
                  Сбросить
                </button>
              </div>

              {filteredEvents.length === 0 ? (
                <div
                  className="p-8 text-center rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    По точным критериям событий не нашлось, но вы можете посмотреть все встречи в ленте или создать свою!
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-white rounded-xl text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    Посмотреть все события
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onSelectEvent(ev);
                        onClose();
                      }}
                      className="p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                            {ev.title}
                          </div>
                          <div className="text-[11px] mt-0.5 truncate tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                            {ev.isToday ? 'Сегодня' : ev.date} · {ev.time} · {ev.approximateArea}
                          </div>
                          <div className="text-[11px] font-semibold mt-0.5 tabular-nums" style={{ color: 'var(--accent-text)' }}>
                            {ev.budget} · {ev.occupiedSpots}/{ev.totalSpots} мест
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
