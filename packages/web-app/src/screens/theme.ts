// SurveyJS Theme Configuration Types
interface SurveyJSCSSVariables {
  "--sjs-general-backcolor": string;
  "--sjs-general-backcolor-dark": string;
  "--sjs-general-backcolor-dim": string;
  "--sjs-general-backcolor-dim-light": string;
  "--sjs-general-backcolor-dim-dark": string;
  "--sjs-general-forecolor": string;
  "--sjs-general-forecolor-light": string;
  "--sjs-general-dim-forecolor": string;
  "--sjs-general-dim-forecolor-light": string;
  "--sjs-primary-backcolor": string;
  "--sjs-primary-backcolor-light": string;
  "--sjs-primary-backcolor-dark": string;
  "--sjs-primary-forecolor": string;
  "--sjs-primary-forecolor-light": string;
  "--sjs-base-unit": string;
  "--sjs-corner-radius": string;
  "--sjs-secondary-backcolor": string;
  "--sjs-secondary-backcolor-light": string;
  "--sjs-secondary-backcolor-semi-light": string;
  "--sjs-secondary-forecolor": string;
  "--sjs-secondary-forecolor-light": string;
  "--sjs-shadow-small": string;
  "--sjs-shadow-medium": string;
  "--sjs-shadow-large": string;
  "--sjs-shadow-inner": string;
  "--sjs-shadow-inner-reset": string;
  "--sjs-border-light": string;
  "--sjs-border-default": string;
  "--sjs-border-inside": string;
  "--sjs-special-red": string;
  "--sjs-special-red-light": string;
  "--sjs-special-red-forecolor": string;
  "--sjs-special-green": string;
  "--sjs-special-green-light": string;
  "--sjs-special-green-forecolor": string;
  "--sjs-special-blue": string;
  "--sjs-special-blue-light": string;
  "--sjs-special-blue-forecolor": string;
  "--sjs-special-yellow": string;
  "--sjs-special-yellow-light": string;
  "--sjs-special-yellow-forecolor": string;
  "--sjs-article-font-xx-large-textDecoration": string;
  "--sjs-article-font-xx-large-fontWeight": string;
  "--sjs-article-font-xx-large-fontStyle": string;
  "--sjs-article-font-xx-large-fontStretch": string;
  "--sjs-article-font-xx-large-letterSpacing": string;
  "--sjs-article-font-xx-large-lineHeight": string;
  "--sjs-article-font-xx-large-paragraphIndent": string;
  "--sjs-article-font-xx-large-textCase": string;
  "--sjs-article-font-x-large-textDecoration": string;
  "--sjs-article-font-x-large-fontWeight": string;
  "--sjs-article-font-x-large-fontStyle": string;
  "--sjs-article-font-x-large-fontStretch": string;
  "--sjs-article-font-x-large-letterSpacing": string;
  "--sjs-article-font-x-large-lineHeight": string;
  "--sjs-article-font-x-large-paragraphIndent": string;
  "--sjs-article-font-x-large-textCase": string;
  "--sjs-article-font-large-textDecoration": string;
  "--sjs-article-font-large-fontWeight": string;
  "--sjs-article-font-large-fontStyle": string;
  "--sjs-article-font-large-fontStretch": string;
  "--sjs-article-font-large-letterSpacing": string;
  "--sjs-article-font-large-lineHeight": string;
  "--sjs-article-font-large-paragraphIndent": string;
  "--sjs-article-font-large-textCase": string;
  "--sjs-article-font-medium-textDecoration": string;
  "--sjs-article-font-medium-fontWeight": string;
  "--sjs-article-font-medium-fontStyle": string;
  "--sjs-article-font-medium-fontStretch": string;
  "--sjs-article-font-medium-letterSpacing": string;
  "--sjs-article-font-medium-lineHeight": string;
  "--sjs-article-font-medium-paragraphIndent": string;
  "--sjs-article-font-medium-textCase": string;
  "--sjs-article-font-default-textDecoration": string;
  "--sjs-article-font-default-fontWeight": string;
  "--sjs-article-font-default-fontStyle": string;
  "--sjs-article-font-default-fontStretch": string;
  "--sjs-article-font-default-letterSpacing": string;
  "--sjs-article-font-default-lineHeight": string;
  "--sjs-article-font-default-paragraphIndent": string;
  "--sjs-article-font-default-textCase": string;
  "--sjs-font-family": string;
}

interface SurveyJSTheme {
  backgroundImage: string;
  backgroundImageFit: "cover" | "contain" | "fill" | "none" | "scale-down";
  backgroundImageAttachment: "scroll" | "fixed" | "local";
  backgroundOpacity: number;
  themeName: string;
  colorPalette: "light" | "dark";
  isPanelless: boolean;
  cssVariables: SurveyJSCSSVariables;
}

export const themeJson: SurveyJSTheme = {
  "backgroundImage": "",
  "backgroundImageFit": "cover",
  "backgroundImageAttachment": "scroll",
  "backgroundOpacity": 1,
  "themeName": "plain",
  "colorPalette": "light",
  "isPanelless": false,
  "cssVariables": {
    "--sjs-general-backcolor": "rgba(255, 255, 255, 1)",
    "--sjs-general-backcolor-dark": "rgba(248, 248, 248, 1)",
    "--sjs-general-backcolor-dim": "rgba(255, 255, 255, 1)",
    "--sjs-general-backcolor-dim-light": "rgba(255, 255, 255, 1)",
    "--sjs-general-backcolor-dim-dark": "rgba(243, 243, 243, 1)",
    "--sjs-general-forecolor": "rgba(0, 0, 0, 0.91)",
    "--sjs-general-forecolor-light": "rgba(0, 0, 0, 0.45)",
    "--sjs-general-dim-forecolor": "rgba(0, 0, 0, 0.91)",
    "--sjs-general-dim-forecolor-light": "rgba(0, 0, 0, 0.45)",
    "--sjs-primary-backcolor": "rgba(37, 137, 229, 1)",
    "--sjs-primary-backcolor-light": "rgba(37, 137, 229, 0.1)",
    "--sjs-primary-backcolor-dark": "rgba(21, 119, 209, 1)",
    "--sjs-primary-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-primary-forecolor-light": "rgba(255, 255, 255, 0.25)",
    "--sjs-base-unit": "8px",
    "--sjs-corner-radius": "0px",
    "--sjs-secondary-backcolor": "rgba(255, 152, 20, 1)",
    "--sjs-secondary-backcolor-light": "rgba(255, 152, 20, 0.1)",
    "--sjs-secondary-backcolor-semi-light": "rgba(255, 152, 20, 0.25)",
    "--sjs-secondary-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-secondary-forecolor-light": "rgba(255, 255, 255, 0.25)",
    "--sjs-shadow-small": "0px 0px 0px 1px rgba(0, 0, 0, 0.15)",
    "--sjs-shadow-medium": "0px 0px 0px 1px rgba(0, 0, 0, 0.1)",
    "--sjs-shadow-large": "0px 8px 16px 0px rgba(0, 0, 0, 0.05)",
    "--sjs-shadow-inner": "0px 0px 0px 1px rgba(0, 0, 0, 0.15)",
    "--sjs-shadow-inner-reset": "0px 0px 0px 0px rgba(0, 0, 0, 0.15)",
    "--sjs-border-light": "rgba(0, 0, 0, 0.15)",
    "--sjs-border-default": "rgba(0, 0, 0, 0.15)",
    "--sjs-border-inside": "rgba(0, 0, 0, 0.16)",
    "--sjs-special-red": "rgba(229, 10, 62, 1)",
    "--sjs-special-red-light": "rgba(229, 10, 62, 0.1)",
    "--sjs-special-red-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-green": "rgba(25, 179, 148, 1)",
    "--sjs-special-green-light": "rgba(25, 179, 148, 0.1)",
    "--sjs-special-green-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-blue": "rgba(67, 127, 217, 1)",
    "--sjs-special-blue-light": "rgba(67, 127, 217, 0.1)",
    "--sjs-special-blue-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-special-yellow": "rgba(255, 152, 20, 1)",
    "--sjs-special-yellow-light": "rgba(255, 152, 20, 0.1)",
    "--sjs-special-yellow-forecolor": "rgba(255, 255, 255, 1)",
    "--sjs-article-font-xx-large-textDecoration": "none",
    "--sjs-article-font-xx-large-fontWeight": "700",
    "--sjs-article-font-xx-large-fontStyle": "normal",
    "--sjs-article-font-xx-large-fontStretch": "normal",
    "--sjs-article-font-xx-large-letterSpacing": "0",
    "--sjs-article-font-xx-large-lineHeight": "64px",
    "--sjs-article-font-xx-large-paragraphIndent": "0px",
    "--sjs-article-font-xx-large-textCase": "none",
    "--sjs-article-font-x-large-textDecoration": "none",
    "--sjs-article-font-x-large-fontWeight": "700",
    "--sjs-article-font-x-large-fontStyle": "normal",
    "--sjs-article-font-x-large-fontStretch": "normal",
    "--sjs-article-font-x-large-letterSpacing": "0",
    "--sjs-article-font-x-large-lineHeight": "56px",
    "--sjs-article-font-x-large-paragraphIndent": "0px",
    "--sjs-article-font-x-large-textCase": "none",
    "--sjs-article-font-large-textDecoration": "none",
    "--sjs-article-font-large-fontWeight": "700",
    "--sjs-article-font-large-fontStyle": "normal",
    "--sjs-article-font-large-fontStretch": "normal",
    "--sjs-article-font-large-letterSpacing": "0",
    "--sjs-article-font-large-lineHeight": "40px",
    "--sjs-article-font-large-paragraphIndent": "0px",
    "--sjs-article-font-large-textCase": "none",
    "--sjs-article-font-medium-textDecoration": "none",
    "--sjs-article-font-medium-fontWeight": "700",
    "--sjs-article-font-medium-fontStyle": "normal",
    "--sjs-article-font-medium-fontStretch": "normal",
    "--sjs-article-font-medium-letterSpacing": "0",
    "--sjs-article-font-medium-lineHeight": "32px",
    "--sjs-article-font-medium-paragraphIndent": "0px",
    "--sjs-article-font-medium-textCase": "none",
    "--sjs-article-font-default-textDecoration": "none",
    "--sjs-article-font-default-fontWeight": "400",
    "--sjs-article-font-default-fontStyle": "normal",
    "--sjs-article-font-default-fontStretch": "normal",
    "--sjs-article-font-default-letterSpacing": "0",
    "--sjs-article-font-default-lineHeight": "28px",
    "--sjs-article-font-default-paragraphIndent": "0px",
    "--sjs-article-font-default-textCase": "none",
    "--sjs-font-family": "fordngbs-antenna-light,arial,helvetica,sans-serif"
  }
};

export type { SurveyJSTheme, SurveyJSCSSVariables };