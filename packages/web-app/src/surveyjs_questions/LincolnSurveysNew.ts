/**
 * Lincoln questions registration using the new universal system
 */

import { registerUniversalQuestions } from '@meridian-event-tech/shared';
import { ComponentCollection, Question } from 'survey-core';
import { handleChoicesByUrl } from './choicesByUrlHelper';

// Global flag to prevent multiple initialization
let lincolnQuestionsInitialized = false;

/**
 * Initialize Lincoln questions using the universal registration system
 */
export const lincolnInit = () => {
  // Prevent multiple initialization
  if (lincolnQuestionsInitialized) {
    console.log('Lincoln questions already initialized, skipping...');
    return;
  }

  console.log('Initializing Lincoln questions using universal registration...');
  
  // Use the universal registration system
  registerUniversalQuestions('lincoln', 'frontend');

  // Add frontend-specific behaviors for VOI and vehicles driven questions
  setupFrontendBehaviors();

  // Mark as initialized
  lincolnQuestionsInitialized = true;
  console.log('Lincoln questions initialization completed');
};

/**
 * Setup frontend-specific behaviors that can't be defined in the shared config
 */
function setupFrontendBehaviors() {
  // Setup Lincoln VOI specific behaviors
  const lincolnVoiQuestion = ComponentCollection.Instance.getCustomQuestionByName('lincolnvoi');
  if (lincolnVoiQuestion) {
    const originalOnLoaded = lincolnVoiQuestion.onLoaded;
    lincolnVoiQuestion.onLoaded = function(question: Question) {
      // Call original if exists
      if (originalOnLoaded) {
        originalOnLoaded.call(this, question);
      }
      
      // Handle choicesByUrl
      handleChoicesByUrl(question, 'LincolnSurveys');
      
      // Update onlyInclude
      updateOnlyInclude(question);
    };

    const originalOnPropertyChanged = lincolnVoiQuestion.onPropertyChanged;
    lincolnVoiQuestion.onPropertyChanged = function(question: Question, propertyName: string, newValue: any) {
      // Call original if exists
      if (originalOnPropertyChanged) {
        originalOnPropertyChanged.call(this, question, propertyName, newValue);
      }
      
      if (propertyName === 'onlyInclude') {
        updateOnlyInclude(question);
      }
    };
  }

  // Setup Lincoln vehicles driven specific behaviors
  const lincolnVehiclesDrivenQuestion = ComponentCollection.Instance.getCustomQuestionByName('lincolnvehiclesdriven');
  if (lincolnVehiclesDrivenQuestion) {
    const originalOnLoaded = lincolnVehiclesDrivenQuestion.onLoaded;
    lincolnVehiclesDrivenQuestion.onLoaded = function(question: Question) {
      // Call original if exists
      if (originalOnLoaded) {
        originalOnLoaded.call(this, question);
      }
      
      // Handle choicesByUrl
      handleChoicesByUrl(question, 'LincolnSurveys');
      
      // Update onlyInclude
      updateOnlyInclude(question);
    };

    const originalOnPropertyChanged = lincolnVehiclesDrivenQuestion.onPropertyChanged;
    lincolnVehiclesDrivenQuestion.onPropertyChanged = function(question: Question, propertyName: string, newValue: any) {
      // Call original if exists
      if (originalOnPropertyChanged) {
        originalOnPropertyChanged.call(this, question, propertyName, newValue);
      }
      
      if (propertyName === 'onlyInclude') {
        updateOnlyInclude(question);
      }
    };
  }
}

/**
 * Helper to update onlyInclude property
 */
function updateOnlyInclude(question: Question) {
  const checkbox = question.contentQuestion;
  if (checkbox && question.onlyInclude) {
    checkbox.onlyInclude = question.onlyInclude;
  }
}

export default {
  lincolnInit,
};
