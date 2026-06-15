/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d4dac9',
          300: '#b5c0a4',
          400: '#9aab7f',
          500: '#7d9460',
          600: '#62764c',
          700: '#4d5c3d',
          800: '#404b34',
          900: '#37402d',
        },
        coffee: {
          50: '#faf8f6',
          100: '#f2efe9',
          200: '#e4ddd2',
          300: '#d4c8b7',
          400: '#c4b39c',
          500: '#b8a084',
          600: '#a88b6e',
          700: '#8c735c',
          800: '#745f4e',
          900: '#604f42',
        },
        mint: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d4',
          300: '#86efb3',
          400: '#4ade96',
          500: '#22c573',
          600: '#16a35b',
          700: '#15804d',
          800: '#166539',
          900: '#14532d',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdfaf5',
          200: '#faf5eb',
          300: '#f6eddd',
          400: '#f0e0c7',
          500: '#e8cfa9',
          600: '#d9b88a',
          700: '#c49d6d',
          800: '#a68259',
          900: '#876b48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
