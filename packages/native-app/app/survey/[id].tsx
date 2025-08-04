import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import SurveyScreen from '../../src/screens/SurveyScreen';
import type { ExpanseEvent } from '@expanse/shared/types';

export default function SurveyPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // In a real app, you'd fetch the event by ID
  // For now, create a mock event based on the ID with survey questions
  const mockEvent: ExpanseEvent = {
    id: id || 'unknown',
    name: id === 'ford-event-1' ? 'Ford F-150 Lightning Experience' :
          id === 'lincoln-event-1' ? 'Lincoln Aviator Luxury Test Drive' :
          'General Automotive Survey',
    brand: id === 'ford-event-1' ? 'Ford' : 
           id === 'lincoln-event-1' ? 'Lincoln' : 'Other',
    startDate: new Date(Date.now() - 60 * 60 * 1000), // Started 1 hour ago
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    questions: {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "text",
              name: "firstName",
              title: "What is your first name?",
              isRequired: true
            },
            {
              type: "text", 
              name: "lastName",
              title: "What is your last name?",
              isRequired: true
            },
            {
              type: "radiogroup",
              name: "vehicleInterest",
              title: id === 'ford-event-1' ? "Which Ford F-150 Lightning feature interests you most?" : "What interests you most about this vehicle?",
              choices: id === 'ford-event-1' ? [
                "All-electric powertrain",
                "Pro Power Onboard capability", 
                "Intelligent Range technology",
                "Advanced towing features",
                "Ford Co-Pilot360 technology"
              ] : [
                "Performance",
                "Technology",
                "Design",
                "Safety",
                "Value"
              ],
              isRequired: true
            }
          ]
        },
        {
          name: "page2", 
          elements: [
            {
              type: "rating",
              name: "overallExperience",
              title: "How would you rate your overall experience?",
              rateMin: 1,
              rateMax: 5,
              minRateDescription: "Poor",
              maxRateDescription: "Excellent",
              isRequired: true
            },
            {
              type: "comment",
              name: "feedback",
              title: "Please share any additional feedback:",
              rows: 4
            },
            {
              type: "boolean",
              name: "recommend",
              title: "Would you recommend this to others?",
              isRequired: true
            }
          ]
        }
      ]
    },
    theme: { cssVariables: {} },
  };

  const handleSurveyComplete = async (data: any) => {
    console.log('Survey completed:', data);
    // Handle survey completion
  };

  const handleSurveyAbandoned = (event: ExpanseEvent) => {
    console.log('Survey abandoned for event:', event.id);
    // Handle survey abandonment
  };

  return (
    <SurveyScreen
      event={mockEvent}
      onSurveyComplete={handleSurveyComplete}
      onSurveyAbandoned={handleSurveyAbandoned}
    />
  );
}