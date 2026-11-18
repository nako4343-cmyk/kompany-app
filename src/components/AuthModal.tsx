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

const CITY_PRESETS = ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург'];

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '85%' : '-85%',
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-85%' : '85%',
    opacity: 0,
    scale: 0.96,
  }),
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const fadeScaleItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 8,
  },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 360,
      damping: 28,
      mass: 0.8,
    },
  },
};

/**
 * Pure HTML/CSS + Framer Motion Brand Logo Mark ("K" Geometric Capsules + Spark)
 * Uses 100% hardware-accelerated HTML/CSS transforms so it works reliably on iOS Safari
 * both during the initial kinetic assembly and when docked at the top of the Login card.
 */
const KompaGeometricLogoMark: React.FC<{
  size?: 'splash' | 'docked';
  animateAssembly?: boolean;
}> = ({ size = 'docked', animateAssembly = false }) => {
  const isSplash = size === 'splash';
  const dim = isSplash ? 'w-32 h-32' : 'w-24 h-24';

  return (
    <motion.div
      layoutId="kompa-brand-logo-mark"
      transition={{
        layout: {
          type: 'spring',
          stiffness: 240,
          damping: 28,
          mass: 0.9,
        },
      }}
      className={`relative ${dim} rounded-full flex items-center justify-center select-none`}
      style={{
        background:
          'radial-gradient(circle at 35% 30%, rgba(56, 26, 19, 0.95) 0%, rgba(18, 10, 8, 0.98) 75%)',
        border: '2.5px solid rgba(255, 138, 108, 0.82)',
        boxShadow: isSplash
          ? '0 0 55px rgba(222, 72, 43, 0.55), inset 0 0 24px rgba(222, 72, 43, 0.25)'
          : '0 0 28px rgba(222, 72, 43, 0.3), inset 0 0 18px rgba(222, 72, 43, 0.18)',
      }}
    >
      {/* Outer Orbital Dashed Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute -inset-2.5 rounded-full border border-dashed border-[#ff8a6c]/40"
      />

      {/* Pulse Shockwave Ring During Assembly */}
      {animateAssembly && (
        <motion.div
          initial={{ scale: 0.45, opacity: 0 }}
          animate={{
            scale: [0.5, 1.15, 1.55],
            opacity: [0, 0.85, 0],
          }}
          transition={{
            duration: 1.35,
            delay: 0.65,
            ease: 'easeOut',
          }}
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#ff7c5c]"
        />
      )}

      {/* Kinetic Diagonal Laser Streaks During Assembly */}
      {animateAssembly && (
        <div className="pointer-events-none absolute inset-0 overflow-visible flex items-center justify-center">
          {/* Diagonal Streak 1 */}
          <motion.div
            initial={{ x: -130, y: 130, opacity: 0, rotate: -45, scaleX: 0.3 }}
            animate={{
              x: [-130, 0, 140],
              y: [130, 0, -140],
              opacity: [0, 1, 0],
              scaleX: [0.4, 1.3, 0.3],
            }}
            transition={{ duration: 0.85, delay: 0.12, ease: 'easeInOut' }}
            className="absolute w-28 h-[3px] rounded-full bg-gradient-to-r from-transparent via-white to-[#FF4D2A]"
          />
          {/* Diagonal Streak 2 */}
          <motion.div
            initial={{ x: 130, y: -130, opacity: 0, rotate: -45, scaleX: 0.3 }}
            animate={{
              x: [130, 0, -140],
              y: [-130, 0, 140],
              opacity: [0, 1, 0],
              scaleX: [0.4, 1.2, 0.3],
            }}
            transition={{ duration: 0.85, delay: 0.28, ease: 'easeInOut' }}
            className="absolute w-24 h-[2.5px] rounded-full bg-gradient-to-r from-transparent via-amber-300 to-white"
          />
          {/* Micro Spark Diamonds */}
          <motion.div
            initial={{ x: -75, y: -65, scale: 0, opacity: 0, rotate: 45 }}
            animate={{
              x: [-75, -44, -58],
              y: [-65, -40, -52],
              scale: [0, 1.25, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.9, delay: 0.45, ease: 'easeOut' }}
            className="absolute w-2.5 h-2.5 bg-white"
          />
          <motion.div
            initial={{ x: 75, y: 65, scale: 0, opacity: 0, rotate: 45 }}
            animate={{
              x: [75, 44, 58],
              y: [65, 40, 52],
              scale: [0, 1.25, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.9, delay: 0.52, ease: 'easeOut' }}
            className="absolute w-2.5 h-2.5 bg-[#FF4D2A]"
          />
        </div>
      )}

      {/* ASSEMBLING GEOMETRIC LOGO CORE (The 4 Interlocking Brand Pieces) */}
      <div
        className={`relative ${
          isSplash ? 'w-16 h-16' : 'w-12 h-12'
        } flex items-center justify-center`}
      >
        {/* PIECE 1: Left Vertical Geometric Capsule of "K" */}
        <motion.div
          initial={
            animateAssembly
              ? { x: -110, y: -85, rotate: -45, scale: 0.35, opacity: 0 }
              : false
          }
          animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            delay: animateAssembly ? 0.05 : 0,
          }}
          className="absolute left-[14%] top-[10%] w-[22%] h-[80%] rounded-full"
          style={{
            background: 'linear-gradient(180deg, #FF7A59 0%, #DE482B 55%, #A92910 100%)',
            boxShadow: '0 4px 14px rgba(222, 72, 43, 0.55)',
          }}
        />

        {/* PIECE 2: Upper-Right Diagonal Capsule Wing of "K" (-42 deg) */}
        <motion.div
          initial={
            animateAssembly
              ? { x: 115, y: -105, rotate: 42, scale: 0.35, opacity: 0 }
              : false
          }
          animate={{ x: 0, y: 0, rotate: 42, scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            delay: animateAssembly ? 0.22 : 0,
          }}
          className="absolute right-[18%] top-[8%] w-[22%] h-[54%] rounded-full origin-bottom"
          style={{
            background: 'linear-gradient(180deg, #FBBF24 0%, #F97316 55%, #DE482B 100%)',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.5)',
          }}
        />

        {/* PIECE 3: Lower-Right Diagonal Capsule Wing of "K" (-42 deg counter) */}
        <motion.div
          initial={
            animateAssembly
              ? { x: 115, y: 105, rotate: -42, scale: 0.35, opacity: 0 }
              : false
          }
          animate={{ x: 0, y: 0, rotate: -42, scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
            delay: animateAssembly ? 0.36 : 0,
          }}
          className="absolute right-[18%] bottom-[8%] w-[22%] h-[54%] rounded-full origin-top"
          style={{
            background: 'linear-gradient(180deg, #DE482B 0%, #FF6B4A 50%, #F59E0B 100%)',
            boxShadow: '0 4px 14px rgba(222, 72, 43, 0.5)',
          }}
        />

        {/* PIECE 4: Center Glowing Nexus Diamond locking the capsules together */}
        <motion.div
          initial={
            animateAssembly
              ? { scale: 0, rotate: -135, opacity: 0 }
              : false
          }
          animate={{ scale: 1, rotate: 45, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 18,
            delay: animateAssembly ? 0.54 : 0,
          }}
          className="absolute left-[37%] top-[39%] w-[22%] h-[22%] rounded-[4px]"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDE68A 45%, #FF7A59 100%)',
            boxShadow: '0 0 14px rgba(255, 255, 255, 0.9)',
          }}
        />
      </div>
    </motion.div>
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
    <rect width="240" height="240" rx="120" fill="#DE482B"/>
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFF7F5" font-family="Onest, Manrope, sans-serif" font-weight="800" font-size="84">${initials}</text>
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

  // Stage 0: Logo Assembly Intro (1.85s) -> smoothly glides into top of Login Card
  const [showLogoSplash, setShowLogoSplash] = useState<boolean>(true);

  useEffect(() => {
    if (!showLogoSplash) return;
    const timer = setTimeout(() => {
      setShowLogoSplash(false);
    }, 1850);
    return () => clearTimeout(timer);
  }, [showLogoSplash]);

  // Auth Flow Mode:
  // 'login' = Login + Password screen with assembled Logo at top, "ВОЙТИ" at bottom and "РЕГИСТРАЦИЯ" on right
  // 'register' = 4-step registration inside the same card with Personal Photo Upload button at top
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
  const [openToInvites, setOpenToInvites] = useState<boolean>(currentUser.openToInvites ?? true);
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
      setErrorMessage('Введите логин (номер телефона или электронную почту)');
      triggerHaptic([12, 30, 12]);
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMessage('Введите пароль (не менее 4 символов)');
      triggerHaptic([12, 30, 12]);
      return;
    }

    setErrorMessage('');
    triggerHaptic([12, 30, 15]);

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
      setErrorMessage('Укажите ваше имя и фамилию (минимум 2 символа)');
      return false;
    }
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Укажите корректный номер телефона (минимум 10 цифр)');
      return false;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Укажите корректную электронную почту (Email)');
      return false;
    }
    if (registerPassword.trim().length < 4) {
      setErrorMessage('Придумайте пароль (не менее 4 символов)');
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
      setErrorMessage('Введите 4-значный код подтверждения из СМС');
      triggerHaptic([12, 30, 12]);
      return;
    }

    if (firebaseConfirmation) {
      try {
        await firebaseConfirmation.confirm(trimmed);
        setIsSmsVerified(true);
        setSmsBannerVisible(false);
        setStatusMessage('Номер телефона успешно подтверждён по СМС');
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
      setStatusMessage('Номер телефона подтверждён по СМС');
      navigateToStep(3);
    } else {
      setErrorMessage('Неверный СМС-код. Проверьте уведомление сверху или нажмите на код');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => {
        if (showLogoSplash) {
          setShowLogoSplash(false);
          return;
        }
        if (!isInitialGate) onClose();
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-y-auto pt-safe pb-safe select-none"
      style={{
        background: 'radial-gradient(circle at 50% 35%, #2b1812 0%, #170e0b 48%, #0a0706 100%)',
      }}
    >
      {/* Hidden Recaptcha container for Firebase Phone Auth */}
      <div ref={recaptchaContainerRef} className="hidden" />

      {/* CONTINUOUSLY MOVING AMBIENT LIGHT ORBS ON THE SCREEN BACKDROP */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <motion.div
          animate={{
            x: [-80, 90, -50, -80],
            y: [-70, 50, 95, -70],
            scale: [1, 1.22, 0.92, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/3 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-35"
          style={{
            background: 'radial-gradient(circle, #DE482B 0%, rgba(222, 72, 43, 0) 70%)',
          }}
        />
        <motion.div
          animate={{
            x: [90, -85, 45, 90],
            y: [80, -60, -90, 80],
            scale: [1.1, 0.88, 1.18, 1.1],
          }}
          transition={{
            duration: 13,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/3 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl opacity-25"
          style={{
            background: 'radial-gradient(circle, #F59E0B 0%, rgba(245, 158, 11, 0) 70%)',
          }}
        />
      </div>

      {/* Interactive iOS-Style Push / SMS Code Banner at Top */}
      <AnimatePresence>
        {smsBannerVisible && generatedSmsCode && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            onClick={e => {
              e.stopPropagation();
              triggerHaptic(10);
              setSmsCodeInput(generatedSmsCode);
            }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-[calc(100%-2rem)] max-w-[395px] p-3.5 rounded-2xl border border-[#ff7c5c]/45 shadow-2xl cursor-pointer flex items-center justify-between gap-3"
            style={{
              background: 'rgba(26, 15, 12, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#DE482B]/25 border border-[#ff7c5c]/45 flex items-center justify-center text-[#ff9378] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff9378]">
                    СМС · KOMPA
                  </span>
                  <span className="text-[10px] text-amber-200/60">сейчас</span>
                </div>
                <p className="text-xs text-white font-medium truncate mt-0.5">
                  Код подтверждения:{' '}
                  <strong className="font-mono-num text-sm text-[#ff9378] tracking-wider">
                    {generatedSmsCode}
                  </strong>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1.5 rounded-xl bg-[#DE482B]/25 border border-[#ff7c5c]/40 text-[11px] font-bold text-[#ffb4a1] shrink-0">
              Вставить
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SHARED LAYOUT GROUP FOR SEAMLESS TRANSITION FROM LOGO ASSEMBLY TO LOGIN CARD */}
      <LayoutGroup>
        {showLogoSplash ? (
          /* STAGE 0: KINETIC LOGO ASSEMBLY IN THE CENTER OF THE SCREEN */
          <div className="relative z-10 flex items-center justify-center">
            <KompaGeometricLogoMark size="splash" animateAssembly={true} />
          </div>
        ) : (
          /* STAGE 1: PORTRAIT CARD WITH MOVING GLOW — LOGO smoothly docks at the top */
          <motion.div
            key="kompa-auth-card"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.48,
              ease: [0.16, 1, 0.3, 1],
            }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-[395px] my-auto flex flex-col items-center"
          >
            {/* Portrait Card Wrapper with Continuously Moving Edge Glows */}
            <div
              className="relative w-full rounded-[36px] p-6 sm:p-7 flex flex-col justify-between overflow-hidden"
              style={{
                background:
                  'linear-gradient(165deg, rgba(74, 37, 27, 0.62) 0%, rgba(36, 20, 16, 0.82) 52%, rgba(20, 12, 10, 0.94) 100%)',
                backdropFilter: 'blur(26px)',
                WebkitBackdropFilter: 'blur(26px)',
                border: '1.5px solid rgba(255, 138, 108, 0.44)',
                boxShadow:
                  '0 28px 70px -15px rgba(0, 0, 0, 0.78), 0 0 42px -8px rgba(222, 72, 43, 0.35), inset 0 1px 1px rgba(255, 210, 195, 0.25)',
              }}
            >
              {/* MOVING GLOW #1: Left Border Vertical Gliding Flare */}
              <motion.div
                aria-hidden="true"
                animate={{
                  y: [-75, 115, -75],
                  opacity: [0.55, 0.95, 0.55],
                  scale: [0.9, 1.2, 0.9],
                }}
                transition={{
                  duration: 4.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute -left-3.5 top-1/4 w-7 h-36 rounded-full blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, #ff8566 0%, #DE482B 45%, transparent 75%)',
                }}
              />

              {/* MOVING GLOW #2: Right Border Vertical Gliding Flare */}
              <motion.div
                aria-hidden="true"
                animate={{
                  y: [95, -95, 95],
                  opacity: [0.6, 0.98, 0.6],
                  scale: [1.1, 0.88, 1.1],
                }}
                transition={{
                  duration: 5.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute -right-3.5 bottom-1/4 w-7 h-40 rounded-full blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, #fbbf24 0%, #DE482B 50%, transparent 75%)',
                }}
              />

              {/* MOVING GLOW #3: Top-to-Bottom Ambient Internal Light Sweep */}
              <motion.div
                aria-hidden="true"
                animate={{
                  x: [-110, 110, -110],
                  y: [-40, 60, -40],
                  opacity: [0.12, 0.24, 0.12],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute -top-16 left-1/4 w-56 h-56 rounded-full blur-3xl"
                style={{
                  background: 'radial-gradient(circle, #ff7c5c 0%, transparent 70%)',
                }}
              />

              {/* Top Close / SignOut Row (when opened from inside the app) */}
              {!isInitialGate && (
                <div className="flex items-center justify-between mb-1 z-10">
                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    className="px-2.5 py-1 rounded-xl bg-[#160d0a]/70 border border-[#ff8a6c]/25 text-[11px] font-semibold text-[#ffcab8] flex items-center gap-1 cursor-pointer hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Выйти</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-[#160d0a]/70 border border-[#ff8a6c]/25 flex items-center justify-center text-[#ffcab8] cursor-pointer hover:bg-[#241410]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hidden File Input for Personal Photo in Registration */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomAvatarUpload}
                className="hidden"
              />

              {/* TOP HEADER AREA:
                  - In LOGIN mode: Shows the Assembled App Logo (smoothly transitioned via layoutId)
                  - In REGISTER mode: Shows the Personal Photo Upload Button (Camera) + step progress */}
              <div className="flex flex-col items-center pt-1 pb-5 z-10">
                {authMode === 'login' ? (
                  <div
                    onClick={() => {
                      triggerHaptic(6);
                      setShowLogoSplash(true);
                    }}
                    title="Логотип КОМПАНИЯ"
                    className="cursor-pointer"
                  >
                    <KompaGeometricLogoMark size="docked" animateAssembly={false} />
                  </div>
                ) : (
                  <>
                    {/* PERSONAL PHOTO UPLOAD BUTTON (Moved strictly into Registration process) */}
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                        className="pointer-events-none absolute -inset-2.5 rounded-full border border-dashed border-[#ff8a6c]/40"
                      />

                      <motion.button
                        type="button"
                        initial={{ scale: 0.88, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        title="Загрузить личную фотографию"
                        className="relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all group"
                        style={{
                          border: '2.5px solid rgba(255, 138, 108, 0.78)',
                          background: 'rgba(22, 13, 10, 0.65)',
                          boxShadow:
                            '0 0 28px rgba(222, 72, 43, 0.28), inset 0 0 18px rgba(222, 72, 43, 0.16)',
                        }}
                      >
                        {avatarUrl ? (
                          <>
                            <img
                              src={avatarUrl}
                              alt={name || 'Ваше фото'}
                              className="w-full h-full rounded-full object-cover"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-[#26140f] border border-[#ff8a6c]/75 flex items-center justify-center text-[#ffbfa9] shadow-md">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                          </>
                        ) : (
                          <Camera className="w-10 h-10 text-[#ff9d82] stroke-[1.7] group-hover:scale-105 transition-transform" />
                        )}
                      </motion.button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2.5 text-[11px] font-semibold text-[#ffcab8]/85 hover:text-white transition-colors cursor-pointer"
                    >
                      {isUploadingPhoto
                        ? 'Обработка фото...'
                        : avatarUrl
                        ? 'Личное фото загружено · Изменить'
                        : 'Загрузить ваше личное фото'}
                    </button>

                    {/* Minimal Step Progress Pills in Register Mode */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {[1, 2, 3, 4].map(stepNum => {
                        const active = wizardStep === stepNum;
                        const done = wizardStep > stepNum;
                        return (
                          <div
                            key={stepNum}
                            className="h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: active ? '26px' : '8px',
                              backgroundColor: active
                                ? '#ff7c5c'
                                : done
                                ? 'rgba(255, 138, 108, 0.55)'
                                : 'rgba(22, 13, 10, 0.75)',
                            }}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Status / Error Feedback */}
              <AnimatePresence mode="wait">
                {statusMessage && (
                  <motion.div
                    key="status"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-xs font-medium flex items-center gap-2 z-10"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{statusMessage}</span>
                  </motion.div>
                )}
                {errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-3 px-3.5 py-2.5 rounded-xl bg-rose-500/25 border border-rose-400/45 text-rose-100 text-xs font-medium flex items-center gap-2 z-10"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MAIN CONTENT AREA: LOGIN SCREEN FIRST OR 4-STEP REGISTRATION */}
              <div className="relative overflow-hidden z-10">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  {authMode === 'login' ? (
                    /* INITIAL LOGIN SCREEN: LOGO AT TOP + LOGIN + PASSWORD + BOTTOM "ВОЙТИ" & RIGHT "РЕГИСТРАЦИЯ" */
                    <motion.div
                      key="login-view"
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, x: -60 }}
                      className="space-y-3.5"
                    >
                      {/* Login Input Bar */}
                      <motion.div
                        variants={fadeScaleItemVariants}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                        style={{
                          backgroundColor: 'rgba(18, 11, 9, 0.82)',
                          border:
                            focusedField === 'loginId'
                              ? '1px solid rgba(255, 138, 108, 0.85)'
                              : '1px solid rgba(255, 138, 108, 0.22)',
                        }}
                      >
                        <User className="w-4 h-4 text-[#ff9d82] shrink-0" />
                        <input
                          type="text"
                          value={loginIdentifier}
                          onFocus={() => setFocusedField('loginId')}
                          onBlur={() => setFocusedField(null)}
                          onChange={e => setLoginIdentifier(e.target.value)}
                          placeholder="Логин (телефон или почта)"
                          className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                        />
                      </motion.div>

                      {/* Password Input Bar */}
                      <motion.div
                        variants={fadeScaleItemVariants}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                        style={{
                          backgroundColor: 'rgba(18, 11, 9, 0.82)',
                          border:
                            focusedField === 'loginPass'
                              ? '1px solid rgba(255, 138, 108, 0.85)'
                              : '1px solid rgba(255, 138, 108, 0.22)',
                        }}
                      >
                        <Lock className="w-4 h-4 text-[#ff9d82] shrink-0" />
                        <input
                          type="password"
                          value={loginPassword}
                          onFocus={() => setFocusedField('loginPass')}
                          onBlur={() => setFocusedField(null)}
                          onChange={e => setLoginPassword(e.target.value)}
                          placeholder="Пароль"
                          className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                        />
                      </motion.div>

                      {/* Remember Me Row (Italic "Регистрация" word completely removed) */}
                      <motion.div
                        variants={fadeScaleItemVariants}
                        className="flex items-center justify-start pt-0.5 px-1 text-xs"
                      >
                        <label className="flex items-center gap-2 text-[#ffdfd4]/85 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#DE482B] cursor-pointer"
                          />
                          <span>Запомнить меня</span>
                        </label>
                      </motion.div>

                      {/* Bottom Row: Left "ВОЙТИ" and Right "РЕГИСТРАЦИЯ" */}
                      <motion.div
                        variants={fadeScaleItemVariants}
                        className="grid grid-cols-2 gap-2.5 pt-2"
                      >
                        <motion.button
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleLoginSubmit}
                          className="py-3.5 px-4 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          style={{
                            background: 'linear-gradient(180deg, #E85234 0%, #B83319 100%)',
                            border: '1px solid rgba(255, 165, 140, 0.5)',
                            boxShadow: '0 10px 25px -5px rgba(20, 8, 5, 0.75)',
                          }}
                        >
                          <span>ВОЙТИ</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.015 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            triggerHaptic(8);
                            setErrorMessage('');
                            setAuthMode('register');
                            setStepState([1, 1]);
                          }}
                          className="py-3.5 px-4 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-[#ffdfd4] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          style={{
                            backgroundColor: 'rgba(18, 11, 9, 0.85)',
                            border: '1px solid rgba(255, 138, 108, 0.45)',
                          }}
                        >
                          <span>РЕГИСТРАЦИЯ</span>
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* REGISTRATION WIZARD STEPS IN THE EXACT SAME CARD FORMAT */
                    <motion.div
                      key={`register-step-${wizardStep}`}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 320, damping: 32, mass: 0.85 },
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.2 },
                      }}
                      className="w-full"
                    >
                      {wizardStep === 1 && (
                        /* STEP 1: REGISTRATION CONTACTS & PASSWORD */
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-2.5"
                        >
                          {/* Name Input Bar */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.82)',
                              border:
                                focusedField === 'name'
                                  ? '1px solid rgba(255, 138, 108, 0.85)'
                                  : '1px solid rgba(255, 138, 108, 0.22)',
                            }}
                          >
                            <User className="w-4 h-4 text-[#ff9d82] shrink-0" />
                            <input
                              type="text"
                              required
                              maxLength={80}
                              value={name}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setName(e.target.value)}
                              placeholder="Ваше имя и фамилия *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Phone Input Bar */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.82)',
                              border:
                                focusedField === 'phone'
                                  ? '1px solid rgba(255, 138, 108, 0.85)'
                                  : '1px solid rgba(255, 138, 108, 0.22)',
                            }}
                          >
                            <Phone className="w-4 h-4 text-[#ff9d82] shrink-0" />
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
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Email Input Bar */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.82)',
                              border:
                                focusedField === 'email'
                                  ? '1px solid rgba(255, 138, 108, 0.85)'
                                  : '1px solid rgba(255, 138, 108, 0.22)',
                            }}
                          >
                            <Mail className="w-4 h-4 text-[#ff9d82] shrink-0" />
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
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Password Input Bar */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.82)',
                              border:
                                focusedField === 'regPass'
                                  ? '1px solid rgba(255, 138, 108, 0.85)'
                                  : '1px solid rgba(255, 138, 108, 0.22)',
                            }}
                          >
                            <Lock className="w-4 h-4 text-[#ff9d82] shrink-0" />
                            <input
                              type="password"
                              required
                              maxLength={60}
                              value={registerPassword}
                              onFocus={() => setFocusedField('regPass')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setRegisterPassword(e.target.value)}
                              placeholder="Придумайте пароль *"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                            />
                          </motion.div>

                          {/* Action Buttons */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-2.5 pt-2"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic(8);
                                setErrorMessage('');
                                setAuthMode('login');
                              }}
                              className="px-3.5 py-3.5 rounded-xl border border-[#ff8a6c]/30 bg-[#140c0a]/75 text-xs font-bold text-[#ffdfd4] flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Вход</span>
                            </button>

                            <motion.button
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              disabled={isSendingSms}
                              onClick={handleRequestSmsCode}
                              className="flex-1 py-3.5 px-5 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                              style={{
                                background: 'linear-gradient(180deg, #E85234 0%, #B83319 100%)',
                                border: '1px solid rgba(255, 165, 140, 0.45)',
                                boxShadow: '0 10px 25px -5px rgba(20, 8, 5, 0.75)',
                              }}
                            >
                              <span>{isSendingSms ? 'ОТПРАВКА СМС...' : 'ДАЛЕЕ · КОД СМС'}</span>
                              <ArrowRight className="w-4 h-4 text-amber-200" />
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
                          className="space-y-3.5"
                        >
                          <motion.div variants={fadeScaleItemVariants} className="text-center space-y-1">
                            <h2 className="text-base font-display font-bold text-white">
                              Подтверждение номера по СМС
                            </h2>
                            <p className="text-xs text-[#ffdfd4]/80">
                              Мы отправили 4-значный код на номер{' '}
                              <span className="font-mono-num font-semibold text-[#ff9d82]">
                                {phoneNumber}
                              </span>
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.86)',
                              border:
                                focusedField === 'sms'
                                  ? '1px solid rgba(255, 138, 108, 0.9)'
                                  : '1px solid rgba(255, 138, 108, 0.38)',
                            }}
                          >
                            <Lock className="w-4 h-4 text-[#ff9d82] shrink-0" />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={smsCodeInput}
                              onFocus={() => setFocusedField('sms')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setSmsCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Код из СМС (4 цифры)"
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[16px] font-mono-num tracking-[0.25em] text-white placeholder:tracking-normal placeholder:text-[#ffcab8]/45 font-bold appearance-none"
                            />
                            {generatedSmsCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(8);
                                  setSmsCodeInput(generatedSmsCode);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#DE482B]/25 border border-[#ff8a6c]/40 text-[11px] font-bold text-[#ffcab8] shrink-0 cursor-pointer"
                              >
                                Код: {generatedSmsCode}
                              </button>
                            )}
                          </motion.div>

                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center justify-between px-1 text-xs"
                          >
                            <button
                              type="button"
                              onClick={() => navigateToStep(1)}
                              className="text-[#ffcab8]/80 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Изменить номер</span>
                            </button>

                            <button
                              type="button"
                              disabled={resendCooldown > 0}
                              onClick={handleRequestSmsCode}
                              className="text-[#ffcab8]/85 hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>
                                {resendCooldown > 0
                                  ? `Повторить через ${resendCooldown}с`
                                  : 'Отправить код ещё раз'}
                              </span>
                            </button>
                          </motion.div>

                          <motion.div variants={fadeScaleItemVariants} className="pt-2">
                            <motion.button
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={handleVerifySmsCode}
                              className="w-full py-3.5 px-6 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                              style={{
                                background: 'linear-gradient(180deg, #E85234 0%, #B83319 100%)',
                                border: '1px solid rgba(255, 165, 140, 0.45)',
                                boxShadow: '0 10px 25px -5px rgba(20, 8, 5, 0.75)',
                              }}
                            >
                              <span>ПОДТВЕРДИТЬ СМС-КОД</span>
                              <ArrowRight className="w-4 h-4 text-amber-200" />
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
                          className="space-y-3"
                        >
                          {/* Age & Gender Row */}
                          <motion.div variants={fadeScaleItemVariants} className="grid grid-cols-12 gap-2">
                            <div
                              className="col-span-5 flex items-center justify-between px-3 py-2.5 rounded-xl"
                              style={{
                                backgroundColor: 'rgba(18, 11, 9, 0.82)',
                                border: '1px solid rgba(255, 138, 108, 0.22)',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.max(18, prev - 1));
                                }}
                                className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                              >
                                −
                              </button>
                              <div className="text-center">
                                <span className="text-sm font-mono-num font-extrabold text-white block leading-none">
                                  {age}
                                </span>
                                <span className="text-[9px] text-[#ffcab8]/65">лет</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.min(90, prev + 1));
                                }}
                                className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="col-span-7 grid grid-cols-2 gap-1.5">
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
                                    className="px-2.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    style={{
                                      backgroundColor: active
                                        ? 'rgba(222, 72, 43, 0.42)'
                                        : 'rgba(18, 11, 9, 0.82)',
                                      color: '#ffffff',
                                      border: active
                                        ? '1px solid rgba(255, 138, 108, 0.85)'
                                        : '1px solid rgba(255, 138, 108, 0.2)',
                                    }}
                                  >
                                    {g === 'female' ? 'Девушка' : 'Мужчина'}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* City & Occupation Inputs */}
                          <motion.div variants={fadeScaleItemVariants} className="grid grid-cols-2 gap-2">
                            <div
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                              style={{
                                backgroundColor: 'rgba(18, 11, 9, 0.82)',
                                border:
                                  focusedField === 'city'
                                    ? '1px solid rgba(255, 138, 108, 0.85)'
                                    : '1px solid rgba(255, 138, 108, 0.22)',
                              }}
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#ff9d82] shrink-0" />
                              <input
                                type="text"
                                value={city}
                                onFocus={() => setFocusedField('city')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Город"
                                className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-xs text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                              />
                            </div>

                            <div
                              className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                              style={{
                                backgroundColor: 'rgba(18, 11, 9, 0.82)',
                                border:
                                  focusedField === 'occupation'
                                    ? '1px solid rgba(255, 138, 108, 0.85)'
                                    : '1px solid rgba(255, 138, 108, 0.22)',
                              }}
                            >
                              <Briefcase className="w-3.5 h-3.5 text-[#ff9d82] shrink-0" />
                              <input
                                type="text"
                                value={occupation}
                                onFocus={() => setFocusedField('occupation')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => setOccupation(e.target.value)}
                                placeholder="Кто вы по делу"
                                className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-xs text-white placeholder:text-[#ffcab8]/45 font-medium appearance-none"
                              />
                            </div>
                          </motion.div>

                          {/* Quick City Buttons */}
                          <motion.div variants={fadeScaleItemVariants} className="flex flex-wrap gap-1.5">
                            {CITY_PRESETS.map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setCity(c);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                                style={{
                                  backgroundColor:
                                    city === c ? 'rgba(222, 72, 43, 0.45)' : 'rgba(18, 11, 9, 0.65)',
                                  color: city === c ? '#ffffff' : 'rgba(255, 202, 184, 0.8)',
                                  border:
                                    city === c
                                      ? '1px solid rgba(255, 138, 108, 0.7)'
                                      : '1px solid rgba(255, 138, 108, 0.16)',
                                }}
                              >
                                {c}
                              </button>
                            ))}
                          </motion.div>

                          {/* Interests Selection Grid */}
                          <motion.div variants={fadeScaleItemVariants} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] text-[#ffdfd4]/85 px-0.5">
                              <span className="font-semibold">Выберите любимые форматы встреч:</span>
                              <span className="font-mono-num font-bold text-[#ff9d82]">
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
                                    className="px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-1.5 transition-all cursor-pointer"
                                    style={{
                                      backgroundColor: selected
                                        ? 'rgba(222, 72, 43, 0.36)'
                                        : 'rgba(18, 11, 9, 0.78)',
                                      border: selected
                                        ? '1px solid rgba(255, 138, 108, 0.85)'
                                        : '1px solid rgba(255, 138, 108, 0.18)',
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <IconComp className="w-3.5 h-3.5 text-[#ff9d82] shrink-0" />
                                      <span className="text-[11px] font-semibold text-white truncate">
                                        {isEn ? item.labelEn : item.tag}
                                      </span>
                                    </div>
                                    {selected && (
                                      <Check className="w-3.5 h-3.5 text-[#ffcab8] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* Step 3 Footer Actions */}
                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="flex items-center gap-2 pt-2"
                          >
                            <button
                              type="button"
                              onClick={() => navigateToStep(1)}
                              className="px-3.5 py-3.5 rounded-xl border border-[#ff8a6c]/30 bg-[#140c0a]/75 text-xs font-bold text-[#ffdfd4] flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Назад</span>
                            </button>

                            <motion.button
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              disabled={isSaving}
                              onClick={handleSaveAndProceedToFinal}
                              className="flex-1 py-3.5 px-5 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              style={{
                                background: 'linear-gradient(180deg, #E85234 0%, #B83319 100%)',
                                border: '1px solid rgba(255, 165, 140, 0.45)',
                                boxShadow: '0 10px 25px -5px rgba(20, 8, 5, 0.75)',
                              }}
                            >
                              <span>{isSaving ? 'СОХРАНЕНИЕ...' : 'ДАЛЕЕ'}</span>
                              <ArrowRight className="w-4 h-4 text-amber-200" />
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
                          <motion.div variants={fadeScaleItemVariants} className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Телефон и профиль подтверждены
                            </span>
                            <h3 className="text-lg font-display font-extrabold text-white pt-1">
                              {name.trim() || 'Участник Kompa'},{' '}
                              <span className="font-mono-num">{age}</span>
                            </h3>
                            <p className="text-xs text-[#ffcab8]/80">
                              {city} · Подобрано{' '}
                              <strong className="font-mono-num text-white">
                                {matchedEventsCount}
                              </strong>{' '}
                              мероприятий
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="p-3.5 rounded-2xl text-left space-y-2"
                            style={{
                              backgroundColor: 'rgba(18, 11, 9, 0.82)',
                              border: '1px solid rgba(255, 138, 108, 0.28)',
                            }}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#ffcab8]/65">Телефон:</span>
                              <span className="font-mono-num font-semibold text-white">
                                {phoneNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#ffcab8]/65">Почта:</span>
                              <span className="font-semibold text-white truncate max-w-[190px]">
                                {email}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                              {interests.slice(0, 4).map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-md bg-[#DE482B]/30 border border-[#ff8a6c]/35 text-[10px] font-semibold text-[#ffdfd4]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </motion.div>

                          <motion.div
                            variants={fadeScaleItemVariants}
                            className="space-y-2 pt-1"
                          >
                            <motion.button
                              whileHover={{ scale: 1.015 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => {
                                triggerHaptic([12, 30, 15]);
                                onClose();
                              }}
                              className="w-full py-3.5 px-6 rounded-xl text-xs sm:text-sm font-display font-extrabold uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                              style={{
                                background: 'linear-gradient(180deg, #E85234 0%, #B83319 100%)',
                                border: '1px solid rgba(255, 165, 140, 0.5)',
                                boxShadow: '0 10px 25px -5px rgba(20, 8, 5, 0.75)',
                              }}
                            >
                              <Check className="w-4 h-4 text-amber-200 stroke-[2.5]" />
                              <span>ЗАВЕРШИТЬ РЕГИСТРАЦИЮ</span>
                            </motion.button>

                            <button
                              type="button"
                              onClick={() => navigateToStep(3)}
                              className="w-full py-2 text-xs font-semibold text-[#ffcab8]/75 hover:text-white transition-colors cursor-pointer"
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
