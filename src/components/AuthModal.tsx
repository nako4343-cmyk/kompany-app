import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants, useReducedMotion } from 'framer-motion';
import {
  X,
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
  Check,
  Flame,
  Trophy,
  Coffee,
  Ticket,
  Mail,
  Phone,
} from 'lucide-react';
import { UserProfile } from '../types/index.ts';
import {
  auth,
  signOutCloudUser,
  syncUserProfileToCloud,
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

const triggerHaptic = (pattern: number | number[] = 8) => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore on unsupported devices
  }
};

const INTEREST_CATALOG: Array<{
  tag: string;
  labelEn: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { tag: 'Настольные игры', labelEn: 'Board Games', icon: Dice5 },
  { tag: 'Рестораны / Бары', labelEn: 'Dining & Bars', icon: Utensils },
  { tag: 'Кино / Концерт', labelEn: 'Cinema & Live Music', icon: Music },
  { tag: 'День рождения', labelEn: 'Birthday Party', icon: PartyPopper },
  { tag: 'Свадьба', labelEn: 'Wedding Celebration', icon: Ticket },
  { tag: 'Квиз / Интеллект', labelEn: 'Quiz & Trivia', icon: Trophy },
  { tag: 'Спорт', labelEn: 'Active & Sports', icon: Flame },
  { tag: 'Пикник / Шашлыки', labelEn: 'Outdoor & Picnic', icon: Compass },
  { tag: 'Прогулка', labelEn: 'City Walk & Coffee', icon: Coffee },
  { tag: 'Путешествие', labelEn: 'Weekend Trips', icon: MapPin },
];

const OCCUPATION_PRESETS = [
  'Арт-директор & Дизайн',
  'IT & Продукт',
  'Предприниматель',
  'Маркетинг & Медиа',
  'Архитектура',
  'Финансы & Консалтинг',
];

const CITY_PRESETS = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'];

const VIBE_CARDS = [
  {
    id: 'gastro',
    title: 'Камерный ужин и разговор',
    desc: 'До 6 человек, авторская кухня, спокойная атмосфера',
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
    spotText: '5 из 6 за столом',
    area: 'Чистые пруды · Сегодня, 19:30',
    image: './assets/images/event_board_games_1794332913325.jpg',
  },
  {
    title: 'Камерный гастро-ужин на Патриарших',
    category: 'Ресторан / Бар',
    spotText: '4 из 6 за столом',
    area: 'Малая Бронная · Сегодня, 20:00',
    image: './assets/images/hero_community_event_1794332913246.jpg',
  },
  {
    title: 'Джазовый квартет и авторские коктейли',
    category: 'Кино / Концерт',
    spotText: '6 из 8 за столом',
    area: 'Кузнецкий Мост · Пятница, 20:30',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    scale: 0.97,
  }),
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.03,
    },
  },
};

const fadeScaleItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      mass: 0.8,
    },
  },
};

/**
 * Custom Animated Studio Brand Emblem for Kompa
 */
const KompaBrandEmblem: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => {
  const shouldReduceMotion = useReducedMotion();
  const isLg = size === 'lg';

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${
        isLg ? 'w-14 h-14 rounded-2xl' : 'w-10 h-10 rounded-xl'
      }`}
      style={{ backgroundColor: 'var(--accent-primary)' }}
    >
      {/* Subtle geometric radar ring */}
      {!shouldReduceMotion && (
        <motion.svg
          viewBox="0 0 64 64"
          className="absolute inset-0 w-full h-full pointer-events-none"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          <circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        </motion.svg>
      )}
      <motion.span
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className={`relative z-10 text-white font-display font-extrabold tracking-tight leading-none ${
          isLg ? 'text-2xl' : 'text-lg'
        }`}
      >
        K
      </motion.span>
    </div>
  );
};

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
    <rect width="240" height="240" rx="48" fill="#DE482B"/>
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Onest, Manrope, sans-serif" font-weight="800" font-size="84">${initials}</text>
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

  // Step 0 = Welcome; Step 1 = Identity & Personal Photo; Step 2 = Vibe & Interests; Step 3 = Pass Review; Step 4 = Celebratory Completion
  const [[wizardStep, direction], setStepState] = useState<[0 | 1 | 2 | 3 | 4, number]>([
    isInitialGate ? 0 : 1,
    1,
  ]);

  const navigateToStep = (nextStep: 0 | 1 | 2 | 3 | 4) => {
    triggerHaptic(8);
    setErrorMessage('');
    setStepState(([prevStep]) => [nextStep, nextStep >= prevStep ? 1 : -1]);
  };

  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [selectedVibeId, setSelectedVibeId] = useState<string>('gastro');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [name, setName] = useState(currentUser.name || '');
  const [age, setAge] = useState<number>(currentUser.age || 27);
  const [gender, setGender] = useState<'female' | 'male'>(currentUser.gender || 'female');
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [occupation, setOccupation] = useState(currentUser.occupation || '');

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

  const [email, setEmail] = useState<string>(() => {
    if (isInitialGate && currentUser.email === 'anna.voronova@example.com') {
      return '';
    }
    return currentUser.email || '';
  });

  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    if (isInitialGate && currentUser.phoneNumber === '+7 (916) 555-01-92') {
      return '';
    }
    return currentUser.phoneNumber || '';
  });

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

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validateIdentityFields = (): boolean => {
    if (name.trim().length < 2) {
      setErrorMessage(
        isEn ? 'Please enter your full name' : 'Укажите ваше имя и фамилию (минимум 2 символа)'
      );
      return false;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage(
        isEn
          ? 'Please enter a valid email address'
          : 'Для регистрации укажите корректную электронную почту (Email)'
      );
      return false;
    }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage(
        isEn
          ? 'Please enter a valid phone number'
          : 'Для регистрации укажите корректный номер телефона (не менее 10 цифр)'
      );
      return false;
    }
    return true;
  };

  const handleStepNavigation = (nextStep: 0 | 1 | 2 | 3 | 4) => {
    if (nextStep > 1) {
      if (!validateIdentityFields()) {
        triggerHaptic([12, 30, 12]);
        if (wizardStep !== 1) {
          setStepState([1, 1]);
        }
        return;
      }
    }
    navigateToStep(nextStep);
  };

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
    }, 3600);
    return () => clearInterval(timer);
  }, [wizardStep]);

  const matchedEventsCount = useMemo(() => {
    const base = 5;
    return base + interests.length * 3;
  }, [interests]);

  const matchPercent = useMemo(() => {
    return Math.min(99, 68 + interests.length * 5);
  }, [interests]);

  const userInitials = useMemo(() => {
    const parts = (name || 'Участник Kompa').trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.slice(0, 2) || 'КМ').toUpperCase();
  }, [name]);

  const toggleInterest = (tag: string) => {
    triggerHaptic(6);
    setInterests(prev => {
      if (prev.includes(tag)) {
        return prev.length > 1 ? prev.filter(x => x !== tag) : prev;
      }
      if (prev.length >= 10) return prev;
      return [...prev, tag];
    });
  };

  const handleSelectVibe = (vibe: (typeof VIBE_CARDS)[number]) => {
    triggerHaptic(10);
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
      triggerHaptic([10, 30, 10]);
      setStatusMessage(isEn ? 'Personal photo uploaded' : 'Ваша личная фотография добавлена');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Не удалось обработать фотографию');
    } finally {
      setIsUploadingPhoto(false);
    }
  };


  const handleFinishRegistration = async () => {
    if (!validateIdentityFields()) {
      setStepState([1, -1]);
      return;
    }

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
        email: email.trim().slice(0, 120) || activeFbUser?.email || 'user@kompa.app',
        isEmailVerified: true,
        isPhoneVerified: true,
        onlineStatus: 'online',
        lastSeen: isEn ? 'Online now' : 'Онлайн сейчас',
      };

      if (activeFbUser) {
        await syncUserProfileToCloud(updatedProfile);
      }

      onProfileRegistered(updatedProfile);
      triggerHaptic([15, 40, 20]);
      navigateToStep(4);
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

  const stepMeta = [
    { num: '01', label: isEn ? 'Profile' : 'Образ' },
    { num: '02', label: isEn ? 'Interests' : 'Интересы' },
    { num: '03', label: isEn ? 'Registration' : 'Регистрация' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={() => {
        if (!isInitialGate && wizardStep !== 4) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 overflow-hidden"
    >
      {/* Fixed-height dvh container on mobile with studio spring entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.85 }}
        onClick={e => e.stopPropagation()}
        className="w-full h-[100dvh] sm:h-[680px] sm:max-h-[92dvh] sm:max-w-xl sm:rounded-3xl shadow-2xl border-0 sm:border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* FIXED TOP HEADER */}
        <div
          className="px-4 py-3.5 sm:px-6 sm:py-4 border-b shrink-0 flex flex-col gap-3 z-10 pt-safe"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <KompaBrandEmblem size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-display font-extrabold text-base sm:text-lg tracking-tight truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Kompa
                  </span>
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    · {city || 'Москва'}
                  </span>
                </div>
                <p
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {wizardStep === 0
                    ? isEn
                      ? 'Private Evening Club'
                      : 'Закрытый клуб вечерних встреч'
                    : wizardStep === 4
                    ? isEn
                      ? 'Registration Completed'
                      : 'Регистрация завершена'
                    : isEn
                    ? `Step ${wizardStep} of 3`
                    : `Этап ${wizardStep} из 3 · Регистрация`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isInitialGate && wizardStep !== 4 && (
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

              {!isInitialGate && wizardStep !== 4 && (
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

          {/* Animated Interactive Step Progress Indicator */}
          {wizardStep >= 1 && wizardStep <= 3 && (
            <div className="grid grid-cols-3 gap-2">
              {stepMeta.map((s, idx) => {
                const stepNum = (idx + 1) as 1 | 2 | 3;
                const isDone = wizardStep > stepNum;
                const isCurrent = wizardStep === stepNum;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => handleStepNavigation(stepNum)}
                    className="group text-left space-y-1.5 cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span
                        style={{
                          color:
                            isCurrent || isDone
                              ? 'var(--accent-primary)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {s.num}. {s.label}
                      </span>
                      {isDone && (
                        <Check
                          className="w-3 h-3"
                          style={{ color: 'var(--accent-primary)' }}
                        />
                      )}
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full overflow-hidden relative"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      {(isDone || isCurrent) && (
                        <motion.div
                          layoutId={isCurrent ? 'active-auth-progress' : undefined}
                          initial={{ width: isDone ? '100%' : '30%' }}
                          animate={{ width: '100%' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: 'var(--accent-primary)',
                            opacity: isDone ? 0.55 : 1,
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* HORIZONTAL SLIDE VIEWPORT */}
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
                opacity: { duration: 0.2 },
                scale: { duration: 0.22 },
              }}
              className="h-full w-full overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
              style={{ backgroundColor: 'var(--bg-surface)' }}
            >
              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusMessage}</span>
                </motion.div>
              )}

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {wizardStep === 0 && (
                /* STEP 0: EMOTIONAL FIRST IMPRESSION & LIVE SHOWCASE */
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  <motion.div variants={fadeScaleItemVariants} className="space-y-2">
                    <div
                      className="text-xs font-bold tracking-tight flex items-center gap-2"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <span>Живые компании сегодня вечером</span>
                      <span aria-hidden="true">·</span>
                      <span>Без дейтинга</span>
                    </div>
                    <h1
                      className="text-xl sm:text-2xl font-display font-extrabold leading-snug tracking-tight text-balance"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isEn
                        ? 'Real plans for tonight with people on your wavelength'
                        : 'Вечер в хорошей компании — за общим столом, игрой или концертом'}
                    </h1>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {isEn
                        ? 'Register in 30 seconds. Exact venue addresses and group chats unlock only after the host approves your request.'
                        : 'Пройдите регистрацию за 30 секунд. Выбирайте проверенные компании по интересам — точный адрес и чат открываются только после одобрения организатором.'}
                    </p>
                  </motion.div>

                  {/* Live Showcase Carousel */}
                  <motion.div
                    variants={fadeScaleItemVariants}
                    className="relative h-48 sm:h-52 rounded-2xl overflow-hidden bg-neutral-900 shadow-md border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <AnimatePresence mode="wait">
                      {SHOWCASE_CARDS.map((card, idx) =>
                        idx === activeShowcaseIdx ? (
                          <motion.div
                            key={card.title}
                            initial={{ opacity: 0, scale: 0.97, x: 16 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.97, x: -16 }}
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
                                <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                  <span>{card.category}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>{card.spotText}</span>
                                </div>
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
                  </motion.div>

                  {/* Carousel Switcher & Security Promise */}
                  <motion.div
                    variants={fadeScaleItemVariants}
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
                          ? 'Exact venue revealed after host approval'
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
                              i === activeShowcaseIdx
                                ? 'var(--accent-primary)'
                                : 'var(--border-subtle)',
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* 3-Step Interactive Roadmap */}
                  <motion.div variants={fadeScaleItemVariants} className="grid grid-cols-3 gap-2.5">
                    {[
                      { num: '01', label: 'Личное фото', sub: 'Почта и телефон' },
                      { num: '02', label: 'Интересы', sub: 'Вайб вечера' },
                      { num: '03', label: 'Регистрация', sub: 'Доступ к встречам' },
                    ].map(item => (
                      <motion.button
                        type="button"
                        key={item.num}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleStepNavigation(Number(item.num) as 1 | 2 | 3)}
                        className="p-3 rounded-2xl border text-left cursor-pointer"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <span
                          className="text-xs font-mono-num font-bold block"
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
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {wizardStep === 1 && (
                /* STEP 1: PERSONAL PHOTO ONLY & INTERACTIVE IDENTITY FIELDS */
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {/* Personal Photo Upload Card */}
                  <motion.div
                    variants={fadeScaleItemVariants}
                    className="p-4 rounded-2xl border flex items-center justify-between gap-4"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: avatarUrl ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {avatarUrl ? (
                        <motion.img
                          key={avatarUrl}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          src={avatarUrl}
                          alt={name || 'Ваше фото'}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2"
                          style={{ borderColor: 'var(--accent-primary)' }}
                        />
                      ) : (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-extrabold text-xl text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          {userInitials}
                        </motion.div>
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
                          Только настоящая фотография владельца профиля
                        </span>
                      </div>
                    </div>

                    <motion.label
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
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
                    </motion.label>
                  </motion.div>


                  {/* Interactive Focus-Aware Name Input */}
                  <motion.div variants={fadeScaleItemVariants}>
                    <label
                      className="text-xs font-bold block mb-1.5 transition-colors"
                      style={{
                        color:
                          focusedField === 'name'
                            ? 'var(--accent-primary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      Ваше имя и фамилия <span style={{ color: 'var(--accent-primary)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={name}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      onChange={e => setName(e.target.value)}
                      placeholder="Например: Анна Воронова"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[15px] font-medium focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor:
                          focusedField === 'name'
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </motion.div>

                  {/* Required Email & Phone Number Inputs */}
                  <motion.div variants={fadeScaleItemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className="text-xs font-bold flex items-center gap-1.5 mb-1.5 transition-colors"
                        style={{
                          color:
                            focusedField === 'email'
                              ? 'var(--accent-primary)'
                              : 'var(--text-primary)',
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Почта (Email) *</span>
                      </label>
                      <input
                        type="email"
                        inputMode="email"
                        required
                        maxLength={120}
                        value={email}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-[15px] font-medium focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor:
                            focusedField === 'email'
                              ? 'var(--accent-primary)'
                              : 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="text-xs font-bold flex items-center gap-1.5 mb-1.5 transition-colors"
                        style={{
                          color:
                            focusedField === 'phone'
                              ? 'var(--accent-primary)'
                              : 'var(--text-primary)',
                        }}
                      >
                        <Phone className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                        <span>Номер телефона *</span>
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        maxLength={30}
                        value={phoneNumber}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        onChange={e => setPhoneNumber(e.target.value)}
                        placeholder="+7 (999) 123-45-67"
                        className="w-full px-3.5 py-2.5 rounded-xl border text-[15px] font-medium focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor:
                            focusedField === 'phone'
                              ? 'var(--accent-primary)'
                              : 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Age & Gender Segmented Controls */}
                  <motion.div variants={fadeScaleItemVariants} className="grid grid-cols-2 gap-3">
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
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setAge(prev => Math.max(18, prev - 1));
                          }}
                          className="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          −
                        </motion.button>
                        <input
                          type="number"
                          min={18}
                          max={99}
                          value={age}
                          onChange={e => setAge(Math.min(99, Math.max(18, Number(e.target.value) || 18)))}
                          className="w-12 text-center text-sm font-bold font-mono-num bg-transparent focus:outline-none"
                          style={{ color: 'var(--text-primary)' }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => {
                            triggerHaptic(6);
                            setAge(prev => Math.min(99, prev + 1));
                          }}
                          className="w-8 h-8 rounded-lg font-bold text-base flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          +
                        </motion.button>
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
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              key={opt.val}
                              type="button"
                              onClick={() => {
                                triggerHaptic(6);
                                setGender(opt.val as 'female' | 'male');
                              }}
                              className="py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              style={{
                                backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                                color: active ? '#ffffff' : 'var(--text-primary)',
                              }}
                            >
                              {opt.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  {/* City & Quick Chips */}
                  <motion.div variants={fadeScaleItemVariants}>
                    <label
                      className="text-xs font-bold block mb-1.5 transition-colors"
                      style={{
                        color:
                          focusedField === 'city'
                            ? 'var(--accent-primary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      Город
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {CITY_PRESETS.map(c => {
                        const active = city === c;
                        return (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            key={c}
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setCity(c);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            {c}
                          </motion.button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      maxLength={60}
                      value={city}
                      onFocus={() => setFocusedField('city')}
                      onBlur={() => setFocusedField(null)}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Ваш город"
                      className="w-full px-3.5 py-2 rounded-xl border text-sm font-medium focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor:
                          focusedField === 'city'
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </motion.div>

                  {/* Occupation & 1-Tap Presets */}
                  <motion.div variants={fadeScaleItemVariants}>
                    <label
                      className="text-xs font-bold block mb-1.5 transition-colors"
                      style={{
                        color:
                          focusedField === 'occupation'
                            ? 'var(--accent-primary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      Профессия / Сфера
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {OCCUPATION_PRESETS.map(occ => {
                        const active = occupation === occ;
                        return (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            key={occ}
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setOccupation(occ);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
                            style={{
                              backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                            }}
                          >
                            {occ}
                          </motion.button>
                        );
                      })}
                    </div>
                    <input
                      type="text"
                      maxLength={100}
                      value={occupation}
                      onFocus={() => setFocusedField('occupation')}
                      onBlur={() => setFocusedField(null)}
                      onChange={e => setOccupation(e.target.value)}
                      placeholder="Например: Арт-директор, Архитектор, IT"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor:
                          focusedField === 'occupation'
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}

              {wizardStep === 2 && (
                /* STEP 2: VISUALIZED INTERESTS & EVENING VIBE */
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {/* Evening Vibe Selector */}
                  <motion.div variants={fadeScaleItemVariants}>
                    <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>
                      Какой сценарий вечера вам ближе?
                    </label>
                    <p className="text-xs mb-2.5" style={{ color: 'var(--text-secondary)' }}>
                      Выберите настроение — мы подстроим рекомендации и подскажем текст о себе
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {VIBE_CARDS.map(vibe => {
                        const Icon = vibe.icon;
                        const isSelected = selectedVibeId === vibe.id;
                        return (
                          <motion.button
                            whileHover={{ scale: 1.015 }}
                            whileTap={{ scale: 0.975 }}
                            key={vibe.id}
                            type="button"
                            onClick={() => handleSelectVibe(vibe)}
                            className="p-3.5 rounded-2xl border text-left transition-colors cursor-pointer flex items-start gap-3"
                            style={{
                              backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                              borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
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
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Visualized Interest Grid with Live Match Meter */}
                  <motion.div
                    variants={fadeScaleItemVariants}
                    className="p-3.5 rounded-2xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                          Ваши темы встреч ({interests.length} выбрано)
                        </span>
                        <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                          Отметьте форматы, куда вы с удовольствием пойдёте
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className="text-xs font-mono-num font-extrabold block"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          {matchPercent}% индекс
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {matchedEventsCount} встреч рядом
                        </span>
                      </div>
                    </div>

                    {/* Animated Match Meter Bar */}
                    <div
                      className="h-1.5 w-full rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-surface)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${matchPercent}%` }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      />
                    </div>

                    {/* Visual Interest Cards */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {INTEREST_CATALOG.map(item => {
                        const Icon = item.icon;
                        const active = interests.includes(item.tag);
                        return (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            key={item.tag}
                            type="button"
                            onClick={() => toggleInterest(item.tag)}
                            className="px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between gap-2 text-left"
                            style={{
                              backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface)',
                              borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                              color: active ? '#ffffff' : 'var(--text-primary)',
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  active ? 'text-white' : 'opacity-75'
                                }`}
                              />
                              <span className="truncate">
                                {isEn ? item.labelEn : item.tag}
                              </span>
                            </div>
                            {active && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Bio Input */}
                  <motion.div variants={fadeScaleItemVariants}>
                    <label
                      className="text-xs font-bold block mb-1.5 transition-colors"
                      style={{
                        color:
                          focusedField === 'bio'
                            ? 'var(--accent-primary)'
                            : 'var(--text-primary)',
                      }}
                    >
                      Коротко о себе и планах на вечер
                    </label>
                    <textarea
                      rows={3}
                      maxLength={600}
                      value={bio}
                      onFocus={() => setFocusedField('bio')}
                      onBlur={() => setFocusedField(null)}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Люблю камерные ужины, стратегические настолки и живую музыку..."
                      className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor:
                          focusedField === 'bio'
                            ? 'var(--accent-primary)'
                            : 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </motion.div>
                </motion.div>
              )}

              {wizardStep === 3 && (
                /* STEP 3: LIVE MEMBER PASS & OPEN-TO-INVITES RADAR */
                <motion.div
                  variants={staggerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-4"
                >
                  {/* Studio Member Pass Card */}
                  <motion.div
                    variants={fadeScaleItemVariants}
                    className="p-5 rounded-3xl border space-y-4 relative overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-mono-num font-bold uppercase tracking-wider"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          ПРОФИЛЬ УЧАСТНИКА · KOMPA
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" />
                        Готов к регистрации
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={name}
                          className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2"
                          style={{ borderColor: 'var(--accent-primary)' }}
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
                          className="text-base sm:text-lg font-display font-extrabold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {name.trim() || 'Участник Kompa'}, {age}
                        </h3>
                        <p
                          className="text-xs font-medium truncate mt-0.5"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {occupation.trim() || 'Участник клуба'} · {city || 'Москва'}
                        </p>
                        <div className="text-[11px] font-medium mt-1.5" style={{ color: 'var(--accent-text)' }}>
                          {interests.slice(0, 4).join(' · ')}
                        </div>
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t text-xs"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                        <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                        <span className="truncate font-medium">{email.trim() || 'Почта не указана'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate" style={{ color: 'var(--text-secondary)' }}>
                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                        <span className="truncate font-mono-num font-medium">{phoneNumber.trim() || 'Телефон не указан'}</span>
                      </div>
                    </div>

                    {bio && (
                      <p
                        className="text-xs leading-relaxed pt-3 border-t"
                        style={{
                          color: 'var(--text-secondary)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        «{bio}»
                      </p>
                    )}
                  </motion.div>

                  {/* Open to Invites Toggle & Quick Templates */}
                  <motion.div
                    variants={fadeScaleItemVariants}
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
                            Статус «Жду приглашений сегодня вечером»
                          </span>
                          <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>
                            Организаторы смогут сами приглашать вас за стол
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={openToInvites}
                        onChange={e => {
                          triggerHaptic(8);
                          setOpenToInvites(e.target.checked);
                        }}
                        className="rounded accent-emerald-600 w-5 h-5 shrink-0"
                      />
                    </label>

                    {openToInvites && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-1.5">
                          {INVITE_NOTE_PRESETS.map((preset, idx) => (
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              key={idx}
                              type="button"
                              onClick={() => {
                                triggerHaptic(6);
                                setOpenToInvitesNote(preset);
                              }}
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
                            </motion.button>
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
                  </motion.div>
                </motion.div>
              )}

              {wizardStep === 4 && (
                /* STEP 4: CELEBRATORY PASS ACTIVATION ANIMATION */
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="h-full flex flex-col items-center justify-center text-center py-8 px-4 space-y-5"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 20, delay: 0.05 }}
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
                  </motion.div>

                  <div className="space-y-1.5 max-w-sm">
                    <span
                      className="text-xs font-mono-num font-bold uppercase tracking-wider block"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      РЕГИСТРАЦИЯ ЗАВЕРШЕНА
                    </span>
                    <h2
                      className="text-2xl font-display font-extrabold tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Добро пожаловать в клуб, {name.trim().split(' ')[0] || 'друг'}!
                    </h2>
                    <p
                      className="text-xs sm:text-sm leading-relaxed"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Для вас подобрано {matchedEventsCount} вечерних встреч в городе {city || 'Москва'}. Нажмите кнопку ниже, чтобы завершить регистрацию и перейти к встречам.
                    </p>
                  </div>

                  {/* Mini Pass Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="p-3.5 px-5 rounded-2xl border flex items-center gap-3"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {userInitials}
                      </div>
                    )}
                    <div className="text-left">
                      <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                        {name.trim() || 'Участник Kompa'}, {age}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {email.trim()} · {phoneNumber.trim()}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* FIXED BOTTOM FOOTER */}
        <div
          className="px-4 py-3.5 sm:px-6 sm:py-4 border-t shrink-0 z-10 pb-safe"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {wizardStep === 0 ? (
            <div>
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => navigateToStep(1)}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-display font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span>{isEn ? 'Registration' : 'Регистрация'}</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          ) : wizardStep === 4 ? (
            <div className="flex items-center justify-between gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => navigateToStep(3)}
                className="px-4 py-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isEn ? 'Back' : 'Назад'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  triggerHaptic([12, 30, 15]);
                  onClose();
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-display font-bold text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Complete Registration' : 'Завершить регистрацию'}</span>
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
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
              </motion.button>

              {wizardStep < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleStepNavigation((wizardStep + 1) as 2 | 3)}
                  className="flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-display font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>
                    {wizardStep === 1
                      ? 'Далее: Интересы и формат вечера'
                      : 'Далее: Проверка анкеты'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={isSaving}
                  onClick={handleFinishRegistration}
                  className="flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-display font-bold text-white shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    {isSaving ? 'Сохранение...' : 'Подтвердить анкету'}
                  </span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
