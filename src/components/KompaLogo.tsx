import React from 'react';
import { motion } from 'framer-motion';

export interface KompaLogoMarkProps {
  /** Pixel dimension of the emblem */
  size?: number;
  /** Visual container style: 'standalone' (no box, pure emblem like IMG_8626) or 'badge' (soft cream card container for compact headers) */
  variant?: 'standalone' | 'badge' | 'brand';
  /** Whether to play the smooth launch formation animation */
  animated?: boolean;
  className?: string;
}

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Helper to render the white person silhouette inside each circular node
 */
const PersonNodeSVG: React.FC<{
  cx: number;
  cy: number;
  r: number;
  fill: string;
  isCenterHub?: boolean;
  animated?: boolean;
  delay?: number;
}> = ({ cx, cy, r, fill, isCenterHub = false, animated = false, delay = 0 }) => {
  const headR = r * 0.235;
  const headCy = cy - r * 0.25;
  const shoulderW = r * 0.48;
  const shoulderTopY = cy + r * 0.04;
  const shoulderBottomY = cy + r * 0.52;

  const shoulderPath = `
    M ${cx - shoulderW} ${shoulderBottomY}
    C ${cx - shoulderW} ${shoulderTopY}, ${cx + shoulderW} ${shoulderTopY}, ${cx + shoulderW} ${shoulderBottomY}
    Z
  `;

  return (
    <motion.g
      initial={animated ? { scale: 0, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 310,
        damping: 22,
        delay: animated ? delay : 0,
      }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {/* Main Node Circle */}
      <circle cx={cx} cy={cy} r={r} fill={fill} />

      {/* Person Head */}
      <circle cx={cx} cy={headCy} r={headR} fill="#FAF8F5" />

      {/* Person Shoulders */}
      <path d={shoulderPath} fill="#FAF8F5" />

      {/* Subtle warm bottom highlight on the central hub node matching IMG_8626 */}
      {isCenterHub && (
        <path
          d={`M ${cx - shoulderW * 0.92} ${cy + r * 0.34} L ${cx + shoulderW * 0.92} ${cy + r * 0.34} L ${cx + shoulderW} ${shoulderBottomY} L ${cx - shoulderW} ${shoulderBottomY} Z`}
          fill="#F5A699"
          opacity="0.72"
        />
      )}
    </motion.g>
  );
};

/**
 * Official Kompa Graphic Symbol (Based directly on IMG_8626_d30e70fc.png):
 * - 4 Warm Coral person nodes on the left & center connected in a triangular network
 * - 3 Deep Navy person nodes on the right branching from the center hub (forming a "K")
 * - Deep Navy Map Location Pin & focal dot at top-center above the central person
 */
export const KompaLogoMark: React.FC<KompaLogoMarkProps> = ({
  size = 84,
  variant = 'standalone',
  animated = false,
  className = '',
}) => {
  const CORAL = '#E8614D';
  const NAVY = '#162946';
  const isBadge = variant === 'badge' || variant === 'brand';
  const radius = Math.round(size * 0.26);

  return (
    <motion.div
      initial={animated ? { scale: 0.94, opacity: 0 } : false}
      animate={animated ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.5, ease: STUDIO_EASE }}
      style={{
        width: size,
        height: size,
        borderRadius: isBadge ? radius : 0,
        backgroundColor: isBadge ? '#FAF7F2' : 'transparent',
        border: isBadge ? '1px solid #ECE3D8' : 'none',
        boxShadow: isBadge
          ? '0 4px 14px -3px rgba(22, 41, 70, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : 'none',
      }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <svg
        viewBox="0 0 240 222"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isBadge ? 'w-[84%] h-[84%] overflow-visible' : 'w-full h-full overflow-visible'}
      >
        {/* =================================================================
            1. CORAL NETWORK CONNECTIONS (Left & Center Triangle Web)
            ================================================================= */}
        {/* Center Hub (122, 126) -> Top-Left (66, 62) */}
        <motion.line
          x1="122"
          y1="126"
          x2="66"
          y2="62"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.14 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Far-Left (30, 126) */}
        <motion.line
          x1="122"
          y1="126"
          x2="30"
          y2="126"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.18 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Bottom-Left (66, 190) */}
        <motion.line
          x1="122"
          y1="126"
          x2="66"
          y2="190"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.22 : 0, ease: STUDIO_EASE }}
        />
        {/* Outer Left Edge: Top-Left (66, 62) -> Far-Left (30, 126) */}
        <motion.line
          x1="66"
          y1="62"
          x2="30"
          y2="126"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.42, delay: animated ? 0.32 : 0, ease: STUDIO_EASE }}
        />
        {/* Outer Left Edge: Far-Left (30, 126) -> Bottom-Left (66, 190) */}
        <motion.line
          x1="30"
          y1="126"
          x2="66"
          y2="190"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.42, delay: animated ? 0.36 : 0, ease: STUDIO_EASE }}
        />

        {/* =================================================================
            2. DEEP NAVY CONNECTIONS (Right Side Branches)
            ================================================================= */}
        {/* Center Hub (122, 126) -> Top-Right (178, 62) */}
        <motion.line
          x1="122"
          y1="126"
          x2="178"
          y2="62"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.28 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Far-Right (210, 126) */}
        <motion.line
          x1="122"
          y1="126"
          x2="210"
          y2="126"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.34 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Bottom-Right (178, 190) */}
        <motion.line
          x1="122"
          y1="126"
          x2="178"
          y2="190"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, delay: animated ? 0.4 : 0, ease: STUDIO_EASE }}
        />

        {/* =================================================================
            3. CORAL PERSON NODES (Center Hub + 3 Left Nodes)
            ================================================================= */}
        {/* Center Hub Node */}
        <PersonNodeSVG
          cx={122}
          cy={126}
          r={32}
          fill={CORAL}
          isCenterHub={true}
          animated={animated}
          delay={0.04}
        />
        {/* Top-Left Coral Node */}
        <PersonNodeSVG
          cx={66}
          cy={62}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.22}
        />
        {/* Far-Left Middle Coral Node */}
        <PersonNodeSVG
          cx={30}
          cy={126}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.27}
        />
        {/* Bottom-Left Coral Node */}
        <PersonNodeSVG
          cx={66}
          cy={190}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.32}
        />

        {/* =================================================================
            4. DEEP NAVY PERSON NODES (3 Right Nodes)
            ================================================================= */}
        {/* Top-Right Navy Node */}
        <PersonNodeSVG
          cx={178}
          cy={62}
          r={24}
          fill={NAVY}
          animated={animated}
          delay={0.38}
        />
        {/* Far-Right Middle Navy Node */}
        <PersonNodeSVG
          cx={210}
          cy={126}
          r={24}
          fill={NAVY}
          animated={animated}
          delay={0.44}
        />
        {/* Bottom-Right Navy Node */}
        <PersonNodeSVG
          cx={178}
          cy={190}
          r={24}
          fill={NAVY}
          animated={animated}
          delay={0.5}
        />

        {/* =================================================================
            5. TOP-CENTER DEEP NAVY MAP PIN & DOT
            ================================================================= */}
        {/* Small Navy Dot directly above the Center Coral Hub */}
        <motion.circle
          cx="122"
          cy="83"
          r="4.8"
          fill={NAVY}
          initial={animated ? { scale: 0, opacity: 0 } : false}
          animate={animated ? { scale: 1, opacity: 1 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 340,
            damping: 20,
            delay: animated ? 0.56 : 0,
          }}
          style={{ transformOrigin: '122px 83px' }}
        />

        {/* Map Location Pin above the Dot */}
        <motion.g
          initial={animated ? { y: -16, scale: 0.7, opacity: 0 } : false}
          animate={animated ? { y: 0, scale: 1, opacity: 1 } : undefined}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: animated ? 0.62 : 0,
          }}
          style={{ transformOrigin: '122px 42px' }}
        >
          <path
            d="M122 10C109.85 10 100 19.85 100 32C100 47.2 117.6 65.4 120.4 68.2C121.28 69.08 122.72 69.08 123.6 68.2C126.4 65.4 144 47.2 144 32C144 19.85 134.15 10 122 10Z"
            fill={NAVY}
          />
          <circle cx="122" cy="31.5" r="8" fill="#FAF8F5" />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export interface KompaLogoFullProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showTagline?: boolean;
  className?: string;
}

/**
 * Full Brand Lockup: Constellation & Map Pin Emblem + bold navy "Kompa" wordmark
 */
export const KompaLogoFull: React.FC<KompaLogoFullProps> = ({
  size = 'md',
  animated = false,
  showTagline = false,
  className = '',
}) => {
  const markSize = size === 'lg' ? 124 : size === 'md' ? 92 : 38;
  const textSizeClass =
    size === 'lg'
      ? 'text-[38px] leading-none'
      : size === 'md'
      ? 'text-[30px] leading-none'
      : 'text-[19px] leading-none';

  return (
    <div
      className={`inline-flex ${
        size === 'sm' ? 'flex-row items-center gap-2.5' : 'flex-col items-center text-center'
      } select-none ${className}`}
    >
      <KompaLogoMark
        size={markSize}
        variant={size === 'sm' ? 'badge' : 'standalone'}
        animated={animated}
      />

      <motion.div
        initial={animated ? { opacity: 0, y: 8 } : false}
        animate={animated ? { opacity: 1, y: 0 } : undefined}
        transition={{
          duration: 0.5,
          delay: animated ? 0.52 : 0,
          ease: STUDIO_EASE,
        }}
        className={size === 'sm' ? 'flex items-baseline' : 'mt-2.5 flex flex-col items-center'}
      >
        <span
          className={`font-display font-extrabold tracking-[-0.03em] ${textSizeClass}`}
          style={{ color: '#162946' }}
        >
          Kompa
        </span>

        {showTagline && (
          <span className="mt-2 text-[13px] font-medium text-[#7B6E65] max-w-[275px] leading-snug">
            Находите компанию для праздников, событий и совместного отдыха
          </span>
        )}
      </motion.div>
    </div>
  );
};
