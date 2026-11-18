import React from 'react';
import { motion } from 'framer-motion';

export interface KompaLogoMarkProps {
  /** Pixel dimension of the square app icon container */
  size?: number;
  /** Visual variant: 'brand' (violet icon container), 'light' (white container), 'minimal' (mark only) */
  variant?: 'brand' | 'light' | 'minimal';
  /** Whether to play the smooth vector formation choreography */
  animated?: boolean;
  className?: string;
}

/**
 * Version 1: Графический знак приложения (Kompa Graphic Symbol)
 *
 * Concept: "The Gathering Knot" (Узел Встречи — Монограмма «K»)
 * Three smooth architectural ribbons representing three people/paths converging
 * into a single shared event and forming a modern, unmistakable "K" monogram.
 * Equally legible on light and dark backgrounds, with zero clichés.
 */
export const KompaLogoMark: React.FC<KompaLogoMarkProps> = ({
  size = 56,
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
      transition={{ duration: 0.55, ease: easeCurve }}
      style={{
        width: size,
        height: size,
        borderRadius: variant === 'minimal' ? 0 : radius,
        background: isBrand
          ? 'linear-gradient(145deg, #6C47FF 0%, #522EE5 58%, #3F1FC2 100%)'
          : isLight
          ? '#FFFFFF'
          : 'transparent',
        boxShadow: isBrand
          ? '0 12px 28px -6px rgba(82, 46, 229, 0.34), 0 2px 6px -1px rgba(82, 46, 229, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.28)'
          : isLight
          ? '0 10px 26px -6px rgba(25, 18, 56, 0.10), 0 0 0 1px rgba(99, 62, 246, 0.14)'
          : 'none',
      }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden ${className}`}
    >
      {/* Subtle internal top-left specular sheen for hardware-grade tactile depth */}
      {isBrand && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 58%)',
          }}
        />
      )}

      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[74%] h-[74%] overflow-visible"
      >
        <defs>
          {/* Left Vertical Path Gradient */}
          <linearGradient id="kompa-ribbon-left" x1="20" y1="12" x2="20" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBrand ? '#FFFFFF' : '#522EE5'} />
            <stop offset="100%" stopColor={isBrand ? '#E2D9FF' : '#7C5CFA'} />
          </linearGradient>

          {/* Upper-Right Converging Path Gradient */}
          <linearGradient id="kompa-ribbon-top" x1="48" y1="14" x2="24" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBrand ? '#FFFFFF' : '#633EF6'} />
            <stop offset="100%" stopColor={isBrand ? '#D6C8FF' : '#8B6CFF'} />
          </linearGradient>

          {/* Lower-Right Outgoing Celebration Path Gradient */}
          <linearGradient id="kompa-ribbon-bottom" x1="26" y1="31" x2="49" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={isBrand ? '#CBB9FF' : '#7C5CFA'} />
            <stop offset="100%" stopColor={isBrand ? '#FFFFFF' : '#4B27D6'} />
          </linearGradient>
        </defs>

        {/* PATH 1: The Foundation Pillar (Left vertical trajectory with gentle organic curve) */}
        <motion.path
          d="M20 14V50"
          stroke="url(#kompa-ribbon-left)"
          strokeWidth="7.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0, y: 6 } : false}
          animate={animated ? { pathLength: 1, opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.65,
            delay: animated ? 0.08 : 0,
            ease: easeCurve,
          }}
        />

        {/* PATH 2: The Incoming Friend Trajectory (Upper-right arc curving smoothly into the meeting point) */}
        <motion.path
          d="M46 15C40 21 34 27 25.5 32"
          stroke="url(#kompa-ribbon-top)"
          strokeWidth="7.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0, x: 6, y: -4 } : false}
          animate={animated ? { pathLength: 1, opacity: 1, x: 0, y: 0 } : undefined}
          transition={{
            duration: 0.68,
            delay: animated ? 0.24 : 0,
            ease: easeCurve,
          }}
        />

        {/* PATH 3: The Shared Experience Trajectory (Flowing from the meeting point to the bottom-right) */}
        <motion.path
          d="M27.5 32C34.5 36.8 40.5 42.8 46.5 49"
          stroke="url(#kompa-ribbon-bottom)"
          strokeWidth="7.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0, x: 6, y: 4 } : false}
          animate={animated ? { pathLength: 1, opacity: 1, x: 0, y: 0 } : undefined}
          transition={{
            duration: 0.68,
            delay: animated ? 0.38 : 0,
            ease: easeCurve,
          }}
        />

        {/* ACCENT POINT: The Spark of Gathering (Subtle warm lilac-coral dot floating above the convergence) */}
        <motion.circle
          cx="46.5"
          cy="32"
          r="4.2"
          fill={isBrand ? '#C4B5FD' : '#8B5CF6'}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={
            animated
              ? {
                  scale: [0, 1.18, 1],
                  opacity: [0, 1, 1],
                }
              : undefined
          }
          transition={{
            duration: 0.55,
            delay: animated ? 0.72 : 0,
            ease: easeCurve,
          }}
        />
      </svg>
    </motion.div>
  );
};

export interface KompaLogoFullProps {
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Theme surface context */
  theme?: 'light' | 'dark';
  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether to show the subtle descriptor below the wordmark */
  showTagline?: boolean;
  /** Whether to animate the formation sequence */
  animated?: boolean;
  className?: string;
}

/**
 * Version 2: Полная версия с названием приложения (Graphic Symbol + Wordmark Lockup)
 */
export const KompaLogoFull: React.FC<KompaLogoFullProps> = ({
  size = 'md',
  theme = 'light',
  orientation = 'horizontal',
  showTagline = false,
  animated = false,
  className = '',
}) => {
  const easeCurve: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const isVertical = orientation === 'vertical';

  const markSize = size === 'lg' ? 68 : size === 'md' ? 48 : 36;
  const wordSizeClass =
    size === 'lg'
      ? 'text-[30px] leading-none'
      : size === 'md'
      ? 'text-[22px] leading-none'
      : 'text-[18px] leading-none';

  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#141026';
  const taglineTextColor = theme === 'dark' ? 'rgba(226, 217, 255, 0.72)' : '#6E6888';

  return (
    <div
      className={`inline-flex ${
        isVertical ? 'flex-col items-center text-center gap-3.5' : 'flex-row items-center gap-3'
      } select-none ${className}`}
    >
      <KompaLogoMark size={markSize} variant="brand" animated={animated} />

      <motion.div
        initial={animated ? { opacity: 0, y: isVertical ? 8 : 0, x: isVertical ? 0 : -6 } : false}
        animate={animated ? { opacity: 1, y: 0, x: 0 } : undefined}
        transition={{
          duration: 0.55,
          delay: animated ? 0.52 : 0,
          ease: easeCurve,
        }}
        className={`flex flex-col ${isVertical ? 'items-center' : 'items-start'}`}
      >
        <div className="flex items-baseline">
          <span
            className={`font-display font-extrabold tracking-[-0.035em] ${wordSizeClass}`}
            style={{ color: primaryTextColor }}
          >
            kompa
          </span>
          <motion.span
            initial={animated ? { scale: 0, opacity: 0 } : false}
            animate={animated ? { scale: 1, opacity: 1 } : undefined}
            transition={{
              duration: 0.4,
              delay: animated ? 0.85 : 0,
              ease: easeCurve,
            }}
            className="inline-block w-1.5 h-1.5 rounded-full ml-0.5 mb-0.5"
            style={{ backgroundColor: '#6C47FF' }}
          />
        </div>

        {showTagline && (
          <motion.span
            initial={animated ? { opacity: 0, y: 4 } : false}
            animate={animated ? { opacity: 1, y: 0 } : undefined}
            transition={{
              duration: 0.45,
              delay: animated ? 0.78 : 0,
              ease: easeCurve,
            }}
            className="text-xs font-medium tracking-[-0.01em] mt-1.5"
            style={{ color: taglineTextColor }}
          >
            Люди и события рядом
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};
