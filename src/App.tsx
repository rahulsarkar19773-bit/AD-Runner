import logoUrl from "./assets/logo.png";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import AuthScreen from './components/AuthScreen';
import MainLayout from './components/MainLayout';
import { UserProfile } from './types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Keep splash screen visible for at least 2.5 seconds

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
      
      if (firebaseUser) {
        // Fetch or create user profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              followers: 0,
              following: 0,
              likesGiven: 0,
              likesReceived: 0,
            };
            await setDoc(userRef, newUser);
          }
          
          // Setup realtime listener
          unsubscribeSnapshot = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUser(doc.data() as UserProfile);
            }
          });
          
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to a basic user object so the app doesn't hang
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            followers: 0,
            following: 0,
            likesGiven: 0,
            likesReceived: 0,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  if (loading || showSplash) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0,transparent_60%)]"></div>
        <div className="relative z-10 flex flex-col items-center animate-[fade-in_0.8s_ease-out_forwards]">
          <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            {/* Outer AI RGB Glow */}
            <div className="absolute inset-[-40%] rounded-full bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] blur-3xl opacity-50 animate-[spin_3s_linear_infinite]"></div>
            
            {/* Logo */}
            <img 
              src={logoUrl} 
              alt="AD Runner Logo" 
              className="relative z-20 w-full h-full object-contain rounded-2xl drop-shadow-md bg-white" 
            />
          </div>
          
          {/* Animated loading dots */}
          <div className="flex items-center space-x-3 mt-4">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-slate-800 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {user ? (
        <MainLayout user={user} setUser={setUser} />
      ) : (
        <AuthScreen />
      )}
    </div>
  );
}
