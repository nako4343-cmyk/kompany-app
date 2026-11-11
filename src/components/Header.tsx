import React, { useState } from 'react';
import { ShieldCheck, Bell, ChevronDown, CheckCircle2, Palette, Sparkles, QrCode, Share2 } from 'lucide-react';
import { UserProfile, AppNotification } from '../types/index.ts';

export type ColorPaletteId = 'sunset' | 'cobalt' | 'midnight';

interface HeaderProps {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onOpenSafetyGuide: () => void;
  onOpenAdmin: () => void;
  onOpenDemoShare?: () => void;
  activePalette: ColorPaletteId;
  onChangePalette: (palette: ColorPaletteId) => void;
}

const PALETTES: Array<{
  id: ColorPaletteId;
  name: string;
  desc: string;
  swatch: string;
  bgPreview: string;
}> = [
  {
    id: 'sunset',
    name: 'Warm Terracotta',
    desc: 'Теплый камень, эспрессо и терракота',
    swatch: '#E04F33',
    bgPreview: '#FAF7F2',
  },
  {
    id: 'cobalt',
    name: 'Electric Cobalt',
    desc: 'Свежий кобальт, кварц и мята',
    swatch: '#3B44F6',
    bgPreview: '#F4F6FB',
  },
  {
    id: 'midnight',
    name: 'Midnight Lounge',
    desc: 'Вечерний оникс и неоновый коралл',
    swatch: '#FF5E3A',
    bgPreview: '#161922',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  notifications,
  onNotificationClick,
  onOpenSafetyGuide,
  onOpenAdmin,
  onOpenDemoShare,
  activePalette,
  onChangePalette,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showPaletteDropdown, setShowPaletteDropdown] = useState(false);

  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-200"
      style={{
        backgroundColor: activePalette === 'midnight' ? 'rgba(22, 25, 34, 0.88)' : 'rgba(255, 255, 255, 0.88)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <span
            className="w-9 h-9 rounded-2xl text-white font-display font-bold flex items-center justify-center text-base shadow-sm transition-transform group-hover:scale-105"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            K
          </span>
          <span
            className="text-lg font-display font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            kompany
          </span>
        </a>

        {/* Zone 2: Interactive Palette Switcher & Trust Links */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Inline Palette Pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            {PALETTES.map((p) => {
              const isSelected = activePalette === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onChangePalette(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                  title={p.desc}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: p.swatch }}
                  />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenSafetyGuide}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
            }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Приватность</span>
          </button>

          {onOpenDemoShare && (
            <button
              onClick={onOpenDemoShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs active:scale-95"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Показать друзьям (QR)</span>
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenAdmin}
              className="px-3.5 py-2 rounded-2xl text-xs font-semibold text-purple-600 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Модерация
            </button>
          )}
        </div>

        {/* Zone 3: Mobile Palette Trigger, Notifications & User Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Demo Share Trigger */}
          {onOpenDemoShare && (
            <button
              onClick={onOpenDemoShare}
              className="p-2.5 rounded-2xl border transition-colors md:hidden flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-text)',
              }}
              title="Показать друзьям / QR-код"
            >
              <QrCode className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </button>
          )}

          {/* Mobile Palette Switcher Button */}
          <div className="relative md:hidden">
            <button
              onClick={() => {
                setShowPaletteDropdown(!showPaletteDropdown);
                setShowNotifDropdown(false);
                setShowUserDropdown(false);
              }}
              className="p-2.5 rounded-2xl border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Сменить цветовую тему"
            >
              <Palette className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            </button>

            {showPaletteDropdown && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-3xl shadow-2xl border p-2.5 z-50 space-y-1"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Цветовая атмосфера
                </div>
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChangePalette(p.id);
                      setShowPaletteDropdown(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl text-left text-xs transition-colors"
                    style={{
                      backgroundColor: activePalette === p.id ? 'var(--bg-elevated)' : 'transparent',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: p.swatch }}
                      />
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          {p.desc}
                        </div>
                      </div>
                    </div>
                    {activePalette === p.id && (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
                setShowPaletteDropdown(false);
              }}
              className="relative p-2.5 rounded-2xl border transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Уведомления"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl shadow-2xl border p-2.5 z-50"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="px-3 py-2 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Уведомления ({notifications.length})
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Push-центр
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      Пока нет новых уведомлений
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n);
                          setShowNotifDropdown(false);
                        }}
                        className="p-3 text-left rounded-2xl transition-colors cursor-pointer my-1"
                        style={{
                          backgroundColor: n.isRead ? 'transparent' : 'var(--accent-soft)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: 'var(--accent-primary)' }}
                            />
                          )}
                        </div>
                        <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User selector dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDropdown(false);
                setShowPaletteDropdown(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-xl object-cover"
              />
              <span
                className="text-xs font-bold hidden sm:inline max-w-[100px] truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentUser.name.split(' ')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </button>

            {showUserDropdown && (
              <div
                className="absolute right-0 mt-2 w-72 rounded-3xl shadow-2xl border p-2.5 z-50"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    <span>{currentUser.city}</span>
                    <span>·</span>
                    <span className="text-emerald-600 font-semibold tabular-nums">
                      ★ {currentUser.reliability.score} ({currentUser.reliability.attendanceRate}% явка)
                    </span>
                  </div>
                </div>

                <div className="py-2">
                  <div className="text-[10px] uppercase font-bold px-3 pb-1.5 tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Переключить роль для теста:
                  </div>
                  {availableUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSwitchUser(u.id);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-2xl text-left text-xs transition-colors"
                      style={{
                        backgroundColor: u.id === currentUser.id ? 'var(--accent-soft)' : 'transparent',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                        <div>
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                            {u.id === 'user-anna' ? 'Организатор (День рождения)' :
                             u.id === 'user-mikhail' ? 'Кандидат / Настолки' :
                             u.id === 'user-elena' ? 'Одобренный гость' : 'Администратор'}
                          </div>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t flex flex-col gap-1" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={() => {
                      onOpenSafetyGuide();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    🛡️ Правила безопасных встреч
                  </button>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-purple-600 font-bold"
                    >
                      ⚡ Открыть панель модерации
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
