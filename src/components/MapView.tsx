import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Lock,
  Unlock,
  Compass,
  Navigation,
  Users,
  Clock,
  Star,
  ChevronRight,
  Shield,
  Map as MapIcon,
  Radar,
  ExternalLink,
  Crosshair,
} from 'lucide-react';
import { EventItem } from '../types/index.ts';
import {
  AppLanguage,
  UI_TEXT,
  translateCategory,
  translateDistrict,
} from '../i18n/translations.ts';

interface MapViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  lang?: AppLanguage;
}

interface AreaPreset {
  name: string;
  lat: number;
  lon: number;
  zoom: number;
  x: number;
  y: number;
  pinStyle: string;
}

const MOSCOW_AREA_PRESETS: AreaPreset[] = [
  { name: 'Патриаршие пруды', lat: 55.7634, lon: 37.5924, zoom: 15, x: 36, y: 34, pinStyle: 'pm2rdm' },
  { name: 'Чистые пруды', lat: 55.7649, lon: 37.6386, zoom: 15, x: 64, y: 36, pinStyle: 'pm2blm' },
  { name: 'Парк Горького', lat: 55.7298, lon: 37.6012, zoom: 14, x: 42, y: 68, pinStyle: 'pm2gnm' },
  { name: 'Хамовники', lat: 55.7275, lon: 37.5678, zoom: 14, x: 26, y: 64, pinStyle: 'pm2orgm' },
  { name: 'Красная Пресня', lat: 55.7602, lon: 37.5618, zoom: 14, x: 22, y: 42, pinStyle: 'pm2vvm' },
  { name: 'Китай-город', lat: 55.7548, lon: 37.6342, zoom: 15, x: 58, y: 50, pinStyle: 'pm2pnm' },
  { name: 'Тверская', lat: 55.7658, lon: 37.6052, zoom: 15, x: 46, y: 28, pinStyle: 'pm2dbm' },
  { name: 'Замоскворечье', lat: 55.7342, lon: 37.6268, zoom: 14, x: 56, y: 66, pinStyle: 'pm2ywm' },
  { name: 'Арбат', lat: 55.7495, lon: 37.5912, zoom: 15, x: 35, y: 52, pinStyle: 'pm2rdm' },
  { name: 'Басманный', lat: 55.7672, lon: 37.6625, zoom: 14, x: 74, y: 38, pinStyle: 'pm2blm' },
  { name: 'Серебряный Бор', lat: 55.7789, lon: 37.4412, zoom: 13, x: 14, y: 24, pinStyle: 'pm2gnm' },
  { name: 'Центр', lat: 55.7558, lon: 37.6173, zoom: 14, x: 48, y: 48, pinStyle: 'pm2rdm' },
];

const DEFAULT_MOSCOW_CENTER = { lat: 55.7539, lon: 37.6208, zoom: 12 };

function resolveEventCoords(event: EventItem, index: number): {
  lat: number;
  lon: number;
  zoom: number;
  x: number;
  y: number;
  areaName: string;
  pinStyle: string;
} {
  const area = (event.approximateArea || '').toLowerCase();
  const matchedPreset = MOSCOW_AREA_PRESETS.find((p) =>
    area.includes(p.name.toLowerCase().slice(0, 5))
  );

  // Deterministic micro-offset so multiple events in the same district remain distinct pins on Yandex Maps
  const angle = ((index * 137.5) % 360) * (Math.PI / 180);
  const latJitter = Math.sin(angle) * 0.0028;
  const lonJitter = Math.cos(angle) * 0.0042;
  const xJitter = ((index * 13) % 10) - 5;
  const yJitter = ((index * 17) % 10) - 5;

  if (event.coordinates) {
    return {
      lat: event.coordinates.lat,
      lon: event.coordinates.lon,
      zoom: 15,
      x: matchedPreset ? Math.min(88, Math.max(12, matchedPreset.x + xJitter)) : 48,
      y: matchedPreset ? Math.min(86, Math.max(14, matchedPreset.y + yJitter)) : 48,
      areaName: matchedPreset?.name || event.approximateArea.split(',')[0] || 'Центр',
      pinStyle: matchedPreset?.pinStyle || 'pm2rdm',
    };
  }

  if (matchedPreset) {
    return {
      lat: +(matchedPreset.lat + latJitter).toFixed(5),
      lon: +(matchedPreset.lon + lonJitter).toFixed(5),
      zoom: matchedPreset.zoom,
      x: Math.min(88, Math.max(12, matchedPreset.x + xJitter)),
      y: Math.min(86, Math.max(14, matchedPreset.y + yJitter)),
      areaName: matchedPreset.name,
      pinStyle: matchedPreset.pinStyle,
    };
  }

  const fallback = MOSCOW_AREA_PRESETS[index % MOSCOW_AREA_PRESETS.length];
  return {
    lat: +(fallback.lat + latJitter).toFixed(5),
    lon: +(fallback.lon + lonJitter).toFixed(5),
    zoom: 13,
    x: Math.min(88, Math.max(12, fallback.x + xJitter)),
    y: Math.min(86, Math.max(14, fallback.y + yJitter)),
    areaName: event.approximateArea.split(',')[0] || fallback.name,
    pinStyle: fallback.pinStyle,
  };
}

export const MapView: React.FC<MapViewProps> = ({
  events,
  onSelectEvent,
  lang = 'ru',
}) => {
  const t = UI_TEXT[lang];
  const [radarMode, setRadarMode] = useState<'yandex' | 'schematic'>('yandex');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    events[0]?.id || null
  );

  // Enrich events with resolved geographic coordinates and district name
  const enrichedEvents = useMemo(
    () =>
      events.map((event, idx) => ({
        event,
        geo: resolveEventCoords(event, idx),
        index: idx + 1,
      })),
    [events]
  );

  // Distinct districts present in current events
  const areaGroups = useMemo(() => {
    const map = new Map<string, typeof enrichedEvents>();
    for (const item of enrichedEvents) {
      const key = item.geo.areaName;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [enrichedEvents]);

  // Filtered events by selected district chip
  const visibleEnrichedEvents = useMemo(() => {
    if (!selectedArea) return enrichedEvents;
    return enrichedEvents.filter((item) => item.geo.areaName === selectedArea);
  }, [enrichedEvents, selectedArea]);

  const activeItem = useMemo(
    () =>
      visibleEnrichedEvents.find((item) => item.event.id === selectedPinId) ||
      visibleEnrichedEvents[0] ||
      null,
    [visibleEnrichedEvents, selectedPinId]
  );

  // Build Yandex Maps widget URL with multi-pin `pt=` parameter
  const yandexMapState = useMemo(() => {
    const pins = visibleEnrichedEvents.slice(0, 28).map((item) => {
      const isFocused = activeItem?.event.id === item.event.id;
      const pinColor = isFocused
        ? 'pm2rdl'
        : item.event.isToday
        ? 'pm2orgm'
        : item.geo.pinStyle;
      return `${item.geo.lon},${item.geo.lat},${pinColor}${item.index}`;
    });

    if (activeItem) {
      const centerLat = activeItem.geo.lat;
      const centerLon = activeItem.geo.lon;
      const zoom = selectedArea || selectedPinId ? 14 : 12;
      const ptParam =
        pins.length > 0
          ? pins.join('~')
          : `${centerLon},${centerLat},pm2rdl`;
      const widgetUrl = `https://yandex.ru/map-widget/v1/?ll=${centerLon}%2C${centerLat}&z=${zoom}&pt=${ptParam}`;
      const externalUrl =
        activeItem.event.yandexMapsUrl ||
        `https://yandex.ru/maps/?ll=${centerLon}%2C${centerLat}&z=15&pt=${centerLon},${centerLat},pm2rdl`;

      return {
        widgetUrl,
        externalUrl,
        centerLat,
        centerLon,
        focusLabel: `${activeItem.event.title} · ${translateDistrict(
          activeItem.geo.areaName,
          lang
        )}`,
      };
    }

    const widgetUrl = `https://yandex.ru/map-widget/v1/?ll=${DEFAULT_MOSCOW_CENTER.lon}%2C${DEFAULT_MOSCOW_CENTER.lat}&z=${DEFAULT_MOSCOW_CENTER.zoom}&pt=${DEFAULT_MOSCOW_CENTER.lon},${DEFAULT_MOSCOW_CENTER.lat},pm2rdm`;
    const externalUrl = `https://yandex.ru/maps/?ll=${DEFAULT_MOSCOW_CENTER.lon}%2C${DEFAULT_MOSCOW_CENTER.lat}&z=12`;

    return {
      widgetUrl,
      externalUrl,
      centerLat: DEFAULT_MOSCOW_CENTER.lat,
      centerLon: DEFAULT_MOSCOW_CENTER.lon,
      focusLabel: t.mapCenterMoscow,
    };
  }, [visibleEnrichedEvents, activeItem, selectedArea, selectedPinId, lang, t.mapCenterMoscow]);

  return (
    <div
      className="rounded-3xl border overflow-hidden shadow-xs"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Top Radar Header Bar + Yandex Maps / Schematic Toggle */}
      <div
        className="p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>{t.mapBadge}</span>
          </div>
          <h3
            className="text-base sm:text-lg font-display font-bold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span>{t.mapTitle}</span>
            <span
              className="text-xs font-extrabold px-2.5 py-0.5 rounded-full tabular-nums"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              {visibleEnrichedEvents.length} {t.mapEventsInArea}
            </span>
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t.mapSubtitle}
          </p>
        </div>

        {/* Mode Switcher & Open in Yandex Maps */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center p-1 rounded-2xl border"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setRadarMode('yandex')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                radarMode === 'yandex' ? 'bg-red-500 text-white shadow-xs' : ''
              }`}
              style={
                radarMode === 'yandex'
                  ? undefined
                  : { color: 'var(--text-secondary)' }
              }
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t.mapModeYandex}</span>
            </button>
            <button
              type="button"
              onClick={() => setRadarMode('schematic')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                radarMode === 'schematic' ? 'text-white shadow-xs' : ''
              }`}
              style={
                radarMode === 'schematic'
                  ? { backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Radar className="w-3.5 h-3.5" />
              <span>{t.mapModeSchematic}</span>
            </button>
          </div>

          <a
            href={yandexMapState.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-colors hover:border-red-500/40"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <Navigation className="w-3.5 h-3.5 text-red-500" />
            <span>{t.mapOpenExternal}</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* District Filter Bar */}
      <div
        className="px-4 sm:px-5 py-3 border-b flex items-center gap-2 overflow-x-auto no-scrollbar"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            setSelectedArea(null);
            setSelectedPinId(events[0]?.id || null);
          }}
          className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shrink-0"
          style={
            selectedArea === null
              ? {
                  backgroundColor: 'var(--accent-primary)',
                  borderColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                }
              : {
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }
          }
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>
            {t.mapAllMoscow} ({events.length})
          </span>
        </button>

        {areaGroups.map(([areaName, list]) => {
          const isSelected = selectedArea === areaName;
          return (
            <button
              key={areaName}
              type="button"
              onClick={() => {
                const nextArea = isSelected ? null : areaName;
                setSelectedArea(nextArea);
                if (nextArea && list[0]) {
                  setSelectedPinId(list[0].event.id);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shrink-0"
              style={
                isSelected
                  ? {
                      backgroundColor: '#EF4444',
                      borderColor: '#EF4444',
                      color: '#FFFFFF',
                    }
                  : {
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              <MapPin
                className={`w-3.5 h-3.5 ${
                  isSelected ? 'text-white' : 'text-red-500'
                }`}
              />
              <span>{translateDistrict(areaName, lang)}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold tabular-nums ${
                  isSelected ? 'bg-white/20 text-white' : ''
                }`}
                style={
                  isSelected
                    ? undefined
                    : {
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                      }
                }
              >
                {list.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split Body: Left Interactive Yandex Map / Schematic Radar + Right Event Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 8 cols: Yandex Map Widget or Schematic Radar */}
        <div
          className="lg:col-span-8 relative flex flex-col border-b lg:border-b-0 lg:border-r"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Floating Geo Status Strip */}
          <div
            className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span
                className="font-semibold shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                {t.mapSelectedZone}:
              </span>
              <span
                className="font-bold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {yandexMapState.focusLabel}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span
                className="px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                {yandexMapState.centerLat.toFixed(4)}, {yandexMapState.centerLon.toFixed(4)}
              </span>
            </div>
          </div>

          {radarMode === 'yandex' ? (
            <div className="relative w-full h-[400px] sm:h-[480px] bg-slate-900">
              <iframe
                key={yandexMapState.widgetUrl}
                src={yandexMapState.widgetUrl}
                title="Яндекс Карта радара встреч"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative w-full h-[400px] sm:h-[480px] bg-[#0F172A] overflow-hidden select-none">
              {/* Stylized Radar Grid */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(148, 163, 184, 0.2) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(148, 163, 184, 0.2) 1px, transparent 1px)
                  `,
                  backgroundSize: '44px 44px',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[180px] h-[180px] rounded-full border border-amber-500/20" />
                <div className="w-[320px] h-[320px] rounded-full border border-indigo-400/15" />
                <div className="w-[460px] h-[460px] rounded-full border border-slate-500/15" />
              </div>

              {visibleEnrichedEvents.map((item) => {
                const isSelected = activeItem?.event.id === item.event.id;
                const isUnlocked = Boolean(item.event.exactAddress);
                return (
                  <button
                    key={item.event.id}
                    type="button"
                    onClick={() => setSelectedPinId(item.event.id)}
                    style={{ left: `${item.geo.x}%`, top: `${item.geo.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none z-10"
                  >
                    <div
                      className={`absolute -inset-5 rounded-full transition-all duration-300 pointer-events-none ${
                        isSelected
                          ? 'bg-red-500/25 border border-red-400/60 scale-110 animate-pulse'
                          : 'bg-indigo-500/10 border border-indigo-400/25 group-hover:scale-110'
                      }`}
                    />
                    <div
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                        isSelected
                          ? 'bg-red-500 text-white scale-110 ring-4 ring-red-500/30'
                          : 'bg-slate-900/90 text-white border border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {isUnlocked ? (
                        <Unlock className="w-3 h-3 text-emerald-300 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-300 shrink-0" />
                      )}
                      <span className="max-w-[120px] truncate">
                        {item.index}. {item.event.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Privacy Footer Banner */}
          <div
            className="px-4 py-2.5 border-t flex items-center justify-between gap-2 text-[11px]"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{t.mapPrivacyNotice}</span>
            </span>
          </div>
        </div>

        {/* Right 4 cols: Interactive Event List Synchronized with Yandex Map */}
        <div className="lg:col-span-4 flex flex-col max-h-[560px]">
          {/* Active Pin Quick Card */}
          {activeItem && (
            <div
              className="p-4 border-b"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-3">
                <img
                  src={activeItem.event.imageUrl}
                  alt={activeItem.event.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border"
                  style={{ borderColor: 'var(--border-subtle)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <span
                      className="px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-primary)',
                      }}
                    >
                      #{activeItem.index} · {translateCategory(activeItem.event.category, lang)}
                    </span>
                    <span className="text-amber-500 flex items-center gap-0.5 ml-auto">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {activeItem.event.organizer.reliability.score}
                    </span>
                  </div>

                  <h4
                    className="text-sm font-bold truncate mt-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activeItem.event.title}
                  </h4>

                  <p
                    className="text-xs truncate mt-0.5 flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {activeItem.event.exactAddress ? (
                      <>
                        <Unlock className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="text-emerald-500 font-semibold truncate">
                          {activeItem.event.exactAddress}
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                          {translateDistrict(activeItem.event.approximateArea, lang)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEvent(activeItem.event)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-opacity hover:opacity-95"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  <span>{t.detailsBtn}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <a
                  href={yandexMapState.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors hover:border-red-500/40"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Navigation className="w-3.5 h-3.5 text-red-500" />
                  <span>Яндекс</span>
                </a>
              </div>
            </div>
          )}

          {/* Scrollable List of Events on Radar */}
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {visibleEnrichedEvents.map((item) => {
              const isSelected = activeItem?.event.id === item.event.id;
              return (
                <div
                  key={item.event.id}
                  onClick={() => {
                    setSelectedPinId(item.event.id);
                    setRadarMode('yandex');
                  }}
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--accent-soft)'
                      : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 tabular-nums ${
                        isSelected ? 'bg-red-500 text-white' : ''
                      }`}
                      style={
                        isSelected
                          ? undefined
                          : {
                              backgroundColor: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                            }
                      }
                    >
                      {item.index}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-bold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {item.event.title}
                      </div>
                      <div
                        className="text-[11px] flex items-center gap-2 mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span className="truncate">
                          {translateDistrict(item.geo.areaName, lang)}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 tabular-nums shrink-0">
                          <Clock className="w-3 h-3" />
                          {item.event.time}
                        </span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5 tabular-nums shrink-0">
                          <Users className="w-3 h-3" />
                          {item.event.occupiedSpots}/{item.event.totalSpots}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(item.event);
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {t.detailsBtn}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
