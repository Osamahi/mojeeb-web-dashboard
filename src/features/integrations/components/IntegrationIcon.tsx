/**
 * Integration Icon
 *
 * Per-vendor brand icon rendered as a CIRCULAR avatar (rounded-full) — matches
 * the visual treatment of `features/connections/components/PlatformIcon.tsx` so
 * the Tools page and Connections page share a single avatar style.
 *
 * Icons use **multi-color brand SVGs** (each glyph carries its own brand colors
 * via embedded `fill` attributes). The wrapper provides a soft tint background
 * + circular clip — same pattern as PlatformIcon. Brand colors are baked into
 * the SVG paths, not driven by `currentColor`, because the canonical Google /
 * Shopify / Notion marks are inherently multi-color and look weak as single-color.
 *
 * Sources (curated, cross-checked May 2026):
 *  - Google Calendar / Shopify / Notion: iconify `logos:*` set (vendor-faithful
 *    multi-color marks)
 *  - Google Sheets: hand-built using Google's official visual identity (rounded
 *    green doc with folded corner + white table grid). iconify's `logos:` set
 *    didn't include Sheets and the mono version (simple-icons) reads weak at
 *    avatar size.
 *
 * NEVER mirror these in RTL — they're trademarks, not directional UI elements.
 */

import { Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrationConnectorId } from '../constants/integrations';

export type IntegrationIconSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<IntegrationIconSize, { wrapper: string; svg: string }> = {
  sm: { wrapper: 'w-8 h-8',   svg: 'w-5 h-5' },
  md: { wrapper: 'w-10 h-10', svg: 'w-6 h-6' },
  lg: { wrapper: 'w-12 h-12', svg: 'w-7 h-7' },
};

/**
 * Per-vendor brand SVG. Each glyph embeds its own colors so the icon reads as
 * the actual vendor mark, not a monochrome stencil. SVGs are kept small (≤1KB)
 * by stripping `xmlns`, IDs, and metadata that the browser doesn't need when
 * rendered inline inside a React tree.
 */
function getBrandSvg(id: IntegrationConnectorId, sizeClass: string): JSX.Element | null {
  switch (id) {
    case 'google_sheets':
      // Hand-built: Google Sheets' canonical visual identity — green rounded
      // rectangle with the folded-corner gesture (top-right) and the white grid.
      // Proportions follow Google's app icon spec (corner fold = ~20% of width).
      return (
        <svg className={sizeClass} viewBox="0 0 48 48" role="img" aria-label="Google Sheets">
          {/* Body — folded-corner shape, single fill */}
          <path
            fill="#0F9D58"
            d="M30 0H8C5.79 0 4 1.79 4 4v40c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V14L30 0z"
          />
          {/* Folded corner highlight */}
          <path fill="#87CEAC" d="M30 0v10c0 2.21 1.79 4 4 4h10L30 0z" />
          {/* Slightly darker shadow on the fold base */}
          <path fill="#F1F1F1" opacity="0.2" d="M30 14V0l14 14H30z" />
          {/* Table grid — white lines */}
          <path
            fill="#FFFFFF"
            d="M13 22v16h22V22H13zm10 14h-8v-4h8v4zm0-6h-8v-4h8v4zm10 6h-8v-4h8v4zm0-6h-8v-4h8v4z"
          />
        </svg>
      );

    case 'google_calendar':
      // iconify logos:google-calendar (multi-color, vendor-faithful).
      return (
        <svg className={sizeClass} viewBox="0 0 256 256" role="img" aria-label="Google Calendar">
          <path fill="#fff" d="M195.368 60.632H60.632v134.736h134.736z" />
          <path fill="#ea4335" d="M195.368 256L256 195.368l-30.316-5.172l-30.316 5.172l-5.533 27.73z" />
          <path fill="#188038" d="M0 195.368v40.421C0 246.956 9.044 256 20.21 256h40.422l6.225-30.316l-6.225-30.316l-33.033-5.172z" />
          <path fill="#1967d2" d="M256 60.632V20.21C256 9.044 246.956 0 235.79 0h-40.422q-5.532 22.554-5.533 33.196q0 10.641 5.533 27.436q20.115 5.76 30.316 5.76T256 60.631" />
          <path fill="#fbbc04" d="M256 60.632h-60.632v134.736H256z" />
          <path fill="#34a853" d="M195.368 195.368H60.632V256h134.736z" />
          <path fill="#4285f4" d="M195.368 0H20.211C9.044 0 0 9.044 0 20.21v175.158h60.632V60.632h134.736z" />
          <path fill="#4285f4" d="M88.27 165.154c-5.036-3.402-8.523-8.37-10.426-14.94l11.689-4.816q1.59 6.063 5.558 9.398c2.627 2.223 5.827 3.318 9.566 3.318q5.734 0 9.852-3.487c2.746-2.324 4.127-5.288 4.127-8.875q0-5.508-4.345-8.994c-2.897-2.324-6.535-3.486-10.88-3.486h-6.754v-11.57h6.063q5.608 0 9.448-3.033c2.56-2.02 3.84-4.783 3.84-8.303c0-3.132-1.145-5.625-3.435-7.494c-2.29-1.87-5.188-2.813-8.708-2.813c-3.436 0-6.164.91-8.185 2.745a16.1 16.1 0 0 0-4.413 6.754l-11.57-4.817c1.532-4.345 4.345-8.185 8.471-11.503s9.398-4.985 15.798-4.985c4.733 0 8.994.91 12.767 2.745c3.772 1.836 6.736 4.379 8.875 7.613c2.14 3.25 3.2 6.888 3.2 10.93c0 4.126-.993 7.613-2.98 10.476s-4.43 5.052-7.327 6.585v.69a22.25 22.25 0 0 1 9.398 7.327c2.442 3.284 3.672 7.208 3.672 11.79c0 4.58-1.163 8.673-3.487 12.26c-2.324 3.588-5.54 6.417-9.617 8.472c-4.092 2.055-8.69 3.1-13.793 3.1c-5.912.016-11.369-1.685-16.405-5.087m71.797-58.005l-12.833 9.28l-6.417-9.734l23.023-16.607h8.825v78.333h-12.598z" />
        </svg>
      );

    case 'shopify':
      // iconify logos:shopify (multi-color, vendor-faithful).
      return (
        <svg className={sizeClass} viewBox="0 0 256 292" role="img" aria-label="Shopify">
          <path fill="#95bf46" d="M223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357a19614 19614 0 0 0-23.383-1.743s-15.507-15.395-17.209-17.099c-1.703-1.703-5.029-1.185-6.32-.805c-.19.056-3.388 1.043-8.678 2.68c-5.18-14.906-14.322-28.604-30.405-28.604c-.444 0-.901.018-1.358.044C129.31 3.407 123.644.779 118.75.779c-37.465 0-55.364 46.835-60.976 70.635c-14.558 4.511-24.9 7.718-26.221 8.133c-8.126 2.549-8.383 2.805-9.45 10.462C21.3 95.806.038 260.235.038 260.235l165.678 31.042l89.77-19.42S223.973 58.8 223.775 57.34M156.49 40.848l-14.019 4.339c.005-.988.01-1.96.01-3.023c0-9.264-1.286-16.723-3.349-22.636c8.287 1.04 13.806 10.469 17.358 21.32m-27.638-19.483c2.304 5.773 3.802 14.058 3.802 25.238c0 .572-.005 1.095-.01 1.624c-9.117 2.824-19.024 5.89-28.953 8.966c5.575-21.516 16.025-31.908 25.161-35.828m-11.131-10.537c1.617 0 3.246.549 4.805 1.622c-12.007 5.65-24.877 19.88-30.312 48.297l-22.886 7.088C75.694 46.16 90.81 10.828 117.72 10.828" />
          <path fill="#5e8e3e" d="M221.237 54.983a19614 19614 0 0 0-23.383-1.743s-15.507-15.395-17.209-17.099c-.637-.634-1.496-.959-2.394-1.099l-12.527 256.233l89.762-19.418S223.972 58.8 223.774 57.34c-.201-1.46-1.48-2.268-2.537-2.357" />
          <path fill="#fff" d="m135.242 104.585l-11.069 32.926s-9.698-5.176-21.586-5.176c-17.428 0-18.305 10.937-18.305 13.693c0 15.038 39.2 20.8 39.2 56.024c0 27.713-17.577 45.558-41.277 45.558c-28.44 0-42.984-17.7-42.984-17.7l7.615-25.16s14.95 12.835 27.565 12.835c8.243 0 11.596-6.49 11.596-11.232c0-19.616-32.16-20.491-32.16-52.724c0-27.129 19.472-53.382 58.778-53.382c15.145 0 22.627 4.338 22.627 4.338" />
        </svg>
      );

    case 'notion':
      // iconify logos:notion-icon (multi-color, vendor-faithful "N" monogram in
      // rounded square — Notion's actual app icon).
      return (
        <svg className={sizeClass} viewBox="0 0 256 268" role="img" aria-label="Notion">
          <path fill="#fff" d="M16.092 11.538L164.09.608c18.179-1.56 22.85-.508 34.28 7.801l47.243 33.282C253.406 47.414 256 48.975 256 55.207v182.527c0 11.439-4.155 18.205-18.696 19.24L65.44 267.378c-10.913.517-16.11-1.043-21.825-8.327L8.826 213.814C2.586 205.487 0 199.254 0 191.97V29.726c0-9.352 4.155-17.153 16.092-18.188" />
          <path d="M164.09.608L16.092 11.538C4.155 12.573 0 20.374 0 29.726v162.245c0 7.284 2.585 13.516 8.826 21.843l34.789 45.237c5.715 7.284 10.912 8.844 21.825 8.327l171.864-10.404c14.532-1.035 18.696-7.801 18.696-19.24V55.207c0-5.911-2.336-7.614-9.21-12.66l-1.185-.856L198.37 8.409C186.94.1 182.27-.952 164.09.608M69.327 52.22c-14.033.945-17.216 1.159-25.186-5.323L23.876 30.778c-2.06-2.086-1.026-4.69 4.163-5.207l142.274-10.395c11.947-1.043 18.17 3.12 22.842 6.758l24.401 17.68c1.043.525 3.638 3.637.517 3.637L71.146 52.095zm-16.36 183.954V81.222c0-6.767 2.077-9.887 8.3-10.413L230.02 60.93c5.724-.517 8.31 3.12 8.31 9.879v153.917c0 6.767-1.044 12.49-10.387 13.008l-161.487 9.361c-9.343.517-13.489-2.594-13.489-10.921M212.377 89.53c1.034 4.681 0 9.897-4.681 9.897l-7.783 1.542v114.404c-6.758 3.637-12.981 5.715-18.18 5.715c-8.308 0-10.386-2.604-16.609-10.396l-50.898-80.079v77.476l16.1 3.646s0 9.362-12.989 9.362l-35.814 2.077c-1.043-2.086 0-7.284 3.63-8.318l9.351-2.595V109.823l-12.98-1.052c-1.044-4.68 1.55-11.439 8.826-11.965l38.426-2.585l52.958 81.113v-71.76l-13.498-1.552c-1.043-5.733 3.111-9.896 8.3-10.404z" />
        </svg>
      );

    default:
      return null;
  }
}

export interface IntegrationIconProps {
  connectorId: string;
  /** Soft tint for the avatar wrapper (e.g. brandBgColor from the catalog). */
  brandBgColor?: string;
  size?: IntegrationIconSize;
  /** Apply grayscale + reduced vibrancy — used for coming-soon state. */
  muted?: boolean;
  className?: string;
}

export function IntegrationIcon({
  connectorId,
  brandBgColor,
  size = 'md',
  muted = false,
  className,
}: IntegrationIconProps) {
  const sz = SIZE_MAP[size];
  const brandSvg = getBrandSvg(connectorId as IntegrationConnectorId, sz.svg);

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden',
        sz.wrapper,
        muted && 'grayscale opacity-70',
        className
      )}
      style={{
        backgroundColor: brandBgColor ?? '#F5F5F5',
      }}
    >
      {brandSvg ?? <Plug className={cn(sz.svg, 'text-neutral-500')} />}
    </div>
  );
}
