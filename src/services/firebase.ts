import { initializeApp } from "firebase/app";
import type { FirebaseOptions } from "firebase/app";

const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyAGX-fDz0xFhlEjuWSEK-2GB6W1R61TIuo",
    authDomain: "latitude-lead-system.firebaseapp.com",
    projectId: "latitude-lead-system",
    storageBucket: "latitude-lead-system.appspot.com",
    messagingSenderId: "846031493147",
    appId: "1:846031493147:web:097f695ea7e214a80b80be",
    measurementId: "G-2NHQNB0M5R"
};

const app = initializeApp(firebaseConfig);

// Log environment variables on startup
console.log('=== Firebase Configuration on Startup ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_ENV:', process.env.REACT_APP_ENV);
console.log('REACT_APP_FIREBASE_MODE:', process.env.REACT_APP_FIREBASE_MODE);
console.log('REACT_APP_USE_FUNCTIONS_EMULATOR:', process.env.REACT_APP_USE_FUNCTIONS_EMULATOR);
console.log('REACT_APP_USE_AUTH_EMULATOR:', process.env.REACT_APP_USE_AUTH_EMULATOR);
console.log('REACT_APP_USE_FIRESTORE_EMULATOR:', process.env.REACT_APP_USE_FIRESTORE_EMULATOR);
console.log('========================================');

// Check if we should connect to emulators
export const shouldUseEmulator = (service?: 'auth' | 'firestore' | 'functions') => {
    // Check Firebase mode first
    const firebaseMode = process.env.REACT_APP_FIREBASE_MODE;
    
    // If explicitly set to production, never use emulators
    if (firebaseMode === 'production') {
        return false;
    }
    
    // If explicitly set to emulator, use all emulators by default
    if (firebaseMode === 'emulator') {
        // Allow individual service overrides
        switch (service) {
            case 'auth':
                return process.env.REACT_APP_USE_AUTH_EMULATOR !== 'false';
            case 'firestore':
                return process.env.REACT_APP_USE_FIRESTORE_EMULATOR !== 'false';
            case 'functions':
                return process.env.REACT_APP_USE_FUNCTIONS_EMULATOR !== 'false';
            default:
                return true;
        }
    }
    
    // Default behavior: emulators in development
    const useEmulator = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       process.env.REACT_APP_USE_EMULATOR === 'true';
    
    if (!useEmulator) return false;
    
    // Allow selective emulator usage
    // By default, only use Functions emulator, keep Firestore and Auth in production
    switch (service) {
        case 'auth':
            return process.env.REACT_APP_USE_AUTH_EMULATOR === 'true';
        case 'firestore':
            return process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true';
        case 'functions':
            return process.env.REACT_APP_USE_FUNCTIONS_EMULATOR !== 'false'; // Default true in dev
        default:
            return useEmulator;
    }
};

// Log final emulator decisions on startup
console.log('=== Firebase Emulator Status ===');
console.log('Auth Emulator:', shouldUseEmulator('auth') ? '✅ ENABLED' : '❌ DISABLED (using production)');
console.log('Firestore Emulator:', shouldUseEmulator('firestore') ? '✅ ENABLED' : '❌ DISABLED (using production)');
console.log('Functions Emulator:', shouldUseEmulator('functions') ? '✅ ENABLED' : '❌ DISABLED (using production)');
console.log('================================');

export default app;