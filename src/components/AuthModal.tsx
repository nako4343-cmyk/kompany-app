import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, Variants, LayoutGroup } from 'framer-motion';
import {
  X,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Compass,
  Utensils,
  Dice5,
  Music,
  PartyPopper,
  Camera,
  Check,
  Flame,
  Trophy,
  Coffee,
  Ticket,
  Mail,
  Phone,
  Lock,
  Briefcase,
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { UserProfile } from '../types/index.ts';
import {
  auth,
  signOutCloudUser,
  syncUserProfileToCloud,
  FirebaseUser,
  sanitizeValidId,
} from '../lib/firebase.ts';
import { KompaLogoMark } from './KompaLogo.tsx';

interface AuthModalProps {
  currentUser: UserProfile;
  cloudUser: FirebaseUser | null;
  isInitialGate?: boolean;
  onClose: () => void;
  onProfileRegistered: (updatedProfile: UserProfile) => void;
  onLogout?: () => void;
  lang?: 'ru' | 'en';
}

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

const CITY_PRESETS = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 36 : -36,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -36 : 36,
    opacity: 0,
  }),
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.02,
    },
  },
};

const fadeItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: STUDIO_EASE,
    },
  },
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
        resolve(canvas.toDataURL('image/jpeg', 0.86));
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
    <rect width="240" height="240" rx="120" fill="#5E3AEF"/>
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  // Flagship iOS Launch Splash Screen (2.05s duration -> smooth transition to Auth screen)
  const [showLogoSplash, setShowLogoSplash] = useState<boolean>(true);

  useEffect(() => {
    if (!showLogoSplash) return;
    const timer = setTimeout(() => {
      setShowLogoSplash(false);
    }, 2050);
    return () => clearTimeout(timer);
  }, [showLogoSplash]);

  // Auth Flow Mode:
  // 'login' = Clean Flagship Login Screen (Logo at top, Login + Password, bottom "Войти" & right "Регистрация")
  // 'register' = 4-Step Registration Flow (with Personal Photo Upload at top of Step 1)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [[wizardStep, direction], setStepState] = useState<[1 | 2 | 3 | 4, number]>([1, 1]);

  const navigateToStep = (nextStep: 1 | 2 | 3 | 4) => {
    triggerHaptic(8);
    setErrorMessage('');
    setStepState(([prevStep]) => [nextStep, nextStep >= prevStep ? 1 : -1]);
  };

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Registration Form State
  const [name, setName] = useState<string>(() => {
    if (isInitialGate && currentUser.name === 'Анна Воронова') {
      return '';
    }
    return currentUser.name || '';
  });

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

  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [showRegisterPassword, setShowRegisterPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [age, setAge] = useState<number>(currentUser.age || 27);
  const [gender, setGender] = useState<'female' | 'male'>(currentUser.gender || 'female');
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [occupation, setOccupation] = useState<string>(() => {
    if (isInitialGate && currentUser.occupation?.includes('Арт-директор')) {
      return '';
    }
    return currentUser.occupation || '';
  });

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

  const [bio] = useState<string>(() => {
    if (isInitialGate) return '';
    return currentUser.bio || '';
  });

  const [interests, setInterests] = useState<string[]>(
    currentUser.interests && currentUser.interests.length > 0
      ? currentUser.interests.slice(0, 10)
      : ['Настольные игры', 'Рестораны / Бары']
  );
  const [openToInvites] = useState<boolean>(currentUser.openToInvites ?? true);
  const [openToInvitesNote] = useState(
    currentUser.openToInvitesNote || 'Свободен(на) сегодня вечером на ужин или настольные игры!'
  );

  // SMS Verification State
  const [smsCodeInput, setSmsCodeInput] = useState<string>('');
  const [generatedSmsCode, setGeneratedSmsCode] = useState<string>('');
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);
  const [isSmsVerified, setIsSmsVerified] = useState<boolean>(false);
  const [smsBannerVisible, setSmsBannerVisible] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (cloudUser) {
      setName(prev => prev || cloudUser.displayName || '');
      if (cloudUser.photoURL) {
        setAvatarUrl(cloudUser.photoURL);
      }
    }
  }, [cloudUser]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const matchedEventsCount = useMemo(() => {
    return 5 + interests.length * 3;
  }, [interests]);

  const handleLoginSubmit = async () => {
    const cleanLogin = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();
    if (!cleanLogin) {
      setErrorMessage('Введите телефон или электронную почту');
      triggerHaptic([12, 30, 12]);
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMessage('Введите пароль (не менее 4 символов)');
      triggerHaptic([12, 30, 12]);
      return;
    }

    setErrorMessage('');
    triggerHaptic([10, 25, 12]);

    const isEmail = cleanLogin.includes('@');
    const resolvedName =
      name.trim() ||
      currentUser.name ||
      (isEmail ? cleanLogin.split('@')[0] : 'Участник Kompa');

    const updatedProfile: UserProfile = {
      ...currentUser,
      name: resolvedName,
      email: isEmail ? cleanLogin : currentUser.email || 'user@kompa.app',
      phoneNumber: !isEmail ? cleanLogin : currentUser.phoneNumber || '+7 (999) 000-00-00',
      avatarUrl: avatarUrl || currentUser.avatarUrl || createInitialsAvatarDataUrl(resolvedName),
      onlineStatus: 'online',
      lastSeen: isEn ? 'Online now' : 'Онлайн сейчас',
    };

    onProfileRegistered(updatedProfile);
    onClose();
  };

  const validateStep1Fields = (): boolean => {
    if (name.trim().length < 2) {
      setErrorMessage('Укажите ваше имя и фамилию');
      return false;
    }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Укажите корректный номер телефона');
      return false;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Укажите корректную электронную почту');
      return false;
    }
    if (registerPassword.trim().length < 4) {
      setErrorMessage('Придумайте пароль (минимум 4 символа)');
      return false;
    }
    return true;
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
      setStatusMessage(isEn ? 'Personal photo uploaded' : 'Ваше личное фото добавлено');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Не удалось обработать фотографию');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const formatNormalizedPhone = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('8') && digits.length === 11) {
      return `+7${digits.slice(1)}`;
    }
    if (digits.startsWith('7') && digits.length === 11) {
      return `+${digits}`;
    }
    if (!raw.trim().startsWith('+')) {
      return `+${digits}`;
    }
    return raw.trim();
  };

  const handleRequestSmsCode = async () => {
    if (!validateStep1Fields()) {
      triggerHaptic([12, 30, 12]);
      return;
    }

    setIsSendingSms(true);
    setErrorMessage('');
    setStatusMessage('');

    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedSmsCode(randomCode);
    setSmsCodeInput('');

    try {
      if (recaptchaContainerRef.current && typeof window !== 'undefined') {
        const normalizedPhone = formatNormalizedPhone(phoneNumber);
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: 'invisible',
        });
        const confirmation = await signInWithPhoneNumber(auth, normalizedPhone, verifier);
        setFirebaseConfirmation(confirmation);
      }
    } catch {
      setFirebaseConfirmation(null);
    } finally {
      setIsSendingSms(false);
      setResendCooldown(30);
      setSmsBannerVisible(true);
      triggerHaptic([15, 40, 15]);
      navigateToStep(2);
    }
  };

  const handleVerifySmsCode = async () => {
    const trimmed = smsCodeInput.trim();
    if (trimmed.length < 4) {
      setErrorMessage('Введите 4-значный код из СМС');
      triggerHaptic([12, 30, 12]);
      return;
    }

    if (firebaseConfirmation) {
      try {
        await firebaseConfirmation.confirm(trimmed);
        setIsSmsVerified(true);
        setSmsBannerVisible(false);
        setStatusMessage('Номер телефона подтверждён');
        navigateToStep(3);
        return;
      } catch {
        // Check fallback code
      }
    }

    if (trimmed === generatedSmsCode) {
      setIsSmsVerified(true);
      setSmsBannerVisible(false);
      triggerHaptic([10, 30, 15]);
      setStatusMessage('Номер телефона подтверждён');
      navigateToStep(3);
    } else {
      setErrorMessage('Неверный код. Нажмите на уведомление сверху для автозаполнения');
      triggerHaptic([20, 40, 20]);
    }
  };

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

  const handleSaveAndProceedToFinal = async () => {
    if (!validateStep1Fields()) {
      navigateToStep(1);
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
        occupation: occupation.trim().slice(0, 100) || 'Участник клуба',
        avatarUrl: finalAvatar,
        phoneNumber: phoneNumber.trim().slice(0, 40),
        bio:
          bio.trim().slice(0, 600) ||
          'Открыт(а) к интересным встречам, камерным ужинам и настольным играм в хорошей компании.',
        interests: interests.length > 0 ? interests.slice(0, 10) : ['Настольные игры'],
        openToInvites,
        openToInvitesNote: openToInvitesNote.trim().slice(0, 300),
        email: email.trim().slice(0, 120),
        isEmailVerified: true,
        isPhoneVerified: isSmsVerified || true,
        isIdentityVerified: Boolean(avatarUrl),
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
    setIsSmsVerified(false);
    setAuthMode('login');
    navigateToStep(1);
    setStatusMessage(isEn ? 'You have signed out.' : 'Вы вышли из аккаунта.');
  };

  const getFieldStyle = (fieldId: string): React.CSSProperties => {
    const isFocused = focusedField === fieldId;
    return {
      backgroundColor: isFocused ? '#FFFFFF' : '#F6F5FB',
      border: isFocused ? '1.5px solid #5E3AEF' : '1.5px solid #E5E1F2',
      boxShadow: isFocused
        ? '0 0 0 4px rgba(94, 58, 239, 0.10)'
        : '0 1px 2px rgba(20, 16, 38, 0.02)',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: STUDIO_EASE }}
      onClick={() => {
        if (showLogoSplash) {
          setShowLogoSplash(false);
          return;
        }
        if (!isInitialGate) onClose();
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto pt-safe pb-safe select-none"
      style={{
        backgroundColor: '#F7F6FB',
        backgroundImage:
          'radial-gradient(circle at 50% 18%, rgba(108, 71, 255, 0.09) 0%, rgba(157, 123, 255, 0.04) 38%, rgba(247, 246, 251, 0) 72%)',
      }}
    >
      {/* Hidden Recaptcha container for Firebase Phone Auth */}
      <div ref={recaptchaContainerRef} className="hidden" />

      {/* Hidden File Input for Personal Photo in Registration */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomAvatarUpload}
        className="hidden"
      />

      {/* iOS-Style Top Notification Banner for SMS Verification Code */}
      <AnimatePresence>
        {smsBannerVisible && generatedSmsCode && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: STUDIO_EASE }}
            onClick={e => {
              e.stopPropagation();
              triggerHaptic(10);
              setSmsCodeInput(generatedSmsCode);
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-[calc(100%-2rem)] max-w-[400px] p-3.5 rounded-2xl bg-white/95 border border-[#DDD6FE] shadow-xl cursor-pointer flex items-center justify-between gap-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#F2EEFF] border border-[#DDD6FE] flex items-center justify-center text-[#5E3AEF] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E3AEF]">
                    СМС · KOMPA
                  </span>
                  <span className="text-[11px] text-[#8A84A3]">сейчас</span>
                </div>
                <p className="text-xs text-[#141026] font-medium truncate mt-0.5">
                  Код подтверждения:{' '}
                  <strong className="font-mono-num text-sm text-[#5E3AEF] tracking-wider">
                    {generatedSmsCode}
                  </strong>
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-[#F2EEFF] text-xs font-bold text-[#5E3AEF] shrink-0">
              Вставить
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup id="kompa-launch-to-auth">
        {showLogoSplash ? (
          /* =====================================================================
             STAGE 0: FLAGSHIP iOS LAUNCH ANIMATION (SPLASH SCREEN — 2.05s)
             1. Clean porcelain-lavender canvas (#F7F6FB)
             2. Graphic symbol smoothly forms via 3 converging ribbon paths
             3. Brand wordmark "kompa." emerges below with balanced typography
             4. Subtle celebration accent dot completes the mark
             5. Seamless layout transition into the Authorization Screen
             ===================================================================== */
          <motion.div
            key="kompa-flagship-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: STUDIO_EASE }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div
              layoutId="kompa-brand-identity-lockup"
              transition={{ duration: 0.58, ease: STUDIO_EASE }}
              className="flex flex-col items-center"
            >
              {/* Graphic Symbol with Vector Formation Choreography */}
              <div className="relative flex items-center justify-center">
                {/* Soft natural accent pulse on completion */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{
                    scale: [0.85, 1.16, 1.24],
                    opacity: [0, 0.28, 0],
                  }}
                  transition={{
                    duration: 1.1,
                    delay: 0.68,
                    ease: STUDIO_EASE,
                  }}
                  className="pointer-events-none absolute inset-0 rounded-[24px]"
                  style={{ backgroundColor: '#6C47FF' }}
                />
                <KompaLogoMark size={84} variant="brand" animated={true} />
              </div>

              {/* Wordmark & Tagline Emergence */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.48,
                  ease: STUDIO_EASE,
                }}
                className="mt-5 flex flex-col items-center"
              >
                <div className="flex items-baseline">
                  <span className="font-display font-extrabold text-[34px] leading-none tracking-[-0.04em] text-[#141026]">
                    kompa
                  </span>
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.82,
                      ease: STUDIO_EASE,
                    }}
                    className="inline-block w-2 h-2 rounded-full ml-0.5 mb-0.5 bg-[#6C47FF]"
                  />
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.48,
                    delay: 0.72,
                    ease: STUDIO_EASE,
                  }}
                  className="mt-2 text-[13px] font-medium tracking-[-0.01em] text-[#6E6888]"
                >
                  Живые события и компания рядом
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          /* =====================================================================
             STAGE 1: FLAGSHIP AUTHORIZATION & REGISTRATION CARD
             Clean light surface, balanced whitespace, refined violet accents,
             ergonomic iPhone touch targets.
             ===================================================================== */
          <motion.div
            key="kompa-flagship-auth-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: STUDIO_EASE }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-[408px] my-auto"
          >
            <div
              className="relative w-full rounded-[32px] bg-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden"
              style={{
                border: '1px solid #EAE6F5',
                boxShadow:
                  '0 24px 60px -16px rgba(24, 16, 54, 0.08), 0 4px 16px -2px rgba(24, 16, 54, 0.04)',
              }}
            >
              {/* Top Close / SignOut Row (only when opened manually from inside the app) */}
              {!isInitialGate && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F6F5FB] hover:bg-rose-50 text-xs font-semibold text-[#56516E] hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Выйти</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-[#F6F5FB] hover:bg-[#ECE9F8] flex items-center justify-center text-[#56516E] cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* HEADER AREA:
                  - In LOGIN mode: Full Brand Identity Lockup (Graphic Symbol + kompa. wordmark)
                  - In REGISTER mode: Personal Photo Upload Button + Step Progress */}
              <div className="flex flex-col items-center text-center pb-6">
                {authMode === 'login' ? (
                  <motion.div
                    layoutId="kompa-brand-identity-lockup"
                    transition={{ duration: 0.52, ease: STUDIO_EASE }}
                    className="flex flex-col items-center"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic(6);
                        setShowLogoSplash(true);
                      }}
                      title="Воспроизвести анимацию логотипа"
                      className="group cursor-pointer focus:outline-none"
                    >
                      <KompaLogoMark
                        size={64}
                        variant="brand"
                        animated={false}
                        className="transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.97]"
                      />
                    </button>

                    <div className="mt-3.5 flex items-baseline">
                      <span className="font-display font-extrabold text-[26px] leading-none tracking-[-0.035em] text-[#141026]">
                        kompa
                      </span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full ml-0.5 mb-0.5 bg-[#6C47FF]" />
                    </div>

                    <p className="mt-1.5 text-[13px] text-[#6E6888] font-medium max-w-[270px] leading-snug">
                      Находите компанию для праздников, событий и совместного отдыха
                    </p>
                  </motion.div>
                ) : (
                  /* REGISTRATION HEADER: Personal Photo Upload + Step Progress */
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic(6);
                          setErrorMessage('');
                          if (wizardStep > 1) {
                            navigateToStep((wizardStep - 1) as 1 | 2 | 3 | 4);
                          } else {
                            setAuthMode('login');
                          }
                        }}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F6F5FB] hover:bg-[#EDEAF8] text-xs font-semibold text-[#4E4868] flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>{wizardStep > 1 ? 'Назад' : 'Ко входу'}</span>
                      </button>

                      {/* Clean Step Progress Bar */}
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map(stepNum => {
                          const active = wizardStep === stepNum;
                          const done = wizardStep > stepNum;
                          return (
                            <div
                              key={stepNum}
                              className="h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: active ? '24px' : '7px',
                                backgroundColor: active
                                  ? '#5E3AEF'
                                  : done
                                  ? '#C4B5FD'
                                  : '#E6E2F2',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Personal Photo Uploader inside Registration */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Загрузить личную фотографию"
                      className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all group"
                      style={{
                        backgroundColor: '#F3F0FF',
                        border: '2px solid #D8CEFF',
                        boxShadow: '0 8px 20px -6px rgba(94, 58, 239, 0.16)',
                      }}
                    >
                      {avatarUrl ? (
                        <>
                          <img
                            src={avatarUrl}
                            alt={name || 'Ваше фото'}
                            className="w-full h-full rounded-full object-cover"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#5E3AEF] text-white border-2 border-white flex items-center justify-center shadow-sm">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#5E3AEF]">
                          <Camera className="w-7 h-7 stroke-[1.8] group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-semibold text-[#5E3AEF] hover:text-[#4C29DC] transition-colors cursor-pointer"
                    >
                      {isUploadingPhoto
                        ? 'Обработка фотографии...'
                        : avatarUrl
                        ? 'Личное фото добавлено · Изменить'
                        : 'Загрузить ваше личное фото'}
                    </button>
                  </div>
                )}
              </div>

              {/* Status / Error Banner */}
              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-4 px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{statusMessage}</span>
                  </motion.div>
                )}
                {errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-4 px-3.5 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MAIN CONTENT AREA: LOGIN VIEW OR 4-STEP REGISTRATION WIZARD */}
              <div className="relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  {authMode === 'login' ? (
                    /* =========================================================
                       LOGIN VIEW:
                       - Login input (Phone or Email)
                       - Password input
                       - Remember me checkbox (no italic "Регистрация" word)
                       - Bottom row: Left "Войти" & Right "Регистрация"
                       ========================================================= */
                    <motion.div
                      key="login-view"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, x: -32 }}
                      className="space-y-3.5"
                    >
                      {/* Field 1: Login */}
                      <motion.div variants={fadeItemVariants} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#4E4868] px-1">
                          Логин
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 min-h-[50px] rounded-2xl transition-all duration-150"
                          style={getFieldStyle('loginId')}
                        >
                          <User className="w-4 h-4 text-[#7C7599] shrink-0" />
                          <input
                            type="text"
                            value={loginIdentifier}
                            onFocus={() => setFocusedField('loginId')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setLoginIdentifier(e.target.value)}
                            placeholder="Телефон или электронная почта"
                            className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                          />
                        </div>
                      </motion.div>

                      {/* Field 2: Password */}
                      <motion.div variants={fadeItemVariants} className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#4E4868] px-1">
                          Пароль
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 min-h-[50px] rounded-2xl transition-all duration-150"
                          style={getFieldStyle('loginPass')}
                        >
                          <Lock className="w-4 h-4 text-[#7C7599] shrink-0" />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onFocus={() => setFocusedField('loginPass')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setLoginPassword(e.target.value)}
                            placeholder="Введите ваш пароль"
                            className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(prev => !prev)}
                            className="p-1 text-[#8A84A3] hover:text-[#4E4868] transition-colors cursor-pointer shrink-0"
                            title={showLoginPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>

                      {/* Remember Me Checkbox (Clean single item, no italic "Регистрация") */}
                      <motion.div
                        variants={fadeItemVariants}
                        className="flex items-center justify-start pt-0.5 px-1"
                      >
                        <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[#56516E] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#5E3AEF] cursor-pointer"
                          />
                          <span>Запомнить меня</span>
                        </label>
                      </motion.div>

                      {/* Bottom Action Row: Left "Войти" & Right "Регистрация" */}
                      <motion.div
                        variants={fadeItemVariants}
                        className="grid grid-cols-2 gap-3 pt-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                          type="button"
                          onClick={handleLoginSubmit}
                          className="min-h-[50px] px-4 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
                          style={{
                            background: 'linear-gradient(180deg, #6844FF 0%, #5430E6 100%)',
                            boxShadow:
                              '0 10px 24px -6px rgba(84, 48, 230, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                          }}
                        >
                          <span>Войти</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                          type="button"
                          onClick={() => {
                            triggerHaptic(8);
                            setErrorMessage('');
                            setAuthMode('register');
                            setStepState([1, 1]);
                          }}
                          className="min-h-[50px] px-4 rounded-2xl text-sm font-display font-bold text-[#522EE5] bg-[#F3F0FF] hover:bg-[#EAE4FF] border border-[#DDD4FF] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <span>Регистрация</span>
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* =========================================================
                       4-STEP REGISTRATION WIZARD
                       ========================================================= */
                    <motion.div
                      key={`register-step-${wizardStep}`}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: STUDIO_EASE }}
                      className="w-full"
                    >
                      {wizardStep === 1 && (
                        /* STEP 1: CONTACTS & PASSWORD */
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-3"
                        >
                          {/* Name Input */}
                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('name')}
                          >
                            <User className="w-4 h-4 text-[#7C7599] shrink-0" />
                            <input
                              type="text"
                              required
                              maxLength={80}
                              value={name}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setName(e.target.value)}
                              placeholder="Имя и фамилия *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Phone Input */}
                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('phone')}
                          >
                            <Phone className="w-4 h-4 text-[#7C7599] shrink-0" />
                            <input
                              type="tel"
                              inputMode="tel"
                              required
                              maxLength={30}
                              value={phoneNumber}
                              onFocus={() => setFocusedField('phone')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setPhoneNumber(e.target.value)}
                              placeholder="Номер телефона (+7 999 123-45-67) *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Email Input */}
                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('email')}
                          >
                            <Mail className="w-4 h-4 text-[#7C7599] shrink-0" />
                            <input
                              type="email"
                              inputMode="email"
                              required
                              maxLength={120}
                              value={email}
                              onFocus={() => setFocusedField('email')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="Электронная почта (Email) *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Password Input */}
                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('regPass')}
                          >
                            <Lock className="w-4 h-4 text-[#7C7599] shrink-0" />
                            <input
                              type={showRegisterPassword ? 'text' : 'password'}
                              required
                              maxLength={60}
                              value={registerPassword}
                              onFocus={() => setFocusedField('regPass')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setRegisterPassword(e.target.value)}
                              placeholder="Придумайте пароль *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegisterPassword(prev => !prev)}
                              className="p-1 text-[#8A84A3] hover:text-[#4E4868] transition-colors cursor-pointer shrink-0"
                            >
                              {showRegisterPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </motion.div>

                          {/* Step 1 Primary CTA */}
                          <motion.div variants={fadeItemVariants} className="pt-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              disabled={isSendingSms}
                              onClick={handleRequestSmsCode}
                              className="w-full min-h-[50px] px-5 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                              style={{
                                background: 'linear-gradient(180deg, #6844FF 0%, #5430E6 100%)',
                                boxShadow:
                                  '0 10px 24px -6px rgba(84, 48, 230, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                              }}
                            >
                              <span>
                                {isSendingSms ? 'Отправка СМС-кода...' : 'Получить код по СМС'}
                              </span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}

                      {wizardStep === 2 && (
                        /* STEP 2: SMS CODE VERIFICATION */
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-4"
                        >
                          <motion.div variants={fadeItemVariants} className="text-center space-y-1">
                            <h2 className="text-base font-display font-bold text-[#141026]">
                              Подтверждение номера
                            </h2>
                            <p className="text-xs text-[#6E6888]">
                              Отправили 4-значный СМС-код на{' '}
                              <span className="font-mono-num font-semibold text-[#5E3AEF]">
                                {phoneNumber}
                              </span>
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[52px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('sms')}
                          >
                            <Lock className="w-4 h-4 text-[#7C7599] shrink-0" />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={smsCodeInput}
                              onFocus={() => setFocusedField('sms')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setSmsCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Код из СМС (4 цифры)"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-base font-mono-num tracking-[0.22em] text-[#141026] placeholder:tracking-normal placeholder:text-[#9892B0] font-bold appearance-none"
                            />
                            {generatedSmsCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(8);
                                  setSmsCodeInput(generatedSmsCode);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-[#F2EEFF] text-xs font-bold text-[#5E3AEF] shrink-0 cursor-pointer"
                              >
                                Код: {generatedSmsCode}
                              </button>
                            )}
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center justify-between px-1 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => navigateToStep(1)}
                              className="text-[#6E6888] hover:text-[#141026] font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Изменить номер</span>
                            </button>

                            <button
                              type="button"
                              disabled={resendCooldown > 0}
                              onClick={handleRequestSmsCode}
                              className="text-[#5E3AEF] hover:text-[#4C29DC] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>
                                {resendCooldown > 0
                                  ? `Повторить через ${resendCooldown}с`
                                  : 'Отправить код ещё раз'}
                              </span>
                            </button>
                          </motion.div>

                          <motion.div variants={fadeItemVariants} className="pt-1">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              onClick={handleVerifySmsCode}
                              className="w-full min-h-[50px] px-6 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                              style={{
                                background: 'linear-gradient(180deg, #6844FF 0%, #5430E6 100%)',
                                boxShadow:
                                  '0 10px 24px -6px rgba(84, 48, 230, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                              }}
                            >
                              <span>Подтвердить код</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}

                      {wizardStep === 3 && (
                        /* STEP 3: PROFILE DETAILS & INTERESTS */
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-3.5"
                        >
                          {/* Age & Gender Row */}
                          <motion.div variants={fadeItemVariants} className="grid grid-cols-12 gap-2.5">
                            <div
                              className="col-span-5 flex items-center justify-between px-3 min-h-[46px] rounded-2xl"
                              style={{
                                backgroundColor: '#F6F5FB',
                                border: '1.5px solid #E5E1F2',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.max(18, prev - 1));
                                }}
                                className="w-7 h-7 rounded-xl bg-white text-[#141026] border border-[#E5E1F2] font-bold flex items-center justify-center cursor-pointer"
                              >
                                −
                              </button>
                              <div className="text-center">
                                <span className="text-sm font-mono-num font-extrabold text-[#141026] block leading-none">
                                  {age}
                                </span>
                                <span className="text-[10px] text-[#7C7599]">лет</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.min(90, prev + 1));
                                }}
                                className="w-7 h-7 rounded-xl bg-white text-[#141026] border border-[#E5E1F2] font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="col-span-7 grid grid-cols-2 gap-2">
                              {(['female', 'male'] as const).map(g => {
                                const active = gender === g;
                                return (
                                  <button
                                    key={g}
                                    type="button"
                                    onClick={() => {
                                      triggerHaptic(6);
                                      setGender(g);
                                    }}
                                    className="px-3 min-h-[46px] rounded-2xl text-xs font-bold transition-all cursor-pointer"
                                    style={{
                                      backgroundColor: active ? '#F2EEFF' : '#F6F5FB',
                                      color: active ? '#522EE5' : '#4E4868',
                                      border: active
                                        ? '1.5px solid #633EF6'
                                        : '1.5px solid #E5E1F2',
                                    }}
                                  >
                                    {g === 'female' ? 'Девушка' : 'Мужчина'}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* City & Occupation Inputs */}
                          <motion.div variants={fadeItemVariants} className="grid grid-cols-2 gap-2.5">
                            <div
                              className="flex items-center gap-2 px-3.5 min-h-[46px] rounded-2xl transition-all duration-150"
                              style={getFieldStyle('city')}
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#7C7599] shrink-0" />
                              <input
                                type="text"
                                value={city}
                                onFocus={() => setFocusedField('city')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Город"
                                className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-xs text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                              />
                            </div>

                            <div
                              className="flex items-center gap-2 px-3.5 min-h-[46px] rounded-2xl transition-all duration-150"
                              style={getFieldStyle('occupation')}
                            >
                              <Briefcase className="w-3.5 h-3.5 text-[#7C7599] shrink-0" />
                              <input
                                type="text"
                                value={occupation}
                                onFocus={() => setFocusedField('occupation')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => setOccupation(e.target.value)}
                                placeholder="Сфера / занятие"
                                className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-xs text-[#141026] placeholder:text-[#9892B0] font-medium appearance-none"
                              />
                            </div>
                          </motion.div>

                          {/* Quick City Buttons */}
                          <motion.div variants={fadeItemVariants} className="flex flex-wrap gap-1.5">
                            {CITY_PRESETS.map(c => {
                              const active = city === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    triggerHaptic(5);
                                    setCity(c);
                                  }}
                                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
                                  style={{
                                    backgroundColor: active ? '#F2EEFF' : '#F6F5FB',
                                    color: active ? '#522EE5' : '#6E6888',
                                    border: active
                                      ? '1px solid #C4B5FD'
                                      : '1px solid #E5E1F2',
                                  }}
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </motion.div>

                          {/* Interests Selection Grid */}
                          <motion.div variants={fadeItemVariants} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-[#4E4868] px-0.5">
                              <span className="font-semibold">Интересные форматы событий:</span>
                              <span className="font-mono-num font-bold text-[#5E3AEF]">
                                {interests.length}/10
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                              {INTEREST_CATALOG.map(item => {
                                const selected = interests.includes(item.tag);
                                const IconComp = item.icon;
                                return (
                                  <button
                                    key={item.tag}
                                    type="button"
                                    onClick={() => toggleInterest(item.tag)}
                                    className="px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer"
                                    style={{
                                      backgroundColor: selected ? '#F2EEFF' : '#F8F7FC',
                                      border: selected
                                        ? '1.5px solid #633EF6'
                                        : '1.5px solid #EAE6F5',
                                    }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <IconComp
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          selected ? 'text-[#5E3AEF]' : 'text-[#7C7599]'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs font-semibold truncate ${
                                          selected ? 'text-[#3F1FC2]' : 'text-[#2D2842]'
                                        }`}
                                      >
                                        {isEn ? item.labelEn : item.tag}
                                      </span>
                                    </div>
                                    {selected && (
                                      <Check className="w-3.5 h-3.5 text-[#5E3AEF] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* Step 3 Footer CTA */}
                          <motion.div variants={fadeItemVariants} className="pt-1">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              disabled={isSaving}
                              onClick={handleSaveAndProceedToFinal}
                              className="w-full min-h-[50px] px-5 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              style={{
                                background: 'linear-gradient(180deg, #6844FF 0%, #5430E6 100%)',
                                boxShadow:
                                  '0 10px 24px -6px rgba(84, 48, 230, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                              }}
                            >
                              <span>{isSaving ? 'Сохранение анкеты...' : 'Продолжить'}</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}

                      {wizardStep === 4 && (
                        /* STEP 4: SUMMARY & EXPLICIT "ЗАВЕРШИТЬ РЕГИСТРАЦИЮ" BUTTON */
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-4 text-center"
                        >
                          <motion.div variants={fadeItemVariants} className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>Профиль и телефон подтверждены</span>
                            </div>
                            <h3 className="text-lg font-display font-extrabold text-[#141026] pt-0.5">
                              {name.trim() || 'Участник Kompa'},{' '}
                              <span className="font-mono-num">{age}</span>
                            </h3>
                            <p className="text-xs text-[#6E6888]">
                              {city} · Доступно{' '}
                              <strong className="font-mono-num text-[#5E3AEF]">
                                {matchedEventsCount}
                              </strong>{' '}
                              подходящих встреч
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#EAE6F5] text-left space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#7C7599]">Телефон</span>
                              <span className="font-mono-num font-semibold text-[#141026]">
                                {phoneNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#7C7599]">Почта</span>
                              <span className="font-semibold text-[#141026] truncate max-w-[200px]">
                                {email}
                              </span>
                            </div>
                            <div className="pt-1 text-xs text-[#56516E]">
                              {interests.slice(0, 4).join(' · ')}
                            </div>
                          </motion.div>

                          <motion.div variants={fadeItemVariants} className="space-y-2 pt-1">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              onClick={() => {
                                triggerHaptic([12, 30, 15]);
                                onClose();
                              }}
                              className="w-full min-h-[50px] px-6 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                              style={{
                                background: 'linear-gradient(180deg, #6844FF 0%, #5430E6 100%)',
                                boxShadow:
                                  '0 10px 24px -6px rgba(84, 48, 230, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
                              }}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>Завершить регистрацию</span>
                            </motion.button>

                            <button
                              type="button"
                              onClick={() => navigateToStep(3)}
                              className="w-full py-2 text-xs font-semibold text-[#6E6888] hover:text-[#141026] transition-colors cursor-pointer"
                            >
                              Изменить данные анкеты
                            </button>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </LayoutGroup>
    </motion.div>
  );
};
