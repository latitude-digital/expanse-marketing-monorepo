/**
 * Survey SPA Entry Point
 * 
 * Main entry point for the self-contained SurveyJS application
 * Initializes React app and imports all required dependencies
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import SurveySPA from './SurveySPA';

// Import all Ford Design System CSS with theme scoping
import '../styles/ford/ford.css';
import '../styles/lincoln/lincoln.css';
import '../styles/ford/ford-font-families.css';
import '../styles/lincoln/lincoln-font-families.css';
import '../index.scss'; // Typography classes and bridge styles

// Import SurveyJS CSS
import 'survey-core/survey-core.css';

// Global error handling for kiosk mode
window.addEventListener('error', (event) => {
  console.error('[SurveySPA] Global error:', event.error);
  
  // Send error to React Native if bridge is available
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SURVEY_ERROR',
      payload: {
        error: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    }));
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[SurveySPA] Unhandled promise rejection:', event.reason);
  
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'SURVEY_ERROR',
      payload: {
        error: event.reason?.message || 'Promise rejection',
        stack: event.reason?.stack,
      }
    }));
  }
});

// Initialize React app
const container = document.getElementById('survey-root');
if (!container) {
  throw new Error('Survey root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <SurveySPA />
  </React.StrictMode>
);

console.log('[SurveySPA] Application initialized');

// Additional kiosk security measures
document.addEventListener('DOMContentLoaded', () => {
  // Disable right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Disable F5, Ctrl+R, Cmd+R refresh
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || 
        (e.ctrlKey && e.key === 'r') || 
        (e.metaKey && e.key === 'r') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')) {
      e.preventDefault();
    }
  });

  // Disable text selection except in form fields
  document.addEventListener('selectstart', (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches('input, textarea, select')) {
      e.preventDefault();
    }
  });

  // Set autocomplete off on all form elements
  const setAutocompleteOff = () => {
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach((element) => {
      element.setAttribute('autocomplete', 'off');
      element.setAttribute('autoComplete', 'off');
    });
  };

  // Run immediately and on mutations
  setAutocompleteOff();
  
  // Watch for new form elements being added
  const observer = new MutationObserver(() => {
    setAutocompleteOff();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[SurveySPA] Kiosk security measures applied');
});