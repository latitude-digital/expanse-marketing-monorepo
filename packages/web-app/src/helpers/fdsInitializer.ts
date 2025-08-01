/**
 * Ford Design System conditional initialization
 * Only loads FDS components and brand-specific questions when needed
 */

import { ReactQuestionFactory } from 'survey-react-ui';
import { AllSurveys, FordSurveys, LincolnSurveys, FMCSurveys } from '../surveyjs_questions';

// FDS Renderer imports - conditionally loaded
let FDSRenderersLoaded = false;

/**
 * Loads FDS renderers and registers them with useAsDefault: true
 * This replaces default SurveyJS renderers with Ford Design System components
 */
async function loadFDSRenderers(): Promise<void> {
  if (FDSRenderersLoaded) {
    console.log('FDS renderers already loaded');
    return;
  }

  try {
    // Dynamically import FDS renderers
    const { FDSTextRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSText');
    const { FDSRadioRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSRadio');
    const { FDSCheckboxRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSCheckbox');
    const { FDSDropdownRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSDropdown');
    const { FDSTextAreaRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSTextArea');
    const { FDSToggleRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSToggle');
    const { FDSRatingRenderer } = await import('../surveysjs_renderers/FDSRenderers/FDSRating');
    
    // Import custom survey question renderer
    await import('../surveysjs_renderers/FDSRenderers/CustomSurveyQuestion');

    console.log('FDS renderers loaded successfully');
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

      // Initialize shared FMC questions first (contains common Ford/Lincoln questions)
      FMCSurveys.fmcInit();
      console.log('FMC shared questions initialized');

      // Initialize brand-specific questions
      if (brand === 'Ford') {
        FordSurveys.fordInit();
        console.log('Ford-specific questions initialized');
      } else if (brand === 'Lincoln') {
        LincolnSurveys.lincolnInit();
        console.log('Lincoln-specific questions initialized');
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
}

/**
 * Resets FDS initialization state (for testing purposes)
 */
export function resetFDSState(): void {
  FDSRenderersLoaded = false;
}