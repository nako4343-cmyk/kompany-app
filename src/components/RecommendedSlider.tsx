import React from 'react';
import { motion } from 'framer-motion';
import { Compass, MapPin, ChevronRight } from 'lucide-react';
import { EventItem } from '../types/index.ts';
import { SmartRecommendation, extractDistrictName } from '../utils/eventMatching.ts';
import { AppLanguage, translateDistrict } from '../i18n/translations.ts';

interface RecommendedSliderProps {
  recommendations: SmartRecommendation[];
  onSelectEvent: (event: EventItem) => void;
  lang?: AppLanguage;
}

export const RecommendedSlider: React.FC<RecommendedSliderProps> = ({
  recommendations,
  onSelectEvent,
  lang = 'ru',
}) => {
  if (recommendations.length === 0) return null;
  const isEn = lang === 'en';

  const formatShortTime = (event: EventItem) => {
    if (event.isToday) return isEn ? `Today, ${event.time}` : `Сегодня, ${event.time}`;
    const d = new Date(event.date);
    const monthsRu = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = (isEn ? monthsEn : monthsRu)[d.getMonth()] || '';
    return `${d.getDate()} ${m}, ${event.time}`;
  };

  return (
    <section aria-labelledby="recommended-for-you-heading" className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Compass
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--accent-primary)' }}
          />
          <h2
            id="recommended-for-you-heading"
            className="text-sm sm:text-[15px] font-display font-extrabold tracking-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {isEn ? 'Picked for you' : 'Подобрали для вас'}
          </h2>
        </div>
        <span
          className="text-[11px] font-semibold tabular-nums shrink-0"
          style={{ color: 'var(--text-muted)' }}
        >
          {recommendations.length} {isEn ? 'matches' : 'подборки'}
        </span>
      </div>

      {/* Compact horizontal snap slider */}
      <div className="flex gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x snap-mandatory no-scrollbar">
        {recommendations.map(({ event, reason }) => {
          const available = Math.max(0, event.totalSpots - event.occupiedSpots);
          const district = translateDistrict(extractDistrictName(event.approximateArea), lang);

          return (
            <motion.button
              key={event.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectEvent(event)}
              className="snap-start shrink-0 w-[282px] sm:w-[306px] p-3 rounded-[22px] border text-left transition-all hover:shadow-md cursor-pointer flex items-center gap-3 group"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Compact Thumbnail */}
              <div className="relative w-[76px] h-[76px] rounded-2xl overflow-hidden shrink-0 bg-[#162946]">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 py-1">
                  <span className="block text-[10px] font-bold text-white leading-none truncate tabular-nums">
                    {event.budget === 'Бесплатно'
                      ? isEn
                        ? 'Free'
                        : 'Бесплатно'
                      : event.budget.replace(' ₽', '₽')}
                  </span>
                </div>
              </div>

              {/* Concise Card Info */}
              <div className="min-w-0 flex-1 space-y-1">
                <div
                  className="text-[11px] font-semibold flex items-center gap-1.5 tabular-nums truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>{formatShortTime(event)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-0.5 truncate">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    {event.distanceKm} км
                  </span>
                </div>

                <h3
                  className="text-[13px] font-display font-bold leading-snug line-clamp-1 group-hover:text-[#E4482A] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event.title}
                </h3>

                {/* Honest, specific match reason */}
                <p
                  className="text-[11px] font-semibold leading-snug line-clamp-1"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {reason}
                </p>

                <div
                  className="flex items-center justify-between text-[11px] pt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span className="truncate">
                    {district} ·{' '}
                    {isEn ? `${available} left` : `свободно ${available}`}
                  </span>
                  <ChevronRight
                    className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: 'var(--accent-primary)' }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
