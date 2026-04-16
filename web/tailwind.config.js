/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff0f4',
          100: '#ffd6e0',
          200: '#ffadc2',
          300: '#ff85a3',
          400: '#ff5c85',
          500: '#FF3366',
          600: '#e62e5c',
          700: '#bf264d',
          800: '#991f3d',
          900: '#73172e',
        },
        success: {
          50: '#effcf9',
          100: '#d2f7f1',
          200: '#a5efe4',
          300: '#77e7d6',
          400: '#4adfc9',
          500: '#2EC4B6',
          600: '#26a99b',
          700: '#1d7f74',
          800: '#14544d',
          900: '#0a2a27',
        },
        info: {
          50: '#eff8fe',
          100: '#d3effd',
          200: '#a8dffd',
          300: '#7ccffc',
          400: '#51b8f8',
          500: '#20A4F3',
          600: '#1983c2',
          700: '#136291',
          800: '#0c4161',
          900: '#062030',
        },
        background: '#011627',
        surface: '#0b2035',
        'surface-elevated': '#14304a',
        'text-primary': '#F6F7F8',
        'text-secondary': '#c7d0d8',
        'text-muted': '#8b9aaa',
        border: '#22435f',
        'border-light': '#37617f',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
