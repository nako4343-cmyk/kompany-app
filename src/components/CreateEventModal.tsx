import React, { useState } from 'react';
import { 
  X, Sparkles, ChevronRight, ChevronLeft, 
  Lock, CheckCircle2, ShieldCheck, AlertCircle,
  MapPin, Navigation, Search, ExternalLink, Users, Heart
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
  'Свадьба',
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

interface MapPresetLocation {
  label: string;
  city: string;
  approximateArea: string;
  exactVenue: string;
  exactAddress: string;
  lat: number;
  lon: number;
}

const YANDEX_MAP_PRESETS: MapPresetLocation[] = [
  {
    label: 'Трубная / Горыныч',
    city: 'Москва',
    approximateArea: 'Трубная площадь, ~1.5 км',
    exactVenue: 'Ресторан «Горыныч»',
    exactAddress: 'Рождественский бульвар, д. 1',
    lat: 55.7672,
    lon: 37.6225,
  },
  {
    label: 'Патриаршие пруды',
    city: 'Москва',
    approximateArea: 'Пресненский район, Патриаршие',
    exactVenue: 'Веранда на Патриарших',
    exactAddress: 'Малая Бронная ул., д. 24',
    lat: 55.7634,
    lon: 37.5924,
  },
  {
    label: 'Парк Горького',
    city: 'Москва',
    approximateArea: 'Парк Горького / Крымский Вал',
    exactVenue: 'Летняя терраса у Пионерского пруда',
    exactAddress: 'ул. Крымский Вал, д. 9',
    lat: 55.7298,
    lon: 37.6012,
  },
  {
    label: 'Хамовники / Усачёвский',
    city: 'Москва',
    approximateArea: 'Хамовники, ~2.5 км',
    exactVenue: 'Гастромаркет «Усачёвский»',
    exactAddress: 'ул. Усачёва, д. 26',
    lat: 55.7275,
    lon: 37.5678,
  },
  {
    label: 'Серебряный Бор (Свадьба / Банкет)',
    city: 'Москва',
    approximateArea: 'Серебряный Бор, берег реки',
    exactVenue: 'Банкетный шатёр у воды «Серебряный Бор»',
    exactAddress: 'Таманская ул., д. 46',
    lat: 55.7789,
    lon: 37.4342,
  },
  {
    label: 'Большая Никитская',
    city: 'Москва',
    approximateArea: 'Центр, Большая Никитская',
    exactVenue: 'Камерный бар и гостиная',
    exactAddress: 'Большая Никитская ул., д. 14',
    lat: 55.7568,
    lon: 37.6039,
  },
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
  const [totalSpots, setTotalSpots] = useState<number>(6);
  const [customSpotsInput, setCustomSpotsInput] = useState<string>('6');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('20-35 лет, позитивный настрой, взаимное уважение');
  const [vibe, setVibe] = useState<EventVibe>('Спокойная беседа');
  const [musicOrMood, setMusicOrMood] = useState('Уютная атмосфера, живое общение без спешки');
  const [icebreakerQuestion, setIcebreakerQuestion] = useState('Какое место в городе ваше самое любимое?');
  const [budget, setBudget] = useState<EventBudgetTier>('1 000–3 000 ₽');
  
  // Location, Yandex Maps & Privacy
  const [city, setCity] = useState(currentUser.city || 'Москва');
  const [approximateArea, setApproximateArea] = useState('Центральный район, ~2 км');
  const [exactVenue, setExactVenue] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [yandexMapsUrl, setYandexMapsUrl] = useState('');
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number }>({ lat: 55.7558, lon: 37.6173 });
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>('');
  const [isSearchingMap, setIsSearchingMap] = useState<boolean>(false);
  const [privateInstructions, setPrivateInstructions] = useState('');
  const [allowPhoneSharing, setAllowPhoneSharing] = useState(true);

  const updateSpotsCount = (val: number) => {
    const clamped = Math.max(2, Math.min(500, Math.round(val) || 2));
    setTotalSpots(clamped);
    setCustomSpotsInput(String(clamped));
  };

  const handleCustomSpotsChange = (raw: string) => {
    setCustomSpotsInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 2) {
      setTotalSpots(Math.min(500, parsed));
    }
  };

  const handleSelectCategory = (cat: EventCategory) => {
    setCategory(cat);
    const isDefaultTitle =
      !title.trim() ||
      title.startsWith('Встреча:') ||
      title === 'День рождения в уютном кругу' ||
      title === 'Вечер настольных игр в кофейне' ||
      title === 'Пикник с грилем в парке' ||
      title === 'Свадебная вечеринка и торжество в кругу друзей';

    if (isDefaultTitle) {
      if (cat === 'День рождения') setTitle('День рождения в уютном кругу');
      else if (cat === 'Свадьба') setTitle('Свадебная вечеринка и торжество в кругу друзей');
      else if (cat === 'Настольные игры') setTitle('Вечер настольных игр в кофейне');
      else if (cat === 'Пикник / Шашлыки') setTitle('Пикник с грилем в парке');
      else setTitle(`Встреча: ${cat}`);
    }

    if (cat === 'Свадьба') {
      setVibe('Праздничный вайб');
      setMusicOrMood('Праздничный банкет, живая музыка, танцы и тёплые тосты');
      setIcebreakerQuestion('Как вы познакомились с молодожёнами или какой ваш любимый свадебный тост?');
      setBudget('3 000–5 000 ₽');
      if (totalSpots <= 6) {
        updateSpotsCount(20);
      }
    }
  };

  // Search address and update Yandex Maps widget pin
  const handleSearchOnYandexMap = async (customQuery?: string) => {
    const queryToSearch = (customQuery ?? mapSearchQuery) || `${city}, ${exactAddress || exactVenue || approximateArea}`;
    if (!queryToSearch.trim()) return;

    setIsSearchingMap(true);
    try {
      // Check preset match first for instant accuracy
      const lower = queryToSearch.toLowerCase();
      const matchedPreset = YANDEX_MAP_PRESETS.find(
        p =>
          lower.includes(p.exactAddress.toLowerCase().split(',')[0]) ||
          lower.includes(p.label.toLowerCase().split(' ')[0])
      );

      if (matchedPreset) {
        setMapCoords({ lat: matchedPreset.lat, lon: matchedPreset.lon });
        setMapZoom(16);
        if (!exactAddress.trim()) setExactAddress(matchedPreset.exactAddress);
        if (!exactVenue.trim()) setExactVenue(matchedPreset.exactVenue);
        setYandexMapsUrl(
          `https://yandex.ru/maps/?ll=${matchedPreset.lon}%2C${matchedPreset.lat}&z=16&pt=${matchedPreset.lon}%2C${matchedPreset.lat}%2Cpm2rdm`
        );
        return;
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ru&q=${encodeURIComponent(
        queryToSearch.includes(city) ? queryToSearch : `${city}, ${queryToSearch}`
      )}`;
      const response = await fetch(url);
      const results = await response.json();
      if (Array.isArray(results) && results.length > 0) {
        const first = results[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          setMapCoords({ lat, lon });
          setMapZoom(16);
          if (!exactAddress.trim() && customQuery) {
            setExactAddress(customQuery);
          }
          setYandexMapsUrl(
            `https://yandex.ru/maps/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2rdm`
          );
          return;
        }
      }

      // Fallback: generate direct Yandex Maps search URL even if geocoder didn't return lat/lon
      setYandexMapsUrl(
        `https://yandex.ru/maps/?text=${encodeURIComponent(`${city}, ${queryToSearch}`)}`
      );
    } catch {
      setYandexMapsUrl(
        `https://yandex.ru/maps/?text=${encodeURIComponent(`${city}, ${queryToSearch}`)}`
      );
    } finally {
      setIsSearchingMap(false);
    }
  };

  const handleApplyMapPreset = (preset: MapPresetLocation) => {
    setCity(preset.city);
    setApproximateArea(preset.approximateArea);
    setExactVenue(preset.exactVenue);
    setExactAddress(preset.exactAddress);
    setMapCoords({ lat: preset.lat, lon: preset.lon });
    setMapZoom(16);
    setMapSearchQuery(`${preset.exactVenue}, ${preset.exactAddress}`);
    setYandexMapsUrl(
      `https://yandex.ru/maps/?ll=${preset.lon}%2C${preset.lat}&z=16&pt=${preset.lon}%2C${preset.lat}%2Cpm2rdm`
    );
  };

  const handleDetectMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsSearchingMap(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lon = Number(pos.coords.longitude.toFixed(5));
        setMapCoords({ lat, lon });
        setMapZoom(16);
        setYandexMapsUrl(`https://yandex.ru/maps/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2rdm`);
        setIsSearchingMap(false);
      },
      () => {
        setIsSearchingMap(false);
      },
      { timeout: 6000 }
    );
  };

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
    if (step === 1 && (!totalSpots || totalSpots < 2)) {
      setErrorMsg('Минимальное число участников — 2 человека');
      return;
    }
    if (step === 2 && (!date || !time)) {
      setErrorMsg('Укажите дату и время встречи');
      return;
    }
    if (step === 3 && (!totalSpots || totalSpots < 2)) {
      setErrorMsg('Укажите корректное количество гостей (от 2 человек)');
      return;
    }
    if (step === 4 && !description.trim()) {
      setErrorMsg('Напишите пару предложений о планируемой встрече');
      return;
    }
    if (step === 6 && (!exactVenue.trim() || !exactAddress.trim())) {
      setErrorMsg('Укажите точное место и адрес или выберите точку на Яндекс Карте');
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
      const finalYandexUrl =
        yandexMapsUrl.trim() ||
        `https://yandex.ru/maps/?text=${encodeURIComponent(`${city}, ${exactAddress || exactVenue}`)}`;

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
        yandexMapsUrl: finalYandexUrl,
        coordinates: mapCoords,
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

  const yandexWidgetIframeUrl = `https://yandex.ru/map-widget/v1/?ll=${mapCoords.lon}%2C${mapCoords.lat}&z=${mapZoom}&pt=${mapCoords.lon}%2C${mapCoords.lat}%2Cpm2rdm`;
  const directYandexMapsHref =
    yandexMapsUrl.trim() ||
    `https://yandex.ru/maps/?text=${encodeURIComponent(`${city}, ${exactAddress || exactVenue || approximateArea}`)}`;

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

          {/* STEP 1: Category, Title & Quick Guest Count */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Что планируется? Выберите тему или категорию:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                    const active = category === cat;
                    const isWedding = cat === 'Свадьба';
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleSelectCategory(cat)}
                        className="p-2.5 rounded-xl text-xs text-left border transition-all cursor-pointer flex items-center justify-between gap-1.5"
                        style={{
                          backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                          borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        <span className="truncate">{cat}</span>
                        {isWedding && (
                          <Heart className="w-3.5 h-3.5 shrink-0 text-rose-500 fill-rose-500/20" />
                        )}
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
                  placeholder="Например: Свадебный ужин и вечеринка на веранде"
                  className="w-full p-3 rounded-xl border text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Quick Custom Guest Count Field on Step 1 as well */}
              <div
                className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <label htmlFor="step1-guest-input" className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                      Количество гостей (включая вас)
                    </label>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Можно ввести любое своё число (от 2 до 500 чел.)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateSpotsCount(totalSpots - 1)}
                    className="w-9 h-9 rounded-xl border text-sm font-bold flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    -
                  </button>
                  <input
                    id="step1-guest-input"
                    type="number"
                    min={2}
                    max={500}
                    value={customSpotsInput}
                    onChange={e => handleCustomSpotsChange(e.target.value)}
                    onBlur={() => updateSpotsCount(totalSpots)}
                    className="w-20 p-2 rounded-xl border text-center text-sm font-extrabold tabular-nums focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => updateSpotsCount(totalSpots + 1)}
                    className="w-9 h-9 rounded-xl border text-sm font-bold flex items-center justify-center cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    +
                  </button>
                </div>
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
                Если вы собираетесь провести встречу <b>прямо сегодня</b>, выберите сегодняшнюю дату — событие автоматически появится в специальном топе <b>«Сегодня вечером»</b>.
              </div>
            </div>
          )}

          {/* STEP 3: Custom Spots / Guest Capacity */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Сколько гостей вы планируете пригласить?
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Укажите любое своё число участников (включая вас) — от камерной встречи на 3–6 человек до масштабного праздника или свадьбы.
              </p>

              <div className="flex items-center justify-center gap-4 py-4">
                <button
                  type="button"
                  onClick={() => updateSpotsCount(totalSpots - 1)}
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
                    всего мест (свободно для гостей: {Math.max(1, totalSpots - 1)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSpotsCount(totalSpots + 1)}
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

              {/* Direct Custom Number Input */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <label htmlFor="custom-spots-field" className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                    Своё число гостей:
                  </label>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Введите точное количество мест вручную (2–500)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="custom-spots-field"
                    type="number"
                    min={2}
                    max={500}
                    value={customSpotsInput}
                    onChange={e => handleCustomSpotsChange(e.target.value)}
                    onBlur={() => updateSpotsCount(totalSpots)}
                    placeholder="Например: 25"
                    className="w-24 p-2.5 rounded-xl border text-center text-sm font-bold tabular-nums focus:outline-none"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--accent-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    чел.
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold block mb-2 text-center" style={{ color: 'var(--text-muted)' }}>
                  Или выберите быстрый вариант:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {[4, 6, 8, 12, 15, 20, 30, 50, 100].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateSpotsCount(n)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer tabular-nums transition-colors"
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
                        {v}
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
                  <span>{isAiLoading ? 'Генерируем...' : 'Сгенерировать с AI'}</span>
                </button>
              </div>

              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Расскажите о формате события, кого хотите пригласить и какая программа ждёт гостей..."
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
                    placeholder="Джаз, свечи, живая музыка"
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
                Помогает участникам заранее понимать формат мероприятия.
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

          {/* STEP 6: Location, Yandex Maps & Privacy */}
          {step === 6 && (
            <div className="space-y-4">
              {/* Privacy Warning Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    Принцип безопасности Kompany + Яндекс Карты
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Выберите место на Яндекс Картах. Точный адрес, пин и ссылка на карту откроются ТОЛЬКО тем участникам, чьи заявки вы лично подтвердите.
                  </span>
                </div>
              </div>

              {/* YANDEX MAPS INTERACTIVE PICKER & SEARCH */}
              <div
                className="p-3.5 rounded-2xl border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-5 h-5 rounded-md bg-[#FC3F1D] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      Я
                    </span>
                    <span>Указать место на Яндекс Картах</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDetectMyLocation}
                      className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Navigation className="w-3 h-3 text-[#FC3F1D]" />
                      <span>Где я</span>
                    </button>
                    <a
                      href={directYandexMapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-[#FC3F1D]/12 text-[#FC3F1D] border border-[#FC3F1D]/25 text-[11px] font-bold flex items-center gap-1 hover:bg-[#FC3F1D]/20 transition-colors"
                    >
                      <span>Яндекс Карты</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Search Address Input on Yandex Map */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                      type="text"
                      value={mapSearchQuery}
                      onChange={e => setMapSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchOnYandexMap();
                        }
                      }}
                      placeholder="Найти адрес или место (например: Малая Бронная, 24)"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSearchingMap}
                    onClick={() => handleSearchOnYandexMap()}
                    className="px-3.5 py-2 rounded-xl bg-[#FC3F1D] text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isSearchingMap ? 'Поиск...' : 'Найти'}
                  </button>
                </div>

                {/* Quick Popular Places Chips */}
                <div>
                  <span className="text-[10px] font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    Быстрый выбор популярных локаций на карте:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {YANDEX_MAP_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyMapPreset(preset)}
                        className="px-2.5 py-1 rounded-lg border text-[11px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer transition-colors hover:border-[#FC3F1D]"
                        style={{
                          backgroundColor:
                            exactAddress === preset.exactAddress ? 'var(--accent-soft)' : 'var(--bg-surface)',
                          borderColor:
                            exactAddress === preset.exactAddress ? '#FC3F1D' : 'var(--border-subtle)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <MapPin className="w-3 h-3 text-[#FC3F1D] shrink-0" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Interactive Yandex Map Widget */}
                <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <iframe
                    key={`${mapCoords.lat}-${mapCoords.lon}-${mapZoom}`}
                    src={yandexWidgetIframeUrl}
                    title="Яндекс Карта места встречи"
                    className="w-full h-full border-0"
                    loading="lazy"
                    allowFullScreen
                  />
                  <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                    <span className="px-2 py-1 rounded-lg bg-slate-950/75 text-white backdrop-blur-xs font-medium tabular-nums">
                      Координаты: {mapCoords.lat.toFixed(4)}, {mapCoords.lon.toFixed(4)}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-[#FC3F1D] text-white font-bold">
                      Яндекс Карты
                    </span>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={exactAddress}
                      onChange={e => setExactAddress(e.target.value)}
                      onBlur={() => {
                        if (exactAddress.trim()) {
                          handleSearchOnYandexMap(`${city}, ${exactAddress}`);
                        }
                      }}
                      placeholder="Рождественский бульвар, д. 1"
                      className="flex-1 p-2.5 rounded-lg border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSearchOnYandexMap(`${city}, ${exactAddress || exactVenue}`)}
                      className="px-3 py-2.5 rounded-lg border text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                      title="Показать этот адрес на Яндекс Карте"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FC3F1D]" />
                      <span>На карте</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold block mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Ссылка на точку в Яндекс Картах (автоматически или своя)
                  </label>
                  <input
                    type="url"
                    value={yandexMapsUrl}
                    onChange={e => setYandexMapsUrl(e.target.value)}
                    placeholder="https://yandex.ru/maps/..."
                    className="w-full p-2 rounded-lg border text-xs"
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
