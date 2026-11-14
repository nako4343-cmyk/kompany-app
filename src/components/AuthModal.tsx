import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  MapPin,
  Compass,
  Utensils,
  Dice5,
  Music,
  PartyPopper,
  Camera,
  Upload,
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

const OCCUPATION_PRESETS = [
  'Арт-директор & Дизайн',
  'IT & Продукт',
  'Предприниматель',
  'Маркетинг & PR',
  'Архитектура',
  'Финансы & Консалтинг',
];

const CITY_PRESETS = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'];

const VIBE_CARDS = [
  {
    id: 'gastro',
    title: 'Камерный ужин и бар',
    desc: 'До 6 человек, авторская кухня, спокойная беседа',
    icon: Utensils,
    defaultInterests: ['Рестораны / Бары', 'Прогулка'],
    bioPreset:
      'Люблю открывать новые гастрономические места, уютные бары и собираться в небольшой приятной компании.',
  },
  {
    id: 'games',
    title: 'Азарт и настольные игры',
    desc: 'Стратегии, квизы, вечера настолок в центре',
    icon: Dice5,
    defaultInterests: ['Настольные игры', 'Квиз / Интеллект'],
    bioPreset:
      'Обожаю стратегические и компанейские настольные игры, интеллектуальные квизы и бодрые вечера с юмором.',
  },
  {
    id: 'culture',
    title: 'Концерты, кино и культура',
    desc: 'Живой джаз, премьеры, выставки и театр',
    icon: Music,
    defaultInterests: ['Кино / Концерт', 'Рестораны / Бары'],
    bioPreset:
      'Ищу компанию на живые концерты, джазовые вечера, кинопремьеры и обсуждение за бокалом после.',
  },
  {
    id: 'party',
    title: 'Праздники и вылазки',
    desc: 'Дни рождения, пикники, спорт и загородные сборы',
    icon: PartyPopper,
    defaultInterests: ['День рождения', 'Пикник / Шашлыки', 'Спорт'],
    bioPreset:
      'За активные выходные, душевные дни рождения, пикники на природе и спонтанные вылазки большой компанией.',
  },
];

const INVITE_NOTE_PRESETS = [
  'Свободен(на) сегодня после 19:00 на ужин или настолки!',
  'Открыт(а) к приглашениям в бар, на квиз или концерт в центре.',
  'С радостью присоединюсь к проверенной компании на выходных.',
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
    title: 'Джазовый концерт и коктейли',
    category: 'Кино / Концерт',
    spotText: '6 из 8 участников',
    area: 'Кузнецкий Мост · Пятница, 20:30',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
};

/**
 * Resize and compress user's uploaded photo on client canvas
 * so smartphone photos save smoothly in localStorage & Firestore.
 */
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл фотографии'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Некорректный формат изображения'));
      img.onload = () => {
        const maxSide = 420;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSide) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          }
        } else {
          if (height > maxSide) {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function createInitialsAvatarDataUrl(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : (parts[0]?.slice(0, 2) || 'КМ').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
    <rect width="240" height="240" rx="48" fill="#E84520"/>
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Onest, Inter, sans-serif" font-weight="800" font-size="84">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

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

  // Step 0 = Welcome showcase; Step 1 = Identity & Personal Photo; Step 2 = Vibe & Interests; Step 3 = Final Pass
  const [[wizardStep, direction], setStepState] = useState<[0 | 1 | 2 | 3, number]>([
    isInitialGate ? 0 : 1,
    1,
  ]);

  const navigateToStep = (nextStep: 0 | 1 | 2 | 3) => {
    setErrorMessage('');
    setStepState(([prevStep]) => [nextStep, nextStep >= prevStep ? 1 : -1]);
  };

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [selectedVibeId, setSelectedVibeId] = useState<string>('gastro');

  const [name, setName] = useState(currentUser.name || '');
  const [age, setAge] = useState<number>(currentUser.age || 27);
  const [gender, setGender] = useState<'female' | 'male'>(currentUser.gender || 'female');
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [occupation, setOccupation] = useState(currentUser.occupation || '');

  // Only keep a photo if it is the user's own uploaded photo (data:) or their Google photo, or existing non-stock photo when editing
  const isPersonalPhoto = (url?: string) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (url.includes('googleusercontent.com')) return true;
    if (!isInitialGate && !url.includes('images.unsplash.com')) return true;
    return false;
  };

  const [avatarUrl, setAvatarUrl] = useState<string>(
    isPersonalPhoto(currentUser.avatarUrl) ? currentUser.avatarUrl : ''
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [phoneNumber] = useState(currentUser.phoneNumber || '+7 (999) 123-45-67');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [interests, setInterests] = useState<string[]>(
    currentUser.interests && currentUser.interests.length > 0
      ? currentUser.interests.slice(0, 10)
      : ['Настольные игры', 'Рестораны / Бары']
  );
  const [openToInvites, setOpenToInvites] = useState<boolean>(currentUser.openToInvites ?? true);
  const [openToInvitesNote, setOpenToInvitesNote] = useState(
    currentUser.openToInvitesNote || INVITE_NOTE_PRESETS[0]
  );

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Lock background page scroll while modal is open so iOS Safari never shifts the viewport
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (cloudUser) {
      setName(prev => prev || cloudUser.displayName || 'Участник Kompa');
      if (cloudUser.photoURL) {
        setAvatarUrl(cloudUser.photoURL);
      }
    }
  }, [cloudUser]);

  useEffect(() => {
    if (wizardStep !== 0) return;
    const timer = setInterval(() => {
      setActiveShowcaseIdx(prev => (prev + 1) % SHOWCASE_CARDS.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [wizardStep]);

  const matchedEventsCount = useMemo(() => {
    const base = 6;
    return base + interests.length * 3;
  }, [interests]);

  const userInitials = useMemo(() => {
    const parts = (name || 'Участник Kompa').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.slice(0, 2) || 'КМ').toUpperCase();
  }, [name]);

  const toggleInterest = (tag: string) => {
    setInterests(prev => {
      if (prev.includes(tag)) {
        return prev.length > 1 ? prev.filter(x => x !== tag) : prev;
      }
      if (prev.length >= 10) return prev;
      return [...prev, tag];
    });
  };

  const handleSelectVibe = (vibe: (typeof VIBE_CARDS)[number]) => {
    setSelectedVibeId(vibe.id);
    setInterests(prev => {
      const combined = Array.from(new Set([...vibe.defaultInterests, ...prev]));
      return combined.slice(0, 10);
    });
    if (!bio.trim() || VIBE_CARDS.some(v => v.bioPreset === bio.trim())) {
      setBio(vibe.bioPreset);
    }
  };

  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setErrorMessage('');
    try {
      const compressedDataUrl = await compressImageFile(file);
      setAvatarUrl(compressedDataUrl);
      setStatusMessage(isEn ? 'Your photo has been uploaded!' : 'Ваше личное фото загружено!');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Не удалось обработать фотографию');
    } finally {
      setIsUploadingPhoto(false);
    }
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

      const resolvedName =
        existingCloud?.name || fbUser.displayName || name || 'Участник Kompa';
      const resolvedAvatar =
        existingCloud?.avatarUrl ||
        fbUser.photoURL ||
        avatarUrl ||
        createInitialsAvatarDataUrl(resolvedName);

      const mergedProfile: UserProfile = {
        ...currentUser,
        id: uid,
        name: resolvedName,
        age: existingCloud?.age || age || 27,
        gender: existingCloud?.gender || gender || 'female',
        city: existingCloud?.city || city || 'Москва',
        occupation: existingCloud?.occupation || occupation || 'Участник Kompa',
        avatarUrl: resolvedAvatar,
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
      setAvatarUrl(mergedProfile.avatarUrl);
      setBio(mergedProfile.bio);
      setInterests(mergedProfile.interests);
      setOpenToInvites(Boolean(mergedProfile.openToInvites));
      setOpenToInvitesNote(mergedProfile.openToInvitesNote || '');

      await syncUserProfileToCloud(mergedProfile);
      onProfileRegistered(mergedProfile);
      navigateToStep(1);
      setStatusMessage(
        isEn ? 'Google profile connected!' : 'Ваш профиль и фото из Google подключены!'
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isEn ? 'Sign-in could not be completed.' : 'Не удалось выполнить вход через Google.')
      );
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleFinishRegistration = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const activeFbUser = auth.currentUser;
      const uid = activeFbUser ? sanitizeValidId(activeFbUser.uid) : currentUser.id;
      const cleanName = name.trim().slice(0, 80) || 'Участник Kompa';
      const finalAvatar = avatarUrl || createInitialsAvatarDataUrl(cleanName);

      const updatedProfile: UserProfile = {
        ...currentUser,
        id: uid,
        name: cleanName,
        age: Math.min(99, Math.max(18, Number(age) || 27)),
        gender,
        city: city.trim().slice(0, 60) || 'Москва',
        occupation: occupation.trim().slice(0, 100) || 'Участник Kompa',
        avatarUrl: finalAvatar,
        phoneNumber: phoneNumber.trim().slice(0, 40),
        bio:
          bio.trim().slice(0, 600) ||
          'Открыт(а) к интересным встречам, камерным ужинам и настольным играм в хорошей компании.',
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
    navigateToStep(0);
    setStatusMessage(isEn ? 'You have signed out.' : 'Вы вышли из аккаунта.');
  };

  const stepTitles = [
    isEn ? 'Welcome' : 'Добро пожаловать',
    isEn ? 'Step 1 of 3 · Personal Profile' : 'Шаг 1 из 3 · Личный профиль и фото',
    isEn ? 'Step 2 of 3 · Evening Vibe' : 'Шаг 2 из 3 · Ваш формат вечера',
    isEn ? 'Step 3 of 3 · Your Member Pass' : 'Шаг 3 из 3 · Пропуск участника',
  ];

  return (
    <div
      onClick={() => {
        if (!isInitialGate) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 overflow-hidden"
    >
      {/* Fixed-height dvh container on mobile so header & footer NEVER shift or clip when scrolling */}
      <div
        onClick={e => e.stopPropagation()}
        className="w-full h-[100dvh] sm:h-[660px] sm:max-h-[90dvh] sm:max-w-xl sm:rounded-3xl shadow-2xl border-0 sm:border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* FIXED TOP HEADER — Never scrolls out of view */}
        <div
          className="px-4 py-3.5 sm:px-6 sm:py-4 border-b shrink-0 flex flex-col gap-2.5 z-10"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-lg shadow-sm shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                K
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-display font-extrabold text-base sm:text-lg tracking-tight truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Kompa
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    {city || 'Москва'}
                  </span>
                </div>
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {stepTitles[wizardStep]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
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
                  className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
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

          {/* Interactive Step Progress Bar for Steps 1..3 */}
          {wizardStep > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              {[1, 2, 3].map(idx => {
                const isDone = wizardStep > idx;
                const isCurrent = wizardStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => navigateToStep(idx as 1 | 2 | 3)}
                    className="h-1.5 rounded-full overflow-hidden transition-all cursor-pointer"
                    style={{
                      backgroundColor:
                        isDone || isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      opacity: isDone ? 0.55 : 1,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* HORIZONTAL SLIDE VIEWPORT — Fixed geometry so steps slide left/right without any vertical jumping */}
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={wizardStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 320, damping: 34, mass: 0.85 },
                opacity: { duration: 0.18 },
              }}
              className="h-full w-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              {statusMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {wizardStep === 0 && (
                /* STEP 0: INTERACTIVE WELCOME SHOWCASE */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1
                      className="text-xl sm:text-2xl font-display font-extrabold leading-snug tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isEn
                        ? 'Find your company for tonight — no dating, just real plans'
                        : 'Найди с кем пойти сегодня вечером — без дейтинга и неловкости'}
                    </h1>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {isEn
                        ? 'Set up your pass in 30 seconds. Exact venue addresses and group chats open only after the organizer approves you.'
                        : 'Соберите свой пропуск участника за 30 секунд: выбирайте проверенные компании по интересам, а точный адрес и чат откроются после одобрения организатором.'}
                    </p>
                  </div>

                  {/* Live Showcase Carousel */}
                  <div
                    className="relative h-48 sm:h-52 rounded-2xl overflow-hidden bg-neutral-900 shadow-md border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <AnimatePresence mode="wait">
                      {SHOWCASE_CARDS.map((card, idx) =>
                        idx === activeShowcaseIdx ? (
                          <motion.div
                            key={card.title}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.28 }}
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
                                <span className="inline-block text-[11px] font-bold text-amber-300 bg-black/60 px-2.5 py-0.5 rounded-md">
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
                            </div>
                          </motion.div>
                        ) : null
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Carousel Switcher & Security Promise */}
                  <div
                    className="p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {isEn
                          ? 'Private venue address until approved'
                          : 'Точный адрес скрыт до подтверждения заявки'}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {SHOWCASE_CARDS.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveShowcaseIdx(i)}
                          className="h-2 rounded-full transition-all cursor-pointer"
                          style={{
                            width: i === activeShowcaseIdx ? '20px' : '8px',
                            backgroundColor:
                              i === activeShowcaseIdx ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Interactive Preview of 3-step Pass Creation */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { num: '01', label: 'Личное фото', sub: 'Имя и сфера' },
                      { num: '02', label: 'Вайб вечера', sub: 'Темы и интересы' },
                      { num: '03', label: 'Пропуск', sub: 'Статус на вечер' },
                    ].map(item => (
                      <div
                        key={item.num}
                        className="p-3 rounded-2xl border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span
                          className="text-xs font-display font-extrabold block"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          {item.num}
                        </span>
                        <span
                          className="text-xs font-bold block mt-0.5"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="text-[11px] block"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.sub}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                /* STEP 1: PERSONAL PHOTO ONLY & IDENTITY */
                <div className="space-y-4">
                  {/* Personal Photo Upload Card (No preset stock avatars) */}
                  <div
                    className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name || 'Ваше фото'}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2"
                          style={{ borderColor: 'var(--accent-primary)' }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-extrabold text-xl text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span
                          className="text-xs sm:text-sm font-display font-bold block truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {avatarUrl ? 'Ваша личная фотография' : 'Загрузите ваше личное фото'}
                        </span>
                        <span
                          className="text-xs block mt-0.5 leading-snug"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          В клубе используются только настоящие фотографии участников
                        </span>
                      </div>
                    </div>

                    <label
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      {isUploadingPhoto ? (
                        <span>Загрузка...</span>
                      ) : (
                        <>
                          {avatarUrl ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          <span>{avatarUrl ? 'Изменить' : 'Загрузить'}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Quick Google Fill Option */}
                  {!cloudUser && (
                    <button
                      type="button"
                      disabled={isLoadingAuth}
                      onClick={handleGoogleSignIn}
                      className="w-full p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        <LogIn className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                        <div>
                          <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                            {isLoadingAuth ? 'Подключение Google...' : 'Заполнить в 1 клик через Google'}
                          </span>
                          <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>
                            Ваше имя и личное фото подтянутся из аккаунта
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                  )}

                  {/* Name Input */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Ваше имя и фамилия
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Например: Анна Воронова"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Age & Gender Segmented Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Возраст ({age} лет)
                      </label>
                      <div
                        className="flex items-center justify-between rounded-xl border px-2 py-1.5"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setAge(prev => Math.max(18, prev - 1))}
                          className="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={18}
                          max={99}
                          value={age}
                          onChange={e => setAge(Math.min(99, Math.max(18, Number(e.target.value) || 18)))}
                          className="w-12 text-center text-sm font-bold tabular-nums bg-transparent focus:outline-none"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setAge(prev => Math.min(99, prev + 1))}
                          className="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                        Пол
                      </label>
                      <div
                        className="grid grid-cols-2 gap-1 p-1 rounded-xl border"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        {[
                          { val: 'female', label: 'Женский' },
                          { val: 'male', label: 'Мужской' },
                        ].map(opt => {
                          const active = gender === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              onClick={() => setGender(opt.val as 'female' | 'male')}
                              className="py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              style={{
                                backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                                color: active ? '#ffffff' : 'var(--text-primary)',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* City & Quick Chips */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Город
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CITY_PRESETS.map(c => {
                        const active = city === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setCity(c)}
                            className="px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Ваш город"
                      className="w-full px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Occupation & 1-Tap Presets */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Профессия / Сфера
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {OCCUPATION_PRESETS.map(occ => {
                        const active = occupation === occ;
                        return (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => setOccupation(occ)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                            }}
                          >
                            {occ}
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={occupation}
                      onChange={e => setOccupation(e.target.value)}
                      placeholder="Например: Арт-директор, Архитектор, IT"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                /* STEP 2: EVENING VIBE CARDS & INTEREST RADAR */
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                      Какой формат вечера вам ближе всего?
                    </label>
                    <p className="text-xs mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                      Выберите настроение — мы автоматически настроим ваши интересы и описание
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {VIBE_CARDS.map(vibe => {
                        const Icon = vibe.icon;
                        const isSelected = selectedVibeId === vibe.id;
                        return (
                          <button
                            key={vibe.id}
                            type="button"
                            onClick={() => handleSelectVibe(vibe)}
                            className="p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3"
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                              borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                              }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <span
                                className="text-xs font-bold block"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {vibe.title}
                              </span>
                              <span
                                className="text-[11px] leading-snug block mt-0.5"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {vibe.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Interactive Interest Tags */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        Интересные темы встреч ({interests.length})
                      </label>
                      <span
                        className="text-xs font-bold"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        Подходит {matchedEventsCount} встреч сегодня
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {INTEREST_OPTIONS.map(tag => {
                        const active = interests.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleInterest(tag)}
                            className="px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer"
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

                  {/* Bio Input with Vibe Presets */}
                  <div>
                    <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                      Коротко о себе и планах на вечер
                    </label>
                    <textarea
                      rows={3}
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
                </div>
              )}

              {wizardStep === 3 && (
                /* STEP 3: LIVE MEMBER PASS & OPEN-TO-INVITES RADAR */
                <div className="space-y-4">
                  {/* Live Member Pass Card */}
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent-text)',
                        }}
                      >
                        ПРОПУСК УЧАСТНИКА KOMPA
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Профиль готов
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border"
                          style={{ borderColor: 'var(--border-subtle)' }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-extrabold text-xl text-white shrink-0"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="text-base font-display font-extrabold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {name.trim() || 'Участник Kompa'}, {age}
                        </h3>
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {occupation.trim() || 'Участник клуба'} · {city || 'Москва'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {interests.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderColor: 'var(--border-subtle)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {bio && (
                      <p
                        className="text-xs leading-relaxed pt-2 border-t"
                        style={{
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        «{bio}»
                      </p>
                    )}
                  </div>

                  {/* Open to Invites Toggle & Quick Templates */}
                  <div
                    className="p-4 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                            Метка «Жду приглашений на мероприятие»
                          </span>
                          <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>
                            Организаторы смогут сами приглашать вас в проверенные компании
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={openToInvites}
                        onChange={e => setOpenToInvites(e.target.checked)}
                        className="rounded accent-emerald-600 w-5 h-5 shrink-0"
                      />
                    </label>

                    {openToInvites && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {INVITE_NOTE_PRESETS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setOpenToInvitesNote(preset)}
                              className="text-left text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer"
                              style={{
                                backgroundColor:
                                  openToInvitesNote === preset ? 'var(--accent-soft)' : 'var(--bg-surface)',
                                borderColor:
                                  openToInvitesNote === preset ? 'var(--accent-primary)' : 'var(--border-subtle)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          maxLength={300}
                          value={openToInvitesNote}
                          onChange={e => setOpenToInvitesNote(e.target.value)}
                          placeholder="Ваше пожелание на вечер..."
                          className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FIXED BOTTOM FOOTER — Always visible, never clipped or scrolled off */}
        <div
          className="px-4 py-3.5 sm:px-6 sm:py-4 border-t shrink-0 z-10"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {wizardStep === 0 ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigateToStep(1)}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-display font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span>{isEn ? 'Create My Pass (30 sec)' : 'Собрать свой профиль за 30 секунд'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isLoadingAuth}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <LogIn className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {isLoadingAuth ? 'Вход...' : 'Быстрый вход через Google'}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigateToStep((wizardStep - 1) as 0 | 1 | 2)}
                className="px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isEn ? 'Back' : 'Назад'}</span>
              </button>

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => navigateToStep((wizardStep + 1) as 2 | 3)}
                  className="flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-display font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>
                    {wizardStep === 1
                      ? 'Далее: Выбрать вайб вечера'
                      : 'Далее: Проверить пропуск'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleFinishRegistration}
                  className="flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-display font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {isSaving ? 'Сохранение...' : 'Открыть радар встреч Kompa'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
