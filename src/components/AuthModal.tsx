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
  Search,
  ChevronDown,
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
import { KompaLogoMark, KompaWordmark } from './KompaLogo.tsx';

interface AuthModalProps {
  currentUser: UserProfile;
  cloudUser: FirebaseUser | null;
  isInitialGate?: boolean;
  mode?: 'gate' | 'edit';
  onClose: () => void;
  onProfileRegistered: (updatedProfile: UserProfile) => void;
  onLogout?: () => void;
  lang?: 'ru' | 'en';
}

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Official Sunset Coral & Warm Cream-Sand + Deep Navy Foundation Palette (IMG_8624 & IMG_8626)
const PALETTE = {
  canvasBg: '#FAF7F2',
  canvasAura:
    'radial-gradient(circle at 50% 18%, rgba(232, 97, 77, 0.09) 0%, rgba(245, 158, 11, 0.04) 40%, rgba(250, 247, 242, 0) 74%)',
  cardBg: '#FFFFFF',
  cardBorder: '#ECE4DA',
  fieldBg: '#F7F3ED',
  fieldFocusBg: '#FFFFFF',
  fieldBorder: '#E5DDD2',
  textNavy: '#162946',
  textPrimary: '#181310',
  textSecondary: '#524740',
  textMuted: '#85776E',
  accentPrimary: '#E4482A',
  accentGradFrom: '#F0593B',
  accentGradTo: '#DE4326',
  accentSoftBg: '#FEF1EE',
  accentSoftBorder: '#FAD4C8',
  accentSoftText: '#C9381C',
  accentShadow: 'rgba(228, 72, 42, 0.32)',
};

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
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
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

const CITY_CATALOG = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Нижний Новгород',
  'Краснодар',
  'Сочи',
  'Самара',
  'Ростов-на-Дону',
  'Уфа',
  'Красноярск',
  'Воронеж',
  'Пермь',
  'Волгоград',
  'Челябинск',
  'Омск',
  'Тюмень',
  'Калининград',
  'Саратов',
  'Тольятти',
  'Барнаул',
  'Ижевск',
  'Махачкала',
  'Хабаровск',
  'Ульяновск',
  'Иркутск',
  'Владивосток',
  'Ярославль',
  'Ставрополь',
  'Севастополь',
  'Симферополь',
  'Томск',
  'Кемерово',
  'Набережные Челны',
  'Оренбург',
  'Новокузнецк',
  'Рязань',
  'Пенза',
  'Липецк',
  'Киров',
  'Чебоксары',
  'Тула',
  'Курск',
  'Тверь',
  'Брянск',
  'Иваново',
  'Белгород',
  'Сургут',
  'Архангельск',
  'Калуга',
  'Смоленск',
  'Владимир',
  'Мурманск',
  'Грозный',
  'Владикавказ',
  'Якутск',
  'Южно-Сахалинск',
  'Пятигорск',
  'Геленджик',
  'Анапа',
  'Минск',
  'Алматы',
  'Астана',
  'Ереван',
  'Тбилиси',
  'Батуми',
  'Дубай',
];

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
    <rect width="240" height="240" rx="120" fill="#E4482A"/>
    <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Onest, Manrope, sans-serif" font-weight="800" font-size="84">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  cloudUser,
  isInitialGate = false,
  mode,
  onClose,
  onProfileRegistered,
  onLogout,
  lang = 'ru',
}) => {
  const isEn = lang === 'en';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  // Explicit mode takes precedence: 'edit' ALWAYS opens directly into questionnaire editing (never login/splash)
  const startsInEditMode = mode ? mode === 'edit' : !isInitialGate;

  // Lock whether the modal was opened as initial registration gate vs editing "Моя анкета"
  const [isEditProfileMode, setIsEditProfileMode] = useState<boolean>(() => startsInEditMode);

  // Launch Splash Screen (3.2s duration on initial gate; instant open when editing "Моя анкета")
  const [showLogoSplash, setShowLogoSplash] = useState<boolean>(() => !startsInEditMode);

  useEffect(() => {
    if (!showLogoSplash) return;
    const timer = setTimeout(() => {
      setShowLogoSplash(false);
    }, 3200);
    return () => clearTimeout(timer);
  }, [showLogoSplash]);

  // Auth Flow Mode:
  // 'login' = Sunset Coral Login Screen (initial gate)
  // 'register' = 4-Step Registration Flow OR direct Step 3 Questionnaire Editor in edit mode
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() =>
    startsInEditMode ? 'register' : 'login'
  );
  const [[wizardStep, direction], setStepState] = useState<[1 | 2 | 3 | 4, number]>(() =>
    startsInEditMode ? [3, 1] : [1, 1]
  );

  // Guard: if explicitly opened in 'edit' mode, never show splash or login screen
  useEffect(() => {
    if (mode === 'edit') {
      setIsEditProfileMode(true);
      setShowLogoSplash(false);
      setAuthMode('register');
      setStepState(([prevStep]) => (prevStep === 3 || prevStep === 4 ? [prevStep, 1] : [3, 1]));
    }
  }, [mode]);

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
  const [cityQuery, setCityQuery] = useState(currentUser.city || 'Москва');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return CITY_CATALOG.slice(0, 14);
    const startsWithMatches = CITY_CATALOG.filter(c => c.toLowerCase().startsWith(q));
    const includesMatches = CITY_CATALOG.filter(
      c => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q)
    );
    return [...startsWithMatches, ...includesMatches].slice(0, 14);
  }, [cityQuery]);

  useEffect(() => {
    if (!isCityDropdownOpen) return;
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (cityContainerRef.current && !cityContainerRef.current.contains(event.target as Node)) {
        setIsCityDropdownOpen(false);
        setCityQuery(prev => (prev.trim() ? prev.trim() : city));
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isCityDropdownOpen, city]);
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
    if (startsInEditMode && !url.includes('images.unsplash.com')) return true;
    return false;
  };

  const [avatarUrl, setAvatarUrl] = useState<string>(
    isPersonalPhoto(currentUser.avatarUrl) ? currentUser.avatarUrl : ''
  );
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [bio, setBio] = useState<string>(() => {
    if (!startsInEditMode) return '';
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
      e.target.value = '';
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
    if (isEditProfileMode) {
      if (name.trim().length < 2) {
        setErrorMessage('Укажите ваше имя и фамилию');
        return;
      }
    } else if (!validateStep1Fields()) {
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
    setIsEditProfileMode(false);
    setIsSmsVerified(false);
    setAuthMode('login');
    navigateToStep(1);
    setStatusMessage(isEn ? 'You have signed out.' : 'Вы вышли из аккаунта.');
  };

  const getFieldStyle = (fieldId: string): React.CSSProperties => {
    const isFocused = focusedField === fieldId;
    return {
      backgroundColor: isFocused ? PALETTE.fieldFocusBg : PALETTE.fieldBg,
      border: isFocused
        ? `1.5px solid ${PALETTE.accentPrimary}`
        : `1.5px solid ${PALETTE.fieldBorder}`,
      boxShadow: isFocused
        ? '0 0 0 4px rgba(228, 72, 42, 0.11)'
        : '0 1px 2px rgba(24, 19, 16, 0.02)',
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: STUDIO_EASE }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto pt-safe pb-safe select-none"
      style={{
        backgroundColor: PALETTE.canvasBg,
        backgroundImage: PALETTE.canvasAura,
      }}
    >
      {/* Hidden Recaptcha container for Firebase Phone Auth */}
      <div ref={recaptchaContainerRef} className="hidden" />

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
            className="fixed top-4 left-1/2 -translate-x-1/2 z-60 w-[calc(100%-2rem)] max-w-[408px] p-3.5 rounded-2xl bg-white shadow-xl cursor-pointer flex items-center justify-between gap-3 backdrop-blur-xl"
            style={{
              border: `1px solid ${PALETTE.accentSoftBorder}`,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: PALETTE.accentSoftBg,
                  color: PALETTE.accentPrimary,
                }}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: PALETTE.accentPrimary }}
                  >
                    СМС · KOMPA
                  </span>
                  <span className="text-[11px]" style={{ color: PALETTE.textMuted }}>
                    сейчас
                  </span>
                </div>
                <p
                  className="text-xs font-medium truncate mt-0.5"
                  style={{ color: PALETTE.textPrimary }}
                >
                  Код подтверждения:{' '}
                  <strong
                    className="font-mono-num text-sm tracking-wider"
                    style={{ color: PALETTE.accentPrimary }}
                  >
                    {generatedSmsCode}
                  </strong>
                </p>
              </div>
            </div>
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              style={{
                backgroundColor: PALETTE.accentSoftBg,
                color: PALETTE.accentPrimary,
              }}
            >
              Вставить
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <LayoutGroup id="kompa-launch-to-auth">
        {showLogoSplash ? (
          /* =====================================================================
             STAGE 0: LAUNCH SPLASH ANIMATION (3.2s)
             Smooth formation of the official Kompa Constellation & Map Pin Logo
             and bold navy "Kompa" wordmark on the warm cream canvas (#FAF7F2).
             ===================================================================== */
          <motion.div
            key="kompa-official-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: STUDIO_EASE }}
            className="relative z-10 flex flex-col items-center justify-center text-center px-6"
          >
            <motion.div
              layoutId="kompa-brand-identity-lockup"
              transition={{ duration: 0.62, ease: STUDIO_EASE }}
              className="flex flex-col items-center"
            >
              <KompaLogoMark size={148} variant="standalone" animated={true} />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.58,
                  delay: 1.85,
                  ease: STUDIO_EASE,
                }}
                className="mt-3.5 flex flex-col items-center"
              >
                <KompaWordmark size="lg" />

                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.52,
                    delay: 2.2,
                    ease: STUDIO_EASE,
                  }}
                  className="mt-2.5 text-[13px] font-medium tracking-[-0.01em]"
                  style={{ color: PALETTE.textMuted }}
                >
                  Живые события и компания рядом
                </motion.p>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : (
          /* =====================================================================
             STAGE 1: SUNSET CORAL & WARM CREAM AUTHORIZATION CARD (IMG_8624)
             With the official Kompa Constellation + Map Pin Logo (IMG_8626) at top.
             ===================================================================== */
          <motion.div
            key="kompa-official-auth-card"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: STUDIO_EASE }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-[408px] my-auto"
          >
            <div
              className="relative w-full rounded-[32px] p-6 sm:p-8 flex flex-col justify-between overflow-visible"
              style={{
                backgroundColor: PALETTE.cardBg,
                border: `1px solid ${PALETTE.cardBorder}`,
                boxShadow:
                  '0 24px 60px -16px rgba(24, 19, 16, 0.08), 0 4px 16px -2px rgba(24, 19, 16, 0.04)',
              }}
            >
              {/* Hidden File Input placed INSIDE the card so clicks never bubble outside */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onClick={e => e.stopPropagation()}
                onChange={handleCustomAvatarUpload}
                className="hidden"
              />

              {/* Top Navigation Row in Questionnaire Edit Mode (Back + Close, never accidental logout) */}
              {isEditProfileMode && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic(6);
                      if (wizardStep === 4) {
                        navigateToStep(3);
                      } else {
                        onClose();
                      }
                    }}
                    className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: PALETTE.fieldBg,
                      color: PALETTE.textSecondary,
                    }}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть редактирование анкеты"
                    className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      backgroundColor: PALETTE.fieldBg,
                      color: PALETTE.textSecondary,
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* HEADER AREA:
                  - In LOGIN mode: Official Kompa Constellation + Map Pin Logo & Navy "Kompa" Wordmark
                  - In REGISTER mode: Personal Photo Upload Button + Step Progress */}
              <div className="flex flex-col items-center text-center pb-5">
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
                      title="Нажмите, чтобы воспроизвести стартовую анимацию"
                      className="group cursor-pointer focus:outline-none"
                    >
                      <KompaLogoMark
                        size={96}
                        variant="standalone"
                        animated={false}
                        className="transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.97]"
                      />
                    </button>

                    <div className="mt-2 flex items-baseline">
                      <KompaWordmark size="md" />
                    </div>

                    <p
                      className="mt-2 text-[13px] font-medium max-w-[275px] leading-snug"
                      style={{ color: PALETTE.textMuted }}
                    >
                      Находите компанию для праздников, событий и совместного отдыха
                    </p>
                  </motion.div>
                ) : (
                  /* REGISTRATION / PROFILE EDIT HEADER: Personal Photo Upload + Step Progress */
                  <div className="w-full flex flex-col items-center">
                    {isEditProfileMode ? (
                      <div className="w-full flex items-center justify-center mb-3">
                        <span
                          className="text-sm font-display font-extrabold"
                          style={{ color: PALETTE.textNavy }}
                        >
                          {wizardStep === 4 ? 'Анкета обновлена' : 'Редактирование анкеты'}
                        </span>
                      </div>
                    ) : (
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
                          className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: PALETTE.fieldBg,
                            color: PALETTE.textSecondary,
                          }}
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
                                    ? PALETTE.accentPrimary
                                    : done
                                    ? '#F59E8B'
                                    : PALETTE.fieldBorder,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Personal Photo Uploader inside Registration */}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => fileInputRef.current?.click()}
                      title="Загрузить личную фотографию"
                      className="relative w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all group"
                      style={{
                        backgroundColor: PALETTE.accentSoftBg,
                        border: `2px solid ${PALETTE.accentSoftBorder}`,
                        boxShadow: `0 8px 20px -6px ${PALETTE.accentShadow}`,
                      }}
                    >
                      {avatarUrl ? (
                        <>
                          <img
                            src={avatarUrl}
                            alt={name || 'Ваше фото'}
                            className="w-full h-full rounded-full object-cover"
                          />
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full text-white border-2 border-white flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: PALETTE.accentPrimary }}
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                        </>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center"
                          style={{ color: PALETTE.accentPrimary }}
                        >
                          <Camera className="w-7 h-7 stroke-[1.8] group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs font-semibold transition-colors cursor-pointer"
                      style={{ color: PALETTE.accentPrimary }}
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
                    className="mb-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5"
                    style={{
                      backgroundColor: PALETTE.accentSoftBg,
                      border: `1px solid ${PALETTE.accentSoftBorder}`,
                      color: PALETTE.textNavy,
                    }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: PALETTE.accentPrimary,
                        color: '#FFFFFF',
                      }}
                    >
                      <Check className="w-3 h-3 stroke-[2.8]" />
                    </span>
                    <span>{statusMessage}</span>
                  </motion.div>
                )}
                {errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-3.5 px-3.5 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MAIN CONTENT AREA: LOGIN VIEW OR 4-STEP REGISTRATION WIZARD */}
              <div className="relative overflow-visible">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  {authMode === 'login' ? (
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
                        <label
                          className="block text-xs font-semibold px-1"
                          style={{ color: PALETTE.textSecondary }}
                        >
                          Логин
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 min-h-[50px] rounded-2xl transition-all duration-150"
                          style={getFieldStyle('loginId')}
                        >
                          <User
                            className="w-4 h-4 shrink-0"
                            style={{ color: PALETTE.textMuted }}
                          />
                          <input
                            type="text"
                            value={loginIdentifier}
                            onFocus={() => setFocusedField('loginId')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setLoginIdentifier(e.target.value)}
                            placeholder="Телефон или электронная почта"
                            style={{ color: PALETTE.textPrimary }}
                            className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                          />
                        </div>
                      </motion.div>

                      {/* Field 2: Password */}
                      <motion.div variants={fadeItemVariants} className="space-y-1.5">
                        <label
                          className="block text-xs font-semibold px-1"
                          style={{ color: PALETTE.textSecondary }}
                        >
                          Пароль
                        </label>
                        <div
                          className="flex items-center gap-3 px-4 min-h-[50px] rounded-2xl transition-all duration-150"
                          style={getFieldStyle('loginPass')}
                        >
                          <Lock
                            className="w-4 h-4 shrink-0"
                            style={{ color: PALETTE.textMuted }}
                          />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onFocus={() => setFocusedField('loginPass')}
                            onBlur={() => setFocusedField(null)}
                            onChange={e => setLoginPassword(e.target.value)}
                            placeholder="Введите ваш пароль"
                            style={{ color: PALETTE.textPrimary }}
                            className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(prev => !prev)}
                            className="p-1 transition-colors cursor-pointer shrink-0"
                            style={{ color: PALETTE.textMuted }}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </motion.div>

                      {/* Remember Me Checkbox */}
                      <motion.div
                        variants={fadeItemVariants}
                        className="flex items-center justify-start pt-0.5 px-1"
                      >
                        <label
                          className="inline-flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                          style={{ color: PALETTE.textSecondary }}
                        >
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={e => setRememberMe(e.target.checked)}
                            style={{ accentColor: PALETTE.accentPrimary }}
                            className="w-4 h-4 rounded cursor-pointer"
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
                            background: `linear-gradient(180deg, ${PALETTE.accentGradFrom} 0%, ${PALETTE.accentGradTo} 100%)`,
                            boxShadow: `0 10px 24px -6px ${PALETTE.accentShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
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
                          className="min-h-[50px] px-4 rounded-2xl text-sm font-display font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: PALETTE.accentSoftBg,
                            color: PALETTE.accentSoftText,
                            border: `1px solid ${PALETTE.accentSoftBorder}`,
                          }}
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
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-3"
                        >
                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('name')}
                          >
                            <User
                              className="w-4 h-4 shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            />
                            <input
                              type="text"
                              required
                              maxLength={80}
                              value={name}
                              onFocus={() => setFocusedField('name')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setName(e.target.value)}
                              placeholder="Имя и фамилия *"
                              style={{ color: PALETTE.textPrimary }}
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                            />
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('phone')}
                          >
                            <Phone
                              className="w-4 h-4 shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            />
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
                              style={{ color: PALETTE.textPrimary }}
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                            />
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('email')}
                          >
                            <Mail
                              className="w-4 h-4 shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            />
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
                              style={{ color: PALETTE.textPrimary }}
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                            />
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[48px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('regPass')}
                          >
                            <Lock
                              className="w-4 h-4 shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            />
                            <input
                              type={showRegisterPassword ? 'text' : 'password'}
                              required
                              maxLength={60}
                              value={registerPassword}
                              onFocus={() => setFocusedField('regPass')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setRegisterPassword(e.target.value)}
                              placeholder="Придумайте пароль *"
                              style={{ color: PALETTE.textPrimary }}
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[15px] placeholder:text-[#A3968D] font-medium appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegisterPassword(prev => !prev)}
                              className="p-1 transition-colors cursor-pointer shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            >
                              {showRegisterPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </motion.div>

                          <motion.div variants={fadeItemVariants} className="pt-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              disabled={isSendingSms}
                              onClick={handleRequestSmsCode}
                              className="w-full min-h-[50px] px-5 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                              style={{
                                background: `linear-gradient(180deg, ${PALETTE.accentGradFrom} 0%, ${PALETTE.accentGradTo} 100%)`,
                                boxShadow: `0 10px 24px -6px ${PALETTE.accentShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
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
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-4"
                        >
                          <motion.div variants={fadeItemVariants} className="text-center space-y-1">
                            <h2
                              className="text-base font-display font-bold"
                              style={{ color: PALETTE.textPrimary }}
                            >
                              Подтверждение номера
                            </h2>
                            <p className="text-xs" style={{ color: PALETTE.textMuted }}>
                              Отправили 4-значный СМС-код на{' '}
                              <span
                                className="font-mono-num font-semibold"
                                style={{ color: PALETTE.accentPrimary }}
                              >
                                {phoneNumber}
                              </span>
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="flex items-center gap-3 px-4 min-h-[52px] rounded-2xl transition-all duration-150"
                            style={getFieldStyle('sms')}
                          >
                            <Lock
                              className="w-4 h-4 shrink-0"
                              style={{ color: PALETTE.textMuted }}
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={smsCodeInput}
                              onFocus={() => setFocusedField('sms')}
                              onBlur={() => setFocusedField(null)}
                              onChange={e => setSmsCodeInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Код из СМС (4 цифры)"
                              style={{ color: PALETTE.textPrimary }}
                              className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-base font-mono-num tracking-[0.22em] placeholder:tracking-normal placeholder:text-[#A3968D] font-bold appearance-none"
                            />
                            {generatedSmsCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  triggerHaptic(8);
                                  setSmsCodeInput(generatedSmsCode);
                                }}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                                style={{
                                  backgroundColor: PALETTE.accentSoftBg,
                                  color: PALETTE.accentPrimary,
                                }}
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
                              className="font-medium flex items-center gap-1 cursor-pointer"
                              style={{ color: PALETTE.textMuted }}
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Изменить номер</span>
                            </button>

                            <button
                              type="button"
                              disabled={resendCooldown > 0}
                              onClick={handleRequestSmsCode}
                              className="font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              style={{ color: PALETTE.accentPrimary }}
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
                                background: `linear-gradient(180deg, ${PALETTE.accentGradFrom} 0%, ${PALETTE.accentGradTo} 100%)`,
                                boxShadow: `0 10px 24px -6px ${PALETTE.accentShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
                              }}
                            >
                              <span>Подтвердить код</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}

                      {wizardStep === 3 && (
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-3"
                        >
                          {isEditProfileMode && (
                            <motion.div variants={fadeItemVariants}>
                              <div
                                className="flex items-center gap-2.5 px-3.5 min-h-[48px] rounded-2xl transition-all duration-150"
                                style={getFieldStyle('editName')}
                              >
                                <User
                                  className="w-4 h-4 shrink-0"
                                  style={{ color: PALETTE.textMuted }}
                                />
                                <input
                                  type="text"
                                  value={name}
                                  onFocus={() => setFocusedField('editName')}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => setName(e.target.value)}
                                  placeholder="Имя и фамилия"
                                  style={{ color: PALETTE.textPrimary }}
                                  className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[14px] placeholder:text-[#A3968D] font-medium appearance-none"
                                />
                              </div>
                            </motion.div>
                          )}

                          <motion.div variants={fadeItemVariants} className="grid grid-cols-12 gap-2">
                            <div
                              className="col-span-5 flex items-center justify-between px-2 min-h-[48px] rounded-2xl"
                              style={{
                                backgroundColor: PALETTE.fieldBg,
                                border: `1.5px solid ${PALETTE.fieldBorder}`,
                              }}
                            >
                              <button
                                type="button"
                                aria-label="Уменьшить возраст"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.max(18, prev - 1));
                                }}
                                className="w-7 h-7 rounded-xl font-bold flex items-center justify-center leading-none shrink-0 cursor-pointer transition-transform active:scale-95"
                                style={{
                                  backgroundColor: PALETTE.cardBg,
                                  color: PALETTE.textNavy,
                                  border: `1px solid ${PALETTE.fieldBorder}`,
                                }}
                              >
                                −
                              </button>
                              <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-center">
                                <span
                                  className="block text-[15px] font-mono-num font-extrabold leading-none"
                                  style={{ color: PALETTE.textPrimary }}
                                >
                                  {age}
                                </span>
                                <span
                                  className="block text-[10px] font-medium leading-none"
                                  style={{ color: PALETTE.textMuted }}
                                >
                                  лет
                                </span>
                              </div>
                              <button
                                type="button"
                                aria-label="Увеличить возраст"
                                onClick={() => {
                                  triggerHaptic(5);
                                  setAge(prev => Math.min(90, prev + 1));
                                }}
                                className="w-7 h-7 rounded-xl font-bold flex items-center justify-center leading-none shrink-0 cursor-pointer transition-transform active:scale-95"
                                style={{
                                  backgroundColor: PALETTE.cardBg,
                                  color: PALETTE.textNavy,
                                  border: `1px solid ${PALETTE.fieldBorder}`,
                                }}
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
                                    className="px-2 min-h-[48px] rounded-2xl text-xs font-bold transition-all cursor-pointer truncate"
                                    style={{
                                      backgroundColor: active
                                        ? PALETTE.accentSoftBg
                                        : PALETTE.fieldBg,
                                      color: active
                                        ? PALETTE.accentSoftText
                                        : PALETTE.textSecondary,
                                      border: active
                                        ? `1.5px solid ${PALETTE.accentPrimary}`
                                        : `1.5px solid ${PALETTE.fieldBorder}`,
                                    }}
                                  >
                                    {g === 'female' ? 'Девушка' : 'Мужчина'}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          {/* Searchable City Picker + Occupation */}
                          <motion.div variants={fadeItemVariants} className="space-y-2">
                            <div ref={cityContainerRef} className="relative z-30">
                              <div
                                className="flex items-center gap-2.5 px-3.5 min-h-[48px] rounded-2xl transition-all duration-150"
                                style={getFieldStyle('city')}
                              >
                                <Search
                                  className="w-4 h-4 shrink-0"
                                  style={{
                                    color: isCityDropdownOpen
                                      ? PALETTE.accentPrimary
                                      : PALETTE.textMuted,
                                  }}
                                />
                                <input
                                  type="text"
                                  value={cityQuery}
                                  onFocus={() => {
                                    setFocusedField('city');
                                    setIsCityDropdownOpen(true);
                                  }}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setCityQuery(val);
                                    setCity(val);
                                    setIsCityDropdownOpen(true);
                                  }}
                                  placeholder="Поиск города (например, Москва, Сочи...)"
                                  style={{ color: PALETTE.textPrimary }}
                                  className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[14px] placeholder:text-[#A3968D] font-medium appearance-none"
                                />
                                {cityQuery ? (
                                  <button
                                    type="button"
                                    aria-label="Очистить поиск города"
                                    onMouseDown={e => e.preventDefault()}
                                    onClick={() => {
                                      setCityQuery('');
                                      setIsCityDropdownOpen(true);
                                    }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                                    style={{
                                      backgroundColor: PALETTE.cardBorder,
                                      color: PALETTE.textSecondary,
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <ChevronDown
                                    className="w-4 h-4 shrink-0"
                                    style={{ color: PALETTE.textMuted }}
                                  />
                                )}
                              </div>

                              <AnimatePresence>
                                {isCityDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.99 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.99 }}
                                    transition={{ duration: 0.16, ease: STUDIO_EASE }}
                                    className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl overflow-hidden shadow-xl"
                                    style={{
                                      backgroundColor: PALETTE.cardBg,
                                      border: `1.5px solid ${PALETTE.cardBorder}`,
                                      boxShadow:
                                        '0 18px 38px -10px rgba(22, 41, 70, 0.18), 0 4px 12px -2px rgba(22, 41, 70, 0.06)',
                                    }}
                                  >
                                    <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5">
                                      {filteredCities.length > 0 ? (
                                        filteredCities.map(itemCity => {
                                          const isSelected =
                                            city.trim().toLowerCase() === itemCity.toLowerCase();
                                          return (
                                            <button
                                              key={itemCity}
                                              type="button"
                                              onMouseDown={e => e.preventDefault()}
                                              onClick={() => {
                                                triggerHaptic(5);
                                                setCity(itemCity);
                                                setCityQuery(itemCity);
                                                setIsCityDropdownOpen(false);
                                              }}
                                              className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                                              style={{
                                                backgroundColor: isSelected
                                                  ? PALETTE.accentSoftBg
                                                  : 'transparent',
                                                color: isSelected
                                                  ? PALETTE.accentSoftText
                                                  : PALETTE.textNavy,
                                              }}
                                            >
                                              <span className="flex items-center gap-2 min-w-0">
                                                <MapPin
                                                  className="w-3.5 h-3.5 shrink-0"
                                                  style={{
                                                    color: isSelected
                                                      ? PALETTE.accentPrimary
                                                      : PALETTE.textMuted,
                                                  }}
                                                />
                                                <span className="truncate">{itemCity}</span>
                                              </span>
                                              {isSelected && (
                                                <Check
                                                  className="w-3.5 h-3.5 shrink-0"
                                                  style={{ color: PALETTE.accentPrimary }}
                                                />
                                              )}
                                            </button>
                                          );
                                        })
                                      ) : (
                                        <button
                                          type="button"
                                          onMouseDown={e => e.preventDefault()}
                                          onClick={() => {
                                            const custom = cityQuery.trim();
                                            if (!custom) return;
                                            triggerHaptic(5);
                                            setCity(custom);
                                            setCityQuery(custom);
                                            setIsCityDropdownOpen(false);
                                          }}
                                          className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 cursor-pointer"
                                          style={{
                                            backgroundColor: PALETTE.accentSoftBg,
                                            color: PALETTE.accentSoftText,
                                          }}
                                        >
                                          <MapPin
                                            className="w-3.5 h-3.5 shrink-0"
                                            style={{ color: PALETTE.accentPrimary }}
                                          />
                                          <span className="truncate">
                                            Выбрать «{cityQuery.trim()}»
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div
                              className="flex items-center gap-2.5 px-3.5 min-h-[46px] rounded-2xl transition-all duration-150"
                              style={getFieldStyle('occupation')}
                            >
                              <Briefcase
                                className="w-4 h-4 shrink-0"
                                style={{ color: PALETTE.textMuted }}
                              />
                              <input
                                type="text"
                                value={occupation}
                                onFocus={() => setFocusedField('occupation')}
                                onBlur={() => setFocusedField(null)}
                                onChange={e => setOccupation(e.target.value)}
                                placeholder="Сфера деятельности / занятие"
                                style={{ color: PALETTE.textPrimary }}
                                className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[14px] placeholder:text-[#A3968D] font-medium appearance-none"
                              />
                            </div>

                            {isEditProfileMode && (
                              <div
                                className="px-3.5 py-2.5 rounded-2xl transition-all duration-150"
                                style={getFieldStyle('editBio')}
                              >
                                <textarea
                                  rows={2}
                                  maxLength={300}
                                  value={bio}
                                  onFocus={() => setFocusedField('editBio')}
                                  onBlur={() => setFocusedField(null)}
                                  onChange={e => setBio(e.target.value)}
                                  placeholder="Коротко о себе (хобби, формат встреч)..."
                                  style={{ color: PALETTE.textPrimary }}
                                  className="w-full bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 text-[13px] placeholder:text-[#A3968D] font-medium resize-none leading-snug appearance-none"
                                />
                              </div>
                            )}
                          </motion.div>

                          <motion.div variants={fadeItemVariants} className="space-y-1.5">
                            <div
                              className="flex items-center justify-between text-xs px-0.5"
                              style={{ color: PALETTE.textSecondary }}
                            >
                              <span className="font-semibold">Интересные форматы событий:</span>
                              <span
                                className="font-mono-num font-bold"
                                style={{ color: PALETTE.accentPrimary }}
                              >
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
                                      backgroundColor: selected
                                        ? PALETTE.accentSoftBg
                                        : PALETTE.fieldBg,
                                      border: selected
                                        ? `1.5px solid ${PALETTE.accentPrimary}`
                                        : `1.5px solid ${PALETTE.fieldBorder}`,
                                    }}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <IconComp
                                        className="w-3.5 h-3.5 shrink-0"
                                        style={{
                                          color: selected
                                            ? PALETTE.accentPrimary
                                            : PALETTE.textMuted,
                                        }}
                                      />
                                      <span
                                        className="text-xs font-semibold truncate"
                                        style={{
                                          color: selected
                                            ? PALETTE.accentSoftText
                                            : PALETTE.textPrimary,
                                        }}
                                      >
                                        {isEn ? item.labelEn : item.tag}
                                      </span>
                                    </div>
                                    {selected && (
                                      <Check
                                        className="w-3.5 h-3.5 shrink-0"
                                        style={{ color: PALETTE.accentPrimary }}
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>

                          <motion.div variants={fadeItemVariants} className="pt-1">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.985 }}
                              type="button"
                              disabled={isSaving}
                              onClick={handleSaveAndProceedToFinal}
                              className="w-full min-h-[50px] px-5 rounded-2xl text-sm font-display font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                              style={{
                                background: `linear-gradient(180deg, ${PALETTE.accentGradFrom} 0%, ${PALETTE.accentGradTo} 100%)`,
                                boxShadow: `0 10px 24px -6px ${PALETTE.accentShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
                              }}
                            >
                              <span>
                                {isSaving
                                  ? 'Сохранение анкеты...'
                                  : isEditProfileMode
                                  ? 'Сохранить изменения'
                                  : 'Продолжить'}
                              </span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}

                      {wizardStep === 4 && (
                        <motion.div
                          variants={staggerContainerVariants}
                          initial="hidden"
                          animate="show"
                          className="space-y-4 text-center"
                        >
                          <motion.div variants={fadeItemVariants} className="space-y-1">
                            <div
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: PALETTE.accentSoftBg,
                                border: `1px solid ${PALETTE.accentSoftBorder}`,
                                color: PALETTE.textNavy,
                              }}
                            >
                              <ShieldCheck
                                className="w-4 h-4 shrink-0"
                                style={{ color: PALETTE.accentPrimary }}
                              />
                              <span>Профиль и телефон подтверждены</span>
                            </div>
                            <h3
                              className="text-lg font-display font-extrabold pt-0.5"
                              style={{ color: PALETTE.textPrimary }}
                            >
                              {name.trim() || 'Участник Kompa'},{' '}
                              <span className="font-mono-num">{age}</span>
                            </h3>
                            <p className="text-xs" style={{ color: PALETTE.textMuted }}>
                              {city} · Доступно{' '}
                              <strong
                                className="font-mono-num"
                                style={{ color: PALETTE.accentPrimary }}
                              >
                                {matchedEventsCount}
                              </strong>{' '}
                              подходящих встреч
                            </p>
                          </motion.div>

                          <motion.div
                            variants={fadeItemVariants}
                            className="p-4 rounded-2xl text-left space-y-2"
                            style={{
                              backgroundColor: PALETTE.fieldBg,
                              border: `1px solid ${PALETTE.fieldBorder}`,
                            }}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: PALETTE.textMuted }}>Телефон</span>
                              <span
                                className="font-mono-num font-semibold"
                                style={{ color: PALETTE.textPrimary }}
                              >
                                {phoneNumber}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span style={{ color: PALETTE.textMuted }}>Почта</span>
                              <span
                                className="font-semibold truncate max-w-[200px]"
                                style={{ color: PALETTE.textPrimary }}
                              >
                                {email}
                              </span>
                            </div>
                            <div
                              className="pt-1 text-xs"
                              style={{ color: PALETTE.textSecondary }}
                            >
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
                                background: `linear-gradient(180deg, ${PALETTE.accentGradFrom} 0%, ${PALETTE.accentGradTo} 100%)`,
                                boxShadow: `0 10px 24px -6px ${PALETTE.accentShadow}, inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
                              }}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>
                                {isEditProfileMode ? 'Готово' : 'Завершить регистрацию'}
                              </span>
                            </motion.button>

                            <button
                              type="button"
                              onClick={() => navigateToStep(3)}
                              className="w-full py-2 text-xs font-semibold transition-colors cursor-pointer"
                              style={{ color: PALETTE.textMuted }}
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
