import firebaseApp, { shouldUseEmulator } from './firebase';
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const functions = getFunctions(firebaseApp);

// Connect to Functions emulator if configured
let functionsEmulatorConnected = false;
if (shouldUseEmulator('functions') && !functionsEmulatorConnected) {
    try {
        console.log('🔧 Connecting to Functions emulator at localhost:5001');
        connectFunctionsEmulator(functions, 'localhost', 5001);
        functionsEmulatorConnected = true;
        console.log('✅ Functions Emulator: CONNECTED');
    } catch (error) {
        // Already connected, ignore
        console.log('⚠️ Functions emulator already connected');
    }
} else {
    console.log('🌐 Functions: Using PRODUCTION');
}

export default functions;