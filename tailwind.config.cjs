/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        appbg: '#E2E2E2',
        appred: '#FF0033',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
}
