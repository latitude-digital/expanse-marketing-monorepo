/**
 * Backend-specific question registrar
 * Uses Serializer API for server-side registration
 */

import { ComponentCollection, Serializer } from 'survey-core';
import { IQuestionRegistrar, QuestionConfig, QuestionProperty } from '../types';

export class BackendRegistrar implements IQuestionRegistrar {
  registerQuestion(config: QuestionConfig): void {
    // Check if already registered
    if (ComponentCollection.Instance.getCustomQuestionByName(config.name)) {
      console.log(`[Backend] Question type already registered: ${config.name}`);
      return;
    }

    // Build the question JSON with defaults
    const questionJSON: any = {
      type: config.baseType,
      ...config.defaultValues,
    };

    // Apply _ffs if defined in properties
    const ffsProperty = config.properties?.find(p => p.name === '_ffs');
    if (ffsProperty && ffsProperty.default) {
      questionJSON._ffs = ffsProperty.default;
    }

    // Register using ComponentCollection (backend also uses this for basic registration)
    ComponentCollection.Instance.add({
      name: config.name,
      questionJSON,
    });

    // Register custom properties
    if (config.properties) {
      config.properties.forEach(prop => {
        this.registerProperty(config.name, prop);
      });
    }

    console.log(`[Backend] Registered question type: ${config.name} (base: ${config.baseType})`);
  }

  registerProperty(questionType: string, property: QuestionProperty): void {
    // Check if property already exists
    if (Serializer.findProperty(questionType, property.name)) {
      return;
    }

    const serializerProp: any = {
      name: property.name,
      displayName: property.displayName || property.name,
      type: property.type || 'text',
      category: property.category || 'data',
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

    if (property.required) {
      serializerProp.required = true;
    }

    // Add property to the question type
    Serializer.addProperty(questionType, serializerProp);
  }

  isRegistered(questionType: string): boolean {
    return !!ComponentCollection.Instance.getCustomQuestionByName(questionType);
  }

  getEnvironment(): 'frontend' | 'backend' {
    return 'backend';
  }
}