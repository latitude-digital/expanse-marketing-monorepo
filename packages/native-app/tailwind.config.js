/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Meridian brand colors
        meridian: {
          primary: '#257180',
          'primary-dark': '#1B5560',
          'primary-light': '#3A94A8',
        },
        // Ford brand colors
        ford: {
          blue: '#003478',
          'light-blue': '#0066CC',
          gray: '#6B7280',
          'light-gray': '#F3F4F6',
        },
        // Lincoln brand colors
        lincoln: {
          black: '#000000',
          gold: '#B8976B',
          gray: '#4B5563',
          'light-gray': '#F9FAFB',
        }
      }
    },
  },
  plugins: [],
}