const admin = require('firebase-admin');

// Initialize admin SDK with emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

admin.initializeApp({
  projectId: 'expanse-marketing'
});

const db = admin.firestore();

async function seedTestData() {
  try {
    // Create a test event
    const testEvent = {
      id: 'staging-test-event-001',
      name: 'Test Event',
      brand: 'Ford',
      active: true,
      showLanguageChooser: true,
      showHeader: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('events').doc('staging-test-event-001').set(testEvent);
    console.log('✅ Created test event: staging-test-event-001');

    // Create a test survey
    const testSurvey = {
      title: 'Test Survey',
      surveyJSON: JSON.stringify({
        title: 'Test Survey',
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
              }
            ]
          }
        ]
      }),
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('surveys').doc('test-survey-001').set(testSurvey);
    console.log('✅ Created test survey: test-survey-001');

    // Link survey to event
    await db.collection('events').doc('staging-test-event-001').update({
      surveyID: 'test-survey-001'
    });
    console.log('✅ Linked survey to event');

    // Create a test admin user
    const testUser = {
      email: 'test@example.com',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc('test@example.com').set(testUser);
    console.log('✅ Created test admin user: test@example.com');

    console.log('\n✨ Test data seeded successfully!');
    console.log('You can now:');
    console.log('1. Access the survey at: http://localhost:8004/s/staging-test-event-001/');
    console.log('2. Log into admin at: http://localhost:8004/admin with test@example.com');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

seedTestData();