import React, { useState } from 'react';
import { X, Flag, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.ts';

interface ReportModalProps {
  targetType: 'user' | 'event';
  targetId: string;
  targetTitle: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  { id: 'scam', label: 'Подозрение в мошенничестве / денежные сборы' },
  { id: 'harassment', label: 'Агрессивное поведение / спам / оскорбления' },
  { id: 'illegal', label: 'Запрещенная деятельность / подозрительные услуги' },
  { id: 'commercial_spam', label: 'Скрытая реклама / продажа товаров' },
  { id: 'discrimination', label: 'Дискриминация' },
  { id: 'other', label: 'Другое нарушение правил' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetType,
  targetId,
  targetTitle,
  onClose,
}) => {
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.submitReport({
        targetType,
        targetId,
        reason,
        details: details.trim() || 'Пользователь подал жалобу',
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700">
            <Flag className="w-4 h-4" />
            <h2 className="text-sm font-bold text-slate-900">
              Пожаловаться на {targetType === 'event' ? 'мероприятие' : 'пользователя'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Жалоба принята</h3>
            <p className="text-xs text-slate-500">
              Служба модерации проверит объект в течение нескольких минут.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
              Объект: <span className="font-bold text-slate-900">{targetTitle}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Причина обращения:
              </label>
              <div className="space-y-1.5">
                {REPORT_REASONS.map(r => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs text-slate-800"
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Подробности (опционально):
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Опишите, что именно вызвало подозрение..."
                className="w-full h-20 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              {isSubmitting ? 'Отправляем...' : 'Отправить жалобу модераторам'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
