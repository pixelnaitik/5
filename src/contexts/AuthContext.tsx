import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: any;
  role: 'admin' | 'staff' | 'guest' | 'unverified' | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  loginAsLocalDemo: () => void;
  loginWithAnyGmail: (email: string, displayName?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  isAdmin: false,
  logout: async () => {},
  loginAsLocalDemo: () => {},
  loginWithAnyGmail: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'admin' | 'staff' | 'guest' | 'unverified' | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const logout = async () => {
    try {
      localStorage.removeItem('healthcareos_local_user');
      setUser(null);
      setRole(null);
      await auth.signOut();
    } catch (e) {
      console.error("Logout error:", e);
      setUser(null);
      setRole(null);
    }
  };

  const loginAsLocalDemo = () => {
    const demoUser = {
      uid: 'sandbox-local-admin',
      email: 'sandbox.demo.healthcare@gmail.com',
      displayName: 'Demo Pathologist',
      role: 'admin',
    };
    try {
      localStorage.setItem('healthcareos_local_user', JSON.stringify(demoUser));
    } catch (e) {}
    setUser(demoUser);
    setRole('admin');
    setLoading(false);
  };

  const loginWithAnyGmail = (email: string, displayName?: string) => {
    const formattedEmail = email.trim();
    const name = displayName || formattedEmail.split('@')[0];
    const emailUser = {
      uid: 'sandbox-gmail-' + Math.random().toString(36).substr(2, 9),
      email: formattedEmail,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      role: 'admin',
    };
    try {
      localStorage.setItem('healthcareos_local_user', JSON.stringify(emailUser));
    } catch (e) {}
    setUser(emailUser);
    setRole('admin');
    setLoading(false);
  };

  useEffect(() => {
    // Guarantee the session is always persisted to localStorage — never dropped until logout
    setPersistence(auth, browserLocalPersistence)
      .catch((err) => console.error('Healthcare OS: Error setting auth persistence:', err));

    // Resolve redirect results elegantly if coming back from Google redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Healthcare OS: Real Google Redirect Authentication success for user:", result.user.email);
          localStorage.removeItem('healthcareos_local_user');
        }
      })
      .catch((error) => {
        console.warn("Healthcare OS: Redirect handling completed or inactive:", error);
      });

    let unsubscribeRole: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (unsubscribeRole) {
        unsubscribeRole();
        unsubscribeRole = null;
      }

      if (authUser) {
        // Clear simulated local storage representation if real Firebase session detected
        localStorage.removeItem('healthcareos_local_user');
        setUser(authUser);
        
        // Listen to user document for live role updates
        unsubscribeRole = onSnapshot(doc(db, 'users', authUser.uid), async (snapshot) => {
          const isGoogleProvider = authUser.providerData?.some(p => p.providerId === 'google.com');
          const isGmail = authUser.email?.toLowerCase().endsWith('@gmail.com');
          const isSandboxUser = authUser.email === 'sandbox.demo.healthcare@gmail.com';
          const isAnonymous = authUser.isAnonymous;

          if (!authUser.emailVerified && !isGoogleProvider && !isGmail && !isSandboxUser && !isAnonymous) {
            setRole('unverified');
            setLoading(false);
            return;
          }

          if (snapshot.exists()) {
            if (snapshot.metadata.hasPendingWrites) {
              return;
            }
            
            const data = snapshot.data();
            let currentRole = data.role || 'admin';
            setRole(currentRole as any);
            setLoading(false);
          } else {
            try {
              const initialRole = 'admin';
              await setDoc(doc(db, 'users', authUser.uid), {
                name: authUser.displayName || authUser.email?.split('@')[0] || 'Demo User',
                email: authUser.email || 'demo@healthcareos.com',
                role: initialRole,
                createdAt: new Date().toISOString(),
              });
              setRole(initialRole);
              setLoading(false);
            } catch (error: any) {
              console.error("AuthContext: Failed to create user doc", error);
              const errMsg = error.message || "";
              if (errMsg.toLowerCase().includes("permission") || error.code === "permission-denied" || error.code === "permission_denied") {
                setErrorMsg(
                  'Failed to create user doc: Missing or insufficient permissions. This means your Firestore Database security rules are currently denying write access. To fix this, please open the "firestore.rules" file in your project, copy its entire contents, and paste/publish them into your Firebase Console -> Firestore Database -> Rules tab.'
                );
              } else {
                setErrorMsg('Failed to create user doc: ' + errMsg);
              }
              setRole(null);
              setLoading(false);
            }
          }
        }, (error: any) => {
          console.error("AuthContext: Error fetching user role:", error);
          const errMsg = error.message || "";
          if (errMsg.toLowerCase().includes("permission") || error.code === "permission-denied" || error.code === "permission_denied") {
            setErrorMsg(
              'Error fetching user role: Missing or insufficient permissions. This means your Firestore Database security rules are currently denying read access. To fix this, please open the "firestore.rules" file in your project, copy its entire contents, and paste/publish them into your Firebase Console -> Firestore Database -> Rules tab.'
            );
          } else {
            setErrorMsg('Error fetching user role: ' + errMsg);
          }
          setRole(null);
          setLoading(false);
        });
      } else {
        // No authenticating Firebase user details. Handle local sandbox fallback
        const localUserStr = localStorage.getItem('healthcareos_local_user');
        if (localUserStr) {
          try {
            const localUser = JSON.parse(localUserStr);
            setUser(localUser);
            setRole(localUser.role || 'admin');
          } catch (e) {
            localStorage.removeItem('healthcareos_local_user');
            setUser(null);
            setRole(null);
          }
        } else {
          setUser(null);
          setRole(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) unsubscribeRole();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin: role === 'admin', logout, loginAsLocalDemo, loginWithAnyGmail }}>
      {errorMsg ? (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-red-50 text-red-900 text-center">
          <h2 className="text-lg font-bold mb-2">Authentication Error</h2>
          <p className="font-mono text-sm break-all">{errorMsg}</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
