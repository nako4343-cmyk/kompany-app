import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Plus,
  MessageSquare,
  User,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { AppNotification } from '../types/index.ts';
import { AppLanguage, UI_TEXT } from '../i18n/translations.ts';

export type NavTab = 'feed' | 'today' | 'create' | 'chats' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadChatCount?: number;
  unreadNotificationCount?: number;
  notifications?: AppNotification[];
  onNotificationClick?: (notif: AppNotification) => void;
  onMarkAllRead?: () => void;
  lang?: AppLanguage;
}

const triggerHaptic = () => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(6);
    }
  } catch {
    // ignore
  }
};

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  unreadNotificationCount = 0,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  lang = 'ru',
}) => {
  const t = UI_TEXT[lang];
  const [showNotifications, setShowNotifications] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const computedUnreadNotifs =
    unreadNotificationCount > 0
      ? unreadNotificationCount
      : notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const leftTabs = [
    { id: 'feed' as NavTab, label: t.navFeed, icon: Compass },
    {
      id: 'chats' as NavTab,
      label: t.navChats,
      icon: MessageSquare,
      badge: unreadChatCount,
    },
  ];

  const rightTab = { id: 'profile' as NavTab, label: t.navProfile, icon: User };

  const renderTabButton = (tab: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id && !showNotifications;

    return (
      <motion.button
        key={tab.id}
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          triggerHaptic();
          setShowNotifications(false);
          onTabChange(tab.id);
        }}
        className="relative flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-2xl transition-colors cursor-pointer"
        style={{
          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
        }}
      >
        {isActive && (
          <motion.div
            layoutId="bottom-nav-pill"
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="absolute inset-0 rounded-2xl"
            style={{ backgroundColor: 'var(--accent-soft)' }}
          />
        )}
        <div className="relative z-10">
          <Icon
            className={`w-5 h-5 transition-transform duration-200 ${
              isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'
            }`}
          />
          {tab.badge && tab.badge > 0 ? (
            <span
              className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              {tab.badge}
            </span>
          ) : null}
        </div>
        <span
          className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all whitespace-nowrap ${
            isActive ? 'font-bold' : 'font-medium'
          }`}
        >
          {tab.label}
        </span>
      </motion.button>
    );
  };

  return (
    <div
      ref={popoverRef}
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-lg pb-safe pointer-events-none"
    >
      {/* Floating Notifications Popover above BottomNav */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 rounded-3xl shadow-2xl border overflow-hidden pointer-events-auto"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              className="px-4 py-3 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Bell
                  className="w-4 h-4"
                  style={{ color: 'var(--accent-primary)' }}
                />
                <span
                  className="font-display font-bold text-xs sm:text-sm"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t.notificationsTitle}
                </span>
                {computedUnreadNotifs > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white tabular-nums"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {computedUnreadNotifs} {t.notificationsUnread}
                  </span>
                )}
              </div>

              {computedUnreadNotifs > 0 && onMarkAllRead && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t.notificationsMarkAllRead}</span>
                </button>
              )}
            </div>

            <div
              className="max-h-72 overflow-y-auto divide-y"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {notifications.length === 0 ? (
                <div
                  className="p-6 text-center text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t.notificationsEmptyTitle}
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => {
                      onNotificationClick?.(notif);
                      setShowNotifications(false);
                    }}
                    className="w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: !notif.isRead
                        ? 'var(--accent-soft)'
                        : 'transparent',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{
                        backgroundColor: !notif.isRead
                          ? 'var(--accent-primary)'
                          : 'transparent',
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs font-bold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {notif.title}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-0.5 leading-relaxed line-clamp-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {notif.message}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Dock Bar: 5 symmetric columns with '+' centered */}
      <nav
        aria-label="Нижняя навигация"
        className="w-full rounded-3xl border shadow-2xl px-2 py-1.5 transition-colors duration-250 pointer-events-auto"
        style={{
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="grid grid-cols-5 items-center gap-1">
          {/* 1. Feed & 2. Chats */}
          {leftTabs.map((tab) => renderTabButton(tab))}

          {/* 3. Center '+' Create Event Button */}
          <div className="flex items-center justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                triggerHaptic();
                setShowNotifications(false);
                onTabChange('create');
              }}
              aria-label={t.createShortBtn}
              title={t.createShortBtn}
              className="w-12 h-11 rounded-2xl text-white font-display font-bold flex items-center justify-center shadow-lg cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Plus className="w-5 h-5 stroke-[2.6]" />
            </motion.button>
          </div>

          {/* 4. Profile */}
          {renderTabButton(rightTab)}

          {/* 5. Notifications */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              triggerHaptic();
              setShowNotifications((prev) => !prev);
            }}
            aria-label={t.navNotifications}
            title={t.navNotifications}
            className="relative flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-2xl transition-colors cursor-pointer"
            style={{
              color: showNotifications
                ? 'var(--accent-primary)'
                : 'var(--text-muted)',
            }}
          >
            {showNotifications && (
              <motion.div
                layoutId="bottom-nav-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-2xl"
                style={{ backgroundColor: 'var(--accent-soft)' }}
              />
            )}
            <div className="relative z-10">
              <Bell
                className={`w-5 h-5 transition-transform duration-200 ${
                  showNotifications ? 'stroke-[2.3]' : 'stroke-[1.8]'
                }`}
              />
              {computedUnreadNotifs > 0 && (
                <motion.span
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums shadow-xs"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {computedUnreadNotifs > 99 ? '99+' : computedUnreadNotifs}
                </motion.span>
              )}
            </div>
            <span
              className={`relative z-10 text-[10px] mt-0.5 tracking-tight transition-all whitespace-nowrap ${
                showNotifications ? 'font-bold' : 'font-medium'
              }`}
            >
              {t.navNotifications}
            </span>
          </motion.button>
        </div>
      </nav>
    </div>
  );
};
