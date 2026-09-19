import logoUrl from "../assets/logo.png";
import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
          
          try {
            const userRef = doc(db, 'users', userCredential.user.uid);
            await updateDoc(userRef, { name: name.trim() });
          } catch (e) {
            // Document might not exist yet if onAuthStateChanged hasn't triggered
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, {
              uid: userCredential.user.uid,
              name: name.trim(),
              email: email,
              followers: 0,
              following: 0,
              likesGiven: 0,
              likesReceived: 0,
            });
          }
        }
      }
    } catch (err: any) {
      let errorMsg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMsg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        try {
          await updateDoc(userRef, {});
        } catch (e) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || 'Google User',
            email: user.email || '',
            followers: 0,
            following: 0,
            likesGiven: 0,
            likesReceived: 0,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSent(false);
    
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#1e1b4b] p-8 text-white text-center flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2)_0,transparent_70%)]"></div>
          
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
            {/* Outer AI RGB Glow */}
            <div className="absolute inset-[-30%] rounded-full bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] blur-xl opacity-40 animate-[spin_3s_linear_infinite]"></div>
            
            {/* Spinning RGB Border Container */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg">
              <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite]"></div>
            </div>
            
            {/* Inner White Box */}
            <div className="absolute inset-[2px] bg-white rounded-2xl z-10 flex items-center justify-center"></div>
            
            <img src={logoUrl} alt="App Logo" className="relative z-20 w-16 h-16 object-contain" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight relative z-10">AD Runner</h1>
          <p className="text-indigo-200 mt-2 relative z-10">Boost your links and connect</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {resetSent && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">
              If an account exists with this email, a reset link has been sent. Please check your spam folder as well.
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          {isForgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
              <div className="relative mt-6 group overflow-hidden rounded-xl p-[2px]">
                <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative w-full bg-[#1e1b4b] hover:bg-indigo-950 text-white font-medium py-3 rounded-[10px] transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetSent(false);
                    setError('');
                  }}
                  className="text-sm text-indigo-900 font-medium hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => { setIsForgotPassword(true); setError(''); setResetSent(false); }}
                        className="text-xs text-indigo-600 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-900 focus:border-transparent outline-none transition-all pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="relative mt-6 group overflow-hidden rounded-xl p-[2px]">
                  <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,#4285F4,#8B5CF6,#EC4899,#F59E0B,#4285F4)] animate-[spin_3s_linear_infinite] opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full bg-[#1e1b4b] hover:bg-indigo-950 text-white font-medium py-3 rounded-[10px] transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : isLogin ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        <span>Sign In</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Sign Up</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase">Or continue with</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-2 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-colors flex items-center justify-center space-x-3 shadow-sm disabled:opacity-70"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-sm text-indigo-900 font-medium hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
