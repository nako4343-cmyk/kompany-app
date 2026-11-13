import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Users,
  MapPin,
  Compass,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import {
  auth,
  signInWithGooglePopup,
  signOutCloudUser,
  syncUserProfileToCloud,
  fetchCloudUserProfile,
  FirebaseUser,
  sanitizeValidId,
} from '../lib/firebase.ts';

interface AuthModalProps {
  currentUser: UserProfile;
  cloudUser: FirebaseUser | null;
  isInitialGate?: boolean;
  onClose: () => void;
  onProfileRegistered: (updatedProfile: UserProfile) => void;
  onLogout?: () => void;
  lang?: 'ru' | 'en';
}

const INTEREST_OPTIONS = [
  'Настольные игры',
  'Рестораны / Бары',
  'Кино / Концерт',
  'День рождения',
  'Свадьба',
  'Квиз / Интеллект',
  'Спорт',
  'Пикник / Шашлыки',
  'Прогулка',
  'Путешествие',
];

const SHOWCASE_CARDS = [
  {
    title: 'Вечер настольных игр на Покровке',
    category: 'Настольные игры',
    spotText: '5 из 6 участников',
    area: 'Чистые пруды · Сегодня в 19:30',
    image: './assets/images/event_board_games_1794332913325.jpg',
  },
  {
    title: 'Камерный гастро-ужин на Патриарших',
    category: 'Ресторан / Бар',
    spotText: '4 из 6 участников',
    area: 'Малая Бронная · Сегодня в 20:00',
    image: './assets/images/hero_community_event_1794332913246.jpg',
  },
  {
    title: 'Камерная свадьба-вечеринка у воды',
    category: 'Свадьба',
    spotText: '18 из 24 гостей',
    area: 'Серебряный Бор · Суббота, 18:30',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  cloudUser,
  isInitialGate = false,
  onClose,
  onProfileRegistered,
  onLogout,
  lang = 'ru',
}) => {
  const isEn = lang === 'en';

  const [step, setStep] = useState<'welcome' | 'form'>(isInitialGate ? 'welcome' : 'form');
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);

  const [name, setName] = useState(currentUser.name || '');
  const [age, setAge] = useState<number>(currentUser.age || 27);
  const [gender, setGender] = useState<'female' | 'male'>(currentUser.gender || 'female');
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [occupation, setOccupation] = useState(currentUser.occupation || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '+7 (999) 123-45-67');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [interests, setInterests] = useState<string[]>(
    currentUser.interests && currentUser.interests.length > 0
      ? currentUser.interests.slice(0, 10)
      : ['Настольные игры', 'Рестораны / Бары']
  );
  const [openToInvites, setOpenToInvites] = useState<boolean>(currentUser.openToInvites ?? true);
  const [openToInvitesNote, setOpenToInvitesNote] = useState(
    currentUser.openToInvitesNote ||
      'Открыт(а) к приглашениям на настольные игры, ужины и интересные вечера в компании!'
  );

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (cloudUser) {
      setName(prev => prev || cloudUser.displayName || 'Участник Kompa');
    }
  }, [cloudUser]);

  useEffect(() => {
    if (step !== 'welcome') return;
    const timer = setInterval(() => {
      setActiveShowcaseIdx(prev => (prev + 1) % SHOWCASE_CARDS.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [step]);

  const toggleInterest = (tag: string) => {
    setInterests(prev => {
      if (prev.includes(tag)) {
        return prev.filter(x => x !== tag);
      }
      if (prev.length >= 10) return prev;
      return [...prev, tag];
    });
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingAuth(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const fbUser = await signInWithGooglePopup();
      const uid = sanitizeValidId(fbUser.uid);

      let existingCloud: Partial<UserProfile> | null = null;
      try {
        existingCloud = await fetchCloudUserProfile(uid);
      } catch {
        existingCloud = null;
      }

      const mergedProfile: UserProfile = {
        ...currentUser,
        id: uid,
        name: existingCloud?.name || fbUser.displayName || name || 'Участник Kompa',
        age: existingCloud?.age || age || 27,
        gender: existingCloud?.gender || gender || 'female',
        city: existingCloud?.city || city || 'Москва',
        occupation: existingCloud?.occupation || occupation || 'Участник Kompa',
        avatarUrl:
          existingCloud?.avatarUrl ||
          fbUser.photoURL ||
          currentUser.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        bio:
          existingCloud?.bio ||
          bio ||
          'Ищу приятную компанию на вечер: настольные игры, гастро-ужины и концерты.',
        interests:
          existingCloud?.interests && existingCloud.interests.length > 0
            ? existingCloud.interests
            : interests,
        openToInvites: existingCloud?.openToInvites ?? openToInvites,
        openToInvitesNote: existingCloud?.openToInvitesNote || openToInvitesNote,
        email: fbUser.email || currentUser.email || 'user@kompa.app',
        phoneNumber: existingCloud?.phoneNumber || phoneNumber,
        isEmailVerified: Boolean(fbUser.emailVerified),
        isPhoneVerified: true,
        isIdentityVerified: true,
        onlineStatus: 'online',
        lastSeen: isEn ? 'Online now' : 'Онлайн сейчас',
      };

      setName(mergedProfile.name);
      setAge(mergedProfile.age);
      setGender(mergedProfile.gender || 'female');
      setCity(mergedProfile.city);
      setOccupation(mergedProfile.occupation || '');
      setBio(mergedProfile.bio);
      setInterests(mergedProfile.interests);
      setOpenToInvites(Boolean(mergedProfile.openToInvites));
      setOpenToInvitesNote(mergedProfile.openToInvitesNote || '');

      await syncUserProfileToCloud(mergedProfile);
      onProfileRegistered(mergedProfile);
      setStep('form');
      setStatusMessage(
        isEn ? 'Welcome to Kompa! Your profile is active.' : 'Добро пожаловать в Kompa! Ваш профиль активен.'
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isEn ? 'Sign-in could not be completed.' : 'Не удалось выполнить вход через Google.')
      );
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const activeFbUser = auth.currentUser;
      const uid = activeFbUser ? sanitizeValidId(activeFbUser.uid) : currentUser.id;

      const updatedProfile: UserProfile = {
        ...currentUser,
        id: uid,
        name: name.trim().slice(0, 80) || 'Участник Kompa',
        age: Math.min(99, Math.max(18, Number(age) || 27)),
        gender,
        city: city.trim().slice(0, 60) || 'Москва',
        occupation: occupation.trim().slice(0, 100) || 'Участник Kompa',
        phoneNumber: phoneNumber.trim().slice(0, 40),
        bio: bio.trim().slice(0, 600),
        interests: interests.length > 0 ? interests.slice(0, 10) : ['Настольные игры'],
        openToInvites,
        openToInvitesNote: openToInvitesNote.trim().slice(0, 300),
        email: activeFbUser?.email || currentUser.email || 'user@kompa.app',
        onlineStatus: 'online',
        lastSeen: isEn ? 'Online now' : 'Онлайн сейчас',
      };

      if (activeFbUser) {
        await syncUserProfileToCloud(updatedProfile);
      }

      onProfileRegistered(updatedProfile);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await signOutCloudUser();
    } catch {
      // ignore
    }
    if (onLogout) {
      onLogout();
    }
    setStep('welcome');
    setStatusMessage(isEn ? 'You have signed out.' : 'Вы вышли из аккаунта.');
  };

  return (
    <div
      onClick={() => {
        if (!isInitialGate) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl max-h-[94vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 'welcome' ? (
            /* STEP 1: HIGH-CONTRAST ANIMATED WELCOME & REGISTRATION GATE */
            <motion.div
              key="welcome-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between p-5 sm:p-7 overflow-y-auto space-y-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              {/* Top Brand Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-xl shadow-md shrink-0"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    K
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-display font-extrabold text-lg tracking-tight leading-none"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Kompa
                      </span>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent-text)',
                        }}
                      >
                        {isEn ? 'Moscow' : 'Москва'}
                      </span>
                    </div>
                    <span
                      className="text-xs block mt-0.5 font-medium"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {isEn ? 'Find your company for tonight' : 'Твоя компания на сегодня вечером'}
                    </span>
                  </div>
                </div>

                {!isInitialGate && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Center Headline & Animated Live Meetup Showcase */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-xl sm:text-2xl font-display font-extrabold leading-snug tracking-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isEn
                      ? 'Meet people through real plans — board games, dinners, concerts & parties'
                      : 'Найди с кем пойти сегодня вечером — без дейтинга и неловкости'}
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06, duration: 0.25 }}
                    className="text-xs sm:text-sm leading-relaxed font-normal"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {isEn
                      ? 'Create your profile once. Exact venue addresses and group chats unlock only after the organizer approves your request.'
                      : 'Заполните анкету один раз при входе: выбирайте компании по интересам или включите метку «Жду приглашений», чтобы организаторы сами звали вас на встречи.'}
                  </motion.p>
                </div>

                {/* Animated Live Event Card Carousel */}
                <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden bg-neutral-900 shadow-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <AnimatePresence mode="wait">
                    {SHOWCASE_CARDS.map((card, idx) =>
                      idx === activeShowcaseIdx ? (
                        <motion.div
                          key={card.title}
                          initial={{ opacity: 0, x: 24 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -24 }}
                          transition={{ duration: 0.32, ease: 'easeOut' }}
                          className="absolute inset-0 flex items-end p-4"
                        >
                          <img
                            src={card.image}
                            alt={card.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
                          <div className="relative z-10 w-full flex items-end justify-between gap-3">
                            <div className="space-y-1 min-w-0">
                              <span className="inline-block text-[11px] font-bold text-amber-300 bg-black/50 px-2 py-0.5 rounded-md">
                                {card.category} · {card.spotText}
                              </span>
                              <h3 className="text-sm sm:text-base font-display font-bold text-white truncate">
                                {card.title}
                              </h3>
                              <p className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="truncate">{card.area}</span>
                              </p>
                            </div>
                            <div className="flex -space-x-2 shrink-0">
                              <img
                                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                                alt=""
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                                alt=""
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
                              />
                              <img
                                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80"
                                alt=""
                                className="w-8 h-8 rounded-full object-cover ring-2 ring-black"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ) : null
                    )}
                  </AnimatePresence>
                </div>

                {/* Progress indicators & Benefits Row */}
                <div
                  className="p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isEn ? 'Private addresses until approved' : 'Точный адрес скрыт до одобрения'}</span>
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Users className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      <span>{isEn ? 'Verified participants' : 'Проверенные участники'}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {SHOWCASE_CARDS.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveShowcaseIdx(i)}
                        className="h-2 rounded-full transition-all cursor-pointer"
                        style={{
                          width: i === activeShowcaseIdx ? '22px' : '8px',
                          backgroundColor:
                            i === activeShowcaseIdx ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Animated Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <motion.button
                  type="button"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStep('form')}
                  className="w-full py-3.5 px-6 rounded-2xl text-sm font-display font-bold text-white shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>{isEn ? 'Create Profile & Enter Kompa' : 'Зарегистрироваться и войти'}</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.span>
                </motion.button>

                <button
                  type="button"
                  disabled={isLoadingAuth}
                  onClick={handleGoogleSignIn}
                  className="w-full py-3 px-5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <LogIn className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span>
                    {isLoadingAuth
                      ? isEn
                        ? 'Signing in...'
                        : 'Вход...'
                      : isEn
                      ? 'Continue with Google'
                      : 'Быстрый вход через Google'}
                  </span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* STEP 2: HIGH-CONTRAST PERSONAL PROFILE & REGISTRATION FORM */
            <motion.div
              key="form-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col max-h-[92vh]"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }}
            >
              {/* Header */}
              <div
                className="p-4 sm:p-5 border-b flex items-center justify-between shrink-0"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isEn ? 'Your Kompa Profile' : 'Регистрация участника Kompa'}
                    </h2>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {isEn
                        ? 'Fill in your profile once — stays signed in until you log out'
                        : 'Заполните анкету один раз — повторный вход только после выхода'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isInitialGate && (
                    <button
                      type="button"
                      onClick={handleSignOutClick}
                      className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Sign Out' : 'Выйти'}</span>
                    </button>
                  )}

                  {!isInitialGate && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* Optional Google Quick Fill Bar */}
                {!cloudUser && (
                  <div
                    className="p-3.5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'Quick sign-in with Google' : 'Заполнить профиль через Google'}
                      </span>
                      <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>
                        {isEn
                          ? 'Automatically import your name and avatar'
                          : 'Имя и фото подтянутся автоматически в один клик'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={isLoadingAuth}
                      onClick={handleGoogleSignIn}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <LogIn className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                      <span>{isLoadingAuth ? 'Подключение...' : 'Войти через Google'}</span>
                    </button>
                  </div>
                )}

                {statusMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSaveRegistration} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'Your Name' : 'Ваше имя и фамилия'}
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Например: Анна Смирнова"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'Age (18–99)' : 'Возраст (18–99)'}
                      </label>
                      <input
                        type="number"
                        min={18}
                        max={99}
                        required
                        value={age}
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none tabular-nums"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'Gender' : 'Пол'}
                      </label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value as 'female' | 'male')}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="female">{isEn ? 'Female' : 'Женский'}</option>
                        <option value="male">{isEn ? 'Male' : 'Мужской'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'City' : 'Город'}
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        {isEn ? 'Occupation' : 'Профессия / Сфера'}
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        value={occupation}
                        onChange={e => setOccupation(e.target.value)}
                        placeholder={isEn ? 'e.g. Designer' : 'Напр.: Архитектор, IT'}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {isEn ? 'About You' : 'Коротко о себе и планах на вечер'}
                    </label>
                    <textarea
                      rows={2}
                      maxLength={600}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Люблю камерные ужины, стратегические настолки и живую музыку..."
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Interests Picker */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      {isEn ? 'Your Interests' : 'Выберите интересные темы встреч'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map(tag => {
                        const active = interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Open to Invites Badge Toggle */}
                  <div
                    className="p-3.5 rounded-2xl border space-y-2"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                          {isEn
                            ? 'Status: "Waiting for event invitations"'
                            : 'Метка «Жду приглашений на мероприятие»'}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={openToInvites}
                        onChange={e => setOpenToInvites(e.target.checked)}
                        className="rounded accent-emerald-600 w-4 h-4"
                      />
                    </label>
                    {openToInvites && (
                      <input
                        type="text"
                        maxLength={300}
                        value={openToInvitesNote}
                        onChange={e => setOpenToInvitesNote(e.target.value)}
                        placeholder={
                          isEn
                            ? 'What kind of events are you open to?'
                            : 'Пожелание для организаторов (напр.: Свободна в пятницу на настолки)'
                        }
                        className="w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('welcome')}
                      className="px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {isEn ? 'Back' : 'Назад'}
                    </button>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSaving
                          ? isEn
                            ? 'Saving...'
                            : 'Сохранение...'
                          : isEn
                          ? 'Save & Continue to Kompa'
                          : 'Сохранить и войти в приложение'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
