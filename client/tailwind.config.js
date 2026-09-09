/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#EEF2FF', // Soft lavender/periwinkle canvas tint
          subtle: '#EAEFFD',
          alt: '#F8FAFC',
        },
        surface: {
          DEFAULT: '#FFFFFF', // Pure crisp white
          elevated: '#FFFFFF',
          muted: '#F8FAFC',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#B0AEFF', // Periwinkle accent
          500: '#6366F1', // Royal Indigo primary
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        pastel: {
          mint: '#ECFDF5',
          mintText: '#065F46',
          sky: '#E0F2FE',
          skyText: '#0369A1',
          rose: '#FFE4E6',
          roseText: '#9F1239',
          lavender: '#EEF2FF',
          lavenderText: '#4338CA',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'bento': '0 10px 30px rgba(99, 102, 241, 0.06), 0 1px 3px rgba(15, 23, 42, 0.03)',
        'bento-hover': '0 20px 35px -5px rgba(99, 102, 241, 0.12), 0 8px 12px -3px rgba(15, 23, 42, 0.04)',
        'btn-glow': '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
        'btn-hover': '0 12px 24px -4px rgba(99, 102, 241, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
        '2xl': '40px',
      },
      animation: {
        'shimmer': 'shimmer 1.8s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}

