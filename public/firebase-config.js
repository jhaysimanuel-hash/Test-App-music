/**
 * WorshipFlow - Firebase Configuration & Authentication
 * Supports Google Sign-In and Realtime Database live sync for Android Hybrid & Web
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  onValue, 
  update 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Fill with your church's Firebase credentials from Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: "your-church-worship.firebaseapp.com",
  databaseURL: "https://your-church-worship-default-rtdb.firebaseio.com",
  projectId: "your-church-worship",
  storageBucket: "your-church-worship.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign-In with automatic role verification
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user already has an assigned role in database
    const userRoleSnapshot = await get(ref(database, `users/${user.uid}/role`));
    let role = 'viewer';
    
    if (userRoleSnapshot.exists()) {
      role = userRoleSnapshot.val();
    } else {
      // First time sign-in: register as viewer by default (or admin if first user)
      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        displayName: user.displayName,
        role: 'viewer',
        createdAt: Date.now()
      });
    }

    return { user, role };
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    throw error;
  }
}

// Sign-Out
export async function logOut() {
  return await signOut(auth);
}
