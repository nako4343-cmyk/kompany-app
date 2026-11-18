import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  ArrowRight,
  ChevronLeft,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedActivity, setSelectedActivity] = useState<string>('all');
  const [selectedWhen, setSelectedWhen] = useState<'today' | 'weekend' | 'any'>(
    'today'
  );
  const [selectedBudget, setSelectedBudget] = useState<string>('any');

  const goStep = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const activities = [
    { id: 'Ресторан / Бар', label: 'Гастро-ужин или бар', sub: 'Камерный стол на 4–6 человек' },
    { id: 'Настольные игры', label: 'Настольные игры', sub: 'Стратегии, квизы и общение' },
    { id: 'День рождения', label: 'День рождения / Праздник', sub: 'Тёплая компания и тосты' },
    { id: 'Свадьба', label: 'Свадьба / Торжество', sub: 'Праздничный банкет и знакомства' },
    { id: 'Кино / Концерт', label: 'Кино или живой концерт', sub: 'Пойти вместе и обсудить после' },
    { id: 'Пикник / Шашлыки', label: 'Пикник или прогулка', sub: 'Активный отдых на воздухе' },
    { id: 'all', label: 'Открыт к любой интересной идее', sub: 'Покажите все лучшие встречи' },
  ];

  const filteredEvents = events.filter(e => {
    if (selectedActivity !== 'all' && e.category !== selectedActivity)
      return false;
    if (selectedWhen === 'today' && !e.isToday) return false;
    if (selectedBudget === 'free' && e.budget !== 'Бесплатно') return false;
    if (
      selectedBudget === 'low' &&
      e.budget !== 'Бесплатно' &&
      e.budget !== 'до 1 000 ₽'
    )
      return false;
    return true;
  });

  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 28 : -28,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 360, damping: 32 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -28 : 28,
      opacity: 0,
      scale: 0.98,
      transition: { duration: 0.14 },
    }),
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 30, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] shadow-2xl border flex flex-col max-h-[90dvh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Mobile Grabber */}
        <div className="pt-2 pb-0.5 flex justify-center sm:hidden shrink-0">
          <div
            className="w-9 h-1 rounded-full opacity-20"
            style={{ backgroundColor: 'var(--text-primary)' }}
          />
        </div>

        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goStep(step - 1)}
                className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                title="Назад"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Compass className="w-4.5 h-4.5" />
              </span>
            )}
            <div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider block font-mono-num"
                style={{ color: 'var(--accent-text)' }}
              >
                {step < 4 ? `Шаг ${step} из 3` : 'Готовая подборка'}
              </span>
              <h2
                className="text-base font-display font-bold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Подобрать компанию на вечер
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full h-1 shrink-0"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <motion.div
            animate={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="h-full"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 pb-safe">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="wiz-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <h3
                    className="text-base font-display font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Какой формат вечера вам ближе?
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Выберите настроение, чтобы отфильтровать компании с свободными местами
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activities.map(act => {
                    const active = selectedActivity === act.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={act.id}
                        onClick={() => {
                          setSelectedActivity(act.id);
                          goStep(2);
                        }}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                          act.id === 'all' ? 'sm:col-span-2' : ''
                        }`}
                        style={{
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'var(--bg-elevated)',
                          borderColor: active
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="text-xs font-bold"
                            style={{
                              color: active
                                ? 'var(--accent-text)'
                                : 'var(--text-primary)',
                            }}
                          >
                            {act.label}
                          </span>
                          {active && (
                            <CheckCircle2
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: 'var(--accent-primary)' }}
                            />
                          )}
                        </div>
                        <span
                          className="text-[11px] block mt-0.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {act.sub}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="wiz-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <h3
                    className="text-base font-display font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Когда вы планируете выход?
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Можем показать спонтанные встречи на ближайшие часы или планы на выходные
                  </p>
                </div>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'today' as const,
                      title: 'Прямо сегодня вечером',
                      desc: 'Встречи, которые начинаются в ближайшие часы',
                      Icon: Flame,
                    },
                    {
                      id: 'weekend' as const,
                      title: 'В ближайшие дни и выходные',
                      desc: 'Запланировать ужин, игру или выезд заранее',
                      Icon: Calendar,
                    },
                    {
                      id: 'any' as const,
                      title: 'В любой удобный день',
                      desc: 'Показать все открытые наборы в компании',
                      Icon: Clock,
                    },
                  ].map(opt => {
                    const active = selectedWhen === opt.id;
                    const IconComp = opt.Icon;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={opt.id}
                        onClick={() => {
                          setSelectedWhen(opt.id);
                          goStep(3);
                        }}
                        className="w-full p-4 rounded-2xl text-left border text-xs transition-all cursor-pointer flex items-center gap-3.5"
                        style={{
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'var(--bg-elevated)',
                          borderColor: active
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: active
                              ? 'var(--accent-primary)'
                              : 'var(--bg-surface)',
                            color: active ? '#FFFFFF' : 'var(--accent-primary)',
                          }}
                        >
                          <IconComp className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-bold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {opt.title}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {opt.desc}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="wiz-3"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div>
                  <h3
                    className="text-base font-display font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Комфортный ориентир по бюджету
                  </h3>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    В Kompa каждый платит за себя или счёт делится прозрачно по чеку
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'any', label: 'Любой формат', sub: 'Все варианты' },
                    { id: 'free', label: 'Бесплатно', sub: 'Прогулки и парки' },
                    { id: 'low', label: 'До 1 000 ₽', sub: 'Кофе, настолки, квиз' },
                    { id: 'mid', label: '1 000–3 000 ₽', sub: 'Ужин в ресторане или бар' },
                  ].map(b => {
                    const active = selectedBudget === b.id;
                    return (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        key={b.id}
                        onClick={() => {
                          setSelectedBudget(b.id);
                          goStep(4);
                        }}
                        className="p-4 rounded-2xl text-left border text-xs transition-all cursor-pointer font-mono-num"
                        style={{
                          backgroundColor: active
                            ? 'var(--accent-soft)'
                            : 'var(--bg-elevated)',
                          borderColor: active
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        }}
                      >
                        <div
                          className="font-bold text-sm"
                          style={{
                            color: active
                              ? 'var(--accent-text)'
                              : 'var(--text-primary)',
                          }}
                        >
                          {b.label}
                        </div>
                        <div
                          className="text-[11px] font-sans mt-0.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {b.sub}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="wiz-4"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="text-sm font-display font-bold font-mono-num"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Подходящие компании: {filteredEvents.length}
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Выберите встречу, чтобы посмотреть участников и подать заявку
                    </p>
                  </div>
                  <button
                    onClick={() => goStep(1)}
                    className="text-xs font-bold hover:underline cursor-pointer"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    Изменить фильтр
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
                    <p
                      className="text-xs mb-3 leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      По выбранным параметрам точных совпадений сейчас нет, но в общей ленте открыты десятки других компаний.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 text-white rounded-xl text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      Смотреть все встречи
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredEvents.map(ev => (
                      <motion.div
                        whileTap={{ scale: 0.99 }}
                        key={ev.id}
                        onClick={() => {
                          onSelectEvent(ev);
                          onClose();
                        }}
                        className="p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 studio-card studio-card-hover"
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
                            <div
                              className="text-xs font-bold line-clamp-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {ev.title}
                            </div>
                            <div
                              className="text-[11px] mt-0.5 truncate font-mono-num"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {ev.isToday ? 'Сегодня' : ev.date} · {ev.time} ·{' '}
                              {ev.approximateArea}
                            </div>
                            <div
                              className="text-[11px] font-semibold mt-0.5 font-mono-num"
                              style={{ color: 'var(--accent-text)' }}
                            >
                              {ev.budget} · {ev.occupiedSpots}/{ev.totalSpots}{' '}
                              мест
                            </div>
                          </div>
                        </div>
                        <ArrowRight
                          className="w-4 h-4 shrink-0"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
