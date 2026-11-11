import React from 'react';
import { X, ShieldCheck, Lock, AlertTriangle, EyeOff, CheckCircle2, PhoneOff } from 'lucide-react';

interface SafetyGuideModalProps {
  onClose: () => void;
}

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              Кодекс доверия и безопасности
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-700 leading-relaxed">
          {/* Core Law */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Главный принцип: Скрытие данных до одобрения</span>
            </div>
            <p>
              До того как организатор подтвердил заявку участника, в открытом доступе <b>никогда не отображаются</b>:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900 font-medium">
              <li>Точный адрес здания и номер квартиры/офиса</li>
              <li>Точное название заведения или закрытого зала</li>
              <li>Личный номер телефона организатора</li>
              <li>Приватные инструкции по входу</li>
            </ul>
            <p className="text-[11px] text-amber-800 pt-1">
              В публичной ленте отображается исключительно примерный район (например: «Москва, Хамовники, ~2.5 км»).
            </p>
          </div>

          {/* Key Safety Rules */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Золотые правила первого знакомства:
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Только общественные места</span>
                Встречайтесь в ресторанах, кафе, парках, антикафе или на концертах. Никогда не соглашайтесь на встречи в безлюдных промзонах или закрытых частных квартирах на первом этапе.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Никаких предоплат незнакомцам</span>
                Каждый участник оплачивает свой счет в заведении лично на месте или покупает собственный билет. Платформа строго пресекает требования переводов на личные карты.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block">Опирайтесь на индекс надежности</span>
                Смотрите не только на «звёзды», но и на фактическую статистику: процент посещаемости (например, 100% явка, 0 неявок), количество организованных встреч и отзывы предыдущих участников.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
            ⚡ Если вы заметили подозрительное объявление, используйте кнопку <b>«Пожаловаться»</b> или <b>«Заблокировать»</b>. Наша система модерации работает круглосуточно.
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Понятно, я согласен с правилами
          </button>
        </div>
      </div>
    </div>
  );
};
