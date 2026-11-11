import React, { useState } from 'react';
import { Compass, Flame, PlusCircle, MessageSquare, User, Bell, CheckCheck, Sparkles, X } from 'lucide-react';
import { AppNotification } from '../types/index.ts';

export type NavTab = 'feed' | 'today' | 'create' | 'chats' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadChatCount?: number;
  unreadNotificationCount?: number;
  notifications?: AppNotification[];
  onNotificationClick?: (notif: AppNotification) => void;
  onMarkAllRead?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
  unreadNotificationCount,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
}) => {
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const computedUnreadNotifCount =
    unreadNotificationCount !== undefined
      ? unreadNotificationCount
      : notifications.filter(n => !n.isRead).length;

  const tabs = [
    { id: 'feed' as NavTab, label: 'Главная', icon: Compass },
    { id: 'today' as NavTab, label: 'Сегодня', icon: Flame, isSpecial: true },
    { id: 'create' as NavTab, label: 'Создать', icon: PlusCircle, isCreate: true },
    { id: 'chats' as NavTab, label: 'Чаты', icon: MessageSquare, badge: unreadChatCount },
    { id: 'profile' as NavTab, label: 'Профиль', icon: User },
  ];

  const handleTabClick = (tabId: NavTab) => {
    setShowNotifPanel(false);
    onTabChange(tabId);
  };

  return (
    <>
      {/* Backdrop when notification drawer is open */}
      {showNotifPanel && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] transition-opacity"
          onClick={() => setShowNotifPanel(false)}
        />
      )}

      <nav className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none">
        <div className="max-w-lg mx-auto relative">
          {/* Floating Notifications Sheet above BottomNav */}
          {showNotifPanel && (
            <div
              className="mb-3 w-full rounded-3xl border shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <div
                className="px-4 py-3 border-b flex items-center justify-between gap-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-elevated)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Уведомления и заявки
                  </span>
                  {computedUnreadNotifCount > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white tabular-nums"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                    >
                      +{computedUnreadNotifCount} новых
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {computedUnreadNotifCount > 0 && onMarkAllRead && (
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Прочитать все</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifPanel(false)}
                    className="p-1.5 rounded-xl transition-colors cursor-pointer hover:opacity-75"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Закрыть уведомления"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className="max-h-72 overflow-y-auto divide-y p-2 space-y-1"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center space-y-1.5">
                    <Sparkles className="w-6 h-6 mx-auto opacity-40" style={{ color: 'var(--accent-primary)' }} />
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Все уведомления прочитаны
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Здесь будут появляться новые заявки на ваши встречи и ответы организаторов
                    </p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        if (onNotificationClick) {
                          onNotificationClick(n);
                        }
                        setShowNotifPanel(false);
                      }}
                      className="w-full p-3 text-left rounded-2xl transition-all cursor-pointer flex items-start justify-between gap-3 hover:opacity-95"
                      style={{
                        backgroundColor: n.isRead ? 'transparent' : 'var(--accent-soft)',
                      }}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          {n.type === 'application_received' && !n.isRead && (
                            <span
                              className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-white shrink-0"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                              Заявка
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {n.message}
                        </p>
                      </div>

                      {!n.isRead && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 animate-pulse"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Main Bottom Navigation Bar */}
          <div
            className="grid grid-cols-6 items-center h-16 px-1.5 sm:px-2 rounded-3xl border shadow-2xl backdrop-blur-xl pointer-events-auto transition-colors duration-200"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {/* First 4 tabs: Главная, Сегодня, Создать, Чаты */}
            {tabs.slice(0, 4).map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && !showNotifPanel;

              if (tab.isCreate) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className="flex flex-col items-center justify-center -mt-4 group min-h-[44px] cursor-pointer"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg group-active:scale-95 transition-transform"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        boxShadow: '0 8px 20px var(--badge-glow)',
                      }}
                    >
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <span
                      className="text-[10px] font-bold mt-1 whitespace-nowrap"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Создать
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className="flex flex-col items-center justify-center py-1 relative min-h-[44px] cursor-pointer"
                >
                  <div className="relative">
                    <Icon
                      className="w-5 h-5 transition-colors"
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        strokeWidth: isActive ? 2.5 : 2,
                      }}
                    />
                    {tab.badge && tab.badge > 0 ? (
                      <span
                        className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 text-white rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums shadow-xs"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      >
                        {tab.badge}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className="text-[10px] tracking-tight mt-1 transition-colors whitespace-nowrap"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* 5th button: Dedicated Notifications button with unread Badge */}
            <button
              type="button"
              onClick={() => setShowNotifPanel(prev => !prev)}
              aria-label="Уведомления"
              className="flex flex-col items-center justify-center py-1 relative min-h-[44px] cursor-pointer"
            >
              <div className="relative">
                <Bell
                  className="w-5 h-5 transition-colors"
                  style={{
                    color: showNotifPanel ? 'var(--accent-primary)' : 'var(--text-muted)',
                    strokeWidth: showNotifPanel ? 2.5 : 2,
                  }}
                />
                {computedUnreadNotifCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 text-white rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums shadow-xs ring-2 ring-[var(--bg-surface)]"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {computedUnreadNotifCount > 9 ? '9+' : computedUnreadNotifCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] tracking-tight mt-1 transition-colors whitespace-nowrap"
                style={{
                  color: showNotifPanel ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: showNotifPanel ? 700 : 500,
                }}
              >
                Заявки
              </span>
            </button>

            {/* 6th button: Профиль */}
            {(() => {
              const profileTab = tabs[4];
              const Icon = profileTab.icon;
              const isActive = activeTab === profileTab.id && !showNotifPanel;
              return (
                <button
                  key={profileTab.id}
                  type="button"
                  onClick={() => handleTabClick(profileTab.id)}
                  className="flex flex-col items-center justify-center py-1 relative min-h-[44px] cursor-pointer"
                >
                  <div className="relative">
                    <Icon
                      className="w-5 h-5 transition-colors"
                      style={{
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                        strokeWidth: isActive ? 2.5 : 2,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] tracking-tight mt-1 transition-colors whitespace-nowrap"
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {profileTab.label}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      </nav>
    </>
  );
};
