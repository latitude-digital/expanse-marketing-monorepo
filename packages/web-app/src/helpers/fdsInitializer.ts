/**
 * Ford Design System conditional initialization
 * Only loads FDS components and brand-specific questions when needed
 */

import { AllSurveys, FMCSurveys } from '../surveyjs_questions';
import FordSurveysNew from '../surveyjs_questions/FordSurveysNew';
import LincolnSurveys from '../surveyjs_questions/LincolnSurveys';

// FDS Renderer imports - conditionally loaded
let FDSRenderersLoaded = false;

// Export a function to check if FDS renderers are loaded
export function areFDSRenderersLoaded(): boolean {
  return FDSRenderersLoaded;
}

/**
 * Loads FDS renderers and registers them with useAsDefault: true
 * This replaces default SurveyJS renderers with Ford Design System components
 */
async function loadFDSRenderers(): Promise<void> {
  if (FDSRenderersLoaded) {
    console.log('FDS renderers already loaded');
    return;
  }

  // Check if renderers were loaded statically (for WebView bundle compatibility)
  // vite-plugin-singlefile doesn't support dynamic imports, so WebView bundles
  // import renderers statically and set this flag
  console.log('Checking for statically loaded renderers...', {
    hasWindow: typeof window !== 'undefined',
    flagValue: typeof window !== 'undefined' ? (window as any).__FDS_RENDERERS_LOADED : undefined
  });

  if (typeof window !== 'undefined' && (window as any).__FDS_RENDERERS_LOADED) {
    console.log('FDS renderers loaded statically (WebView bundle)');
    FDSRenderersLoaded = true;
    return;
  }

  if (typeof window !== 'undefined') {
    const registrar = (window as any).__FDS_REGISTER_RENDERERS__;
    if (typeof registrar === 'function') {
      registrar();
      console.log('FDS renderers registered via WebView helper');
      FDSRenderersLoaded = true;
      return;
    }
  }

  try {
    const { registerAllFDSRenderers } = await import('../surveysjs_renderers/FDSRenderers/register');
    registerAllFDSRenderers();
    console.log('FDS renderers loaded successfully via dynamic import');
    FDSRenderersLoaded = true;
  } catch (error) {
    console.error('Failed to load FDS renderers:', error);
    throw error;
  }
}

/**
 * Initializes Ford Design System components and questions for the specified brand
 * @param brand - The event brand ('Ford', 'Lincoln', or 'Other')
 */
export async function initializeFDSForBrand(brand: string): Promise<void> {
  console.log(`Initializing FDS for brand: ${brand}`);

  // Always initialize universal questions
  AllSurveys.globalInit();

  // Only load FDS and brand-specific questions for Ford/Lincoln
  if (brand === 'Ford' || brand === 'Lincoln') {
    try {
      // Load FDS renderers with useAsDefault: true
      await loadFDSRenderers();


      // Initialize brand-specific questions using new universal system
      if (brand === 'Ford') {
        FMCSurveys.fmcInit();
        FordSurveysNew.fordInit();
        console.log('FMC and Ford-specific questions initialized using universal system');
      } else if (brand === 'Lincoln') {
        FMCSurveys.fmcInit();
        LincolnSurveys.lincolnInit();
        console.log('FMC and Lincoln-specific questions initialized using universal system');
      }

      console.log(`FDS initialization complete for ${brand}`);
    } catch (error) {
      console.error(`Failed to initialize FDS for ${brand}:`, error);
      // Graceful degradation: continue with universal questions only
      console.log('Continuing with universal questions only');
    }
  } else {
    console.log(`No FDS loading for brand: ${brand} - using universal questions only`);
  }

  // Load and conditionally register CustomSurveyQuestion based on brand
  try {
    const customSurveyQuestionModule = await import('../surveysjs_renderers/FDSRenderers/CustomSurveyQuestion');
    // Call the registration function which will check if FDS is loaded
    customSurveyQuestionModule.registerCustomSurveyQuestion();
  } catch (error) {
    console.error('Failed to load CustomSurveyQuestion:', error);
    // Non-critical error - continue without enhanced scroll-to-error
  }
}

/**
 * Resets FDS initialization state (for testing purposes)
 */
export function resetFDSState(): void {
  FDSRenderersLoaded = false;
}
