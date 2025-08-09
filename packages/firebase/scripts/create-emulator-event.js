const admin = require('firebase-admin');

// Initialize admin SDK with emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'expanse-marketing'
});

const db = admin.firestore();

async function createEmulatorEvent() {
  try {
    // Create a test event with "emulator" in the name
    const testEvent = {
      id: 'emulator-test-event-001',
      name: 'Emulator Test Event',
      brand: 'Ford',
      active: true,
      showLanguageChooser: true,
      showHeader: true,
      startDate: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2025-12-31')),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('events').doc('emulator-test-event-001').set(testEvent);
    console.log('✅ Created test event: emulator-test-event-001');

    // Create a test survey with questions
    const testSurvey = {
      title: 'Emulator Test Survey',
      questions: JSON.stringify({
        title: 'Emulator Test Survey',
        pages: [
          {
            elements: [
              {
                type: 'text',
                name: 'firstname',
                title: 'First Name',
                isRequired: true
              },
              {
                type: 'text',
                name: 'lastname', 
                title: 'Last Name',
                isRequired: true
              },
              {
                type: 'text',
                name: 'email',
                title: 'Email',
                inputType: 'email',
                isRequired: true
              },
              {
                type: 'radiogroup',
                name: 'satisfaction',
                title: 'How satisfied are you with our service?',
                choices: [
                  'Very Satisfied',
                  'Satisfied',
                  'Neutral',
                  'Dissatisfied',
                  'Very Dissatisfied'
                ],
                isRequired: true
              }
            ]
          }
        ]
      }),
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('surveys').doc('emulator-test-survey-001').set(testSurvey);
    console.log('✅ Created test survey: emulator-test-survey-001');

    // Link survey to event
    await db.collection('events').doc('emulator-test-event-001').update({
      surveyID: 'emulator-test-survey-001',
      questions: testSurvey.questions
    });
    console.log('✅ Linked survey to event');

    console.log('\n✨ Emulator test data created successfully!');
    console.log('You can now:');
    console.log('1. Check admin panel at: http://localhost:8004/admin/');
    console.log('2. Access the survey at: http://localhost:8004/s/emulator-test-event-001/');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating emulator test data:', error);
    process.exit(1);
  }
}

createEmulatorEvent();