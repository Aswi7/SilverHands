import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import UserDashboard from './pages/UserDashboard';
import EmployerDashboard from './pages/EmployerDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing');
  const [signupRole, setSignupRole] = useState('provider');

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
        setView(event.state.view);
        if (event.state.signupRole) {
          setSignupRole(event.state.signupRole);
        }
      } else {
        const hash = window.location.hash;
        if (hash.startsWith('#/')) {
          setView(hash.slice(2));
        } else {
          setView('landing');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Parse hash on initial load
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      const parsedView = hash.slice(2);
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
        if (view === 'login' || view === 'signup') {
          if (user.role === 'provider') {
            navigate('onboarding', 'provider', true);
          } else {
            navigate('dashboard', 'customer', true);
          }
        } else if (view === 'onboarding' && user.role === 'customer') {
          navigate('dashboard', 'customer', true);
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
      return <Signup onNavigate={handleNavigate} initialRole={signupRole} />;
    case 'onboarding':
      return <OnboardingFlow onNavigate={handleNavigate} />;
    case 'dashboard':
      return user ? (
        user.role === 'customer' 
          ? <EmployerDashboard onNavigate={handleNavigate} /> 
          : <UserDashboard onNavigate={handleNavigate} />
      ) : <Login onNavigate={handleNavigate} />;
    case 'login':
    default:
      return <Login onNavigate={handleNavigate} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
