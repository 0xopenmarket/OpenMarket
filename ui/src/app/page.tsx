'use client'
import { redirect } from 'next/navigation';

import { useState, useEffect } from 'react';

function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const android = /Android/.test(navigator.userAgent);
    setIsIOS(ios);
    setIsAndroid(android);
    console.log('Device type - iOS:', ios, 'Android:', android);

    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    console.log('Is standalone:', standalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('Before install prompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      console.log('App installed event fired');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For debugging, show the prompt after a short delay
    const timer = setTimeout(() => setShowInstallPrompt(true), 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else {
      console.log('No deferred prompt available');
    }
  };

  console.log('Render - showInstallPrompt:', showInstallPrompt, 'isIOS:', isIOS, 'isAndroid:', isAndroid, 'isStandalone:', isStandalone);

  if (isStandalone) {
    console.log('App is already installed, not showing prompt');
    return null;
  }

  const promptStyle = {
    position: 'fixed' as const,
    bottom: '20px',
    left: '20px',
    right: '20px',
    backgroundColor: '#f0f0f0',
    padding: '15px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
  };

  const buttonStyle = {
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '5px',
  };

  return (
    <>
      {showInstallPrompt && (
        <div style={promptStyle}>
          <h3>Install HashPredict App</h3>
          {isIOS && (
            <p>
              To install this app on your iOS device, tap the share button
              <span role="img" aria-label="share icon"> ⎋ </span>
              and then "Add to Home Screen"
              <span role="img" aria-label="plus icon"> ➕ </span>.
            </p>
          )}
          {isAndroid && (
            <>
              <p>Install our app for a better experience!</p>
              <button onClick={handleInstallClick} style={{...buttonStyle, backgroundColor: '#4CAF50'}}>
                Install
              </button>
            </>
          )}
          {!isIOS && !isAndroid && (
            <>
              <p>Install our app for a better experience!</p>
              <button onClick={handleInstallClick} style={{...buttonStyle, backgroundColor: '#4CAF50'}}>
                Install
              </button>
            </>
          )}
          <button onClick={() => setShowInstallPrompt(false)} style={{...buttonStyle, backgroundColor: '#f44336'}}>
            Not Now
          </button>
        </div>
      )}
    </>
  );
}


export default function Home() {
  // Consider removing this redirect for testing the InstallPrompt
  useEffect(() => {
    redirect('/hub/dashboard')
  }, [])

  return (
    <div>
      <InstallPrompt />
      {/* Your other components */}
    </div>
  )
}