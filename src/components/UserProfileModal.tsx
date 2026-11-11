import React, { useState, useEffect } from 'react';
import { 
  X, Star, ShieldCheck, CheckCircle2, 
  MapPin, UserX, Flag, Camera, ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';
import { UserProfile, UserReview } from '../types/index.ts';
import { api } from '../services/api.ts';
import { OnlineStatusBadge } from './OnlineStatusBadge.tsx';
import { MeetingReviewsSection } from './MeetingReviewsSection.tsx';

interface UserProfileModalProps {
  userId: string;
  currentUserId: string;
  onClose: () => void;
  onOpenReport: (targetType: 'user', targetId: string, targetTitle: string) => void;
  onUserBlocked: () => void;
  onOpenReview?: (targetUserId: string, targetUserName: string) => void;
  onSelectUser?: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userId,
  currentUserId,
  onClose,
  onOpenReport,
  onUserBlocked,
  onOpenReview,
  onSelectUser,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getUserProfile(userId);
        setProfile(data.profile);
        setReviews(data.reviews);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  const handleBlock = async () => {
    if (!profile) return;
    try {
      await api.blockUser(profile.id);
      setBlockSuccess(true);
      setTimeout(() => {
        onUserBlocked();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to block:', err);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
        <div
          className="p-6 rounded-2xl text-xs border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Загрузка профиля...
        </div>
      </div>
    );
  }

  const isMe = profile.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Профиль участника
          </span>
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

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {blockSuccess && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl">
              Пользователь заблокирован. Его события больше не будут отображаться в вашей ленте.
            </div>
          )}

          {/* User hero card */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
              {/* Floating dot on avatar */}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  profile.onlineStatus === 'online'
                    ? 'bg-emerald-500'
                    : profile.onlineStatus === 'recent'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
                title={profile.lastSeen || (profile.onlineStatus === 'online' ? 'Онлайн' : 'Не в сети')}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-display font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {profile.name}, {profile.age}
                </h2>
                <OnlineStatusBadge
                  status={profile.onlineStatus || (isMe ? 'online' : 'recent')}
                  lastSeen={isMe ? 'Онлайн сейчас' : profile.lastSeen}
                  size="sm"
                />
              </div>

              {profile.occupation && (
                <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
                  <span>💼 {profile.occupation}</span>
                  {profile.companyOrIndustry && (
                    <>
                      <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{profile.companyOrIndustry}</span>
                    </>
                  )}
                </div>
              )}
              <div className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-secondary)' }}>
                <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                <span>{profile.city}</span>
              </div>

              {/* Verified indicators */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {profile.isPhoneVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    Телефон подтвержден
                  </span>
                )}
                {profile.isIdentityVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-lg">
                    <ShieldCheck className="w-3 h-3" />
                    Личность проверена
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {(() => {
            const photoList = (profile.photos && profile.photos.length > 0)
              ? profile.photos
              : [profile.avatarUrl];

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Camera className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    <span>Фотографии ({photoList.length})</span>
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Нажмите для полноэкранного просмотра
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photoList.map((photo, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className="group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer hover:opacity-95 transition-all shadow-xs"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <img
                        src={photo}
                        alt={`${profile.name} - фото ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                          Главное
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Bio */}
          {profile.bio && (
            <div
              className="p-3.5 rounded-2xl border text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              «{profile.bio}»
            </div>
          )}

          {/* FACTUAL REPUTATION & RELIABILITY METRICS */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
                <ShieldCheck className="w-4 h-4" />
                <span>Индекс надежности и поведение</span>
              </span>
              <div className="flex items-center gap-1 text-sm font-extrabold text-amber-500 tabular-nums">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{profile.reliability.score}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 tabular-nums">
              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-lg font-display font-black block" style={{ color: 'var(--text-primary)' }}>
                  {profile.reliability.attendanceRate}%
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Фактическая явка
                </span>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-lg font-display font-black block" style={{ color: 'var(--text-primary)' }}>
                  {profile.reliability.eventsAttended}
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Встреч посещено
                </span>
              </div>

              <div
                className="p-2.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-lg font-display font-black block" style={{ color: 'var(--text-primary)' }}>
                  {profile.reliability.eventsOrganized}
                </span>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Организовано
                </span>
              </div>
            </div>

            <div className="text-[11px] flex justify-between px-1 tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              <span>Отмен встреч: <b style={{ color: 'var(--text-primary)' }}>{profile.reliability.cancellations}</b></span>
              <span>Неявок: <b style={{ color: 'var(--text-primary)' }}>{profile.reliability.noShows}</b></span>
              <span>Отзывов: <b style={{ color: 'var(--text-primary)' }}>{profile.reliability.positiveReviewsCount}</b></span>
            </div>
          </div>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Интересы и увлечения
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map(i => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl text-xs font-semibold border"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews of Meetings Section */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <MeetingReviewsSection
              reviews={reviews}
              targetUserName={profile.name}
              targetUserId={profile.id}
              isCurrentUser={isMe}
              onWriteReview={!isMe && onOpenReview ? () => onOpenReview(profile.id, profile.name) : undefined}
              onSelectAuthor={onSelectUser}
            />
          </div>

          {/* Safety options if looking at other user */}
          {!isMe && (
            <div
              className="pt-4 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <button
                onClick={() => onOpenReport('user', profile.id, profile.name)}
                className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Пожаловаться на профиль</span>
              </button>

              <button
                onClick={handleBlock}
                className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Заблокировать</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {activePhotoIndex !== null && (() => {
        const photoList = (profile.photos && profile.photos.length > 0)
          ? profile.photos
          : [profile.avatarUrl];
        const currentPhoto = photoList[activePhotoIndex] || photoList[0];

        return (
          <div
            className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setActivePhotoIndex(null)}
          >
            {/* Top Lightbox Bar */}
            <div
              className="flex items-center justify-between text-white text-xs max-w-4xl mx-auto w-full pt-1"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <div>
                  <span className="font-bold block">{profile.name}</span>
                  <span className="text-[11px] text-white/70 tabular-nums">
                    Фотография {activePhotoIndex + 1} из {photoList.length}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActivePhotoIndex(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Закрыть (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage Image & Navigation */}
            <div
              className="relative flex-1 flex items-center justify-center max-w-4xl mx-auto w-full my-4"
              onClick={e => e.stopPropagation()}
            >
              {photoList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + photoList.length) % photoList.length)}
                  className="absolute left-2 sm:left-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Предыдущее фото"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <div className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black/40">
                <img
                  src={currentPhoto}
                  alt={`${profile.name} полноразмерное фото`}
                  referrerPolicy="no-referrer"
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
                />
              </div>

              {photoList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % photoList.length)}
                  className="absolute right-2 sm:right-4 z-10 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-lg"
                  title="Следующее фото"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {photoList.length > 1 && (
              <div
                className="flex items-center justify-center gap-2 max-w-4xl mx-auto w-full overflow-x-auto py-2"
                onClick={e => e.stopPropagation()}
              >
                {photoList.map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activePhotoIndex === idx
                        ? 'border-white scale-105 shadow-md'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`Миниатюра ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
