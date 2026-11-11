import React, { useState } from 'react';
import { 
  X, Sparkles, ChevronRight, ChevronLeft, 
  Lock, CheckCircle2, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { EventCategory, EventBudgetTier, EventVibe, UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CreateEventModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onCreated: () => void;
}

const CATEGORIES: EventCategory[] = [
  'День рождения',
  'Ресторан / Бар',
  'Настольные игры',
  'Кино / Концерт',
  'Спорт',
  'Пикник / Шашлыки',
  'Прогулка',
  'Путешествие',
  'Вечеринка',
  'Квиз / Интеллект',
  'Другое'
];

const VIBES: EventVibe[] = [
  'Спокойная беседа',
  'Гастро-вечер',
  'Интеллектуальная игра',
  'Активный движ',
  'Праздничный вайб'
];

const BUDGET_TIERS: EventBudgetTier[] = [
  'Бесплатно',
  'до 1 000 ₽',
  '1 000–3 000 ₽',
  '3 000–5 000 ₽',
  '5 000+ ₽',
  'Бюджет обсуждается'
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  currentUser,
  onClose,
  onCreated,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [category, setCategory] = useState<EventCategory>('Ресторан / Бар');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [totalSpots, setTotalSpots] = useState(5);
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('20-35 лет, позитивный настрой, взаимное уважение');
  const [vibe, setVibe] = useState<EventVibe>('Спокойная беседа');
  const [musicOrMood, setMusicOrMood] = useState('Уютная атмосфера, живое общение без спешки');
  const [icebreakerQuestion, setIcebreakerQuestion] = useState('Какое место в городе ваше самое любимое?');
  const [budget, setBudget] = useState<EventBudgetTier>('1 000–3 000 ₽');
  
  // Location and Privacy
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [approximateArea, setApproximateArea] = useState('Центральный район, ~2 км');
  const [exactVenue, setExactVenue] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [privateInstructions, setPrivateInstructions] = useState('');
  const [allowPhoneSharing, setAllowPhoneSharing] = useState(true);

  // AI Description Generator
  const handleAiGenerate = async () => {
    setIsAiLoading(true);
    try {
      const res = await api.aiDescribeEvent({
        category,
        title: title || `Встреча в ${category}`,
        budget,
        targetParticipants: totalSpots,
        notes: description,
      });

      if (res?.description) {
        setDescription(res.description);
        if (res.suggestedIcebreaker) {
          setIcebreakerQuestion(res.suggestedIcebreaker);
        }
      }
    } catch (err: any) {
      console.error('AI error:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleNext = () => {
    setErrorMsg('');
    if (step === 1 && !title.trim()) {
      setErrorMsg('Укажите название мероприятия');
      return;
    }
    if (step === 2 && (!date || !time)) {
      setErrorMsg('Укажите дату и время встречи');
      return;
    }
    if (step === 4 && !description.trim()) {
      setErrorMsg('Напишите пару предложений о планируемой встрече');
      return;
    }
    if (step === 6 && (!exactVenue.trim() || !exactAddress.trim())) {
      setErrorMsg('Укажите точное место и адрес (они будут надежно скрыты до одобрения заявок)');
      return;
    }

    if (step < 6) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.createEvent({
        title,
        category,
        description,
        date,
        time,
        totalSpots,
        budget,
        city,
        approximateArea,
        exactVenue,
        exactAddress,
        organizerPhone: currentUser.phoneNumber || '',
        privateInstructions,
        requirements,
        rules: ['Быть вовремя', 'Предупредить заранее при изменении планов', 'Счет каждый за себя или поровну'],
        allowPhoneSharing,
        vibe,
        musicOrMood,
        icebreakerQuestion,
      });

      onCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка создания мероприятия');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block tabular-nums"
              style={{ color: 'var(--accent-text)' }}
            >
              Шаг {step} из 6
            </span>
            <h2 className="text-base font-display font-bold" style={{ color: 'var(--text-primary)' }}>
              Создать мероприятие
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
          <div
            className="h-1 transition-all duration-300"
            style={{
              width: `${(step / 6) * 100}%`,
              backgroundColor: 'var(--accent-primary)',
            }}
          />
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Category & Title */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Что планируется? Выберите категорию:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const active = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          if (!title) {
                            if (cat === 'День рождения') setTitle('День рождения в уютном кругу');
                            else if (cat === 'Настольные игры') setTitle('Вечер настольных игр в кофейне');
                            else if (cat === 'Пикник / Шашлыки') setTitle('Пикник с грилем в парке');
                            else setTitle(`Встреча: ${cat}`);
                          }
                        }}
                        className="p-2.5 rounded-xl text-xs text-left border transition-all cursor-pointer"
                        style={{
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Название мероприятия
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: Празднуем 30-летие в панорамном ресторане"
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Когда состоится событие?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Дата встречи
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 rounded-xl border text-xs focus:outline-none tabular-nums"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full p-3 rounded-xl border text-xs focus:outline-none tabular-nums"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div
                className="p-3 rounded-xl text-xs border"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-text)',
                }}
              >
                💡 Если вы собираетесь пойти куда-то <b>прямо сегодня</b>, выберите сегодняшнюю дату — событие автоматически появится в специальном топе <b>«Сегодня вечером»</b>.
              </div>
            </div>
          )}

          {/* STEP 3: Spots capacity */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Сколько человек комфортно видеть?
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Включая вас. Для душевного первого знакомства лучше всего подходят группы от 4 до 8 человек.
              </p>

              <div className="flex items-center justify-center gap-4 py-6">
                <button
                  type="button"
                  onClick={() => setTotalSpots(Math.max(2, totalSpots - 1))}
                  className="w-12 h-12 rounded-2xl border text-xl font-bold flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  -
                </button>
                <div className="text-center">
                  <span className="text-4xl font-display font-extrabold block tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {totalSpots}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    всего мест (1/{totalSpots} занято вами)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTotalSpots(Math.min(25, totalSpots + 1))}
                  className="w-12 h-12 rounded-2xl border text-xl font-bold flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  +
                </button>
              </div>

              <div className="flex justify-center gap-2">
                {[4, 5, 6, 8, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTotalSpots(n)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer tabular-nums"
                    style={{
                      backgroundColor: totalSpots === n ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                      color: totalSpots === n ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {n} чел
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Description + Vibe Check + Gemini AI Helper */}
          {step === 4 && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Темп и вайб встречи (Vibe Check):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {VIBES.map(v => {
                    const active = vibe === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVibe(v)}
                        className="px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer"
                        style={{
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        ✦ {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold block" style={{ color: 'var(--text-secondary)' }}>
                  Расскажите о встрече
                </label>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isAiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAiLoading ? 'Gemini сочиняет...' : 'Сгенерировать с AI'}</span>
                </button>
              </div>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Мне исполняется 28 лет. Хочу собрать уютную компанию, вкусно посидеть и познакомиться с новыми людьми..."
                className="w-full h-24 p-3 rounded-xl border text-xs focus:outline-none resize-none leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Фон / Настроение:
                  </label>
                  <input
                    type="text"
                    value={musicOrMood}
                    onChange={e => setMusicOrMood(e.target.value)}
                    placeholder="Джаз, свечи, крафтовый чай"
                    className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Кого рады видеть:
                  </label>
                  <input
                    type="text"
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder="20-35 лет, позитивный настрой"
                    className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Тема для легкого знакомства (Icebreaker):
                </label>
                <input
                  type="text"
                  value={icebreakerQuestion}
                  onChange={e => setIcebreakerQuestion(e.target.value)}
                  placeholder="Например: Какой фильм или поездка впечатлили вас за последний год?"
                  className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 5: Budget */}
          {step === 5 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Предполагаемый бюджет на участника:
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Помогает участникам понимать формат мероприятия.
              </p>

              <div className="space-y-2">
                {BUDGET_TIERS.map(b => {
                  const active = budget === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className="w-full p-3 rounded-xl text-xs text-left border flex items-center justify-between transition-all cursor-pointer tabular-nums"
                      style={{
                        backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: active ? 'var(--accent-text)' : 'var(--text-primary)',
                        fontWeight: active ? 700 : 500,
                      }}
                    >
                      <span>{b}</span>
                      {active && <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Location & Privacy (THE CORE SECURITY LAW) */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Privacy Warning Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Принцип безопасности Kompany
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Точный адрес и телефон будут скрыты от посторонних в ленте. Они откроются ТОЛЬКО тем участникам, чьи заявки вы лично подтвердите!
                  </span>
                </div>
              </div>

              {/* Publicly visible part */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide block" style={{ color: 'var(--text-muted)' }}>
                  1. Публичная часть (видна всем в ленте):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Город</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full p-2 rounded-lg border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium block mb-0.5" style={{ color: 'var(--text-secondary)' }}>Примерный район / метро</label>
                    <input
                      type="text"
                      value={approximateArea}
                      onChange={e => setApproximateArea(e.target.value)}
                      placeholder="Хамовники, ~2.5 км"
                      className="w-full p-2 rounded-lg border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Strictly hidden secret part */}
              <div
                className="p-3.5 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: 'var(--accent-text)' }}>
                  <Lock className="w-4 h-4" />
                  <span>2. Скрытые данные (только для одобренных гостей):</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Точное заведение / место *
                  </label>
                  <input
                    type="text"
                    value={exactVenue}
                    onChange={e => setExactVenue(e.target.value)}
                    placeholder="Например: Ресторан «Горыныч», стол на имя Анны"
                    className="w-full p-2.5 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Точный адрес встречи *
                  </label>
                  <input
                    type="text"
                    value={exactAddress}
                    onChange={e => setExactAddress(e.target.value)}
                    placeholder="Рождественский бульвар, д. 1"
                    className="w-full p-2.5 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Инструкции по прибытию (опционально)
                  </label>
                  <input
                    type="text"
                    value={privateInstructions}
                    onChange={e => setPrivateInstructions(e.target.value)}
                    placeholder="2 этаж, веранда у окна, домофон 14#"
                    className="w-full p-2 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="phoneShare"
                    checked={allowPhoneSharing}
                    onChange={e => setAllowPhoneSharing(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="phoneShare" className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Показывать мой телефон одобренным участникам (в дополнение к чату)
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : <div />}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {isSubmitting ? (
              <span>Публикуем...</span>
            ) : step === 6 ? (
              <span>Опубликовать событие</span>
            ) : (
              <>
                <span>Далее</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
