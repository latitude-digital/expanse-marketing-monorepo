/** @type {import('tailwindcss').Config} */
const { join } = require('path');
const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');

// Import theme colors system from Ford UI (matching storybook configuration)
const {
  fordLightThemes,
  fordDarkThemes,
  lincolnLightThemes,
  lincolnDarkThemes,
  customThemes,
  globalThemes,
} = require('../ford-ui/themes/fofThemes/colors');

// Note: ford-tailwind-extensions.js removed - Ford UI presets now handle all classes properly

// Generate color safelist classes (matching storybook configuration)
const nvcThemeColors = {
  ...fordLightThemes,
  ...fordDarkThemes,
  ...lincolnLightThemes,
  ...lincolnDarkThemes,
  ...customThemes,
  ...globalThemes,
};
const colorSafelist = Object.keys(nvcThemeColors).flatMap((color) => ['bg-' + color, 'text-' + color, 'border-' + color]);

module.exports = {
  // Use ALL Ford UI Storybook presets for complete class generation
  presets: [
    require('../ford-ui/tailwindPresets/tailwind.fbc.preset'),
    require('../ford-ui/tailwindPresets/tailwind.nvc.preset'),
    require('../ford-ui/tailwindPresets/tailwind.img.preset'),
    require('../ford-ui/tailwindPresets/tailwind.own.preset'),
    require('../ford-ui/tailwindPresets/tailwind.nabuy.preset'),
  ],
  darkMode: ['class', '[data-mode="dark"]'],
  content: [
    './node_modules/@nextui-org/theme/dist/components/**.js',
    '../ford-ui/packages/@shared/components/**/*!(*.stories|*.spec).{ts,tsx,html}',
    '../ford-ui/packages/@ui/ford-ui-components/**/*!(*.stories|*.spec).{ts,tsx,html}',
    '../ford-ui/apps/@nvc/**/*!(*.stories|*.spec).{ts,tsx,html}',
    '../ford-ui/apps/@img/**/*!(*.stories|*.spec).{ts,tsx,html}',
    '../ford-ui/apps/@own/**/*!(*.stories|*.spec).{ts,tsx,html}',
    '../ford-ui/packages/@shared/accessories/src/**/*!(*.stories|*.spec).{ts,tsx,html}',
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // Minimal additional customizations - Ford UI presets handle most styling
      boxShadow: {
        card: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        ford: ['Ford-Font', 'Arial', 'sans-serif'],
      },
    },
  },
  safelist: [
    // Generated color classes from theme system
    ...colorSafelist,
    
    // Ford UI typography classes (matching storybook safelist)
    'text-ford-display1-large-regular',
    'text-ford-display1-large-semibold',
    'text-ford-display1-small-regular',
    'text-ford-display1-small-semibold',
    'text-ford-display2-large-regular',
    'text-ford-display2-large-semibold',
    'text-ford-display2-small-regular',
    'text-ford-display2-small-semibold',
    'text-ford-display3-large-regular',
    'text-ford-display3-large-semibold',
    'text-ford-display3-small-regular',
    'text-ford-display3-small-semibold',
    'text-ford-headline1-large-regular',
    'text-ford-headline1-large-semibold',
    'text-ford-headline1-small-regular',
    'text-ford-headline1-small-semibold',
    'text-ford-headline2-large-regular',
    'text-ford-headline2-large-semibold',
    'text-ford-headline2-small-regular',
    'text-ford-headline2-small-semibold',
    'text-ford-headline3-large-regular',
    'text-ford-headline3-large-semibold',
    'text-ford-headline3-small-regular',
    'text-ford-headline3-small-semibold',
    'text-ford-title-medium',
    'text-ford-title-semibold',
    'text-ford-subtitle-regular',
    'text-ford-subtitle-semibold',
    'text-ford-body1-light',
    'text-ford-body1-regular',
    'text-ford-body1-medium',
    'text-ford-body1-semibold',
    'text-ford-body1-bold',
    'text-ford-body1-underline',
    'text-ford-body1-superscript',
    'text-ford-body2-light',
    'text-ford-body2-regular',
    'text-ford-body2-medium',
    'text-ford-body2-semibold',
    'text-ford-body2-bold',
    'text-ford-body2-underline',
    'text-ford-body2-superscript',
    'text-ford-caption-regular',
    'text-ford-caption-medium',
    'text-ford-caption-semibold',
    'text-ford-caption-bold',
    'text-ford-caption-underline',
    'text-ford-caption-superscript',

    // Ford UI font classes (matching storybook safelist)
    'font-ford-display1-large-regular',
    'font-ford-display1-large-semibold',
    'font-ford-display1-small-regular',
    'font-ford-display1-small-semibold',
    'font-ford-display2-large-regular',
    'font-ford-display2-large-semibold',
    'font-ford-display2-small-regular',
    'font-ford-display2-small-semibold',
    'font-ford-display3-large-regular',
    'font-ford-display3-large-semibold',
    'font-ford-display3-small-regular',
    'font-ford-display3-small-semibold',
    'font-ford-headline1-large-regular',
    'font-ford-headline1-large-semibold',
    'font-ford-headline1-small-regular',
    'font-ford-headline1-small-semibold',
    'font-ford-headline2-large-regular',
    'font-ford-headline2-large-semibold',
    'font-ford-headline2-small-regular',
    'font-ford-headline2-small-semibold',
    'font-ford-headline3-large-regular',
    'font-ford-headline3-large-semibold',
    'font-ford-headline3-small-regular',
    'font-ford-headline3-small-semibold',
    'font-ford-title-medium',
    'font-ford-title-semibold',
    'font-ford-subtitle-regular',
    'font-ford-subtitle-semibold',
    'font-ford-body1-light',
    'font-ford-body1-regular',
    'font-ford-body1-medium',
    'font-ford-body1-semibold',
    'font-ford-body1-bold',
    'font-ford-body1-underline',
    'font-ford-body1-superscript',
    'font-ford-body2-light',
    'font-ford-body2-regular',
    'font-ford-body2-medium',
    'font-ford-body2-semibold',
    'font-ford-body2-bold',
    'font-ford-body2-underline',
    'font-ford-body2-superscript',
    'font-ford-caption-regular',
    'font-ford-caption-medium',
    'font-ford-caption-semibold',
    'font-ford-caption-bold',
    'font-ford-caption-underline',
    'font-ford-caption-superscript',

    // Ford UI grid classes
    'grid-cols-ford-lg-12',
    'grid-cols-ford-md-8', 
    'grid-cols-ford-sm-8',

    // Ford UI gap classes
    'gap-ford-lg-16',
    'gap-ford-md-8',
    'gap-ford-sm-8',

    // Ford UI shadow classes
    'shadow-ford-shadow-none',
    'shadow-ford-shadow-sm',
    'shadow-ford-shadow',
    'shadow-ford-shadow-md',
    'shadow-ford-shadow-lg',
    'shadow-ford-shadow-xl',
    'shadow-ford-shadow-2xl',
    'shadow-ford-shadow-inner',
    'shadow-ford-shadow-inverse',

    // Ford UI border width classes
    'border-ford-border-width-none',
    'border-ford-border-width-xs',
    'border-ford-border-width-s',
    'border-ford-border-width-m',
    'border-ford-border-width-l',
    'border-ford-border-width-xl',

    // Ford UI border radius classes
    'rounded-ford-radius-none',
    'rounded-ford-radius-sm',
    'rounded-ford-radius-md',
    'rounded-ford-radius-lg',
    'rounded-ford-radius-xl',
    'rounded-ford-radius-2xl',
    'rounded-ford-radius-full',

    // Line clamp classes
    'line-clamp-1',
    'line-clamp-2',
    'line-clamp-3',
    'line-clamp-4',
    'line-clamp-5',
    'line-clamp-6',
    'line-clamp-none',

    // Essential component bridge classes (minimal set)
    'ford-component-input-color',
    'ford-component-selection-card',
  ],
  plugins: [
    require('@tailwindcss/forms'),
    // Additional plugins can be added here
  ],
}