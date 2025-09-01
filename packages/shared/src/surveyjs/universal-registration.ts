/**
 * Universal question registration system
 * Single source of truth for all SurveyJS custom questions
 */

import { Serializer } from 'survey-core';
import { Brand, Environment, QuestionConfig } from './types';
import { RegistrarFactory } from './registrars/registrar-factory';
import { fordQuestions } from './questions/ford-questions';
import { lincolnQuestions } from './questions/lincoln-questions';
import { fmcQuestions } from './questions/fmc-questions';

// Track initialization to prevent duplicate registration
const initializedBrands = new Set<string>();

/**
 * Register the _ffs property globally
 * This is required for field mapping to Ford/Lincoln APIs
 */
function registerFFSProperty(): void {
  // Register on question type
  if (!Serializer.findProperty('question', '_ffs')) {
    Serializer.addProperty('question', {
      name: '_ffs',
      displayName: 'FFS question',
      type: 'text',
      category: 'data',
      isSerializable: true,
    });
    console.log('[Universal Registration] Registered _ffs property on question');
  }

  // Also register on panel type for container questions
  if (!Serializer.findProperty('panel', '_ffs')) {
    Serializer.addProperty('panel', {
      name: '_ffs',
      displayName: 'FFS question',
      type: 'text',
      category: 'data',
      isSerializable: true,
    });
    console.log('[Universal Registration] Registered _ffs property on panel');
  }
}

/**
 * Get question configurations for a brand
 */
function getQuestionsForBrand(brand: Brand): QuestionConfig[] {
  const questions: QuestionConfig[] = [];

  // Always include FMC questions (shared by all brands)
  questions.push(...fmcQuestions);

  // Add brand-specific questions
  switch (brand) {
    case 'ford':
      questions.push(...fordQuestions);
      break;
    case 'lincoln':
      questions.push(...lincolnQuestions);
      break;
    case 'fmc':
      // FMC only gets the shared questions
      break;
    case 'unbranded':
      // Unbranded gets all questions
      questions.push(...fordQuestions);
      questions.push(...lincolnQuestions);
      break;
  }

  return questions;
}

/**
 * Register questions for a specific brand
 * This is the main entry point for question registration
 * 
 * @param brand - The brand to register questions for
 * @param environment - Optional environment (auto-detected if not provided)
 * @param force - Force re-registration even if already initialized
 */
export function registerUniversalQuestions(
  brand: Brand,
  environment?: Environment,
  force: boolean = false
): void {
  const registrationKey = `${brand}-${environment || 'auto'}`;
  
  // Check if already initialized (unless forced)
  if (!force && initializedBrands.has(registrationKey)) {
    console.log(`[Universal Registration] Questions already registered for ${registrationKey}, skipping...`);
    return;
  }

  console.log(`[Universal Registration] Starting registration for brand: ${brand}, environment: ${environment || 'auto-detected'}`);

  // Always register _ffs property first
  registerFFSProperty();

  // Get the appropriate registrar
  const registrar = RegistrarFactory.getRegistrar(environment);
  console.log(`[Universal Registration] Using ${registrar.getEnvironment()} registrar`);

  // Get questions for this brand
  const questions = getQuestionsForBrand(brand);
  console.log(`[Universal Registration] Registering ${questions.length} questions for ${brand}`);

  // Register each question
  questions.forEach(question => {
    registrar.registerQuestion(question);
  });

  // Mark as initialized
  initializedBrands.add(registrationKey);
  console.log(`[Universal Registration] Registration complete for ${registrationKey}`);
}

/**
 * Clear registration cache (useful for testing)
 */
export function clearRegistrationCache(): void {
  initializedBrands.clear();
  RegistrarFactory.clearCache();
}

/**
 * Check if a brand has been initialized
 */
export function isBrandInitialized(brand: Brand, environment?: Environment): boolean {
  const registrationKey = `${brand}-${environment || 'auto'}`;
  return initializedBrands.has(registrationKey);
}

/**
 * Legacy compatibility exports
 * These match the old function signatures for easier migration
 */
export function registerCustomQuestionTypes(brand?: string): void {
  // Map old brand string to new Brand type
  let brandType: Brand = 'unbranded';
  if (brand) {
    const lowerBrand = brand.toLowerCase();
    if (lowerBrand === 'ford') brandType = 'ford';
    else if (lowerBrand === 'lincoln') brandType = 'lincoln';
    else if (lowerBrand === 'fmc') brandType = 'fmc';
  }

  // Register using new system (backend environment)
  registerUniversalQuestions(brandType, 'backend');
}