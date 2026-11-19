import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  RotateCcw,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Wallet,
  Users,
  Sparkles,
  Check,
  UserCheck,
} from 'lucide-react';
import { EventCategory, EventVibe } from '../types/index.ts';
import {
  FeedFiltersState,
  DEFAULT_FEED_FILTERS,
  countActiveFeedFilters,
} from '../utils/eventMatching.ts';
import { AppLanguage, translateCategory, translateVibe } from '../i18n/translations.ts';

interface FeedFiltersSheetProps {
  isOpen: boolean;
  filters: FeedFiltersState;
  onChange: (next: FeedFiltersState) => void;
  onReset: () => void;
  onClose: () => void;
  resultCount: number;
  lang?: AppLanguage;
}

const ALL_CATEGORIES: Array<'Все' | EventCategory> = [
  'Все',
  'Ресторан / Бар',
  'Вечеринка',
  'День рождения',
  'Настольные игры',
  'Кино / Концерт',
  'Прогулка',
  'Пикник / Шашлыки',
  'Спорт',
  'Квиз / Интеллект',
  'Путешествие',
  'Свадьба',
  'Другое',
];

const ALL_FORMATS: Array<'all' | EventVibe> = [
  'all',
  'Спокойная беседа',
  'Гастро-вечер',
  'Интеллектуальная игра',
  'Активный движ',
  'Праздничный вайб',
];

export const FeedFiltersSheet: React.FC<FeedFiltersSheetProps> = ({
  isOpen,
  filters,
  onChange,
  onReset,
  onClose,
  resultCount,
  lang = 'ru',
}) => {
  const isEn = lang === 'en';
  const activeCount = countActiveFeedFilters(filters);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const update = <K extends keyof FeedFiltersState>(key: K, value: FeedFiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const renderChoiceButton = (
    key: string,
    label: string,
    isActive: boolean,
    onClick: () => void
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      className="min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap active:scale-[0.97]"
      style={
        isActive
          ? {
              backgroundColor: '#162946',
              color: '#FFFFFF',
              borderColor: '#162946',
              boxShadow: '0 4px 12px -4px rgba(22, 41, 70, 0.28)',
            }
          : {
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-subtle)',
            }
      }
    >
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-lg rounded-t-[28px] sm:rounded-3xl border shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* Mobile Drag Handle */}
            <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--border-subtle)' }}
              />
            </div>

            {/* Header */}
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between gap-3 shrink-0"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <h2
                  className="text-base font-display font-extrabold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isEn ? 'Filters' : 'Фильтры'}
                </h2>
                {activeCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white tabular-nums"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {activeCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Reset' : 'Сбросить'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={isEn ? 'Close filters' : 'Закрыть фильтры'}
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="px-5 py-4 overflow-y-auto space-y-5 flex-1">
              {/* 1. Date */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Calendar className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Date' : 'Дата'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'Any date' : 'Любая' },
                    { id: 'today' as const, label: isEn ? 'Today' : 'Сегодня' },
                    { id: 'tomorrow' as const, label: isEn ? 'Tomorrow' : 'Завтра' },
                    { id: 'weekend' as const, label: isEn ? 'Weekend' : 'Выходные' },
                    { id: 'week' as const, label: isEn ? 'This week' : 'На этой неделе' },
                  ].map(item =>
                    renderChoiceButton(item.id, item.label, filters.date === item.id, () =>
                      update('date', item.id)
                    )
                  )}
                </div>
              </section>

              {/* 2. Time of Day */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Time of day' : 'Время суток'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'Any time' : 'Любое' },
                    { id: 'morning' as const, label: isEn ? 'Morning (6–12)' : 'Утро (6–12)' },
                    { id: 'day' as const, label: isEn ? 'Day (12–17)' : 'День (12–17)' },
                    { id: 'evening' as const, label: isEn ? 'Evening (17–22)' : 'Вечер (17–22)' },
                    { id: 'night' as const, label: isEn ? 'Night (22+)' : 'Ночь (22+)' },
                  ].map(item =>
                    renderChoiceButton(item.id, item.label, filters.time === item.id, () =>
                      update('time', item.id)
                    )
                  )}
                </div>
              </section>

              {/* 3. Distance */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Distance' : 'Расстояние от вас'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { val: null, label: isEn ? 'Any distance' : 'Любое' },
                    { val: 2, label: isEn ? 'Up to 2 km' : 'До 2 км' },
                    { val: 3.5, label: isEn ? 'Up to 3.5 km' : 'До 3.5 км' },
                    { val: 5, label: isEn ? 'Up to 5 km' : 'До 5 км' },
                    { val: 10, label: isEn ? 'Up to 10 km' : 'До 10 км' },
                  ].map(item =>
                    renderChoiceButton(
                      String(item.val),
                      item.label,
                      filters.maxDistanceKm === item.val,
                      () => update('maxDistanceKm', item.val)
                    )
                  )}
                </div>
              </section>

              {/* 4. Category */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Tag className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Category' : 'Категория'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map(cat =>
                    renderChoiceButton(
                      cat,
                      cat === 'Все' ? (isEn ? 'All' : 'Все') : translateCategory(cat, lang),
                      filters.category === cat,
                      () => update('category', cat)
                    )
                  )}
                </div>
              </section>

              {/* 5. Budget */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Wallet className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Budget' : 'Бюджет'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'Any' : 'Любой' },
                    { id: 'free' as const, label: isEn ? 'Free' : 'Бесплатно' },
                    { id: 'up_to_1000' as const, label: isEn ? 'Up to 1 000 ₽' : 'До 1 000 ₽' },
                    { id: '1000_3000' as const, label: '1 000–3 000 ₽' },
                    { id: '3000_plus' as const, label: '3 000+ ₽' },
                  ].map(item =>
                    renderChoiceButton(item.id, item.label, filters.budget === item.id, () =>
                      update('budget', item.id)
                    )
                  )}
                </div>
              </section>

              {/* 6. Age */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Age group' : 'Возраст участников'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'Any age' : 'Любой' },
                    { id: 'my_age' as const, label: isEn ? 'Fits my age' : 'Под мой возраст' },
                    { id: '18_25' as const, label: '18–25 лет' },
                    { id: '25_35' as const, label: '25–35 лет' },
                    { id: '35_plus' as const, label: '35+ лет' },
                  ].map(item =>
                    renderChoiceButton(item.id, item.label, filters.ageRange === item.id, () =>
                      update('ageRange', item.id)
                    )
                  )}
                </div>
              </section>

              {/* 7. Group Size */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Group size' : 'Количество участников'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'all' as const, label: isEn ? 'Any' : 'Любое' },
                    { id: 'small' as const, label: isEn ? 'Small (2–4)' : 'Камерно (2–4)' },
                    { id: 'medium' as const, label: isEn ? 'Medium (5–8)' : 'Компания (5–8)' },
                    { id: 'large' as const, label: isEn ? 'Large (9+)' : 'Большая (9+)' },
                  ].map(item =>
                    renderChoiceButton(item.id, item.label, filters.groupSize === item.id, () =>
                      update('groupSize', item.id)
                    )
                  )}
                </div>
              </section>

              {/* 8. Event Format / Vibe */}
              <section className="space-y-2.5">
                <div
                  className="flex items-center gap-2 text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>{isEn ? 'Format & vibe' : 'Формат мероприятия'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_FORMATS.map(fmt =>
                    renderChoiceButton(
                      fmt,
                      fmt === 'all' ? (isEn ? 'Any format' : 'Любой') : translateVibe(fmt, lang),
                      filters.format === fmt,
                      () => update('format', fmt)
                    )
                  )}
                </div>
              </section>

              {/* Open Spots Toggle */}
              <section
                className="pt-3 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <button
                  type="button"
                  onClick={() => update('onlyOpenSpots', !filters.onlyOpenSpots)}
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: filters.onlyOpenSpots
                      ? 'var(--accent-soft)'
                      : 'var(--bg-elevated)',
                    borderColor: filters.onlyOpenSpots
                      ? 'color-mix(in srgb, var(--accent-primary) 30%, transparent)'
                      : 'var(--border-subtle)',
                  }}
                >
                  <span
                    className="text-xs font-bold text-left"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isEn ? 'Only events with open spots' : 'Только мероприятия со свободными местами'}
                  </span>
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    style={
                      filters.onlyOpenSpots
                        ? { backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            border: '1.5px solid var(--border-subtle)',
                          }
                    }
                  >
                    {filters.onlyOpenSpots && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                  </span>
                </button>
              </section>
            </div>

            {/* Sticky Footer */}
            <div
              className="px-5 py-3.5 border-t flex items-center gap-2.5 shrink-0 pb-safe"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(DEFAULT_FEED_FILTERS);
                    onReset();
                  }}
                  className="min-h-[48px] px-4 rounded-2xl text-xs font-bold border cursor-pointer shrink-0 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {isEn ? 'Reset' : 'Сбросить'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[48px] px-5 rounded-2xl text-sm font-display font-bold text-white cursor-pointer transition-transform active:scale-[0.985] shadow-md"
                style={{
                  background: 'linear-gradient(180deg, #F0593B 0%, #DE4326 100%)',
                  boxShadow: '0 10px 22px -6px rgba(228, 72, 42, 0.35)',
                }}
              >
                {isEn
                  ? `Show ${resultCount} event${resultCount === 1 ? '' : 's'}`
                  : `Показать ${resultCount} ${
                      resultCount === 1
                        ? 'мероприятие'
                        : resultCount >= 2 && resultCount <= 4
                        ? 'мероприятия'
                        : 'мероприятий'
                    }`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
