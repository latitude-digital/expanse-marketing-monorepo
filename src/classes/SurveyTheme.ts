export default class SurveyTheme {
    headerImage?: URL;
    headerTitle?: string;
    splashBackground?: URL;
    splashHeader?: URL;
    micrositeHeader?: URL;
    borderRadius?: string;

    fonts?: {
        body?: string,
        heading?: string,
    };

    fontWeights?: {
        body?: string,
        heading?: string,
    };

    colors?: {
		splashText: Color,
		text: Color,
		header: Color,
		background: Color,
		primary: Color,
		textOnPrimary: Color,
		buttonBackground: Color,
		secondary: Color,
		accent: Color,
		highlight: Color,
		muted: Color,
		error: Color,
		valid: Color
    };

    constructor(surveyThemeObject:any) {
        this.headerImage = surveyThemeObject.headerImage ? new URL(surveyThemeObject.headerImage) : undefined;
        this.headerTitle = surveyThemeObject.headerTitle;
        this.splashBackground = surveyThemeObject.splashBackground ? new URL(surveyThemeObject.splashBackground) : undefined;
        this.splashHeader = surveyThemeObject.splashHeader ? new URL(surveyThemeObject.splashHeader) : undefined;
        this.micrositeHeader = surveyThemeObject.micrositeHeader ? new URL(surveyThemeObject.micrositeHeader) : undefined;
        this.borderRadius = surveyThemeObject.borderRadius;
        this.fonts = {
            body: surveyThemeObject?.fonts?.body ||'Helvetica, sans-serif',
            heading: surveyThemeObject?.fonts?.heading || 'Helvetica, sans-serif',
        }
        this.fontWeights = {
            body: surveyThemeObject?.fontWeights?.body || '400',
            heading: surveyThemeObject?.fontWeights?.heading || '700',
        }
        this.colors = {
            splashText: surveyThemeObject?.colors?.splashText,
            text: surveyThemeObject?.colors?.text,
            header: surveyThemeObject?.colors?.header,
            background: surveyThemeObject?.colors?.background,
            primary: surveyThemeObject?.colors?.primary,
            textOnPrimary: surveyThemeObject?.colors?.textOnPrimary,
            buttonBackground: surveyThemeObject?.colors?.buttonBackground,
            secondary: surveyThemeObject?.colors?.secondary,
            accent: surveyThemeObject?.colors?.accent,
            highlight: surveyThemeObject?.colors?.highlight,
            muted: surveyThemeObject?.colors?.muted,
            error: surveyThemeObject?.colors?.error,
            valid: surveyThemeObject?.colors?.valid
        }
    }
}