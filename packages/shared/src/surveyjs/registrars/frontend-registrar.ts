/**
 * Frontend-specific question registrar
 * Uses ComponentCollection API for client-side registration
 */

import { ComponentCollection, Serializer, Question } from 'survey-core';
import { IQuestionRegistrar, QuestionConfig, QuestionProperty } from '../types';

export class FrontendRegistrar implements IQuestionRegistrar {
  registerQuestion(config: QuestionConfig): void {
    // Extract _ffs property (if provided)
    const ffsProperty = config.properties?.find(p => p.name === '_ffs');

    // Check if already registered
    if (ComponentCollection.Instance.getCustomQuestionByName(config.name)) {
      console.log(`[Frontend] Question type already registered: ${config.name}`);
      // Ensure _ffs default and readOnly are applied even if type pre-registered elsewhere
      if (ffsProperty) {
        const prop = Serializer.findProperty(config.name, '_ffs');
        if (prop) {
          if (ffsProperty.default !== undefined) prop.default = ffsProperty.default;
          prop.readOnly = true;
          prop.visible = ffsProperty.visible !== undefined ? ffsProperty.visible : prop.visible;
        }
      }
      return;
    }

    // Build the question JSON - merge all defaultValues first, then override type
    const questionJSON: any = {
      ...config.defaultValues,
      type: config.baseType,
      name: config.name,
    };
    
    // Apply _ffs if defined in properties
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

    // If this pre-defined question declares an _ffs default, make _ffs read-only for this type
    if (ffsProperty) {
      const prop = Serializer.findProperty(config.name, '_ffs');
      if (prop) {
        if (ffsProperty.default !== undefined) prop.default = ffsProperty.default;
        prop.readOnly = true; // visible in property grid but not editable for this specific type
        if (ffsProperty.visible !== undefined) prop.visible = ffsProperty.visible;
      }
    }

    console.log(`[Frontend] Registered question type: ${config.name}`, {
      baseType: config.baseType,
      questionJSON: questionJSON,
      hasChoices: !!questionJSON.choices,
      renderAs: questionJSON.renderAs
    });
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
