import React, { useState, useEffect } from 'react';
import { 
  X, ShieldAlert, Users, Calendar, CheckCircle2, 
  Trash2, UserX, BarChart3, AlertTriangle, ShieldCheck 
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

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'block_user' | 'delete_event') => {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white p-6 rounded-2xl text-xs text-slate-500">
          Загрузка панели модератора...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none">
                Панель безопасности и модерации Kompany
              </h2>
              <span className="text-[10px] text-slate-400">
                Контроль качества, жалоб и защита пользователей
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setTab('kpi')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'kpi'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Метрики & Аналитика
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'reports'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Жалобы</span>
            {data.kpi.pendingReports > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {data.kpi.pendingReports}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('events')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'events'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Все события ({data.recentEvents.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {tab === 'kpi' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ключевые показатели платформы (KPI)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Пользователей
                  </span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {data.kpi.totalUsers}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Активных событий
                  </span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {data.kpi.activeEvents}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Всего заявок
                  </span>
                  <span className="text-2xl font-black text-slate-900 tabular-nums">
                    {data.kpi.totalApplications}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-[11px] text-purple-700 font-medium block">
                    % Одобрения
                  </span>
                  <span className="text-2xl font-black text-purple-900 tabular-nums">
                    {data.kpi.acceptanceRatePercent}%
                  </span>
                </div>
              </div>

              {/* Security scan status */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block mb-1">
                    AI-модерация Gemini активна
                  </span>
                  Все создаваемые события проверяются в реальном времени на запрещенные сборы, завуалированный эскорт и подозрительные локации.
                </div>
              </div>
            </div>
          )}

          {tab === 'reports' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Жалобы от пользователей
              </h3>

              {data.reports.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  Активных жалоб нет. Сообщество в полной безопасности!
                </div>
              ) : (
                data.reports.map((r: any) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {r.reason}
                        </span>
                        <span className="text-slate-500">от {r.reporterName}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {r.status === 'pending' ? 'Ожидает решения' : 'Обработано'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">
                      Объект: {r.targetTitle} ({r.targetType})
                    </div>
                    <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      "{r.details}"
                    </p>

                    {r.status === 'pending' && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleReportAction(r.id, 'dismiss')}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium"
                        >
                          Отклонить жалобу
                        </button>
                        {r.targetType === 'user' && (
                          <button
                            onClick={() => handleReportAction(r.id, 'block_user')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            Заблокировать нарушителя
                          </button>
                        )}
                        {r.targetType === 'event' && (
                          <button
                            onClick={() => handleReportAction(r.id, 'delete_event')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                          >
                            Удалить событие
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
                <div key={e.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{e.title}</span>
                    <span className="text-[11px] text-slate-500">
                      {e.category} · Орг: {e.organizerName} · {e.occupiedSpots}/{e.totalSpots} мест
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    e.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
