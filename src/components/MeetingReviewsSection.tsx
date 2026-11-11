import React, { useState, useMemo } from 'react';
import { 
  MessageSquareQuote, Star, ShieldCheck, Calendar, 
  Sparkles, ThumbsUp, CheckCircle, Plus
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

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    reviews.forEach(r => r.tags?.forEach(t => set.add(t)));
    return Array.from(set);
  }, [reviews]);

  // Filter reviews by tag if selected
  const filteredReviews = useMemo(() => {
    if (!selectedTag) return reviews;
    return reviews.filter(r => r.tags?.includes(selectedTag));
  }, [reviews, selectedTag]);

  // Average rating
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  // Count 5-star ratings
  const fiveStarPercentage = useMemo(() => {
    if (reviews.length === 0) return 100;
    const fiveStarCount = reviews.filter(r => r.rating >= 5).length;
    return Math.round((fiveStarCount / reviews.length) * 100);
  }, [reviews]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-text)',
            }}
          >
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Отзывы о встречах</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {reviews.length}
              </span>
            </h3>
          </div>
        </div>

        {!isCurrentUser && onWriteReview && (
          <button
            type="button"
            onClick={onWriteReview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Оставить отзыв</span>
          </button>
        )}
      </div>

      {reviews.length > 0 ? (
        <>
          {/* Summary stats card */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-display font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i <= Math.round(avgRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <b style={{ color: 'var(--text-primary)' }}>{fiveStarPercentage}%</b> участников рекомендуют для совместных встреч
                </span>
              </div>

              <div
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xl"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Проверенные встречи</span>
              </div>
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
                  Теги:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTag === null ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
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
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        isSelected ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                      }`}
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
            {filteredReviews.map(rev => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl border space-y-3 transition-all hover:shadow-xs"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {/* Author and rating header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={rev.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={rev.authorName}
                      referrerPolicy="no-referrer"
                      className={`w-9 h-9 rounded-xl object-cover shrink-0 border ${
                        onSelectAuthor ? 'cursor-pointer hover:opacity-90' : ''
                      }`}
                      style={{ borderColor: 'var(--border-subtle)' }}
                      onClick={() => onSelectAuthor && onSelectAuthor(rev.authorId)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${onSelectAuthor ? 'hover:underline cursor-pointer' : ''}`}
                          style={{ color: 'var(--text-primary)' }}
                          onClick={() => onSelectAuthor && onSelectAuthor(rev.authorId)}
                        >
                          {rev.authorName}
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0"
                          title="Участник реально посетил мероприятие"
                        >
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>Участник встречи</span>
                        </span>
                      </div>
                      <span className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
                        {rev.createdAt}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 text-amber-500 font-extrabold text-xs tabular-nums shrink-0">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i <= (rev.rating || 5) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span>{rev.rating}</span>
                  </div>
                </div>

                {/* Event attended together pill */}
                <div
                  className="p-2 rounded-xl text-[11px] flex items-center justify-between gap-2 border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    <span className="font-semibold truncate">
                      Совместная встреча: <span style={{ color: 'var(--text-primary)' }}>«{rev.eventTitle}»</span>
                    </span>
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider shrink-0 px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    Подтверждено
                  </span>
                </div>

                {/* Review Text */}
                <div className="relative pl-3 border-l-2" style={{ borderColor: 'var(--accent-primary)' }}>
                  <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
                    «{rev.text}»
                  </p>
                </div>

                {/* Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg border flex items-center gap-1"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
              Отзывы о встречах появляются здесь после того, как участники посетят совместное мероприятие и подтвердят явку.
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
              <span>Оставить первый отзыв о встрече</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
