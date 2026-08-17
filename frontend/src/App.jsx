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

  // Unified navigation helper supporting push and replace history entries
  const navigate = (newView, role = 'provider', replace = false) => {
    let targetView = newView;
    if (newView === 'signup' && role === 'provider') {
      targetView = 'provider-entry';
    }
    setView(targetView);
    if (targetView === 'signup') {
      setSignupRole(role);
    }
    const targetHash = `#/${targetView}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState({ view: targetView, signupRole: role }, '', targetHash);
      } else {
        window.history.pushState({ view: targetView, signupRole: role }, '', targetHash);
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
        let role = event.state.signupRole || 'provider';
        if (targetView === 'signup' && role === 'provider') {
          targetView = 'provider-entry';
        }
        setView(targetView);
        if (event.state.signupRole) {
          setSignupRole(event.state.signupRole);
        }
      } else {
        const hash = window.location.hash;
        if (hash.startsWith('#/')) {
          let parsedView = hash.slice(2);
          if (parsedView === 'signup' && signupRole === 'provider') {
            parsedView = 'provider-entry';
          }
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
      if (parsedView === 'signup' && signupRole === 'provider') {
        parsedView = 'provider-entry';
      }
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
        if (user.role === 'provider') {
          if (!user.isOnboarded) {
            // Force onboarding if not onboarded yet
            if (view !== 'onboarding') {
              navigate('onboarding', 'provider', true);
            }
          } else {
            // Already onboarded, don't allow returning to login, signup, or onboarding
            if (view === 'login' || view === 'signup' || view === 'onboarding') {
              navigate('dashboard', 'provider', true);
            }
          }
        } else {
          // Employer/Customer
          if (view === 'login' || view === 'signup' || view === 'onboarding') {
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
      if (signupRole === 'provider') {
        return <ProviderEntry onNavigate={handleNavigate} />;
      }
      return <Signup onNavigate={handleNavigate} initialRole={signupRole} />;
    case 'onboarding':
      return <OnboardingFlow onNavigate={handleNavigate} />;
    case 'dashboard':
      return user ? (
        user.role === 'customer' 
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
