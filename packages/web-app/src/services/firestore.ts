import firebaseApp, { shouldUseEmulator } from './firebase';
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const db = getFirestore(firebaseApp);

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