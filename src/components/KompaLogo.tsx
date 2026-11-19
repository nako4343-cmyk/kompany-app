import React from 'react';
import { motion } from 'framer-motion';

export interface KompaLogoMarkProps {
  /** Pixel dimension of the emblem */
  size?: number;
  /** Visual container style: 'standalone' (pure emblem like IMG_8626) or 'badge' (soft cream card container for compact headers) */
  variant?: 'standalone' | 'badge' | 'brand';
  /** Whether to play the full 3-second launch formation animation */
  animated?: boolean;
  className?: string;
}

const STUDIO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const HUB_X = 122;
const HUB_Y = 126;

/**
 * Renders one circular person node.
 * When `animated` is true, outer nodes smoothly travel outward from the central hub (122, 126)
 * to their target coordinates (cx, cy) — using pure x/y translation which works 100% reliably
 * in iOS Safari SVG without any transform-origin quirks.
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

  // Offset from the central hub so the node visibly travels outward from the center
  const offsetX = isCenterHub ? 0 : HUB_X - cx;
  const offsetY = isCenterHub ? 0 : HUB_Y - cy;

  return (
    <motion.g
      initial={
        animated
          ? {
              x: offsetX,
              y: offsetY,
              opacity: 0,
            }
          : false
      }
      animate={
        animated
          ? {
              x: 0,
              y: 0,
              opacity: 1,
            }
          : undefined
      }
      transition={{
        duration: isCenterHub ? 0.55 : 0.68,
        delay: animated ? delay : 0,
        ease: STUDIO_EASE,
      }}
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
 *
 * Full 3-second launch choreography:
 * 0.15s - 0.65s: Central Coral Hub appears with a warm expanding pulse ring
 * 0.55s - 1.45s: 3 Left Coral nodes travel outward from the center hub as coral links form
 * 1.35s - 2.15s: 3 Right Deep Navy nodes travel outward from the center hub as navy links form
 * 2.05s - 2.65s: Top Deep Navy Map Pin drops into place from above with a location radar pulse
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
    <div
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
        {/* Warm Expanding Radar Pulse Ring from Center Hub during 3s Launch Animation */}
        {animated && (
          <>
            <motion.circle
              cx={HUB_X}
              cy={HUB_Y}
              r={32}
              stroke={CORAL}
              strokeWidth="3"
              fill="none"
              initial={{ r: 28, opacity: 0 }}
              animate={{
                r: [28, 72, 96],
                opacity: [0, 0.45, 0],
              }}
              transition={{
                duration: 1.4,
                delay: 0.25,
                ease: 'easeOut',
              }}
            />
            <motion.circle
              cx={122}
              cy={32}
              r={18}
              stroke={NAVY}
              strokeWidth="2.5"
              fill="none"
              initial={{ r: 16, opacity: 0 }}
              animate={{
                r: [16, 44, 56],
                opacity: [0, 0.38, 0],
              }}
              transition={{
                duration: 0.95,
                delay: 2.15,
                ease: 'easeOut',
              }}
            />
          </>
        )}

        {/* =================================================================
            1. CORAL NETWORK CONNECTIONS (Left & Center Triangle Web)
            ================================================================= */}
        {/* Center Hub (122, 126) -> Top-Left (66, 62) */}
        <motion.path
          d="M 122 126 L 66 62"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 0.52 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Far-Left (30, 126) */}
        <motion.path
          d="M 122 126 L 30 126"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 0.72 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Bottom-Left (66, 190) */}
        <motion.path
          d="M 122 126 L 66 190"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 0.92 : 0, ease: STUDIO_EASE }}
        />
        {/* Outer Left Edge: Top-Left (66, 62) -> Far-Left (30, 126) */}
        <motion.path
          d="M 66 62 L 30 126"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.48, delay: animated ? 1.12 : 0, ease: STUDIO_EASE }}
        />
        {/* Outer Left Edge: Far-Left (30, 126) -> Bottom-Left (66, 190) */}
        <motion.path
          d="M 30 126 L 66 190"
          stroke={CORAL}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.48, delay: animated ? 1.24 : 0, ease: STUDIO_EASE }}
        />

        {/* =================================================================
            2. DEEP NAVY CONNECTIONS (Right Side Branches)
            ================================================================= */}
        {/* Center Hub (122, 126) -> Top-Right (178, 62) */}
        <motion.path
          d="M 122 126 L 178 62"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 1.38 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Far-Right (210, 126) */}
        <motion.path
          d="M 122 126 L 210 126"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 1.56 : 0, ease: STUDIO_EASE }}
        />
        {/* Center Hub (122, 126) -> Bottom-Right (178, 190) */}
        <motion.path
          d="M 122 126 L 178 190"
          stroke={NAVY}
          strokeWidth="8.5"
          strokeLinecap="round"
          initial={animated ? { pathLength: 0, opacity: 0 } : false}
          animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.55, delay: animated ? 1.74 : 0, ease: STUDIO_EASE }}
        />

        {/* =================================================================
            3. CORAL PERSON NODES (Center Hub + 3 Left Nodes)
            ================================================================= */}
        {/* Top-Left Coral Node */}
        <PersonNodeSVG
          cx={66}
          cy={62}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.5}
        />
        {/* Far-Left Middle Coral Node */}
        <PersonNodeSVG
          cx={30}
          cy={126}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.7}
        />
        {/* Bottom-Left Coral Node */}
        <PersonNodeSVG
          cx={66}
          cy={190}
          r={24}
          fill={CORAL}
          animated={animated}
          delay={0.9}
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
          delay={1.36}
        />
        {/* Far-Right Middle Navy Node */}
        <PersonNodeSVG
          cx={210}
          cy={126}
          r={24}
          fill={NAVY}
          animated={animated}
          delay={1.54}
        />
        {/* Bottom-Right Navy Node */}
        <PersonNodeSVG
          cx={178}
          cy={190}
          r={24}
          fill={NAVY}
          animated={animated}
          delay={1.72}
        />

        {/* Center Hub Node rendered on top of the inner line origins */}
        <PersonNodeSVG
          cx={122}
          cy={126}
          r={32}
          fill={CORAL}
          isCenterHub={true}
          animated={animated}
          delay={0.12}
        />

        {/* =================================================================
            5. TOP-CENTER DEEP NAVY MAP PIN & DOT (2.0s - 2.6s)
            ================================================================= */}
        {/* Small Navy Dot directly above the Center Coral Hub */}
        <motion.circle
          cx="122"
          cy="83"
          r="4.8"
          fill={NAVY}
          initial={animated ? { y: -18, opacity: 0 } : false}
          animate={animated ? { y: 0, opacity: 1 } : undefined}
          transition={{
            duration: 0.45,
            delay: animated ? 1.98 : 0,
            ease: STUDIO_EASE,
          }}
        />

        {/* Map Location Pin dropping from above */}
        <motion.g
          initial={animated ? { y: -38, opacity: 0 } : false}
          animate={animated ? { y: [null, 4, 0], opacity: 1 } : undefined}
          transition={{
            duration: 0.6,
            delay: animated ? 2.08 : 0,
            ease: STUDIO_EASE,
          }}
        >
          <path
            d="M122 10C109.85 10 100 19.85 100 32C100 47.2 117.6 65.4 120.4 68.2C121.28 69.08 122.72 69.08 123.6 68.2C126.4 65.4 144 47.2 144 32C144 19.85 134.15 10 122 10Z"
            fill={NAVY}
          />
          <circle cx="122" cy="31.5" r="8" fill="#FAF8F5" />
        </motion.g>
      </svg>
    </div>
  );
};

export interface KompaWordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Official Kompa Wordmark Badge:
 * - Rounded rectangle in the logo's deep navy color (#162946)
 * - Capital letter "K" in pure white (#FFFFFF) centered inside a rounded coral-orange square (#E8614D)
 * - Remaining letters "ompa" in pure white (#FFFFFF)
 */
export const KompaWordmark: React.FC<KompaWordmarkProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: {
      container: 'pl-1 pr-2.5 py-1 rounded-[10px] gap-1',
      kBox: 'w-[22px] h-[22px] rounded-[7px] text-[15px]',
      restText: 'text-[16px]',
    },
    md: {
      container: 'pl-1.5 pr-4 py-1.5 rounded-[15px] gap-1.5',
      kBox: 'w-[34px] h-[34px] rounded-[10px] text-[24px]',
      restText: 'text-[27px]',
    },
    lg: {
      container: 'pl-2 pr-5 py-2 rounded-[19px] gap-2',
      kBox: 'w-[44px] h-[44px] rounded-[13px] text-[32px]',
      restText: 'text-[36px]',
    },
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center font-display font-extrabold leading-none tracking-[-0.03em] select-none ${sizeStyles.container} ${className}`}
      style={{
        backgroundColor: '#162946',
        boxShadow:
          '0 10px 24px -8px rgba(22, 41, 70, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      <span
        className={`inline-flex items-center justify-center font-extrabold leading-none shrink-0 ${sizeStyles.kBox}`}
        style={{
          background: 'linear-gradient(135deg, #F06A4B 0%, #E8614D 100%)',
          color: '#FFFFFF',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        }}
      >
        K
      </span>
      <span className={sizeStyles.restText} style={{ color: '#FFFFFF' }}>
        ompa
      </span>
    </span>
  );
};

