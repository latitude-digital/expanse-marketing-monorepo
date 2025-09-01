/**
 * Ford questions registration using the new universal system
 */

import { registerUniversalQuestions } from '@expanse/shared';
import { ComponentCollection, Question } from 'survey-core';
import { handleChoicesByUrl } from './choicesByUrlHelper';

// Global flag to prevent multiple initialization
let fordQuestionsInitialized = false;

/**
 * Initialize Ford questions using the universal registration system
 */
export const fordInit = () => {
  // Prevent multiple initialization
  if (fordQuestionsInitialized) {
    console.log('Ford questions already initialized, skipping...');
    return;
  }

  console.log('Initializing Ford questions using universal registration...');
  
  // Use the universal registration system
  registerUniversalQuestions('ford', 'frontend');

  // Add frontend-specific behaviors for VOI and vehicles driven questions
  setupFrontendBehaviors();

  // Mark as initialized
  fordQuestionsInitialized = true;
  console.log('Ford questions initialization completed');
};

/**
 * Setup frontend-specific behaviors that can't be defined in the shared config
 */
function setupFrontendBehaviors() {
  // Setup Ford VOI specific behaviors
  const fordVoiQuestion = ComponentCollection.Instance.getCustomQuestionByName('fordvoi');
  if (fordVoiQuestion) {
    const originalOnLoaded = fordVoiQuestion.onLoaded;
    fordVoiQuestion.onLoaded = function(question: Question) {
      // Call original if exists
      if (originalOnLoaded) {
        originalOnLoaded.call(this, question);
      }
      
      // Handle choicesByUrl
      handleChoicesByUrl(question, 'FordSurveys');
      
      // Update onlyInclude
      updateOnlyInclude(question);
    };

    const originalOnPropertyChanged = fordVoiQuestion.onPropertyChanged;
    fordVoiQuestion.onPropertyChanged = function(question: Question, propertyName: string, newValue: any) {
      // Call original if exists
      if (originalOnPropertyChanged) {
        originalOnPropertyChanged.call(this, question, propertyName, newValue);
      }
      
      if (propertyName === 'onlyInclude') {
        updateOnlyInclude(question);
      }
    };
  }

  // Setup Ford vehicles driven specific behaviors
  const fordVehiclesDrivenQuestion = ComponentCollection.Instance.getCustomQuestionByName('fordvehiclesdriven');
  if (fordVehiclesDrivenQuestion) {
    const originalOnLoaded = fordVehiclesDrivenQuestion.onLoaded;
    fordVehiclesDrivenQuestion.onLoaded = function(question: Question) {
      // Call original if exists
      if (originalOnLoaded) {
        originalOnLoaded.call(this, question);
      }
      
      // Handle choicesByUrl
      handleChoicesByUrl(question, 'FordSurveys');
      
      // Update onlyInclude
      updateOnlyInclude(question);
    };

    const originalOnPropertyChanged = fordVehiclesDrivenQuestion.onPropertyChanged;
    fordVehiclesDrivenQuestion.onPropertyChanged = function(question: Question, propertyName: string, newValue: any) {
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
  fordInit,
};