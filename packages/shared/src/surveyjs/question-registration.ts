/**
 * Shared SurveyJS custom question type registration
 * 
 * This module provides server-side registration of custom question types
 * to ensure the SurveyJS Model can properly recognize and process custom questions.
 * 
 * This is used by Firebase functions to enable proper _ffs field mapping
 * when processing surveys server-side.
 */

import { ComponentCollection, Serializer } from "survey-core";

/**
 * Register custom question types based on event brand
 * This enables server-side SurveyJS Model to recognize custom question types
 */
export function registerCustomQuestionTypes(brand?: string): void {
  console.log(`[Question Registration] Registering custom question types for brand: ${brand || 'All'}`);
  
  // First, ensure _ffs property is registered (critical for field mapping)
  if (!Serializer.findProperty("question", "_ffs")) {
    Serializer.addProperty("question", {
      name: "_ffs",
      displayName: "FFS question",
      type: "text",
      category: "data",
      isSerializable: true,
    });
    console.log('[Question Registration] Registered _ffs property');
  }

  // Also add to panel type for container questions
  if (!Serializer.findProperty("panel", "_ffs")) {
    Serializer.addProperty("panel", {
      name: "_ffs",
      displayName: "FFS question",
      type: "text",
      category: "data",
      isSerializable: true,
    });
  }

  // Register universal question types (used by all brands)
  registerUniversalQuestions();

  // Register brand-specific questions
  if (brand === 'Ford') {
    registerFordQuestions();
  } else if (brand === 'Lincoln') {
    registerLincolnQuestions();
  }

  console.log('[Question Registration] Registration complete');
}

/**
 * Register universal question types used by all brands
 */
function registerUniversalQuestions(): void {
  // Personal information questions
  registerQuestionIfNeeded("firstname", "text");
  registerQuestionIfNeeded("lastname", "text");
  registerQuestionIfNeeded("phone", "text");
  registerQuestionIfNeeded("email", "text");
  
  // Address questions
  registerQuestionIfNeeded("autocompleteaddress", "text");
  registerQuestionIfNeeded("autocompleteaddressall", "text");
  
  // Waiver questions (SurveyJS lowercases these names)
  registerQuestionIfNeeded("waiver", "panel");
  registerQuestionIfNeeded("adultwaiver", "panel");
  registerQuestionIfNeeded("minorwaiver", "panel");
}

/**
 * Register Ford-specific question types
 */
function registerFordQuestions(): void {
  console.log('[Question Registration] Registering Ford-specific questions');
  
  // Ford opt-in
  registerQuestionIfNeeded("fordoptin", "radiogroup");
  
  // Ford Vehicle of Interest
  registerQuestionIfNeeded("fordvoi", "checkbox");
  
  // Ford vehicles driven
  registerQuestionIfNeeded("fordvehiclesdriven", "checkbox");
  
  // Ford recommendation questions
  registerQuestionIfNeeded("fordrecommend", "radiogroup");
  registerQuestionIfNeeded("fordrecommendpost", "radiogroup");
  
  // Ford purchase and acquisition questions
  registerQuestionIfNeeded("howlikelyacquire", "radiogroup");
  registerQuestionIfNeeded("howlikelypurchasingford", "radiogroup");
  registerQuestionIfNeeded("howlikelypurchasingfordpost", "radiogroup");
  registerQuestionIfNeeded("inmarkettiming", "radiogroup");
  registerQuestionIfNeeded("vehicledrivenmostmake", "text");
  
  // FMC questions (shared by Ford and Lincoln)
  registerFMCQuestions();
}

/**
 * Register Lincoln-specific question types
 */
function registerLincolnQuestions(): void {
  console.log('[Question Registration] Registering Lincoln-specific questions');
  
  // Lincoln opt-in
  registerQuestionIfNeeded("lincolnoptin", "radiogroup");
  
  // Lincoln Vehicle of Interest
  registerQuestionIfNeeded("lincolnvoi", "checkbox");
  
  // Lincoln vehicles driven
  registerQuestionIfNeeded("lincolnvehiclesdriven", "checkbox");
  
  // Lincoln opinion and recommendation questions
  registerQuestionIfNeeded("lincolnrecommend", "radiogroup");
  registerQuestionIfNeeded("lincolnrecommendpost", "radiogroup");
  registerQuestionIfNeeded("lincolnoverallopinion", "radiogroup");
  registerQuestionIfNeeded("lincolnoverallopinionpost", "radiogroup");
  registerQuestionIfNeeded("lincolnpurchaseconsideration", "radiogroup");
  registerQuestionIfNeeded("lincolnpurchaseconsiderationpost", "radiogroup");
  
  // FMC questions (shared by Ford and Lincoln)
  registerFMCQuestions();
}

/**
 * Register FMC questions (used by both Ford and Lincoln)
 * Note: SurveyJS lowercases all custom question type names
 */
function registerFMCQuestions(): void {
  // Age bracket questions
  registerQuestionIfNeeded("agegroup", "radiogroup");
  registerQuestionIfNeeded("agebracket", "radiogroup");
  
  // Gender questions
  registerQuestionIfNeeded("genderchoice", "radiogroup");
  registerQuestionIfNeeded("gender", "radiogroup");
  
  // Ethnicity (lowercased by SurveyJS)
  registerQuestionIfNeeded("ethnicityselect", "checkbox");
  
  // Income (lowercased by SurveyJS)
  registerQuestionIfNeeded("incomelevel", "radiogroup");
}

/**
 * Helper function to register a question type if it doesn't already exist
 */
function registerQuestionIfNeeded(name: string, baseType: string): void {
  if (!ComponentCollection.Instance.getCustomQuestionByName(name)) {
    ComponentCollection.Instance.add({
      name: name,
      questionJSON: {
        type: baseType
      }
    });
    console.log(`[Question Registration] Registered question type: ${name} (base: ${baseType})`);
  } else {
    console.log(`[Question Registration] Question type already registered: ${name}`);
  }
}