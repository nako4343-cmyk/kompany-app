import React, { useState } from 'react';
import { X, ShieldCheck, Copy, Share2, Check, Send, AlertTriangle } from 'lucide-react';
import { EventItem } from '../types/index.ts';

interface SafetyShareModalProps {
  event: EventItem;
  onClose: () => void;
}

export const SafetyShareModal: React.FC<SafetyShareModalProps> = ({ event, onClose }) => {
  const [copied, setCopied] = useState(false);

  const shareText = `🛡️ Защитная карточка встречи через Kompany:
Мероприятие: «${event.title}»
Организатор: ${event.organizer.name} (Рейтинг: ★${event.organizer.reliability.score}, ${event.organizer.reliability.attendanceRate}% явка)
Время: ${event.isToday ? 'Сегодня' : event.date} в ${event.time}
Точное место: ${event.exactVenue || event.approximateArea}
Адрес: ${event.exactAddress || event.approximateArea}
${event.organizerPhone ? `Телефон организатора: ${event.organizerPhone}` : ''}
Участников: ${event.occupiedSpots} чел.
Если я не выйду на связь после завершения встречи, эти данные помогут знать, где я нахожусь.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Поделиться встречей с близким
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Функция «Доверенный контакт»</span>
              Перед выходом отправьте информацию родственнику или близкому другу. Он будет знать, с кем и где вы находитесь.
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Карточка встречи для отправки:
            </span>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {shareText}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопировано в буфер обмена!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Скопировать карточку безопасности</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            Вы можете вставить этот текст в Telegram, WhatsApp или отправить SMS вашему близкому человеку.
          </p>
        </div>
      </div>
    </div>
  );
};
