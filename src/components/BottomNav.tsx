import React from 'react';
import { Compass, Flame, PlusCircle, MessageSquare, User } from 'lucide-react';

export type NavTab = 'feed' | 'today' | 'create' | 'chats' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unreadChatCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadChatCount = 0,
}) => {
  const tabs = [
    { id: 'feed' as NavTab, label: 'Главная', icon: Compass },
    { id: 'today' as NavTab, label: 'Сегодня', icon: Flame, isSpecial: true },
    { id: 'create' as NavTab, label: 'Создать', icon: PlusCircle, isCreate: true },
    { id: 'chats' as NavTab, label: 'Чаты', icon: MessageSquare, badge: unreadChatCount },
    { id: 'profile' as NavTab, label: 'Профиль', icon: User },
  ];

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
      <div
        className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-2 rounded-3xl border shadow-2xl backdrop-blur-xl pointer-events-auto transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCreate) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
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
              onClick={() => onTabChange(tab.id)}
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
                    className="absolute -top-1 -right-2 w-4 h-4 text-white rounded-full text-[9px] font-bold flex items-center justify-center"
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
      </div>
    </nav>
  );
};
