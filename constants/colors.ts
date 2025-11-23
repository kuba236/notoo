export const COLORS = {
  bg: '#000000',
  surface: 'rgba(28, 28, 30, 0.6)',
  surfaceHighlight: 'rgba(44, 44, 46, 0.8)',
  secondary:"#f00",
  primary: '#0A84FF',
  accent: '#BF5AF2',  // Modern Purple
  text: '#FFFFFF',
  textSec: '#8E8E93',
  border: 'rgba(255,255,255,0.1)',
  card:"#1d1d1dff",
  // Memory Anchor Colors
  anchor: {
    RED: { color: '#FF453A', emoji: '🔴' }, // Złość/Ważne/Alarm
    BLUE: { color: '#0A84FF', emoji: '🔵' }, // Spokój/Koncept
    GREEN: { color: '#32D74B', emoji: '🟢' }, // Sukces/Wzrost
    PURPLE: { color: '#AF52DE', emoji: '🟣' }, // Kreatywność/Abstrakcja
    YELLOW: { color: '#FFD60A', emoji: '🟡' }, // Odkrycie/Wątpliwość
  }
};

export const ANCHOR_KEYS = Object.keys(COLORS.anchor) as Array<keyof typeof COLORS.anchor>;