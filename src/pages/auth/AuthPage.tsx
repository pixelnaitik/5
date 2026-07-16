import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Microscope, Loader2, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../../components/BackButton';

export default function AuthPage() {
  const { user: currentUser, loginAsLocalDemo } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        return;
      }
    } catch (popupError: any) {
      console.error("Healthcare OS: Google Sign-In failed", popupError);
      const errorCode = popupError?.code;
      const errorMessage = popupError?.message || "";

      if (errorCode === 'auth/unauthorized-domain') {
        setError(
          `Google Sign-In is blocked because "${window.location.hostname}" is not authorized in your Firebase console. Please go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add "${window.location.hostname}" to enable real Google login.`
        );
      } else if (errorCode === 'auth/popup-blocked') {
        console.log("Popup blocked. Attempting Google Redirect Sign-in...");
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          setError(`Google Sign-In popup was blocked and redirect failed: ${redirectError.message}`);
        }
      } else if (errorCode === 'auth/operation-not-allowed') {
        setError(
          "Google Sign-In provider is disabled in your Firebase console. Please go to Firebase Console -> Authentication -> Sign-in method and enable Google."
        );
      } else {
        setError(errorMessage || "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-container-low p-6 font-sans relative overflow-hidden">
      {/* Dynamic graphic background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden select-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-container/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary-container/10 blur-3xl rounded-full" />
      </div>

      <BackButton />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-[2.5rem] border border-outline-variant/30 shadow-2xl overflow-hidden relative z-10"
      >
        <div className="p-8 md:p-10 flex flex-col">
          
          {/* Logo container with custom pulsing aura */}
          <div className="relative mb-6 self-center">
            <div className="absolute inset-0 bg-primary-container/20 blur-xl rounded-full scale-125 animate-pulse" />
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg relative z-10 border border-white/15">
              <Microscope className="w-8 h-8" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2 font-sans">
              Healthcare OS
            </h2>
            <p className="text-on-surface-variant font-medium text-sm leading-relaxed px-2">
              Clinical Digital Pathology Laboratory Portal
            </p>
          </div>

          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-900 text-xs rounded-xl font-semibold border border-red-200/50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-In Button */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-200/80 shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  <span>Continue with Google</span>
                </>
              )}
            </motion.button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200/50"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase font-bold">Or</span>
              <div className="flex-grow border-t border-gray-200/50"></div>
            </div>

            {/* Demo Sign-In Button */}
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={() => {
                setError(null);
                setLoading(true);
                setTimeout(() => {
                  loginAsLocalDemo();
                  setLoading(false);
                }, 500);
              }}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-primary text-white font-bold rounded-2xl border border-transparent shadow-md hover:bg-primary/95 transition-all text-sm cursor-pointer"
            >
              <span>Login as Demo Admin</span>
            </motion.button>
          </div>

        </div>

        {/* Small aesthetic footer banner */}
        <div className="bg-surface py-4 px-8 border-t border-outline-variant/30 text-center">
          <p className="text-[11px] font-mono text-on-surface-variant font-medium">
            HEALTHCARE.OS // CLINICAL SYSTEM v2.1
          </p>
        </div>
      </motion.div>
    </div>
  );
}
