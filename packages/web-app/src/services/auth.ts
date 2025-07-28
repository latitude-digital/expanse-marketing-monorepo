import firebaseApp, { shouldUseEmulator } from './firebase' // This is the Firebase object from the previous tutorial
import { getAuth, connectAuthEmulator } from "firebase/auth";

const auth = getAuth(firebaseApp);

// Connect to Auth emulator if configured
let authEmulatorConnected = false;
if (shouldUseEmulator('auth') && !authEmulatorConnected) {
    try {
        console.log('🔧 Connecting to Auth emulator at localhost:9099');
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        authEmulatorConnected = true;
        console.log('✅ Auth Emulator: CONNECTED');
    } catch (error) {
        // Already connected, ignore
        console.log('⚠️ Auth emulator already connected');
    }
} else {
    console.log('🌐 Auth: Using PRODUCTION');
}

export default auth;