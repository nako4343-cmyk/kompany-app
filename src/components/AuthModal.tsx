import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  LogIn,
  LogOut,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Database,
  AlertCircle,
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
  onClose: () => void;
  onProfileRegistered: (updatedProfile: UserProfile) => void;
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

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  cloudUser,
  onClose,
  onProfileRegistered,
  lang = 'ru',
}) => {
  const isEn = lang === 'en';

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

      // Check if user already has a profile in Cloud DB
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
      setStatusMessage(
        isEn
          ? 'Signed in and synced profile with Cloud Database!'
          : 'Вход выполнен! Ваш профиль синхронизирован с облачной базой данных.'
      );
    } catch (err: any) {
      setErrorMessage(
        err?.message ||
          (isEn ? 'Authentication error. Please try again.' : 'Ошибка авторизации через Google.')
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
      setStatusMessage(
        activeFbUser
          ? isEn
            ? 'Profile saved to Cloud Database!'
            : 'Анкета сохранена в облачной базе данных Kompa!'
          : isEn
          ? 'Profile updated! Sign in with Google above to sync to the cloud.'
          : 'Анкета обновлена! Войдите через Google выше для сохранения в облачную БД.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutCloudUser();
    setStatusMessage(isEn ? 'Signed out of cloud account.' : 'Вы вышли из облачного аккаунта.');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
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
                {isEn ? 'Registration & Cloud Profile' : 'Регистрация и облачный профиль Kompa'}
              </h2>
              <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Database className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {cloudUser
                    ? isEn
                      ? `Connected as ${cloudUser.email}`
                      : `Облачная БД подключена · ${cloudUser.email}`
                    : isEn
                    ? 'Sign in with Google to sync your profile, events & chats'
                    : 'Авторизация и сохранение анкеты, событий и чатов в облачной БД'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Step 1: Google Cloud Auth Box */}
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {cloudUser
                    ? isEn
                      ? 'Verified Google Account Connected'
                      : 'Аккаунт подтверждён и синхронизирован с БД'
                    : isEn
                    ? 'Fast Registration via Google'
                    : 'Быстрая регистрация и вход через Google'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {cloudUser
                  ? isEn
                    ? 'Your email and phone are stored in an isolated private collection; only approved hosts see your contact details.'
                    : 'Ваш email и телефон защищены правилами безопасности БД и изолированы в приватной коллекции.'
                  : isEn
                  ? 'Click to sign in with Google and persist your profile, events, and applications in the cloud database.'
                  : 'Войдите через Google в 1 клик, чтобы привязать анкету, события и заявки к облачной базе данных.'}
              </p>
            </div>

            {cloudUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isEn ? 'Sign Out' : 'Выйти'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isLoadingAuth}
                onClick={handleGoogleSignIn}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shrink-0 cursor-pointer shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {isLoadingAuth
                    ? isEn
                      ? 'Connecting...'
                      : 'Подключение...'
                    : isEn
                    ? 'Sign in with Google'
                    : 'Войти через Google'}
                </span>
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 2: Registration & Seeker Profile Form */}
          <form onSubmit={handleSaveRegistration} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEn ? 'Your Name' : 'Ваше имя и фамилия'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEn ? 'Age (18–99)' : 'Возраст (18–99)'}
                </label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  required
                  value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
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
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEn ? 'Gender' : 'Пол (для подбора компании)'}
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'female' | 'male')}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
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
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEn ? 'City' : 'Город'}
                </label>
                <input
                  type="text"
                  maxLength={60}
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEn ? 'Occupation' : 'Профессия / Сфера'}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={occupation}
                  onChange={e => setOccupation(e.target.value)}
                  placeholder={isEn ? 'e.g. Product Designer' : 'Напр.: Дизайнер, IT'}
                  className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                {isEn ? 'About You' : 'О себе (кто вы и какую компанию ищете)'}
              </label>
              <textarea
                rows={2}
                maxLength={600}
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Interests Picker */}
            <div>
              <label className="text-[11px] font-bold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {isEn ? 'Your Interests (up to 10)' : 'Ваши интересы (для поиска совпадений)'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(tag => {
                  const active = interests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer"
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
              className="p-3 rounded-2xl border space-y-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <label className="flex items-center justify-between gap-2 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isEn
                      ? 'Badge: "Waiting for event invitations"'
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
                  placeholder={isEn ? 'What kind of events are you looking for?' : 'Пожелание для организаторов (напр.: Свободна в пятницу на настолки)'}
                  className="w-full px-3 py-1.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border text-xs font-bold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {isEn ? 'Close' : 'Закрыть'}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Database className="w-3.5 h-3.5" />
                <span>
                  {isSaving
                    ? isEn
                      ? 'Saving...'
                      : 'Сохранение...'
                    : isEn
                    ? 'Save Registration to Database'
                    : 'Сохранить анкету в базу данных'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
