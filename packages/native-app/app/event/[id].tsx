import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import EventDetailScreen from '../../src/screens/EventDetailScreen';
import type { ExpanseEvent } from '@expanse/shared/types';

export default function EventDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // In a real app, you'd fetch the event by ID
  // For now, create a mock event based on the ID
  const mockEvent: ExpanseEvent = {
    id: id || 'unknown',
    name: id === 'ford-event-1' ? 'Ford F-150 Lightning Experience' :
          id === 'lincoln-event-1' ? 'Lincoln Aviator Luxury Test Drive' :
          'General Automotive Survey',
    brand: id === 'ford-event-1' ? 'Ford' : 
           id === 'lincoln-event-1' ? 'Lincoln' : 'Other',
    startDate: new Date(Date.now() - 60 * 60 * 1000), // Started 1 hour ago
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true, // Make the event active for testing
    // Add missing properties that EventDetailScreen expects
    eventName: id === 'ford-event-1' ? 'Ford F-150 Lightning Experience' :
               id === 'lincoln-event-1' ? 'Lincoln Aviator Luxury Test Drive' :
               'General Automotive Survey',
    eventDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    location: id === 'ford-event-1' ? 'Ford Dealership - Downtown' :
              id === 'lincoln-event-1' ? 'Lincoln Showroom - Uptown' :
              'Location TBD',
    surveyName: 'Vehicle Experience Survey',
    expectedResponses: 50,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    questions: id === 'ford-event-1' ? {
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
              title: "Which Ford F-150 Lightning feature interests you most?",
              choices: [
                "All-electric powertrain",
                "Pro Power Onboard capability", 
                "Intelligent Range technology",
                "Advanced towing features",
                "Ford Co-Pilot360 technology"
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
              title: "How would you rate your overall experience with the F-150 Lightning?",
              rateMin: 1,
              rateMax: 5,
              minRateDescription: "Poor",
              maxRateDescription: "Excellent",
              isRequired: true
            },
            {
              type: "comment",
              name: "feedback",
              title: "Please share any additional feedback about your Ford F-150 Lightning experience:",
              rows: 4
            },
            {
              type: "boolean",
              name: "recommend",
              title: "Would you recommend the Ford F-150 Lightning to others?",
              isRequired: true
            }
          ]
        }
      ]
    } : { pages: [] },
    theme: { cssVariables: {} },
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: mockEvent.name,
          headerBackTitle: "Events"
        }} 
      />
      <EventDetailScreen event={mockEvent} />
    </>
  );
}