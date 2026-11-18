import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface AdminPanelModalProps {
  onClose: () => void;
  onActionComplete: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  onClose,
  onActionComplete,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'kpi' | 'reports' | 'events'>('kpi');

  const loadOverview = async () => {
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err) {
      console.error('Admin overview err:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleReportAction = async (
    reportId: string,
    action: 'dismiss' | 'block_user' | 'delete_event'
  ) => {
    try {
      await api.adminReportAction(reportId, action);
      await loadOverview();
      onActionComplete();
    } catch (err) {
      console.error('Failed to execute admin action:', err);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
        <div
          className="p-6 rounded-2xl text-xs border"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Загрузка центра безопасности...
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 30, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl rounded-t-[28px] sm:rounded-[28px] shadow-2xl border flex flex-col max-h-[92dvh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Mobile Grabber */}
        <div className="pt-2 pb-0.5 flex justify-center sm:hidden shrink-0">
          <div
            className="w-9 h-1 rounded-full opacity-20"
            style={{ backgroundColor: 'var(--text-primary)' }}
          />
        </div>

        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2
                className="text-sm sm:text-base font-display font-bold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Центр доверия и модерации Kompa
              </h2>
              <span
                className="text-[11px]"
                style={{ color: 'var(--text-secondary)' }}
              >
                Контроль верификации, обращений и правил клуба
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation */}
        <div
          className="px-5 pt-3 pb-2 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            {[
              { id: 'kpi' as const, label: 'Метрики клуба' },
              {
                id: 'reports' as const,
                label: 'Обращения',
                badge: data.kpi.pendingReports,
              },
              {
                id: 'events' as const,
                label: `События (${data.recentEvents.length})`,
              },
            ].map(item => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: active
                      ? 'var(--bg-surface)'
                      : 'transparent',
                    color: active
                      ? 'var(--text-primary)'
                      : 'var(--text-secondary)',
                  }}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono-num">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 pb-safe">
          {tab === 'kpi' && (
            <div className="space-y-4">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Ключевые показатели сообщества
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Участников', value: data.kpi.totalUsers },
                  { label: 'Активных встреч', value: data.kpi.activeEvents },
                  { label: 'Заявок в компании', value: data.kpi.totalApplications },
                  {
                    label: 'Одобрение слотов',
                    value: `${data.kpi.acceptanceRatePercent}%`,
                    accent: true,
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border"
                    style={{
                      backgroundColor: stat.accent
                        ? 'var(--accent-soft)'
                        : 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span
                      className="text-[11px] font-medium block"
                      style={{
                        color: stat.accent
                          ? 'var(--accent-text)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className="text-2xl font-display font-extrabold font-mono-num block mt-0.5"
                      style={{
                        color: stat.accent
                          ? 'var(--accent-text)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Security scan status */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span
                    className="font-bold block mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Проактивный фильтр безопасности Kompa Trust активен
                  </span>
                  <p
                    className="leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Все публикуемые встречи автоматически проверяются на соответствие этике клуба, отсутствие коммерческого спама и защиту точных адресов участников.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-3">
              <h3
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Обращения участников
              </h3>

              {data.reports.length === 0 ? (
                <div
                  className="p-8 text-center text-xs rounded-2xl border"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Активных жалоб нет. В клубе полный порядок.
                </div>
              ) : (
                data.reports.map((r: any) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border space-y-2 text-xs"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-500 font-bold text-[10px]">
                          {r.reason}
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          от {r.reporterName}
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {r.status === 'pending'
                          ? 'Ожидает решения'
                          : 'Обработано'}
                      </span>
                    </div>

                    <div
                      className="font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Объект: {r.targetTitle} ({r.targetType})
                    </div>
                    <p
                      className="p-2.5 rounded-xl border"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      «{r.details}»
                    </p>

                    {r.status === 'pending' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleReportAction(r.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          Отклонить
                        </button>
                        {r.targetType === 'user' && (
                          <button
                            onClick={() =>
                              handleReportAction(r.id, 'block_user')
                            }
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Заблокировать профиль
                          </button>
                        )}
                        {r.targetType === 'event' && (
                          <button
                            onClick={() =>
                              handleReportAction(r.id, 'delete_event')
                            }
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Снять встречу
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'events' && (
            <div className="space-y-2">
              {data.recentEvents.map((e: any) => (
                <div
                  key={e.id}
                  className="p-3 rounded-xl border flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div>
                    <span
                      className="font-bold block"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {e.title}
                    </span>
                    <span
                      className="text-[11px] font-mono-num"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {e.category} · Орг: {e.organizerName} · {e.occupiedSpots}/
                      {e.totalSpots} мест
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      e.status === 'open'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-slate-500/15 text-slate-400'
                    }`}
                  >
                    {e.status === 'open' ? 'Активно' : e.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
