import { ComponentCollection } from 'survey-core';
import { AllSurveys, FordSurveys, LincolnSurveys } from '../index';

describe('Custom Question Integration', () => {
  beforeEach(() => {
    // Clear any existing registered components
    ComponentCollection.Instance.clear();
  });

  describe('AllSurveys', () => {
    it('should register universal question types', () => {
      AllSurveys.globalInit();
      
      const expectedQuestions = [
        'firstname',
        'lastname', 
        'email',
        'phone',
        'optin',
        'autocompleteaddress',
        'autocompleteaddress2'
      ];
      
      expectedQuestions.forEach(questionType => {
        const component = ComponentCollection.Instance.getCustomQuestionByName(questionType);
        expect(component).toBeDefined();
        expect(component.name).toBe(questionType);
      });
    });
  });

  describe('FordSurveys', () => {
    it('should register Ford-specific question types', () => {
      FordSurveys.fordInit();
      
      const expectedQuestions = [
        'fordvoi',
        'fordoptin',
        'fordrecommend',
        'gender',
        'agebracket',
        'howlikelyacquire',
        'howlikelypurchasingford',
        'inmarkettiming',
        'adultwaiver',
        'minorwaiver',
        'vehicledrivenmostmake',
        'fordrecommendpost',
        'howlikelypurchasingfordpost'
      ];
      
      expectedQuestions.forEach(questionType => {
        const component = ComponentCollection.Instance.getCustomQuestionByName(questionType);
        expect(component).toBeDefined();
        expect(component.name).toBe(questionType);
      });
    });
  });

  describe('LincolnSurveys', () => {
    it('should register Lincoln-specific question types', () => {
      LincolnSurveys.lincolnInit();
      
      const expectedQuestions = [
        'lincolnvoi',
        'lincolnoptin'
      ];
      
      expectedQuestions.forEach(questionType => {
        const component = ComponentCollection.Instance.getCustomQuestionByName(questionType);
        expect(component).toBeDefined();
        expect(component.name).toBe(questionType);
      });
    });
  });

  describe('All question types together', () => {
    it('should register all question types without conflicts', () => {
      AllSurveys.globalInit();
      FordSurveys.fordInit();
      LincolnSurveys.lincolnInit();
      
      // Test a few key questions from each category
      const testQuestions = [
        'firstname', // AllSurveys
        'fordvoi',   // FordSurveys  
        'lincolnvoi' // LincolnSurveys
      ];
      
      testQuestions.forEach(questionType => {
        const component = ComponentCollection.Instance.getCustomQuestionByName(questionType);
        expect(component).toBeDefined();
        expect(component.name).toBe(questionType);
      });
    });
  });
});