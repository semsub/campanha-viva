import React, { useState, useEffect } from 'react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CampaignPage from './pages/CampaignPage';
import Editor from './pages/Editor';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        console.log('User logged in:', authUser.email, 'UID:', authUser.uid);
        setUser(authUser);
        // Check role in Firestore
        // First check if admin
        const adminRef = doc(db, 'admins', authUser.uid);
        const adminSnap = await getDoc(adminRef);
        
        if (adminSnap.exists()) {
          setUserRole('admin');
        } else if (authUser.email === 'semsub@gmail.com') {
          // Bootstrap first admin
          await setDoc(adminRef, {
            uid: authUser.uid,
            email: authUser.email,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
          setUserRole('admin');
        } else {
          // Check if candidate owner
          // Candidates are managed via the 'candidates' collection
          // We'll check if this user owns any candidate profile
          setUserRole('candidate');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Simple path-based routing
  const path = window.location.pathname;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Route handling
  if (path === '/') return <Home user={user} role={userRole} />;
  
  if (path === '/admin') {
    return userRole === 'admin' ? <AdminDashboard user={user} /> : <Home user={user} role={userRole} />;
  }

  if (path === '/dashboard') {
    return user ? <Dashboard user={user} role={userRole} /> : <Home user={user} role={userRole} />;
  }

  if (path.startsWith('/editor')) {
    return user ? <Editor user={user} /> : <Home user={user} role={userRole} />;
  }
  
  // Public campaign pages: /c/:slug
  if (path.startsWith('/c/')) {
    const slug = path.split('/')[2];
    return <CampaignPage slug={slug} />;
  }

  return <Home user={user} role={userRole} />;
}
