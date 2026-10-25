import { ColorPalette, BuiltInFont } from '../types';

export interface PaletteClasses {
  primaryBg: string;
  primaryHover: string;
  primaryRing: string;
  text: string;
  darkText: string;
  border: string;
  badgeBg: string;
  lightBg: string;
  gradientFrom: string;
  swatchHex: string;
  label: string;
}

export const PALETTES: Record<ColorPalette, PaletteClasses> = {
  red: {
    primaryBg: 'bg-red-500',
    primaryHover: 'hover:bg-red-400',
    primaryRing: 'ring-red-500',
    text: 'text-red-500',
    darkText: 'text-red-400',
    border: 'border-red-500/30',
    badgeBg: 'bg-red-500/15',
    lightBg: 'bg-red-50/95',
    gradientFrom: 'from-red-500/20',
    swatchHex: '#ef4444',
    label: 'Red (Default)'
  },
  blue: {
    primaryBg: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-400',
    primaryRing: 'ring-blue-500',
    text: 'text-blue-500',
    darkText: 'text-blue-400',
    border: 'border-blue-500/30',
    badgeBg: 'bg-blue-500/15',
    lightBg: 'bg-blue-50/95',
    gradientFrom: 'from-blue-500/20',
    swatchHex: '#3b82f6',
    label: 'Sapphire Blue'
  },
  green: {
    primaryBg: 'bg-emerald-500',
    primaryHover: 'hover:bg-emerald-400',
    primaryRing: 'ring-emerald-500',
    text: 'text-emerald-500',
    darkText: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/15',
    lightBg: 'bg-emerald-50/95',
    gradientFrom: 'from-emerald-500/20',
    swatchHex: '#10b981',
    label: 'Emerald Green'
  },
  amber: {
    primaryBg: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-400',
    primaryRing: 'ring-amber-500',
    text: 'text-amber-500',
    darkText: 'text-amber-400',
    border: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/15',
    lightBg: 'bg-amber-50/95',
    gradientFrom: 'from-amber-500/20',
    swatchHex: '#f59e0b',
    label: 'Golden Amber'
  },
  purple: {
    primaryBg: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-400',
    primaryRing: 'ring-purple-500',
    text: 'text-purple-500',
    darkText: 'text-purple-400',
    border: 'border-purple-500/30',
    badgeBg: 'bg-purple-500/15',
    lightBg: 'bg-purple-50/95',
    gradientFrom: 'from-purple-500/20',
    swatchHex: '#a855f7',
    label: 'Royal Purple'
  },
  teal: {
    primaryBg: 'bg-teal-500',
    primaryHover: 'hover:bg-teal-400',
    primaryRing: 'ring-teal-500',
    text: 'text-teal-500',
    darkText: 'text-teal-400',
    border: 'border-teal-500/30',
    badgeBg: 'bg-teal-500/15',
    lightBg: 'bg-teal-50/95',
    gradientFrom: 'from-teal-500/20',
    swatchHex: '#14b8a6',
    label: 'Ocean Teal'
  },
  rose: {
    primaryBg: 'bg-rose-500',
    primaryHover: 'hover:bg-rose-400',
    primaryRing: 'ring-rose-500',
    text: 'text-rose-500',
    darkText: 'text-rose-400',
    border: 'border-rose-500/30',
    badgeBg: 'bg-rose-500/15',
    lightBg: 'bg-rose-50/95',
    gradientFrom: 'from-rose-500/20',
    swatchHex: '#f43f5e',
    label: 'Velvet Rose'
  }
};

export const INSTALLED_FONTS: Array<{ name: BuiltInFont; family: string; sample: string }> = [
  { name: 'Outfit', family: "'Outfit', sans-serif", sample: 'WorshipFlow Modern' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", sample: 'Clean Corporate & Modern' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", sample: 'Classic Hymnal Elegant' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", sample: 'Tech Minimalist Display' },
  { name: 'Inter', family: "'Inter', sans-serif", sample: 'Ultra Readable UI' }
];
