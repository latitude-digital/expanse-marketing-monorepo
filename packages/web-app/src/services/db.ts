import firebaseApp, { shouldUseEmulator } from './firebase' // This is the Firebase object from the previous tutorial
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// When using emulator, always use default database
// When in production, use staging or default based on namespace
const isUsingEmulator = shouldUseEmulator('firestore');
const databaseId = isUsingEmulator 
    ? '(default)'  // Emulator only supports default database
    : (import.meta.env.VITE_FIREBASE_NAMESPACE === 'staging' ? 'staging' : '(default)');

console.log(`🔥 DB Service: Namespace = ${import.meta.env.VITE_FIREBASE_NAMESPACE}, Database = ${databaseId}, Emulator = ${isUsingEmulator}`);

// Connect to the appropriate database
// Note: For client SDK, we need to use the database parameter only for non-default databases
const db = databaseId === '(default)' 
    ? getFirestore(firebaseApp)
    : getFirestore(firebaseApp, databaseId);

// Connect to Firestore emulator if configured
let emulatorConnected = false;
if (shouldUseEmulator('firestore') && !emulatorConnected) {
    try {
        console.log('🔧 Connecting to Firestore emulator at localhost:8080');
        connectFirestoreEmulator(db, 'localhost', 8080);
        emulatorConnected = true;
    } catch (error) {
        // Already connected, ignore
        console.log('Firestore emulator already connected');
    }
} else {
    console.log('🌐 Using production Firestore');
}

export default db;