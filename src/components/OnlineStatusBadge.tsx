import React from 'react';
import { UserOnlineStatus } from '../types/index.ts';

interface OnlineStatusBadgeProps {
  status?: UserOnlineStatus;
  lastSeen?: string;
  size?: 'sm' | 'md';
  showText?: boolean;
}

export const OnlineStatusBadge: React.FC<OnlineStatusBadgeProps> = ({
  status = 'recent',
  lastSeen,
  size = 'md',
  showText = true,
}) => {
  // Color configuration according to design specs:
  // Green for online now, Amber/Orange for was recent, Slate for offline
  const isOnline = status === 'online';
  const isRecent = status === 'recent';

  const dotColorClass = isOnline
    ? 'bg-emerald-500'
    : isRecent
    ? 'bg-amber-500'
    : 'bg-slate-400';

  const ringColorClass = isOnline
    ? 'ring-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : isRecent
    ? 'ring-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : 'ring-slate-400/20 bg-slate-400/10 text-slate-500';

  const label = isOnline
    ? 'Онлайн сейчас'
    : lastSeen || (isRecent ? 'Был(а) недавно' : 'Не в сети');

  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${ringColorClass} ${textSize}`}
      style={{
        borderColor: isOnline
          ? 'rgba(16, 185, 129, 0.3)'
          : isRecent
          ? 'rgba(245, 158, 11, 0.3)'
          : 'var(--border-subtle)',
      }}
      title={label}
    >
      <span className="relative flex items-center justify-center">
        {isOnline && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColorClass}`}
          />
        )}
        <span className={`relative inline-flex rounded-full ${dotSize} ${dotColorClass}`} />
      </span>

      {showText && <span className="tabular-nums whitespace-nowrap">{label}</span>}
    </div>
  );
};
