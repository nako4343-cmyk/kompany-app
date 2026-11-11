import React from 'react';
import { Compass, Flame, Target, SlidersHorizontal, X, Sparkles, MapPin } from 'lucide-react';

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
    badge?: string;
  }> = [
    {
      id: 'all',
      label: 'Все',
      icon: <SlidersHorizontal className="w-3.5 h-3.5" />,
      count: counts.all,
    },
    {
      id: 'nearby',
      label: 'Только поблизости',
      icon: <Compass className="w-3.5 h-3.5" />,
      count: counts.nearby,
      badge: 'до 3 км',
    },
    {
      id: 'popular',
      label: 'Самые популярные',
      icon: <Flame className="w-3.5 h-3.5" />,
      count: counts.popular,
      badge: 'топ мест',
    },
    {
      id: 'interests',
      label: 'Наиболее подходящие по интересам',
      icon: <Target className="w-3.5 h-3.5" />,
      count: counts.interests,
      badge: 'AI совпадение',
    },
  ];

  return (
    <div className="space-y-2 mb-4">
      {/* Filter Buttons Segmented Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar w-full">
          <span className="text-[11px] font-bold uppercase tracking-wider shrink-0 mr-1 hidden sm:inline-block" style={{ color: 'var(--text-muted)' }}>
            Быстрые фильтры:
          </span>

          {filterOptions.map(opt => {
            const isActive = activeFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeFilter(opt.id)}
                className={`group px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer border flex items-center gap-2 ${
                  isActive ? 'shadow-sm scale-[1.01]' : 'hover:opacity-95'
                }`}
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
              </button>
            );
          })}
        </div>
      </div>

      {/* Helpful Active Context Indicator Strip */}
      {activeFilter !== 'all' && (
        <div
          className="p-2.5 px-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-150"
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
                  <b>Только поблизости:</b> события в радиусе до 3 км, упорядочены от ближайших к вам ({filteredCount} найдено)
                </span>
              </>
            )}

            {activeFilter === 'popular' && (
              <>
                <Flame className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span className="truncate">
                  <b>Самые популярные:</b> компании с наибольшей заполненностью и активным набором участников
                </span>
              </>
            )}

            {activeFilter === 'interests' && (
              <>
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                <span className="truncate">
                  <b>По вашим интересам:</b>{' '}
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
            <span>Сбросить быстрый фильтр</span>
          </button>
        </div>
      )}
    </div>
  );
};
