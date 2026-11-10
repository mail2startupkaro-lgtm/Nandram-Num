import type { Config } from 'tailwindcss';

const v = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1200px' } },
    extend: {
      colors: {
        background: v('background'),
        foreground: v('foreground'),
        card: { DEFAULT: v('card'), foreground: v('card-foreground') },
        primary: { DEFAULT: v('primary'), foreground: v('primary-foreground') },
        secondary: { DEFAULT: v('secondary'), foreground: v('secondary-foreground') },
        muted: { DEFAULT: v('muted'), foreground: v('muted-foreground') },
        accent: { DEFAULT: v('accent'), foreground: v('accent-foreground') },
        gold: v('gold'),
        maroon: v('maroon'),
        success: v('success'),
        warning: v('warning'),
        danger: v('danger'),
        border: v('border'),
        input: v('input'),
        ring: v('ring'),
      },
      fontFamily: {
        cinzel: ['var(--font-cinzel)', 'var(--font-deva-serif)', 'Georgia', 'serif'],
        serif: ['var(--font-playfair)', 'var(--font-deva-serif)', 'var(--font-cormorant)', 'Georgia', 'serif'],
        sans: ['var(--font-poppins)', 'var(--font-deva)', 'system-ui', 'sans-serif'],
        deva: ['var(--font-deva)', 'var(--font-poppins)', 'sans-serif'],
      },
      borderRadius: { lg: '0.9rem', md: '0.65rem', sm: '0.45rem' },
      keyframes: {
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: { 'spin-slow': 'spinSlow 180s linear infinite', shimmer: 'shimmer 3s linear infinite' },
    },
  },
  plugins: [],
} satisfies Config;
