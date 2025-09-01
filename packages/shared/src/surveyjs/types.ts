/**
 * Unified types for SurveyJS question registration
 */

/**
 * Configuration for a custom SurveyJS question
 */
export interface QuestionConfig {
  /** Unique name for the question type */
  name: string;
  
  /** Base question type it extends (e.g., 'radiogroup', 'text', 'dropdown') */
  baseType: string;
  
  /** Display title for the question type */
  title?: string;
  
  /** Custom properties to add to the question */
  properties?: QuestionProperty[];
  
  /** Default values for the question */
  defaultValues?: Record<string, any>;
  
  /** Custom validator function name */
  validator?: string;
  
  /** Custom renderer component name (frontend only) */
  renderer?: string;
  
  /** Icon for the toolbox (frontend only) */
  icon?: string;
  
  /** Category in the toolbox (frontend only) */
  category?: string;
}

/**
 * Property definition for a custom question
 */
export interface QuestionProperty {
  /** Property name */
  name: string;
  
  /** Property type */
  type?: string;
  
  /** Default value */
  default?: any;
  
  /** Whether property is required */
  required?: boolean;
  
  /** Display name in property grid */
  displayName?: string;
  
  /** Category in property grid */
  category?: string;
  
  /** Whether property is visible in property grid */
  visible?: boolean;
  
  /** Choices for dropdown properties */
  choices?: Array<string | { value: string; text: string }>;
  
  /** Whether property is localizable */
  isLocalizable?: boolean;
  
  /** Serialization options */
  serializationProperty?: string;
  
  /** Maximum value (for numeric properties) */
  maxValue?: number;
  
  /** Minimum value (for numeric properties) */
  minValue?: number;
}

/**
 * Interface for question registrars
 */
export interface IQuestionRegistrar {
  /**
   * Register a custom question type
   */
  registerQuestion(config: QuestionConfig): void;
  
  /**
   * Register a custom property for an existing question type
   */
  registerProperty(questionType: string, property: QuestionProperty): void;
  
  /**
   * Check if a question type is already registered
   */
  isRegistered(questionType: string): boolean;
  
  /**
   * Get the environment type
   */
  getEnvironment(): 'frontend' | 'backend';
}

/**
 * Brand types supported by the system
 */
export type Brand = 'ford' | 'lincoln' | 'fmc' | 'unbranded';

/**
 * Environment types
 */
export type Environment = 'frontend' | 'backend';

/**
 * Function signature for universal registration
 */
export type RegisterUniversalQuestions = (
  brand: Brand,
  environment?: Environment
) => void;