import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Prepare persistent sessions before opening the sign-in popup.
const persistenceReady = setPersistence(auth, browserLocalPersistence).catch(err => {
  console.warn("Firebase Auth persistence setup error:", err);
});

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    await persistenceReady;
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}
