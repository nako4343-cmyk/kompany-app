import React, { useState } from 'react';
import { MapPin, Navigation, Shield, Flame, Users, Clock, Sparkles } from 'lucide-react';
import { EventItem } from '../types/index.ts';

interface MapViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

// Simulated city districts in Moscow with relative coordinates on stylized visual map
const DISTRICTS = [
  { id: 'khamovniki', name: 'Хамовники', x: 38, y: 55, radiusKm: 2.5, description: 'Центр, набережные, уютные рестораны' },
  { id: 'basmanny', name: 'Басманный', x: 62, y: 40, radiusKm: 1.8, description: 'Антикафе, крафтовые бары, настолки' },
  { id: 'arbat', name: 'Арбат', x: 42, y: 42, radiusKm: 3.2, description: 'Концертные клубы, театр, прогулки' },
  { id: 'gorky', name: 'Парк Горького / Нескучный сад', x: 44, y: 68, radiusKm: 4.1, description: 'Пикники, спорт, природа' },
  { id: 'zamoskvorechye', name: 'Замоскворечье', x: 52, y: 56, radiusKm: 2.9, description: 'Кинотеатры, кофейни, галереи' },
];

export const MapView: React.FC<MapViewProps> = ({ events, onSelectEvent }) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const getDistrictEvents = (districtName: string) => {
    return events.filter(e => e.approximateArea.toLowerCase().includes(districtName.toLowerCase().split(' ')[0]));
  };

  const activeDistrictObj = DISTRICTS.find(d => d.id === selectedDistrict);
  const activeEvents = activeDistrictObj 
    ? getDistrictEvents(activeDistrictObj.name) 
    : events;

  return (
    <div className="space-y-4">
      {/* Map Canvas Card */}
      <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
        {/* Stylized Dark Grid Map Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '24px 24px, 48px 48px, 48px 48px'
          }}
        />

        {/* River curve aesthetic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path
            d="M 15 10 C 35 25, 45 45, 40 65 C 36 80, 55 90, 85 95"
            fill="none"
            stroke="#0284c7"
            strokeWidth="3"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Top Floating Map Info */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs text-white flex items-center gap-2 pointer-events-auto shadow-sm">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[11px]">Безопасные радиусы зон без точных точек</span>
          </div>

          <button
            onClick={() => setSelectedDistrict(null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md border transition-all pointer-events-auto ${
              selectedDistrict === null
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            Все районы ({events.length})
          </button>
        </div>

        {/* Interactive District Zone Bubbles on Map */}
        {DISTRICTS.map(dist => {
          const count = getDistrictEvents(dist.name).length;
          const isSelected = selectedDistrict === dist.id;

          return (
            <div
              key={dist.id}
              style={{ left: `${dist.x}%`, top: `${dist.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
              onClick={() => setSelectedDistrict(isSelected ? null : dist.id)}
            >
              {/* Pulsing Approximate Zone Circle (Privacy Enforcement) */}
              <div 
                className={`rounded-full border transition-all duration-300 flex items-center justify-center ${
                  isSelected
                    ? 'w-24 h-24 bg-amber-500/25 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                    : 'w-18 h-18 bg-sky-500/15 border-sky-400/40 group-hover:bg-sky-500/25 group-hover:border-sky-400'
                }`}
              >
                <div className={`p-2 rounded-2xl flex flex-col items-center justify-center shadow-md transition-transform ${
                  isSelected 
                    ? 'bg-amber-500 text-slate-950 scale-110 font-bold' 
                    : 'bg-slate-900/90 text-white border border-slate-700 group-hover:scale-105'
                }`}>
                  <div className="flex items-center gap-1 text-[11px]">
                    <MapPin className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                    <span className="font-extrabold">{count}</span>
                  </div>
                  <span className="text-[9px] font-semibold whitespace-nowrap px-1">
                    {dist.name.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none z-10">
          <span className="bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded-md">
            📍 Нажмите на район, чтобы отфильтровать события
          </span>
          <span className="hidden sm:inline bg-slate-950/70 backdrop-blur-xs px-2.5 py-1 rounded-md text-amber-300">
            Ориентировочный радиус ~1.5 - 3 км
          </span>
        </div>
      </div>

      {/* Selected District Feed Carousel / List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeDistrictObj ? `События в районе «${activeDistrictObj.name}»` : 'Все события на карте'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeEvents.length} открытых мероприятий для знакомств и отдыха
            </p>
          </div>

          {selectedDistrict && (
            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Показать все районы
            </button>
          )}
        </div>

        {activeEvents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            В этом районе сейчас нет активных событий. Вы можете создать первое!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeEvents.map(ev => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center gap-3"
              >
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {ev.isToday ? 'Сегодня' : ev.date} в {ev.time}
                  </div>
                  <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                    {ev.budget} · {ev.occupiedSpots}/{ev.totalSpots} мест
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
