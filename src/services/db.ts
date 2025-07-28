import firebaseApp, { shouldUseEmulator } from './firebase' // This is the Firebase object from the previous tutorial
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const db = getFirestore(firebaseApp);

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