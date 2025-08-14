import { SurveyModel, Question } from 'survey-core';

// Template question names that always have default translations
const TEMPLATE_QUESTION_NAMES = [
  'first_name',
  'last_name', 
  'email',
  'phone',
  'address_group',
  // Ford template questions
  'fordVOI',
  'fordEmailOptIn',
  'howLikelyRecommend',
  'howLikelyRecommend (post event)',
  'gender',
  'ageBracket',
  'howLikelyAcquire',
  'howLikelyPurchasing',
  'howLikelyPurchasing (post event)',
  'inMarketTiming',
  'adultWaiver',
  'minorWaiver',
  'vehicleDrivenMostMake',
  // Lincoln template questions
  'lincolnVOI',
  'lincolnEmailOptIn',
  'howLikelyRecommend',
  'howLikelyRecommend (post event)'
];

// Template question types that always have default translations
const TEMPLATE_QUESTION_TYPES = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'autocompleteaddress',
  'autocompleteaddress2',
  // Ford template types
  'fordvoi',
  'fordoptin',
  'fordrecommend',
  'fordrecommendpost',
  'gender',
  'agebracket',
  'howlikelyacquire',
  'howlikelypurchasingford',
  'howlikelypurchasingfordpost',
  'inmarkettiming',
  'adultwaiver',
  'minorwaiver',
  'vehicledrivenmostmake',
  // Lincoln template types
  'lincolnvoi',
  'lincolnoptin',
  'lincolnrecommend',
  'lincolnrecommendpost',
  'lincolnoverallopinion',
  'lincolnoverallopinionpost'
];

/**
 * Checks if a question is a template question with default translations
 */
export function isTemplateQuestion(question: Question): boolean {
  return TEMPLATE_QUESTION_NAMES.includes(question.name) || 
         TEMPLATE_QUESTION_TYPES.includes(question.getType());
}

/**
 * Gets the locales that have actual custom content translations,
 * excluding default template question translations
 */
export function getCustomContentLocales(survey: SurveyModel): string[] {
  const allLocales = survey.getUsedLocales() || [];
  
  // If no locales, return empty array
  if (!allLocales || allLocales.length === 0) {
    return [];
  }
  
  // If only one locale, return empty array (no translations needed)
  if (allLocales.length === 1) {
    return [];
  }

  // Check each locale to see if it has custom content
  const customContentLocales: string[] = [];
  
  for (const locale of allLocales) {
    if (hasCustomContentInLocale(survey, locale)) {
      customContentLocales.push(locale);
    }
  }

  return customContentLocales;
}

/**
 * Checks if a specific locale has any custom (non-template) content
 */
function hasCustomContentInLocale(survey: SurveyModel, locale: string): boolean {
  // Get all questions using SurveyJS built-in method that handles all nesting
  const allQuestions = survey.getAllQuestions();

  // Check if any non-template question has a translation in this locale
  for (const question of allQuestions) {
    if (!isTemplateQuestion(question)) {
      // Check if this question has a localized title
      if (question.locTitle && question.locTitle.getJson) {
        const titleJson = question.locTitle.getJson();
        if (titleJson && titleJson[locale]) {
          return true;
        }
      }
      
      // Check if this question has localized description
      if (question.locDescription && question.locDescription.getJson) {
        const descJson = question.locDescription.getJson();
        if (descJson && descJson[locale]) {
          return true;
        }
      }

      // Check for localized choices in choice questions
      if (question.choices && Array.isArray(question.choices)) {
        for (const choice of question.choices) {
          if (choice.locText && choice.locText.getJson) {
            const choiceJson = choice.locText.getJson();
            if (choiceJson && choiceJson[locale]) {
              return true;
            }
          }
        }
      }

      // Check for localized HTML content
      if (question.locHtml && question.locHtml.getJson) {
        const htmlJson = question.locHtml.getJson();
        if (htmlJson && htmlJson[locale]) {
          return true;
        }
      }
    }
  }

  // Check survey-level translations (title, description, etc.)
  if (survey.locTitle && survey.locTitle.getJson) {
    const titleJson = survey.locTitle.getJson();
    if (titleJson && titleJson[locale]) {
      return true;
    }
  }

  if (survey.locDescription && survey.locDescription.getJson) {
    const descJson = survey.locDescription.getJson();
    if (descJson && descJson[locale]) {
      return true;
    }
  }

  // Check page titles and descriptions
  for (const page of survey.pages) {
    if (page.locTitle && page.locTitle.getJson) {
      const titleJson = page.locTitle.getJson();
      if (titleJson && titleJson[locale]) {
        return true;
      }
    }
    
    if (page.locDescription && page.locDescription.getJson) {
      const descJson = page.locDescription.getJson();
      if (descJson && descJson[locale]) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Gets the default locale for a survey (usually 'en' or the first available locale)
 */
export function getDefaultLocale(survey: SurveyModel): string {
  const customLocales = getCustomContentLocales(survey);
  
  // If there are custom content locales, prefer 'en' if available, otherwise first locale
  if (customLocales.length > 0) {
    return customLocales.includes('en') ? 'en' : customLocales[0];
  }
  
  // If no custom content, check all locales
  const allLocales = survey.getUsedLocales() || [];
  if (allLocales.length > 0) {
    return allLocales.includes('en') ? 'en' : allLocales[0];
  }
  
  // Default to 'en'
  return 'en';
}