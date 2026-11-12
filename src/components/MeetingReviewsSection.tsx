import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquareQuote, Star, ShieldCheck, Calendar, 
  ThumbsUp, CheckCircle2, Plus, Tag
} from 'lucide-react';
import { UserReview } from '../types/index.ts';

export interface MeetingReviewsSectionProps {
  reviews: UserReview[];
  targetUserName: string;
  targetUserId: string;
  isCurrentUser: boolean;
  onWriteReview?: () => void;
  onSelectAuthor?: (authorId: string) => void;
}

export const MeetingReviewsSection: React.FC<MeetingReviewsSectionProps> = ({
  reviews,
  targetUserName,
  targetUserId: _targetUserId,
  isCurrentUser,
  onWriteReview,
  onSelectAuthor,
}) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => r.tags?.forEach(t => set.add(t)));
    return Array.from(set);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (!selectedTag) return reviews;
    return reviews.filter(r => r.tags?.includes(selectedTag));
  }, [reviews, selectedTag]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const fiveStarPercentage = useMemo(() => {
    if (reviews.length === 0) return 100;
    const fiveStarCount = reviews.filter(r => r.rating >= 5).length;
    return Math.round((fiveStarCount / reviews.length) * 100);
  }, [reviews]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
            }}
          >
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-display font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Отзывы участников</span>
              <span className="text-xs font-normal tabular-nums" style={{ color: 'var(--text-muted)' }}>
                · {reviews.length}
              </span>
            </h3>
          </div>
        </div>

        {!isCurrentUser && onWriteReview && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onWriteReview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-xs"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Оставить отзыв</span>
          </motion.button>
        )}
      </div>

      {reviews.length > 0 ? (
        <>
          {/* Summary stats strip */}
          <div
            className="p-4 rounded-2xl border space-y-3.5"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{fiveStarPercentage}%</strong> рекомендуют для встреч
                </span>
              </div>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Подтверждённые встречи</span>
              </span>
            </div>

            {/* Interactive Tag Filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: selectedTag === null ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: selectedTag === null ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  Все ({reviews.length})
                </button>
                {allTags.map(tag => {
                  const count = reviews.filter(r => r.tags?.includes(tag)).length;
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of reviews */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((rev, idx) => (
                <motion.div
                  key={rev.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="p-4 rounded-2xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {/* Author and rating header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={rev.authorAvatar || './assets/images/avatar_host_anna_1794332914629.jpg'}
                        alt={rev.authorName}
                        referrerPolicy="no-referrer"
                        className={`w-10 h-10 rounded-xl object-cover shrink-0 border ${
                          onSelectAuthor ? 'cursor-pointer hover:opacity-90' : ''
                        }`}
                        style={{ borderColor: 'var(--border-subtle)' }}
                        onClick={() => onSelectAuthor && onSelectAuthor(rev.authorId)}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-bold truncate ${onSelectAuthor ? 'hover:underline cursor-pointer' : ''}`}
                            style={{ color: 'var(--text-primary)' }}
                            onClick={() => onSelectAuthor && onSelectAuthor(rev.authorId)}
                          >
                            {rev.authorName}
                          </span>
                          <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0"
                            title="Участник реально посетил мероприятие"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Подтверждённая явка</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span className="truncate">Встреча: {rev.eventTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums shrink-0">{rev.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="inline-flex items-center gap-1 text-amber-500 font-bold text-xs tabular-nums shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  {/* Review Text (clean editorial prose, no thick left border) */}
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    «{rev.text}»
                  </p>

                  {/* Unboxed/Clean Tags */}
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                      <Tag className="w-3 h-3 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      {rev.tags.map((t, i) => (
                        <React.Fragment key={t}>
                          {i > 0 && <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>}
                          <span className="font-medium">{t}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Empty State */
        <div
          className="p-6 rounded-2xl border text-center space-y-3"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div
            className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
            }}
          >
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
              {isCurrentUser ? 'У вас пока нет отзывов' : `У ${targetUserName} пока нет отзывов`}
            </span>
            <p className="text-xs mt-1 max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Отзывы появляются после совместного посещения встречи и отметки явки.
            </p>
          </div>
          {!isCurrentUser && onWriteReview && (
            <button
              type="button"
              onClick={onWriteReview}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Оставить первый отзыв</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
