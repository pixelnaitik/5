import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress — slim bar, no spinner (we have our own)
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });

// Expose NProgress globally so lazy-loaded Suspense wrappers can call it
(window as any).__NProgress = NProgress;

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Healthcare OS PWA: Service Worker registered scope:', reg.scope))
      .catch((err) => console.error('Healthcare OS PWA: Service Worker registration failed:', err));
  });
}

// Dismiss the HTML splash screen once React is ready to render
function removeSplash() {
  const splash = document.getElementById('app-splash');
  if (splash) {
    // Complete the progress bar then fade out
    const bar = document.getElementById('splash-bar');
    if (bar) bar.style.width = '100%';
    if ((window as any).__splashInterval) clearInterval((window as any).__splashInterval);
    setTimeout(() => {
      splash.style.transition = 'opacity 0.35s ease';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 370);
    }, 300);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App onReady={removeSplash} />
  </StrictMode>,
);
