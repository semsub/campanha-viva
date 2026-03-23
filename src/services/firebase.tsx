import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" stroke="url(#logo-grad)" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="15" fill="url(#logo-grad)" />
      <path d="M30 50 H40 M60 50 H70 M50 30 V40 M50 60 V70" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);
