/** @type {import('tailwindcss').Config} */

// Auto-generated Ford UI extensions for StyledSelectionCard compatibility
const fordExtensions = require('./src/styles/ford-tailwind-extensions.js');

module.exports = {
  // Use Ford UI Storybook's Tailwind preset for proper ford- prefixed classes
  presets: [
    require('../ford-ui/tailwindPresets/tailwind.fbc.preset')
  ],
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Include Ford UI v2 components in Tailwind content scanning
    "../ford-ui/packages/@ui/ford-ui-components/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // Additional customizations if needed
      boxShadow: {
        card: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        ford: ['Ford-Font', 'Arial', 'sans-serif'],
      },
      // Auto-generated Ford UI extensions for StyledSelectionCard compatibility
      spacing: {
        ...fordExtensions.spacing,
      },
      borderRadius: {
        ...fordExtensions.borderRadius,
      },
      borderWidth: {
        ...fordExtensions.borderWidth,
      },
      height: {
        ...fordExtensions.height,
      },
      colors: {
        // Auto-generated ford- prefixed colors
        ...fordExtensions.colors,
        // Map Ford UI component classes to theme color system
        'ford-text-moderate(default)': 'var(--semantic-color-text-onlight-moderate-default)',
        'ford-text-subtle': 'var(--semantic-color-text-onlight-subtle)',
        'ford-text-subtlest(disabled)': 'var(--semantic-color-text-onlight-subtlest-disabled)',
        'ford-fill-moderate(default)': 'var(--semantic-color-stroke-onlight-moderate-default)',
        'ford-fill-danger-strong': 'var(--semantic-color-fill-onlight-danger-strong)',
        'ford-fill-success-strong': 'var(--semantic-color-fill-onlight-success-strong)',
        'ford-stroke-strongest(focus)': 'var(--semantic-color-stroke-onlight-strongest-focus)',
      }
    },
  },
  safelist: [
    // Ford UI typography classes needed by StyledTextField
    'text-ford-body1-regular',
    'text-ford-body2-regular', 
    'text-ford-caption-semibold',
    // Ford UI color classes needed by StyledTextField  
    'text-ford-text-moderate\\(default\\)',
    'text-ford-text-subtle',
    'text-ford-text-subtlest\\(disabled\\)',
    'border-ford-fill-moderate\\(default\\)',
    'border-ford-fill-danger-strong',
    'text-ford-fill-danger-strong',
    'text-ford-fill-success-strong',
    'border-ford-fill-success-strong',
    'ring-ford-stroke-strongest\\(focus\\)',
    // Ford UI StyledSelectionCard classes with parentheses
    'bg-ford-fill-highcontrast\\(default\\)',
    'border-ford-stroke-subtle\\(dividers\\)',
    'hover:bg-ford-opacity-hover-default',
    // Ford UI component classes
    'ford-component-select',
    'ford-component-input-color',
    'ford-component-input-disabled-background',
  ],
  plugins: [
    require('@tailwindcss/forms'),
    // Additional plugins can be added here
  ],
}