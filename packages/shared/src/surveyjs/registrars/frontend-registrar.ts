/**
 * Frontend-specific question registrar
 * Uses ComponentCollection API for client-side registration
 */

import { ComponentCollection, Serializer, Question } from 'survey-core';
import { IQuestionRegistrar, QuestionConfig, QuestionProperty } from '../types';

export class FrontendRegistrar implements IQuestionRegistrar {
  registerQuestion(config: QuestionConfig): void {
    // Check if already registered
    if (ComponentCollection.Instance.getCustomQuestionByName(config.name)) {
      console.log(`[Frontend] Question type already registered: ${config.name}`);
      return;
    }

    // Build the question JSON with defaults
    const questionJSON: any = {
      type: config.baseType,
      name: config.name,
      ...config.defaultValues,
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
              this.registerProperty(config.name, prop);
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
        const child = question.contentQuestion;
        if (child) {
          if (question.isRequired) {
            child.isRequired = true;
          }
          if (question.validators?.length > 0) {
            child.validators = [...(child.validators || []), ...question.validators];
          }
        }
      },
      onPropertyChanged: (question: Question, propertyName: string, newValue: any) => {
        // Handle property changes like onlyInclude
        if (propertyName === 'onlyInclude' && question.contentQuestion) {
          question.contentQuestion.onlyInclude = newValue;
        }
      },
    });

    console.log(`[Frontend] Registered question type: ${config.name}`);
  }

  registerProperty(questionType: string, property: QuestionProperty): void {
    const serializerProp: any = {
      name: property.name,
      displayName: property.displayName || property.name,
      type: property.type || 'text',
      category: property.category || 'general',
      isSerializable: true,
    };

    if (property.default !== undefined) {
      serializerProp.default = property.default;
    }

    if (property.choices) {
      serializerProp.choices = property.choices;
    }

    if (property.visible !== undefined) {
      serializerProp.visible = property.visible;
    }

    if (property.isLocalizable) {
      serializerProp.isLocalizable = true;
    }

    Serializer.addProperty(questionType, serializerProp);
  }

  isRegistered(questionType: string): boolean {
    return !!ComponentCollection.Instance.getCustomQuestionByName(questionType);
  }

  getEnvironment(): 'frontend' | 'backend' {
    return 'frontend';
  }
}