/**
 * Ford questions registration using the new universal system
 */

import { fordQuestions, registerUniversalQuestions } from '@meridian-event-tech/shared';
import { ComponentCollection, Question, Serializer } from 'survey-core';
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
  
  // Use the universal registration system to register ALL questions (Ford + shared)
  registerUniversalQuestions('ford', 'frontend');
  
  // Register Ford questions directly using our own ComponentCollection (legacy fallback)
  registerFordQuestions();

  // Add frontend-specific behaviors for VOI and vehicles driven questions
  setupFrontendBehaviors();

  // Mark as initialized
  fordQuestionsInitialized = true;
  console.log('Ford questions initialization completed');
};

/**
 * Register Ford questions using the web-app's ComponentCollection instance
 */
function registerFordQuestions() {
    // Register each Ford question from the shared package
    fordQuestions.forEach(config => {
    const existingComponent = ComponentCollection.Instance.getCustomQuestionByName(config.name);
    const isFordOptIn = config.name === 'fordoptin';
    if (existingComponent) {
      console.log(`[FordSurveysNew] Question type already registered: ${config.name}`);
      enhanceFordQuestion(existingComponent, config);
      return;
    }

    // Build the question JSON - merge all defaultValues first, then override type
    const questionJSON: any = {
      ...config.defaultValues,
      type: config.baseType,
      name: config.name,
    };
    
    // Apply _ffs if defined in properties
    const ffsProperty = config.properties?.find(p => p.name === '_ffs');
    if (ffsProperty && ffsProperty.default) {
      questionJSON._ffs = ffsProperty.default;
    }

    // Register the question type
    ComponentCollection.Instance.add({
      name: config.name,
      title: config.title || config.name,
      iconName: config.icon,
      showInToolbox: true,
      inheritBaseProps: true,
      questionJSON,
      onInit: () => {
        // Register custom properties
        if (config.properties) {
          config.properties.forEach(prop => {
            if (prop.name !== '_ffs') { // _ffs is handled specially
              const serializerProp: any = {
                name: prop.name,
                displayName: prop.displayName || prop.name,
                type: prop.type || 'text',
                category: prop.category || 'general',
                isSerializable: true,
              };

              if (prop.default !== undefined) {
                serializerProp.default = prop.default;
              }

              if (prop.choices) {
                serializerProp.choices = prop.choices;
              }

              if (prop.visible !== undefined) {
                serializerProp.visible = prop.visible;
              }

              if (prop.isLocalizable) {
                serializerProp.isLocalizable = true;
              }

              Serializer.addProperty(config.name, serializerProp);
            }
          });
        }
      },
      onLoaded: (question: Question) => {
        // Handle special properties like onlyInclude for VOI questions
        const onlyIncludeProp = config.properties?.find(p => p.name === 'onlyInclude');
        if (onlyIncludeProp && question.contentQuestion) {
          question.contentQuestion.onlyInclude = question.onlyInclude;
        }

        // Sync isRequired and validators from parent to child
        applyFordQuestionOverrides(question, config);
      },
      onPropertyChanged: (question: Question, propertyName: string, newValue: any) => {
        // Handle property changes like onlyInclude
        if (propertyName === 'onlyInclude' && question.contentQuestion) {
          question.contentQuestion.onlyInclude = newValue;
        }
      },
    });

    // If this pre-defined question declares an _ffs default, make _ffs read-only for this type
    if (ffsProperty) {
      const prop = Serializer.findProperty(config.name, '_ffs');
      if (prop) {
        if (ffsProperty.default !== undefined) prop.default = ffsProperty.default;
        prop.readOnly = true; // visible in property grid but not editable for this specific type
        if (ffsProperty.visible !== undefined) prop.visible = ffsProperty.visible;
      }
    }

    console.log(`[FordSurveysNew] Registered question type: ${config.name}`, {
      baseType: config.baseType,
      questionJSON: questionJSON,
      hasChoices: !!questionJSON.choices,
      renderAs: questionJSON.renderAs
    });

    const registeredComponent = ComponentCollection.Instance.getCustomQuestionByName(config.name);
    enhanceFordQuestion(registeredComponent, config);
  });
}

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

function enhanceFordQuestion(component: any, config: QuestionConfig) {
  if (!component) {
    return;
  }

  const appliedKey = `__fordEnhanced_${config.name}`;
  if ((component as any)[appliedKey]) {
    return;
  }

  const originalOnLoaded = component.onLoaded;
  component.onLoaded = function(question: Question) {
    originalOnLoaded?.call(this, question);
    applyFordQuestionOverrides(question, config);
  };

  const originalOnPropertyChanged = component.onPropertyChanged;
  component.onPropertyChanged = function(question: Question, propertyName: string, newValue: any) {
    originalOnPropertyChanged?.call(this, question, propertyName, newValue);
    if (propertyName === 'onlyInclude' && question.contentQuestion) {
      question.contentQuestion.onlyInclude = newValue;
    }
  };

  (component as any)[appliedKey] = true;
}

function applyFordQuestionOverrides(question: Question, config: QuestionConfig) {
  const onlyIncludeProp = config.properties?.find(p => p.name === 'onlyInclude');
  if (onlyIncludeProp && question.contentQuestion) {
    question.contentQuestion.onlyInclude = question.onlyInclude;
  }

  const targetQuestion: any = (question as any).contentQuestion || question;

  const sanitizeText = (value?: string): string | undefined => {
    if (!value || typeof value !== 'string') return value;
    return value
      .replace(/\r\n/g, '\n')
      .replace(/<br\s*\/?>/gi, '\n\n')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/<\/?strong>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n(?!\n)/g, '\n\n')
      .trim();
  };

  const sanitizeLocalized = (value: any): any => {
    if (!value) return value;
    if (typeof value === 'string') return sanitizeText(value);
    if (typeof value === 'object') {
    const sanitized: Record<string, string> = {};
    Object.keys(value).forEach((locale) => {
      sanitized[locale] = sanitizeText(value[locale]) || value[locale];
    });
    return sanitized;
    }
    return value;
  };

  if (targetQuestion) {
    if (question.isRequired) {
      targetQuestion.isRequired = true;
    }
    if (question.validators?.length > 0) {
      targetQuestion.validators = [...(targetQuestion.validators || []), ...question.validators];
    }
  }

  if (config.name === 'fordoptin' && targetQuestion) {
    const localizedLabelTrue = sanitizeLocalized(config.defaultValues?.labelTrue);
    const localizedLabelFalse = sanitizeLocalized(config.defaultValues?.labelFalse);
    const localizedDescription = sanitizeLocalized(config.defaultValues?.description);

    console.log('[FordSurveysNew] fordoptin override inputs', {
      localizedLabelTrue,
      localizedLabelFalse,
      localizedDescription,
    });

    const resolveLocalizedValue = (value: any, localeFallback = 'en'): string | undefined => {
      if (!value) return undefined;
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        const locale = targetQuestion.survey?.locale || localeFallback;
        return value[locale] || value[localeFallback] || value.en;
      }
      return undefined;
    };

    const labelTrueValue = resolveLocalizedValue(localizedLabelTrue);
    const labelFalseValue = resolveLocalizedValue(localizedLabelFalse);
    const descriptionValue = resolveLocalizedValue(localizedDescription);

    if (localizedLabelTrue && targetQuestion.locLabelTrue?.setJson) {
      targetQuestion.locLabelTrue.setJson(localizedLabelTrue);
    }

    if (localizedLabelTrue && targetQuestion.locLabel?.setJson) {
      targetQuestion.locLabel.setJson(localizedLabelTrue);
    }

    if (labelTrueValue) {
      targetQuestion.labelTrue = labelTrueValue;
      targetQuestion.label = labelTrueValue;
      if (targetQuestion.jsonObj) {
        targetQuestion.jsonObj.labelTrue = localizedLabelTrue;
        targetQuestion.jsonObj.label = labelTrueValue;
      }
      question.label = labelTrueValue;
      question.title = labelTrueValue;
    }

    if (labelFalseValue) {
      targetQuestion.labelFalse = labelFalseValue;
      if (targetQuestion.jsonObj) {
        targetQuestion.jsonObj.labelFalse = localizedLabelFalse;
      }
    }

    if (localizedLabelFalse && targetQuestion.locLabelFalse?.setJson) {
      targetQuestion.locLabelFalse.setJson(localizedLabelFalse);
    }

    if (localizedDescription && targetQuestion.locDescription?.setJson) {
      targetQuestion.locDescription.setJson(localizedDescription);
    }

    if (localizedLabelTrue && question.locTitle?.setJson) {
      question.locTitle.setJson(localizedLabelTrue);
    }

    if (localizedDescription && question.locDescription?.setJson) {
      question.locDescription.setJson(localizedDescription);
    }

    if (descriptionValue) {
      question.description = descriptionValue;
      targetQuestion.description = descriptionValue;
    }

    if (config.defaultValues?.descriptionLocation) {
      targetQuestion.descriptionLocation = config.defaultValues.descriptionLocation;
      (question as any).descriptionLocation = config.defaultValues.descriptionLocation;
    }

    targetQuestion.titleLocation = 'hidden';
    targetQuestion.renderAs = 'checkbox';
    targetQuestion.__fdsCustomBoolean = true;

    question.titleLocation = 'top';

    console.log('[FordSurveysNew] Applied fordoptin localized strings', {
      questionName: targetQuestion.name,
      labelTrue: targetQuestion.locLabelTrue?.textOrHtml,
      legacyLabel: targetQuestion.locLabel?.textOrHtml,
      description: targetQuestion.locDescription?.textOrHtml,
      titleLocation: targetQuestion.titleLocation,
      renderAs: targetQuestion.renderAs,
    });
  }
}
