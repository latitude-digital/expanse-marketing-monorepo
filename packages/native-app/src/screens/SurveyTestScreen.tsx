import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { SurveyWebViewStatic } from '../components/SurveyWebViewStatic';

export default function SurveyTestScreen() {
  const [surveyData, setSurveyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Test survey JSON
  const testSurvey = {
    title: "Offline Survey Test",
    description: "Testing offline survey functionality",
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
            name: "satisfaction",
            title: "How satisfied are you with our service?",
            choices: [
              "Very Satisfied",
              "Satisfied",
              "Neutral",
              "Dissatisfied",
              "Very Dissatisfied"
            ],
            isRequired: true
          }
        ]
      },
      {
        name: "page2",
        elements: [
          {
            type: "comment",
            name: "feedback",
            title: "Please provide any additional feedback:"
          }
        ]
      }
    ],
    showProgressBar: "top",
    showNavigationButtons: true,
    showCompletedPage: true,
    completedHtml: "<h3>Thank you for completing the survey!</h3>"
  };

  const handleComplete = (data: any) => {
    console.log('Survey completed:', data);
    setSurveyData(data);
  };

  const handleProgress = (data: any) => {
    console.log('Survey progress:', data);
  };

  const handleError = (errorMessage: string) => {
    console.error('Survey error:', errorMessage);
    setError(errorMessage);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Survey Test</Text>
        {error && (
          <Text style={styles.error}>Error: {error}</Text>
        )}
      </View>
      
      <View style={styles.surveyContainer}>
        <SurveyWebViewStatic
          surveyJson={testSurvey}
          brand="FORD"
          eventId="test-event-001"
          onComplete={handleComplete}
          onProgress={handleProgress}
          onError={handleError}
        />
      </View>

      {surveyData && (
        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Survey Results:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(surveyData, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
  surveyContainer: {
    flex: 1,
  },
  resultsContainer: {
    maxHeight: 200,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultsText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});