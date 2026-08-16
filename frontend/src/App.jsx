import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import UserDashboard from './pages/UserDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing');

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (view === 'login' || view === 'signup') {
          setView('onboarding');
        }
      } else {
        if (view === 'dashboard' || view === 'onboarding') {
          setView('login');
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
      return <LandingPage onNavigate={setView} />;
    case 'signup':
      return <Signup onNavigate={setView} />;
    case 'onboarding':
      return <OnboardingFlow onNavigate={setView} />;
    case 'dashboard':
      return user ? <UserDashboard onNavigate={setView} /> : <Login onNavigate={setView} />;
    case 'login':
    default:
      return <Login onNavigate={setView} />;
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
