/**
 * Survey SPA Component
 * 
 * Main React component for the self-contained SurveyJS application
 * that runs inside React Native WebView
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import { nativeBridge } from './bridge/NativeBridge';

// Import all custom questions and renderers
import AllSurveys from '../surveyjs_questions/AllSurveys';
import FordSurveys from '../surveyjs_questions/FordSurveys';
import LincolnSurveys from '../surveyjs_questions/LincolnSurveys';

// Import FDS renderers
import '../surveysjs_renderers/FDSRenderers';

interface SurveySPAProps {
  // Props will be injected via bridge communication
}

interface SurveyInitData {
  surveyJSON: any;
  brand: string;
  theme: string;
  eventId?: string;
}

const SurveySPA: React.FC<SurveySPAProps> = () => {
  const [survey, setSurvey] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeClass, setThemeClass] = useState('ford_light');

  /**
   * Initialize all custom survey questions
   */
  const initializeCustomQuestions = useCallback(() => {
    try {
      // Initialize universal questions
      if (AllSurveys && typeof AllSurveys.globalInit === 'function') {
        AllSurveys.globalInit();
      }

      // Initialize Ford-specific questions
      if (FordSurveys && typeof FordSurveys.fordInit === 'function') {
        FordSurveys.fordInit();
      }

      // Initialize Lincoln-specific questions
      if (LincolnSurveys && typeof LincolnSurveys.lincolnInit === 'function') {
        LincolnSurveys.lincolnInit();
      }

      console.log('[SurveySPA] Custom questions initialized');
    } catch (error) {
      console.error('[SurveySPA] Failed to initialize custom questions:', error);
      setError('Failed to initialize survey components');
    }
  }, []);

  /**
   * Create and configure SurveyJS model
   */
  const createSurvey = useCallback((surveyJSON: any, eventId?: string) => {
    try {
      const surveyModel = new Model(surveyJSON);

      // Configure for kiosk mode
      surveyModel.showProgressBar = 'top';
      surveyModel.showQuestionNumbers = 'off';
      surveyModel.questionTitleLocation = 'top';
      surveyModel.questionDescriptionLocation = 'underTitle';
      surveyModel.checkErrorsMode = 'onValueChanged';
      surveyModel.textUpdateMode = 'onTyping';
      surveyModel.clearInvisibleValues = 'onComplete';

      // Add autocomplete="off" to all form inputs for kiosk security
      surveyModel.onAfterRenderSurvey.add((sender, options) => {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach((input) => {
          (input as HTMLElement).setAttribute('autocomplete', 'off');
          (input as HTMLElement).setAttribute('autoComplete', 'off');
        });
      });

      // Handle survey completion
      surveyModel.onComplete.add((sender) => {
        try {
          nativeBridge.onSurveyComplete({
            ...sender.data,
            eventId,
          });
        } catch (error) {
          console.error('[SurveySPA] Survey completion error:', error);
          nativeBridge.onSurveyError(error as Error, sender.id, eventId);
        }
      });

      // Handle survey progress
      surveyModel.onCurrentPageChanged.add((sender) => {
        try {
          const currentPage = sender.currentPageNo + 1;
          const totalPages = sender.visiblePageCount;
          if (eventId) {
            nativeBridge.onSurveyProgress(currentPage, totalPages, eventId);
          }
        } catch (error) {
          console.error('[SurveySPA] Survey progress error:', error);
        }
      });

      // Handle survey errors
      surveyModel.onValidateQuestion.add((sender, options) => {
        if (options.error) {
          nativeBridge.onSurveyError(
            new Error(`Validation error: ${options.error}`),
            sender.id,
            eventId
          );
        }
      });

      setSurvey(surveyModel);
      setLoading(false);
      console.log('[SurveySPA] Survey created successfully');
    } catch (error) {
      console.error('[SurveySPA] Failed to create survey:', error);
      setError('Failed to create survey');
      nativeBridge.onSurveyError(error as Error, undefined, eventId);
    }
  }, []);

  /**
   * Handle survey initialization from React Native
   */
  const handleSurveyInit = useCallback((event: CustomEvent<SurveyInitData>) => {
    const { surveyJSON, brand, theme, eventId } = event.detail;
    
    console.log('[SurveySPA] Initializing survey with brand:', brand, 'theme:', theme);
    
    // Update theme class
    const newThemeClass = `${brand}_${theme}`;
    setThemeClass(newThemeClass);
    
    // Create survey with provided JSON
    createSurvey(surveyJSON, eventId);
  }, [createSurvey]);

  /**
   * Set up event listeners and initialize
   */
  useEffect(() => {
    // Initialize custom questions first
    initializeCustomQuestions();

    // Listen for survey initialization from React Native
    document.addEventListener('surveyInit', handleSurveyInit as EventListener);

    // Signal that the page is loaded and ready
    nativeBridge.onPageLoaded();

    return () => {
      document.removeEventListener('surveyInit', handleSurveyInit as EventListener);
    };
  }, [initializeCustomQuestions, handleSurveyInit]);

  /**
   * Handle theme changes from React Native
   */
  useEffect(() => {
    const fdNextElement = document.getElementById('fd-nxt');
    if (fdNextElement) {
      fdNextElement.className = themeClass;
    }
  }, [themeClass]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        padding: '20px',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>Survey Error</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading || !survey) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
      }}>
        Loading survey...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Survey model={survey} />
    </div>
  );
};

export default SurveySPA;