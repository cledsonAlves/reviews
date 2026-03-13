import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, limit, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
// Note: Using the specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Auth Helpers (Unused, using local state in App.tsx)
// export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
// export const logout = () => signOut(auth);

// Connection Test (Optional, can be called manually)
export async function testConnection() {
  try {
    const { getDocFromServer, doc } = await import('firebase/firestore');
    await getDocFromServer(doc(db, '_connection_test', 'init'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Firebase connection error: The client is offline. Check your configuration.");
    }
  }
}
// Removed immediate call to avoid auth/internal-error during initialization
// testConnection();

export { onAuthStateChanged };
export type { User };
