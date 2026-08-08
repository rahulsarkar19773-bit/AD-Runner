import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCM8NXl3TmA2Pwyo6WhiUMlkUuFr4LW-4c",
  authDomain: "ad-runner-8c226.firebaseapp.com",
  projectId: "ad-runner-8c226",
  storageBucket: "ad-runner-8c226.firebasestorage.app",
  messagingSenderId: "314326571827",
  appId: "1:314326571827:web:94cb1f89a5ebf63eb2bc46",
  measurementId: "G-9SY2C5NLXF"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
