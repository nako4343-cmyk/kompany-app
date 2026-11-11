import React, { useState } from 'react';
import { X, Star, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../services/api.ts';

interface ReviewModalProps {
  eventId: string;
  targetUserId: string;
  targetUserName: string;
  eventName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const REVIEW_TAGS = [
  'Пунктуальный',
  'Легко общаться',
  'Отличная организация',
  'Душа компании',
  'Вежливый',
  'Интересный собеседник',
  'Надежный участник',
  'Командный игрок',
  'Эрудированный',
  'Позитивный настрой',
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  eventId,
  targetUserId,
  targetUserName,
  eventName,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Легко общаться', 'Пунктуальный']);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      setErrorMsg('Пожалуйста, напишите пару слов о впечатлениях от совместной встречи');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.submitReview({
        eventId,
        targetUserId,
        rating,
        tags: selectedTags,
        text,
      });
      onSubmitted();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отправки отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              Отзыв о встрече с {targetUserName}
            </h2>
            {eventName && (
              <span className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                <Calendar className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} />
                <span>{eventName}</span>
              </span>
            )}
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

        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Stars */}
          <div
            className="text-center p-3 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="text-xs block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Оцените общение и соблюдение договоренностей:
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 focus:outline-hidden transition-all cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= rating ? 'fill-amber-500 text-amber-500 drop-shadow-xs' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-amber-500 mt-1 block tabular-nums">
              {rating === 5 ? '5 из 5 — Отличный участник!' : `${rating} из 5`}
            </span>
          </div>

          {/* Quick tags */}
          <div>
            <span className="text-xs font-bold block mb-2" style={{ color: 'var(--text-primary)' }}>
              Что особенно понравилось:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_TAGS.map(t => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
              Текст отзыва о встрече:
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Как прошла совместная встреча? Было ли комфортно общаться? Все ли пришли вовремя?"
              className="w-full h-24 p-3 rounded-2xl border text-xs focus:outline-hidden resize-none"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <button
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-3 text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer active:scale-98"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {isSubmitting ? 'Сохраняем отзыв...' : 'Опубликовать отзыв в профиле'}
          </button>
        </div>
      </div>
    </div>
  );
};
