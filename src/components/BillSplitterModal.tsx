import React, { useState } from 'react';
import { X, Calculator, DollarSign, Users, Check, Copy } from 'lucide-react';

interface BillSplitterModalProps {
  totalParticipants: number;
  onClose: () => void;
}

export const BillSplitterModal: React.FC<BillSplitterModalProps> = ({
  totalParticipants,
  onClose,
}) => {
  const [totalAmount, setTotalAmount] = useState<number>(6000);
  const [participantsCount, setParticipantsCount] = useState<number>(Math.max(2, totalParticipants));
  const [includeTips, setIncludeTips] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const tipsAmount = includeTips ? Math.round(totalAmount * 0.1) : 0;
  const grandTotal = totalAmount + tipsAmount;
  const perPerson = Math.ceil(grandTotal / (participantsCount || 1));

  const splitText = `Калькулятор счета Kompa:
Общая сумма счета: ${totalAmount.toLocaleString()} ₽
${includeTips ? `Чаевые (10%): ${tipsAmount.toLocaleString()} ₽\n` : ''}Итого к оплате: ${grandTotal.toLocaleString()} ₽
Количество участников: ${participantsCount} чел.
С каждого по: ${perPerson.toLocaleString()} ₽`;

  const handleCopy = () => {
    navigator.clipboard.writeText(splitText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <Calculator className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Сплит счета встречи
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Легкий и прозрачный расчет, чтобы избежать неловкости при оплате в ресторане или кафе.
          </p>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Общая сумма по чеку (₽)
            </label>
            <input
              type="number"
              step="100"
              value={totalAmount}
              onChange={e => setTotalAmount(Number(e.target.value) || 0)}
              className="w-full p-3 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Участников
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={participantsCount}
                onChange={e => setParticipantsCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeTips}
                  onChange={e => setIncludeTips(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Чаевые (+10%)</span>
              </label>
            </div>
          </div>

          {/* Result Highlight */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs font-medium text-amber-800 block">
              С каждого участника:
            </span>
            <span className="text-3xl font-black text-slate-900 block my-1 tabular-nums">
              {perPerson.toLocaleString()} ₽
            </span>
            <span className="text-[11px] text-slate-500">
              Итого {grandTotal.toLocaleString()} ₽ на {participantsCount} чел.
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Скопировано для отправки в чат!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Скопировать расчет в чат события</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
