/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        appbg: '#E2E2E2',
        appred: '#FF0033',
      },
      keyframes: {
        swipeHint: {
          '0%':   { opacity: '0.3', transform: 'translateX(-10px)' },
          '50%':  { opacity: '1',   transform: 'translateX(0px)'  },
          '100%': { opacity: '0.3', transform: 'translateX(10px)'  },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
        fadeInDown: {
          '0%':   { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'       },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'      },
        },
      },
      animation: {
        swipeHint:   'swipeHint 2s ease-in-out infinite',
        fadeOut:     'fadeOut 0.3s ease-out forwards',
        fadeInDown:  'fadeInDown 0.5s ease-out forwards',
        fadeInUp:    'fadeInUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
}
