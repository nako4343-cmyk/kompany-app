import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ShieldAlert,
  ChevronDown,
  Users,
  Share2,
  Palette,
  Check,
  ShieldCheck,
  Sparkles,
  Globe,
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types/index.ts';
import { OnlineStatusBadge } from './OnlineStatusBadge.tsx';
import { AppLanguage, LANGUAGE_OPTIONS, UI_TEXT } from '../i18n/translations.ts';

export type ColorPaletteId = 'sunset' | 'cobalt' | 'midnight';

export interface PaletteOption {
  id: ColorPaletteId;
  name: string;
  subtitle: string;
  swatchBg: string;
  swatchAccent: string;
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'sunset',
    name: 'Warm Terracotta',
    subtitle: 'Тёплый терракотовый',
    swatchBg: '#FAF7F2',
    swatchAccent: '#E04F33',
  },
  {
    id: 'cobalt',
    name: 'Electric Cobalt',
    subtitle: 'Кобальт и сланец',
    swatchBg: '#F4F6FA',
    swatchAccent: '#2563EB',
  },
  {
    id: 'midnight',
    name: 'Midnight Lounge',
    subtitle: 'Вечерний неон',
    swatchBg: '#0B0F17',
    swatchAccent: '#FF6B4A',
  },
];

interface HeaderProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  notifications: AppNotification[];
  activePalette: ColorPaletteId;
  onChangePalette: (palette: ColorPaletteId) => void;
  lang?: AppLanguage;
  onChangeLang?: (lang: AppLanguage) => void;
  onSwitchUser: (userId: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
  onMarkAllRead?: () => void;
  onOpenSafetyGuide: () => void;
  onOpenAdmin?: () => void;
  onOpenAdminPanel?: () => void;
  onOpenDemoShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableUsers,
  notifications,
  activePalette,
  onChangePalette,
  lang = 'ru',
  onChangeLang,
  onSwitchUser,
  onNotificationClick,
  onMarkAllRead,
  onOpenSafetyGuide,
  onOpenAdmin,
  onOpenAdminPanel,
  onOpenDemoShare,
}) => {
  const t = UI_TEXT[lang];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activePaletteObj =
    PALETTE_OPTIONS.find((p) => p.id === activePalette) || PALETTE_OPTIONS[0];
  const activeLangObj =
    LANGUAGE_OPTIONS.find((l) => l.id === lang) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (
        switcherRef.current &&
        !switcherRef.current.contains(event.target as Node)
      ) {
        setShowUserSwitcher(false);
      }
      if (
        paletteRef.current &&
        !paletteRef.current.contains(event.target as Node)
      ) {
        setShowPaletteMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-xl transition-colors duration-200"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left Zone: Brand Identity */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: -6, scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-display font-extrabold text-lg shadow-sm"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            K
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-display font-extrabold text-base tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Kompa
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                }}
              >
                {lang === 'en' ? 'Moscow' : 'Москва'}
              </span>
            </div>
            <p
              className="text-[11px] hidden sm:block"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.brandTagline}
            </p>
          </div>
        </div>

        {/* Right Zone: Actions, Language Switcher, Single Theme Button, Notifications & Account */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Safety Guide Trigger */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenSafetyGuide}
            title={t.safetyBtnTitle}
            className="p-2 rounded-xl transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </motion.button>

          {/* Share Link Button */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenDemoShare}
            title={t.shareBtnTitle}
            className="p-2 rounded-xl transition-colors cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Share2 className="w-4 h-4" />
          </motion.button>

          {/* Admin Panel Trigger (if admin) */}
          {currentUser.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenAdmin || onOpenAdminPanel}
              title={t.adminBtnTitle}
              className="p-2 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
              }}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden lg:inline">Модерация</span>
            </motion.button>
          )}

          {/* Language Selector Button (RU / ES) */}
          {onChangeLang && (
            <div className="relative" ref={langRef}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLangMenu((prev) => !prev)}
                title={t.langBtnTitle}
                className="px-2.5 py-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <Globe
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span>{activeLangObj.shortLabel}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    showLangMenu ? 'rotate-180' : ''
                  }`}
                  style={{ color: 'var(--text-muted)' }}
                />
              </motion.button>

              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-44 rounded-2xl shadow-xl border p-1.5 z-50"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div
                      className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {t.langMenuHeader}
                    </div>
                    {LANGUAGE_OPTIONS.map((option) => {
                      const isSelected = lang === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            onChangeLang(option.id);
                            setShowLangMenu(false);
                          }}
                          className="w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between text-xs font-semibold transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isSelected
                              ? 'var(--accent-soft)'
                              : 'transparent',
                            color: isSelected
                              ? 'var(--accent-text)'
                              : 'var(--text-primary)',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-5 rounded-md text-[10px] font-extrabold flex items-center justify-center border"
                              style={{
                                backgroundColor: 'var(--bg-elevated)',
                                borderColor: 'var(--border-subtle)',
                              }}
                            >
                              {option.shortLabel}
                            </span>
                            <span>{option.nativeName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Unified Single Theme Selector Button on the Right */}
          <div className="relative" ref={paletteRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPaletteMenu((prev) => !prev)}
              title={t.themeBtnTitle}
              className="px-2.5 py-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <Palette
                className="w-3.5 h-3.5"
                style={{ color: 'var(--accent-primary)' }}
              />
              <span
                className="w-3 h-3 rounded-full border shrink-0"
                style={{
                  backgroundColor: activePaletteObj.swatchAccent,
                  borderColor: 'rgba(125,125,125,0.35)',
                }}
              />
              <span className="hidden xl:inline text-[11px] font-semibold">
                {activePaletteObj.name}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  showPaletteMenu ? 'rotate-180' : ''
                }`}
                style={{ color: 'var(--text-muted)' }}
              />
            </motion.button>

            <AnimatePresence>
              {showPaletteMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-60 rounded-2xl shadow-xl border p-1.5 z-50"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t.themeMenuHeader}
                  </div>
                  {PALETTE_OPTIONS.map((p) => {
                    const isSelected = activePalette === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onChangePalette(p.id);
                          setShowPaletteMenu(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between text-xs font-medium transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--accent-soft)'
                            : 'transparent',
                          color: isSelected
                            ? 'var(--accent-text)'
                            : 'var(--text-primary)',
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border shrink-0"
                            style={{
                              backgroundColor: p.swatchAccent,
                              borderColor: 'rgba(125,125,125,0.3)',
                            }}
                          />
                          <div>
                            <div className="font-semibold leading-tight">
                              {p.name}
                            </div>
                            <div className="text-[10px] opacity-75">
                              {p.subtitle}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 rounded-xl border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl shadow-2xl border overflow-hidden z-50"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="p-3.5 border-b flex items-center justify-between"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {t.notificationsTitle}
                      </span>
                      {unreadCount > 0 && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent-text)',
                          }}
                        >
                          {unreadCount} {t.notificationsUnread}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllRead}
                        className="text-xs font-semibold hover:underline cursor-pointer"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        {t.notificationsMarkAllRead}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center space-y-2">
                        <Sparkles
                          className="w-6 h-6 mx-auto opacity-40"
                          style={{ color: 'var(--text-muted)' }}
                        />
                        <p
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {t.notificationsEmptyTitle}
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            onNotificationClick(n);
                            setShowNotifications(false);
                          }}
                          className="p-3.5 transition-colors cursor-pointer hover:opacity-90"
                          style={{
                            backgroundColor: !n.isRead
                              ? 'var(--accent-soft)'
                              : 'transparent',
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className="font-semibold text-xs"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0 mt-1"
                                style={{
                                  backgroundColor: 'var(--accent-primary)',
                                }}
                              />
                            )}
                          </div>
                          <p
                            className="text-xs mt-1 leading-relaxed"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Demo User Switcher */}
          <div className="relative" ref={switcherRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowUserSwitcher((prev) => !prev)}
              className="flex items-center gap-2.5 py-1 pl-1.5 pr-3 rounded-full border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="relative shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover block"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-elevated)] ${
                    currentUser.onlineStatus === 'offline'
                      ? 'bg-slate-400'
                      : currentUser.onlineStatus === 'recent'
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="text-left hidden sm:flex flex-col justify-center leading-tight">
                <div
                  className="text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[11px] font-bold text-amber-500 inline-flex items-center gap-0.5 tabular-nums">
                    ★ {currentUser.reliability.score}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5 whitespace-nowrap">
                  {lang === 'en' ? 'Online' : 'В сети'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                  showUserSwitcher ? 'rotate-180' : ''
                }`}
                style={{ color: 'var(--text-muted)' }}
              />
            </motion.button>

            <AnimatePresence>
              {showUserSwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-76 rounded-3xl shadow-2xl border overflow-hidden z-50"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div
                    className="p-3 border-b flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t.switchDemoAccount}</span>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {availableUsers.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            onSwitchUser(u.id);
                            setShowUserSwitcher(false);
                          }}
                          className="w-full p-2.5 rounded-2xl flex items-center gap-3 text-left transition-colors cursor-pointer"
                          style={{
                            backgroundColor: isCurrent
                              ? 'var(--accent-soft)'
                              : 'transparent',
                          }}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover block"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-surface)] ${
                                u.onlineStatus === 'offline'
                                  ? 'bg-slate-400'
                                  : u.onlineStatus === 'recent'
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className="text-xs font-bold truncate"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {u.name}
                              </span>
                              <span className="text-[11px] font-bold text-amber-500 shrink-0 tabular-nums">
                                ★ {u.reliability.score}
                              </span>
                            </div>
                            <div
                              className="text-[11px] truncate flex items-center gap-1.5 mt-0.5"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <span className="truncate">
                                {u.occupation
                                  ? `${u.occupation} · `
                                  : u.role === 'admin'
                                  ? 'Модератор · '
                                  : ''}
                                {u.reliability.attendanceRate}%
                              </span>
                              <OnlineStatusBadge
                                status={u.onlineStatus}
                                size="sm"
                                showText={false}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
