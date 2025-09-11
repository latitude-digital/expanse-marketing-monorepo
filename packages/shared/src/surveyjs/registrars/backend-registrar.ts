/**
 * Backend-specific question registrar
 * Uses Serializer API for server-side registration
 */

import { ComponentCollection, Serializer } from 'survey-core';
import { IQuestionRegistrar, QuestionConfig, QuestionProperty } from '../types';

export class BackendRegistrar implements IQuestionRegistrar {
  registerQuestion(config: QuestionConfig): void {
    // Extract _ffs property (if provided)
    const ffsProperty = config.properties?.find(p => p.name === '_ffs');

    // Check if already registered
    if (ComponentCollection.Instance.getCustomQuestionByName(config.name)) {
      console.log(`[Backend] Question type already registered: ${config.name}`);
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

    // Build the question JSON with defaults
    const questionJSON: any = {
      type: config.baseType,
      ...config.defaultValues,
    };

    // Apply _ffs if defined in properties
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

    // If this pre-defined question declares an _ffs default, make _ffs read-only for this type
    if (ffsProperty) {
      const prop = Serializer.findProperty(config.name, '_ffs');
      if (prop) {
        if (ffsProperty.default !== undefined) prop.default = ffsProperty.default;
        prop.readOnly = true; // keep visible but lock editing for this custom type
        if (ffsProperty.visible !== undefined) prop.visible = ffsProperty.visible;
      }
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
