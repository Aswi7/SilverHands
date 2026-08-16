import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('login');

  useEffect(() => {
    if (!loading) {
      if (user) {
        setView('dashboard');
      } else {
        if (view === 'dashboard') {
          setView('login');
        }
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <p>Loading SilverHands session...</p>
      </div>
    );
  }

  switch (view) {
    case 'signup':
      return <Signup onNavigate={setView} />;
    case 'dashboard':
      return user ? <Dashboard onNavigate={setView} /> : <Login onNavigate={setView} />;
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
