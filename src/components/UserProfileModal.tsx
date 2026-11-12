import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Star, ShieldCheck, CheckCircle2, MapPin, UserX, Flag, 
  Camera, ChevronLeft, ChevronRight, Eye, Briefcase, Award, 
  CalendarCheck, Users, MessageSquareQuote
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

type ProfileSectionTab = 'about' | 'reviews';

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
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>('about');
  const [isLoading, setIsLoading] = useState(true);
  const [blockSuccess, setBlockSuccess] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
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
  const photoList = (profile.photos && profile.photos.length > 0)
    ? profile.photos
    : [profile.avatarUrl];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* 1. TOP PROFILE HEADER */}
        <div
          className="p-5 sm:p-6 border-b shrink-0 space-y-4"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <motion.div
                whileHover={{ scale: 1.03 }}
                onClick={() => setActivePhotoIndex(0)}
                className="relative shrink-0 cursor-pointer group"
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl object-cover border shadow-sm"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
                <div className="absolute inset-0 rounded-3xl bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </motion.div>

              <div className="min-w-0 space-y-1.5 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-display font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {profile.name}, {profile.age}
                  </h2>
                  <OnlineStatusBadge
                    status={profile.onlineStatus || (isMe ? 'online' : 'recent')}
                    lastSeen={isMe ? 'В сети' : profile.lastSeen}
                    size="sm"
                  />
                </div>

                {profile.occupation && (
                  <div className="text-xs font-medium flex flex-wrap items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{profile.occupation}</span>
                    {profile.companyOrIndustry && (
                      <>
                        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                        <span>{profile.companyOrIndustry}</span>
                      </>
                    )}
                  </div>
                )}

                <div className="text-xs flex flex-wrap items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    <span>{profile.city}</span>
                  </span>

                  {profile.isPhoneVerified && (
                    <>
                      <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Телефон подтверждён</span>
                      </span>
                    </>
                  )}

                  {profile.isIdentityVerified && (
                    <>
                      <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>·</span>
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Личность проверена</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
              }}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Segmented Navigation Bar */}
          <div
            className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className="relative flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === 'about' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {activeTab === 'about' && (
                <motion.div
                  layoutId="userProfileActiveTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                  className="absolute inset-0 rounded-xl shadow-xs"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                />
              )}
              <Award className="w-3.5 h-3.5 relative z-10" style={{ color: 'var(--accent-primary)' }} />
              <span className="relative z-10">О человеке и надёжность</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className="relative flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                color: activeTab === 'reviews' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {activeTab === 'reviews' && (
                <motion.div
                  layoutId="userProfileActiveTab"
                  transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                  className="absolute inset-0 rounded-xl shadow-xs"
                  style={{ backgroundColor: 'var(--bg-surface)' }}
                />
              )}
              <MessageSquareQuote className="w-3.5 h-3.5 relative z-10" style={{ color: 'var(--accent-primary)' }} />
              <span className="relative z-10">Отзывы со встреч</span>
              <span
                className="relative z-10 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tabular-nums"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                }}
              >
                {reviews.length}
              </span>
            </button>
          </div>
        </div>

        {/* 2. SCROLLABLE BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {blockSuccess && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-2xl">
              Пользователь заблокирован. Его события больше не будут отображаться в вашей ленте.
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'about' ? (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Bio Section */}
                {profile.bio && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      О себе
                    </span>
                    <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Reputation & Reliability Metrics */}
                <div
                  className="p-4 sm:p-5 rounded-2xl border space-y-4"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                      <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                      <span>Репутация и дисциплина</span>
                    </div>
                    <div className="inline-flex items-center gap-1 text-sm font-extrabold text-amber-500 tabular-nums">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{profile.reliability.score}</span>
                    </div>
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-secondary)' }}>Фактическая явка на подтверждённые встречи</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {profile.reliability.attendanceRate}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profile.reliability.attendanceRate}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Clean 3-Stat Row */}
                  <div
                    className="grid grid-cols-3 gap-3 pt-2 border-t tabular-nums"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <CalendarCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Посещено</span>
                      </div>
                      <span className="text-xl font-display font-black block mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {profile.reliability.eventsAttended}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Users className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Создано</span>
                      </div>
                      <span className="text-xl font-display font-black block mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {profile.reliability.eventsOrganized}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Award className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Рекомендаций</span>
                      </div>
                      <span className="text-xl font-display font-black block mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {profile.reliability.positiveReviewsCount}
                      </span>
                    </div>
                  </div>

                  <div
                    className="pt-2.5 border-t flex items-center justify-between text-xs tabular-nums"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <span>Отмен встреч: <strong style={{ color: 'var(--text-primary)' }}>{profile.reliability.cancellations}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Пропусков (no-show): <strong style={{ color: 'var(--text-primary)' }}>{profile.reliability.noShows}</strong></span>
                  </div>
                </div>

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Интересы и темы встреч
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map(i => (
                        <span
                          key={i}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold"
                          style={{
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Gallery Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Camera className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                      <span>Фотографии ({photoList.length})</span>
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Нажмите для увеличения
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {photoList.map((photo, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActivePhotoIndex(idx)}
                        className="group relative aspect-square rounded-2xl overflow-hidden border cursor-pointer shadow-2xs"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <img
                          src={photo}
                          alt={`${profile.name} - фото ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <MeetingReviewsSection
                  reviews={reviews}
                  targetUserName={profile.name}
                  targetUserId={profile.id}
                  isCurrentUser={isMe}
                  onWriteReview={!isMe && onOpenReview ? () => onOpenReview(profile.id, profile.name) : undefined}
                  onSelectAuthor={onSelectUser}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Safety options if looking at other user */}
          {!isMe && (
            <div
              className="pt-4 border-t flex items-center justify-between text-xs"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => onOpenReport('user', profile.id, profile.name)}
                className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Пожаловаться на профиль</span>
              </button>

              <button
                type="button"
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
      </motion.div>

      {/* Fullscreen Photo Lightbox Modal */}
      <AnimatePresence>
        {activePhotoIndex !== null && (() => {
          const currentPhoto = photoList[activePhotoIndex] || photoList[0];

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/95 flex flex-col justify-between p-4 sm:p-6 backdrop-blur-md"
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
                  type="button"
                  onClick={() => setActivePhotoIndex(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Закрыть"
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

                <motion.div
                  key={activePhotoIndex}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black/40"
                >
                  <img
                    src={currentPhoto}
                    alt={`${profile.name} полноразмерное фото`}
                    referrerPolicy="no-referrer"
                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl"
                  />
                </motion.div>

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
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
