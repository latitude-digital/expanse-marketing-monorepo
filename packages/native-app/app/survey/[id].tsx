import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import SurveyScreen from '../../src/screens/SurveyScreen';
import type { ExpanseEvent } from '@expanse/shared/types';

export default function SurveyPage() {
  const { id, eventData } = useLocalSearchParams<{ id: string; eventData?: string }>();

  // Parse the event data from navigation params
  let event: ExpanseEvent;
  
  if (eventData) {
    try {
      // Parse the JSON event data passed from EventListScreen
      event = JSON.parse(eventData);
      console.log('Survey Page: Using event data from navigation params:', event.name);
      console.log('Survey Page: Event has questions:', !!event.questions);
      console.log('Survey Page: Event has surveyJSON:', !!event.surveyJSON);
      console.log('Survey Page: Event has surveyJSModel:', !!event.surveyJSModel);
      console.log('Survey Page: Questions preview:', JSON.stringify(event.questions || {}).substring(0, 200));
      console.log('Survey Page: SurveyJSON preview:', JSON.stringify(event.surveyJSON || {}).substring(0, 200));
    } catch (error) {
      console.error('Failed to parse event data:', error);
      // Fallback to a basic event structure if parsing fails
      event = {
        id: id || 'unknown',
        name: 'Survey',
        brand: 'Other',
        startDate: new Date(),
        endDate: new Date(),
        questions: { pages: [] },
        theme: { cssVariables: {} },
      };
    }
  } else {
    // If no event data passed, create a minimal event structure
    console.log('Survey Page: No event data provided, using minimal structure');
    event = {
      id: id || 'unknown', 
      name: 'Survey',
      brand: 'Other',
      startDate: new Date(),
      endDate: new Date(),
      questions: { pages: [] },
      theme: { cssVariables: {} },
    };
  }

  const handleSurveyComplete = async (data: any) => {
    console.log('Survey completed:', data);
    // Handle survey completion
  };

  const handleSurveyAbandoned = (abandonedEvent: ExpanseEvent) => {
    console.log('Survey abandoned for event:', abandonedEvent.id);
    // Handle survey abandonment
  };

  return (
    <SurveyScreen
      event={event}
      onSurveyComplete={handleSurveyComplete}
      onSurveyAbandoned={handleSurveyAbandoned}
    />
  );
}