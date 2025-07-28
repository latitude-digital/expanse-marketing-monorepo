/** @type {import('tailwindcss').Config} */

// Import Ford UI presets
const globalPreset = require('../ford-ui/tailwind.global.preset.js');
const fdsTheme = require('../ford-ui/themes/fds/fds.main.js');

module.exports = {
  presets: [globalPreset],
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include Ford UI v2 components in Tailwind content scanning
    "../ford-ui/packages/@ui/ford-ui-components/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Merge Ford Design System theme
      ...fdsTheme.theme,
      // Additional theme extensions for the web app
      boxShadow: {
        ...fdsTheme.theme.boxShadow,
        card: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        ford: ['Ford-Font', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Additional plugins can be added here
  ],
}