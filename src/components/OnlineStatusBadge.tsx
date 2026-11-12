import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
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
  const isOnline = status === 'online';
  const isRecent = status === 'recent';

  const colorClass = isOnline
    ? 'text-emerald-600 dark:text-emerald-400'
    : isRecent
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-slate-400';

  const label = isOnline
    ? 'В сети'
    : lastSeen || (isRecent ? 'Недавно' : 'Не в сети');

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${colorClass} ${textSize}`}
      title={label}
    >
      {isOnline ? (
        <CheckCircle2 className={`${iconSize} shrink-0`} />
      ) : (
        <Clock className={`${iconSize} shrink-0`} />
      )}
      {showText && <span className="tabular-nums whitespace-nowrap">{label}</span>}
    </span>
  );
};
