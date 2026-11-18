import React from 'react';
import { motion } from 'framer-motion';

export type KompaLogoConceptId = 'knot' | 'circle' | 'compass' | 'dialogue' | 'prism';

export interface LogoConceptOption {
  id: KompaLogoConceptId;
  title: string;
  subtitle: string;
  metaphor: string;
}

export const LOGO_CONCEPT_OPTIONS: LogoConceptOption[] = [
  {
    id: 'knot',
    title: '01 · Узел Встречи',
    subtitle: 'Три пути в монограмме «K»',
    metaphor: 'Три самостоятельные линии-траектории сходятся в одной точке общего события.',
  },
  {
    id: 'circle',
    title: '02 · Круг Компании',
    subtitle: 'Симметрия общего круга',
    metaphor: 'Четыре переплетённых дуги вокруг единого центра — метафора дружеского круга и праздника.',
  },
  {
    id: 'compass',
    title: '03 · Компас Событий',
    subtitle: 'Ориентир и буква «K»',
    metaphor: 'Динамичная стрела-навигатор внутри орбиты города, складывающаяся в знак «K».',
  },
  {
    id: 'dialogue',
    title: '04 · Живая Волна',
    subtitle: 'Энергия общения',
    metaphor: 'Две встречные пластичные дуги диалога с центральной искрой совместного досуга.',
  },
  {
    id: 'prism',
    title: '05 · Трилистник Эмоций',
    subtitle: 'Встречи · Праздники · Поездки',
    metaphor: 'Три объёмных лепестка-грани, объединённых в чистый современный знак.',
  },
];

export interface BrandPaletteTheme {
  id: 'iris' | 'amethyst' | 'indigo' | 'coral' | 'velvet';
  name: string;
  subtitle: string;
  isDark?: boolean;
  canvasBg: string;
  canvasAura: string;
  cardBg: string;
  cardBorder: string;
  fieldBg: string;
  fieldFocusBg: string;
  fieldBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGradFrom: string;
  accentGradVia: string;
  accentGradTo: string;
  accentSoftBg: string;
  accentSoftBorder: string;
  accentSoftText: string;
  accentShadow: string;
}

export const BRAND_PALETTE_THEMES: BrandPaletteTheme[] = [
  {
    id: 'iris',
    name: 'Iris Violet',
    subtitle: 'Светлый ирис и фарфор',
    isDark: false,
    canvasBg: '#F7F6FB',
    canvasAura:
      'radial-gradient(circle at 50% 18%, rgba(108, 71, 255, 0.10) 0%, rgba(157, 123, 255, 0.04) 40%, rgba(247, 246, 251, 0) 72%)',
    cardBg: '#FFFFFF',
    cardBorder: '#EAE6F5',
    fieldBg: '#F6F5FB',
    fieldFocusBg: '#FFFFFF',
    fieldBorder: '#E5E1F2',
    textPrimary: '#141026',
    textSecondary: '#4E4868',
    textMuted: '#7C7599',
    accentPrimary: '#5E3AEF',
    accentSecondary: '#A78BFA',
    accentGradFrom: '#6C47FF',
    accentGradVia: '#522EE5',
    accentGradTo: '#3F1FC2',
    accentSoftBg: '#F3F0FF',
    accentSoftBorder: '#DDD4FF',
    accentSoftText: '#522EE5',
    accentShadow: 'rgba(84, 48, 230, 0.36)',
  },
  {
    id: 'amethyst',
    name: 'Amethyst & Berry',
    subtitle: 'Аметист и ягодный праздник',
    isDark: false,
    canvasBg: '#FAF6FB',
    canvasAura:
      'radial-gradient(circle at 50% 18%, rgba(147, 51, 234, 0.10) 0%, rgba(217, 70, 239, 0.04) 40%, rgba(250, 246, 251, 0) 72%)',
    cardBg: '#FFFFFF',
    cardBorder: '#EFE5F5',
    fieldBg: '#F9F5FA',
    fieldFocusBg: '#FFFFFF',
    fieldBorder: '#E9DEF0',
    textPrimary: '#1E112A',
    textSecondary: '#584469',
    textMuted: '#88729B',
    accentPrimary: '#7E22CE',
    accentSecondary: '#E879F9',
    accentGradFrom: '#9333EA',
    accentGradVia: '#7E22CE',
    accentGradTo: '#581C87',
    accentSoftBg: '#F8F0FC',
    accentSoftBorder: '#E9D5FF',
    accentSoftText: '#6B21A8',
    accentShadow: 'rgba(126, 34, 206, 0.35)',
  },
  {
    id: 'indigo',
    name: 'Nordic Indigo',
    subtitle: 'Скандинавский индиго и воздух',
    isDark: false,
    canvasBg: '#F4F6FB',
    canvasAura:
      'radial-gradient(circle at 50% 18%, rgba(79, 70, 229, 0.10) 0%, rgba(59, 130, 246, 0.04) 40%, rgba(244, 246, 251, 0) 72%)',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F4',
    fieldBg: '#F3F6FA',
    fieldFocusBg: '#FFFFFF',
    fieldBorder: '#DCE3F0',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    accentPrimary: '#4338CA',
    accentSecondary: '#818CF8',
    accentGradFrom: '#4F46E5',
    accentGradVia: '#4338CA',
    accentGradTo: '#312E81',
    accentSoftBg: '#EEF2FF',
    accentSoftBorder: '#C7D2FE',
    accentSoftText: '#3730A3',
    accentShadow: 'rgba(67, 56, 202, 0.34)',
  },
  {
    id: 'coral',
    name: 'Sunset Coral',
    subtitle: 'Тёплый коралл и сливочный песок',
    isDark: false,
    canvasBg: '#FAF7F2',
    canvasAura:
      'radial-gradient(circle at 50% 18%, rgba(224, 79, 51, 0.10) 0%, rgba(245, 158, 11, 0.04) 40%, rgba(250, 247, 242, 0) 72%)',
    cardBg: '#FFFFFF',
    cardBorder: '#ECE4DA',
    fieldBg: '#F7F3ED',
    fieldFocusBg: '#FFFFFF',
    fieldBorder: '#E5DDD2',
    textPrimary: '#181310',
    textSecondary: '#524740',
    textMuted: '#85776E',
    accentPrimary: '#DE482B',
    accentSecondary: '#FDBA74',
    accentGradFrom: '#F0593B',
    accentGradVia: '#DE482B',
    accentGradTo: '#B33219',
    accentSoftBg: '#FEF1EE',
    accentSoftBorder: '#FAD4C8',
    accentSoftText: '#B8331A',
    accentShadow: 'rgba(222, 72, 43, 0.34)',
  },
  {
    id: 'velvet',
    name: 'Velvet Night',
    subtitle: 'Бархатный ночной фиолетовый',
    isDark: true,
    canvasBg: '#0D0A14',
    canvasAura:
      'radial-gradient(circle at 50% 20%, rgba(124, 58, 237, 0.22) 0%, rgba(88, 28, 135, 0.08) 45%, rgba(13, 10, 20, 0) 75%)',
    cardBg: '#161224',
    cardBorder: '#2A2342',
    fieldBg: '#1D182E',
    fieldFocusBg: '#231D38',
    fieldBorder: '#31294D',
    textPrimary: '#F8F7FC',
    textSecondary: '#C4BDE0',
    textMuted: '#867EA6',
    accentPrimary: '#7C3AED',
    accentSecondary: '#C4B5FD',
    accentGradFrom: '#8B5CF6',
    accentGradVia: '#6D28D9',
    accentGradTo: '#4C1D95',
    accentSoftBg: '#231B3A',
    accentSoftBorder: '#3E2F66',
    accentSoftText: '#DDD6FE',
    accentShadow: 'rgba(124, 58, 237, 0.45)',
  },
];

export interface KompaLogoMarkProps {
  /** Pixel dimension of the square app icon container */
  size?: number;
  /** Which of the 5 studio logo concepts to render */
  concept?: KompaLogoConceptId;
  /** Optional palette theme override */
  palette?: BrandPaletteTheme;
  /** Visual variant: 'brand' (colored icon container), 'light' (white container), 'minimal' (mark only) */
  variant?: 'brand' | 'light' | 'minimal';
  /** Whether to play the smooth vector formation choreography */
  animated?: boolean;
  className?: string;
}

export const KompaLogoMark: React.FC<KompaLogoMarkProps> = ({
  size = 56,
  concept = 'knot',
  palette = BRAND_PALETTE_THEMES[0],
  variant = 'brand',
  animated = false,
  className = '',
}) => {
  const easeCurve: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const radius = Math.round(size * 0.28);
  const isBrand = variant === 'brand';
  const isLight = variant === 'light';

  return (
    <motion.div
      initial={animated ? { scale: 0.92, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.52, ease: easeCurve }}
      style={{
        width: size,
        height: size,
        borderRadius: variant === 'minimal' ? 0 : radius,
        background: isBrand
          ? `linear-gradient(145deg, ${palette.accentGradFrom} 0%, ${palette.accentGradVia} 58%, ${palette.accentGradTo} 100%)`
          : isLight
          ? '#FFFFFF'
          : 'transparent',
        boxShadow: isBrand
          ? `0 12px 28px -6px ${palette.accentShadow}, inset 0 1px 1px rgba(255, 255, 255, 0.28)`
          : isLight
          ? '0 10px 26px -6px rgba(25, 18, 56, 0.10), 0 0 0 1px rgba(99, 62, 246, 0.14)'
          : 'none',
      }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
    >
      {/* Subtle internal top-left specular sheen */}
      {isBrand && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0) 58%)',
          }}
        />
      )}

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[74%] h-[74%] overflow-visible"
      >
        {concept === 'knot' && (
          /* CONCEPT 1: УЗЕЛ ВСТРЕЧИ (The Gathering Knot "K") */
          <>
            <motion.path
              d="M20 14V50"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="7.5"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, y: 6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.62, delay: animated ? 0.06 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M46 15C40 21 34 27 25.5 32"
              stroke={isBrand ? 'rgba(255,255,255,0.92)' : palette.accentGradFrom}
              strokeWidth="7.5"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, x: 5, y: -4 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, x: 0, y: 0 } : undefined}
              transition={{ duration: 0.65, delay: animated ? 0.2 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M27.5 32C34.5 36.8 40.5 42.8 46.5 49"
              stroke={isBrand ? 'rgba(255,255,255,0.82)' : palette.accentGradTo}
              strokeWidth="7.5"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, x: 5, y: 4 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, x: 0, y: 0 } : undefined}
              transition={{ duration: 0.65, delay: animated ? 0.34 : 0, ease: easeCurve }}
            />
            <motion.circle
              cx="46.5"
              cy="32"
              r="4.4"
              fill={isBrand ? palette.accentSecondary : palette.accentPrimary}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: [0, 1.2, 1], opacity: 1 } : undefined}
              transition={{ duration: 0.5, delay: animated ? 0.65 : 0, ease: easeCurve }}
            />
          </>
        )}

        {concept === 'circle' && (
          /* CONCEPT 2: КРУГ КОМПАНИИ (Four Interlocking Friendship Arcs Around Shared Table) */
          <>
            <motion.path
              d="M20 26C20 18.268 25.373 12 32 12C38.627 12 44 18.268 44 26"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="6.2"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, y: -6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: animated ? 0.06 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M38 20C45.732 20 52 25.373 52 32C52 38.627 45.732 44 38 44"
              stroke={isBrand ? 'rgba(255,255,255,0.86)' : palette.accentGradFrom}
              strokeWidth="6.2"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, x: 6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.6, delay: animated ? 0.18 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M44 38C44 45.732 38.627 52 32 52C25.373 52 20 45.732 20 38"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="6.2"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, y: 6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: animated ? 0.3 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M26 44C18.268 44 12 38.627 12 32C12 25.373 18.268 20 26 20"
              stroke={isBrand ? 'rgba(255,255,255,0.86)' : palette.accentGradTo}
              strokeWidth="6.2"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, x: -6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.6, delay: animated ? 0.42 : 0, ease: easeCurve }}
            />
            <motion.circle
              cx="32"
              cy="32"
              r="5.2"
              fill={isBrand ? palette.accentSecondary : palette.accentPrimary}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: [0, 1.25, 1], opacity: 1 } : undefined}
              transition={{ duration: 0.5, delay: animated ? 0.65 : 0, ease: easeCurve }}
            />
          </>
        )}

        {concept === 'compass' && (
          /* CONCEPT 3: КОМПАС СОБЫТИЙ (Geometric Event Compass & Monogram K) */
          <>
            <motion.circle
              cx="32"
              cy="32"
              r="21"
              stroke={isBrand ? 'rgba(255,255,255,0.34)' : palette.accentSoftBorder}
              strokeWidth="4.5"
              initial={animated ? { pathLength: 0, opacity: 0 } : false}
              animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.7, delay: animated ? 0.05 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M22 19V45"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="6.8"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0 } : false}
              animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.55, delay: animated ? 0.18 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M42 20L28 32L42 44"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="6.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={animated ? { pathLength: 0, opacity: 0, x: 6 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.62, delay: animated ? 0.32 : 0, ease: easeCurve }}
            />
            <motion.circle
              cx="45"
              cy="17"
              r="4"
              fill={isBrand ? palette.accentSecondary : palette.accentPrimary}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: [0, 1.25, 1], opacity: 1 } : undefined}
              transition={{ duration: 0.45, delay: animated ? 0.65 : 0, ease: easeCurve }}
            />
          </>
        )}

        {concept === 'dialogue' && (
          /* CONCEPT 4: ЖИВАЯ ВОЛНА (Two Resonating Dialogue Waves + Spark) */
          <>
            <motion.path
              d="M14 25C20 15 31 15 37 25C43 35 50 28 50 21"
              stroke={isBrand ? '#FFFFFF' : palette.accentPrimary}
              strokeWidth="7"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, y: -5 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.65, delay: animated ? 0.08 : 0, ease: easeCurve }}
            />
            <motion.path
              d="M14 43C14 36 21 29 27 39C33 49 44 49 50 39"
              stroke={isBrand ? 'rgba(255,255,255,0.84)' : palette.accentGradFrom}
              strokeWidth="7"
              strokeLinecap="round"
              initial={animated ? { pathLength: 0, opacity: 0, y: 5 } : false}
              animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.65, delay: animated ? 0.26 : 0, ease: easeCurve }}
            />
            <motion.circle
              cx="32"
              cy="32"
              r="4.5"
              fill={isBrand ? palette.accentSecondary : palette.accentPrimary}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: [0, 1.25, 1], opacity: 1 } : undefined}
              transition={{ duration: 0.48, delay: animated ? 0.62 : 0, ease: easeCurve }}
            />
          </>
        )}

        {concept === 'prism' && (
          /* CONCEPT 5: ТРИЛИСТНИК ЭМОЦИЙ (Three Architectural Petals Converging) */
          <>
            <motion.rect
              x="16"
              y="13"
              width="12"
              height="38"
              rx="6"
              fill={isBrand ? '#FFFFFF' : palette.accentPrimary}
              initial={animated ? { scaleY: 0, opacity: 0 } : false}
              animate={animated ? { scaleY: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.55, delay: animated ? 0.08 : 0, ease: easeCurve }}
            />
            <motion.rect
              x="31"
              y="13"
              width="12"
              height="24"
              rx="6"
              transform="rotate(38 37 25)"
              fill={isBrand ? 'rgba(255,255,255,0.92)' : palette.accentGradFrom}
              initial={animated ? { scale: 0.4, opacity: 0 } : false}
              animate={animated ? { scale: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.55, delay: animated ? 0.24 : 0, ease: easeCurve }}
            />
            <motion.rect
              x="31"
              y="27"
              width="12"
              height="24"
              rx="6"
              transform="rotate(-38 37 39)"
              fill={isBrand ? 'rgba(255,255,255,0.78)' : palette.accentGradTo}
              initial={animated ? { scale: 0.4, opacity: 0 } : false}
              animate={animated ? { scale: 1, opacity: 1 } : undefined}
              transition={{ duration: 0.55, delay: animated ? 0.38 : 0, ease: easeCurve }}
            />
            <motion.circle
              cx="48"
              cy="32"
              r="4.2"
              fill={isBrand ? palette.accentSecondary : palette.accentPrimary}
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={animated ? { scale: [0, 1.25, 1], opacity: 1 } : undefined}
              transition={{ duration: 0.48, delay: animated ? 0.64 : 0, ease: easeCurve }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
};
