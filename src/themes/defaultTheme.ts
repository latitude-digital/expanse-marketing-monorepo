// my-theme.ts
import { DefaultTheme } from 'styled-components';

const fordTheme: DefaultTheme = {
  borderRadius: '1rem',

  fonts: {
    body: 'Helvetica, sans-serif',
  },

  colors: {
    primary: '#003263',
    secondary: '#1295D8',

    accent: '#FF4D4D',
    highlight: '#FF4D4D',
    background: '#f6f7f9',
    
    muted: '#C4CED4',
    error: '#d62d0a',
    valid: '#008200',

    text: '#191015',
    splashText: '#ffffff',
    textOnPrimary: '#ffffff',
    
    buttonBackground: '#ffffff',
    buttonText: '#ffffff',
    header: '#C4CED4',
  },
};

export { fordTheme };