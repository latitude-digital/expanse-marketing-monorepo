import firebaseApp, { shouldUseEmulator } from './firebase';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Determine which database to use based on environment
const databaseId = import.meta.env.VITE_FIREBASE_NAMESPACE === 'staging' ? 'staging' : '(default)';

console.log(`🔥 Firestore: Namespace = ${import.meta.env.VITE_FIREBASE_NAMESPACE}, Database = ${databaseId}`);

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