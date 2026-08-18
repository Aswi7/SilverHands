import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import UserDashboard from './pages/UserDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import ProviderEntry from './pages/ProviderEntry';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing');
  const [signupRole, setSignupRole] = useState('provider');
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    const handleError = (event) => {
      setGlobalError({
        message: event.message,
        stack: event.error?.stack || 'No stack trace available'
      });
    };
    
    const handleRejection = (event) => {
      setGlobalError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack || 'No stack trace available'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Unified navigation helper supporting push and replace history entries
  const navigate = (newView, role = 'provider', replace = false) => {
    setView(newView);
    if (newView === 'signup') {
      setSignupRole(role);
    }
    const targetHash = `#/${newView}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState({ view: newView, signupRole: role }, '', targetHash);
      } else {
        window.history.pushState({ view: newView, signupRole: role }, '', targetHash);
      }
    }
  };

  const handleNavigate = (newView, role = 'provider') => {
    navigate(newView, role, false); // User click pushes to history
  };

  // 1. Listen for browser Back/Forward (popstate) actions
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        let targetView = event.state.view;
        setView(targetView);
        if (event.state.signupRole) {
          setSignupRole(event.state.signupRole);
        }
      } else {
        const hash = window.location.hash;
        if (hash.startsWith('#/')) {
          let parsedView = hash.slice(2);
          setView(parsedView);
        } else {
          setView('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Parse hash on initial load
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      let parsedView = hash.slice(2);
      setView(parsedView);
      window.history.replaceState({ view: parsedView, signupRole }, '', hash);
    } else {
      window.history.replaceState({ view: 'landing', signupRole }, '', '#/landing');
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle redirects in useEffect (always use replace = true to prevent history loops)
  useEffect(() => {
    if (!loading) {
      if (user) {
        const userRole = (user.role === 'customer' || user.role === 'employer') ? 'customer' : 'provider';
        if (userRole === 'provider') {
          if (!user.isOnboarded) {
            // Force onboarding if trying to access dashboard, login, or signup, but allow landing page
            if (view === 'dashboard' || view === 'login' || view === 'signup' || view === 'provider-entry') {
              navigate('onboarding', 'provider', true);
            }
          } else {
            // Already onboarded, don't allow returning to login, signup, or onboarding
            if (view === 'login' || view === 'signup' || view === 'onboarding' || view === 'provider-entry') {
              navigate('dashboard', 'provider', true);
            }
          }
        } else {
          // Customer
          if (view === 'login' || view === 'signup' || view === 'onboarding' || view === 'provider-entry') {
            navigate('dashboard', 'customer', true);
          }
        }
      } else {
        if (view === 'dashboard' || view === 'onboarding') {
          navigate('login', 'provider', true);
        }
      }
    }
  }, [user, loading, view]);

  if (globalError) {
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: '#fff5f5', border: '2px solid red', borderRadius: '8px', margin: '20px', textAlign: 'left', fontFamily: 'monospace' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>⚠️ Global React Runtime Error</h3>
        <p><strong>Message:</strong> {globalError.message}</p>
        <pre style={{ backgroundColor: '#eee', padding: '10px', overflowX: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{globalError.stack}</pre>
        <button onClick={() => { setGlobalError(null); sessionStorage.clear(); window.location.hash = '#/landing'; window.location.reload(); }} style={{ padding: '8px 16px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#e53e3e', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Clear Session & Reload</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading SilverHands session...</p>
      </div>
    );
  }

  switch (view) {
    case 'landing':
      return <LandingPage onNavigate={handleNavigate} />;
    case 'signup':
      return <Signup onNavigate={handleNavigate} initialRole={signupRole} />;
    case 'onboarding':
      return <OnboardingFlow onNavigate={handleNavigate} />;
    case 'dashboard':
      return user ? (
        (user.role === 'customer' || user.role === 'employer')
          ? <EmployerDashboard onNavigate={handleNavigate} /> 
          : <UserDashboard onNavigate={handleNavigate} />
      ) : <Login onNavigate={handleNavigate} />;
    case 'provider-entry':
      return <ProviderEntry onNavigate={handleNavigate} />;
    case 'login':
    default:
      return <Login onNavigate={handleNavigate} />;
  }
}

function App() {
  return (
    <AccessibilityProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </AccessibilityProvider>
  );
}

export default App;
