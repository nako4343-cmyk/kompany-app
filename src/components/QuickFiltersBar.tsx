import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Flame, Target, SlidersHorizontal, X, MapPin } from 'lucide-react';

export type QuickFilterType = 'all' | 'nearby' | 'popular' | 'interests';

interface QuickFiltersBarProps {
  activeFilter: QuickFilterType;
  onChangeFilter: (filter: QuickFilterType) => void;
  counts: {
    all: number;
    nearby: number;
    popular: number;
    interests: number;
  };
  currentUserInterests?: string[];
  totalEventsCount: number;
  filteredCount: number;
}

export const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({
  activeFilter,
  onChangeFilter,
  counts,
  currentUserInterests = [],
  totalEventsCount: _totalEventsCount,
  filteredCount,
}) => {
  const filterOptions: Array<{
    id: QuickFilterType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      id: 'all',
      label: 'Все',
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      count: counts.all,
    },
    {
      id: 'nearby',
      label: 'Поблизости',
      icon: <Compass className="w-3.5 h-3.5" />,
      count: counts.nearby,
    },
    {
      id: 'popular',
      label: 'Популярные',
      icon: <Flame className="w-3.5 h-3.5" />,
      count: counts.popular,
    },
    {
      id: 'interests',
      label: 'По интересам',
      icon: <Target className="w-3.5 h-3.5" />,
      count: counts.interests,
    },
  ];

  return (
    <div className="space-y-2.5 mb-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
          {filterOptions.map(opt => {
            const isActive = activeFilter === opt.id;
            return (
              <motion.button
                key={opt.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onChangeFilter(opt.id)}
                className="relative px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer border flex items-center gap-2"
                style={{
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <span className={isActive ? 'text-white' : 'text-amber-500'}>
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
                <span
                  className="px-1.5 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'var(--bg-elevated)',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  }}
                >
                  {opt.count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {activeFilter !== 'all' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div
              className="p-2.5 px-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-text)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeFilter === 'nearby' && (
                  <>
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                    <span className="truncate">
                      <strong>Поблизости:</strong> события в радиусе до 3 км ({filteredCount} найдено)
                    </span>
                  </>
                )}

                {activeFilter === 'popular' && (
                  <>
                    <Flame className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">
                      <strong>Популярные:</strong> компании с высокой активностью и набором участников
                    </span>
                  </>
                )}

                {activeFilter === 'interests' && (
                  <>
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      <strong>По вашим интересам:</strong>{' '}
                      {currentUserInterests.length > 0
                        ? currentUserInterests.slice(0, 3).join(', ') + (currentUserInterests.length > 3 ? '...' : '')
                        : 'на основе профиля'}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => onChangeFilter('all')}
                className="text-[11px] font-bold inline-flex items-center gap-1 hover:underline cursor-pointer shrink-0 ml-auto"
                style={{ color: 'var(--accent-primary)' }}
              >
                <X className="w-3 h-3" />
                <span>Сбросить</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
