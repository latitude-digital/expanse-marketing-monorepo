// import original module declarations
import 'styled-components';

// and extend them!
declare module 'styled-components' {
  export interface DefaultTheme {
    borderRadius: string;

    fonts?: {
      body?: string,
      heading?: string,
    };

    fontWeights?: {
        body?: string,
        heading?: string,
    };

    colors: {
        primary: Color;
        secondary: Color;

        accent: Color;
        highlight: Color;
        background: Color;
        
        muted: Color;
        error: Color;
        valid: Color;

        text: Color;
        splashText: Color;
        textOnPrimary: Color;
        
        buttonBackground: Color;
        buttonText: Color;
        header: Color;
    };
  }
}