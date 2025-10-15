/**
 * Survey WebView Bundle Entry Point
 *
 * This is a single universal bundle that includes:
 * - React + SurveyJS + React UI
 * - Ford Design System (FDS) custom renderers
 * - All brand CSS (Ford/Lincoln/Other)
 * - All question types (universal + FMC + Ford + Lincoln)
 *
 * Brand is determined at runtime from the SURVEY_INIT message from React Native
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyWebViewApp } from './SurveyWebViewApp';

// Import SurveyJS CSS
import 'survey-core/survey-core.min.css';

// Import Ford UI Components CSS (for FDS renderers)
import '@ui/ford-ui-components/index.css';

// Import ALL brand CSS (brand detection happens at runtime)
import '../styles/ford/ford-font-families.css';
import '../styles/ford/ford.css';
import '../styles/lincoln/lincoln-font-families.css';
import '../styles/lincoln/lincoln.css';
import '../styles/ford-text-colors.css';
import '../styles/survey-scroll-fix.css';
import '../styles/survey-mobile-fixes.css';
import '../styles/ford-navigation.css';
import '../App.scss';
// import '../components/GlobalFooter.css';

// Import FDS renderers statically for WebView bundle compatibility
// vite-plugin-singlefile doesn't support dynamic imports, so we need to import them here
// IMPORTANT: Import as named exports to prevent tree-shaking
import { FDSTextRenderer } from '../surveysjs_renderers/FDSRenderers/FDSText';
import { FDSRadioRenderer } from '../surveysjs_renderers/FDSRenderers/FDSRadio';
import { FDSCheckboxRenderer } from '../surveysjs_renderers/FDSRenderers/FDSCheckbox';
import { FDSDropdownRenderer } from '../surveysjs_renderers/FDSRenderers/FDSDropdown';
import { FDSTagboxRenderer } from '../surveysjs_renderers/FDSRenderers/FDSTagbox';
import { FDSTextAreaRenderer } from '../surveysjs_renderers/FDSRenderers/FDSTextArea';
import { FDSToggleRenderer } from '../surveysjs_renderers/FDSRenderers/FDSToggle';
import { FDSRatingRenderer } from '../surveysjs_renderers/FDSRenderers/FDSRating';
import { FDSPanelRenderer } from '../surveysjs_renderers/FDSRenderers/FDSPanel';

// Import additional renderers (same as Survey.tsx)
import { CheckboxVOIQuestion } from '../surveysjs_renderers/FDSRenderers/CheckboxVOI';
import { CheckboxVehiclesDrivenQuestion } from '../surveysjs_renderers/FDSRenderers/CheckboxVehiclesDriven';
import { RadioGroupRowQuestion } from '../surveysjs_renderers/FDSRenderers/RadioButtonButton';
import { SurveyBookeoQuestion } from '../surveysjs_renderers/Bookeo';

// Reference all renderer classes to prevent tree-shaking
console.log('[Survey Bundle] FDS renderers imported statically:', {
  FDSTextRenderer: FDSTextRenderer.name,
  FDSRadioRenderer: FDSRadioRenderer.name,
  FDSCheckboxRenderer: FDSCheckboxRenderer.name,
  FDSDropdownRenderer: FDSDropdownRenderer.name,
  FDSTagboxRenderer: FDSTagboxRenderer.name,
  FDSTextAreaRenderer: FDSTextAreaRenderer.name,
  FDSToggleRenderer: FDSToggleRenderer.name,
  FDSRatingRenderer: FDSRatingRenderer.name,
  FDSPanelRenderer: FDSPanelRenderer.name,
});
console.log('[Survey Bundle] Additional renderers:', CheckboxVehiclesDrivenQuestion.name, CheckboxVOIQuestion.name, RadioGroupRowQuestion.name, SurveyBookeoQuestion.name);

// Mark FDS renderers as loaded for fdsInitializer
// The renderers are imported above and self-register, but fdsInitializer needs to know they're loaded
// This is a workaround for vite-plugin-singlefile not supporting dynamic imports
(window as any).__FDS_RENDERERS_LOADED = true;

// NOTE: Custom question types are loaded dynamically in SurveyWebViewApp.tsx
// based on the brand received from the SURVEY_INIT message

// Wait for DOM to be ready before rendering
// This is needed because vite-plugin-singlefile inlines scripts in <head>
// and we removed type="module" for file:// protocol compatibility
function initApp() {
  const container = document.getElementById('survey-root');
  if (!container) {
    throw new Error('Survey root element not found');
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SurveyWebViewApp />
    </React.StrictMode>
  );

  console.log('[Survey Bundle] App rendered successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
