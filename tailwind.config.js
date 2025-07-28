import { theme } from '@ford/gdux-design-foundation/dist/tailwind-theme/theme.main';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    // "./public/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@ford/ford-ui-components/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    ...theme,
    extend: {},
  },
  plugins: [
  ],
}