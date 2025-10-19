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
import { registerAllFDSRenderers } from '../surveysjs_renderers/FDSRenderers/register';

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

// Import additional renderers (same as Survey.tsx)
import { CheckboxVOIQuestion } from '../surveysjs_renderers/FDSRenderers/CheckboxVOI';
import { CheckboxVehiclesDrivenQuestion } from '../surveysjs_renderers/FDSRenderers/CheckboxVehiclesDriven';
import { RadioGroupRowQuestion } from '../surveysjs_renderers/FDSRenderers/RadioButtonButton';
import { SurveyBookeoQuestion } from '../surveysjs_renderers/Bookeo';

console.log('[Survey Bundle] FDS renderer registrar ready:', typeof registerAllFDSRenderers === 'function');
console.log('[Survey Bundle] Additional renderers:', CheckboxVehiclesDrivenQuestion.name, CheckboxVOIQuestion.name, RadioGroupRowQuestion.name, SurveyBookeoQuestion.name);

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
