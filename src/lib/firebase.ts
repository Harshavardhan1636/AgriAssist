// Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration - in a real app, these would come from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Function to validate Firebase config
function validateFirebaseConfig(config: any): boolean {
  return Object.values(config).every(value => value !== undefined && value !== null && value !== '');
}

// Check if we're in a development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize Firebase services
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (validateFirebaseConfig(firebaseConfig) || isDevelopment) {
  try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Firebase Authentication
    auth = getAuth(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // In development, we can provide mock implementations
    if (isDevelopment) {
      console.warn('Using mock Firebase services in development');
    }
  }
} else {
  console.warn('Firebase config is invalid. Skipping Firebase initialization.');
}

// Export for backward compatibility
export { app, db, auth };
export default app;