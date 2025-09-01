import firebaseApp, { shouldUseEmulator } from './firebase';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Determine which database to use based on environment
// Rules:
// 1. When using staging namespace, use staging database
// 2. EXCEPT when using emulators, then always use default database
const isUsingEmulator = shouldUseEmulator('firestore');
const isStaging = import.meta.env.VITE_FIREBASE_NAMESPACE === 'staging';

let databaseId: string;
if (isUsingEmulator) {
    // Emulator always uses default database
    databaseId = '(default)';
} else if (isStaging) {
    // Production/staging uses staging database
    databaseId = 'staging';
} else {
    // Everything else uses default
    databaseId = '(default)';
}

console.log(`🔥 Firestore: Namespace = ${import.meta.env.VITE_FIREBASE_NAMESPACE}, Database = ${databaseId}${isUsingEmulator ? ' (emulator mode)' : ''}`);

// Connect to the appropriate database
// Note: For client SDK, we need to use the database parameter only for non-default databases
const db = databaseId === '(default)' 
    ? getFirestore(firebaseApp)
    : getFirestore(firebaseApp, databaseId);

// Connect to Firestore emulator if configured
let firestoreEmulatorConnected = false;
if (shouldUseEmulator('firestore') && !firestoreEmulatorConnected) {
    try {
        console.log('🔧 Connecting to Firestore emulator at localhost:8080');
        connectFirestoreEmulator(db, 'localhost', 8080);
        firestoreEmulatorConnected = true;
        console.log('✅ Firestore Emulator: CONNECTED');
    } catch (error) {
        // Already connected, ignore
        console.log('⚠️ Firestore emulator already connected');
    }
} else {
    console.log('🌐 Firestore: Using PRODUCTION');
}

export default db;