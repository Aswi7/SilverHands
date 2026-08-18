import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import OnboardingFlow from './pages/OnboardingFlow';
import UserDashboard from './pages/UserDashboard';
import EmployerDashboard from './pages/EmployerDashboard';
import { useTranslation } from 'react-i18next';

const VALID_VIEWS = new Set(['landing', 'login', 'signup', 'onboarding', 'dashboard']);
const VALID_SIGNUP_ROLES = new Set(['provider', 'customer']);

const parseNavigationHash = () => {
  const rawHash = window.location.hash.replace(/^#\/?/, '');
  const [rawView, query = ''] = rawHash.split('?');
  const requestedRole = new URLSearchParams(query).get('role');
  return {
    view: VALID_VIEWS.has(rawView) ? rawView : 'landing',
    signupRole: VALID_SIGNUP_ROLES.has(requestedRole) ? requestedRole : 'provider'
  };
};

const isProviderProfileComplete = (user) => (
  user?.role === 'provider'
  && Boolean(user.bio?.trim())
  && Array.isArray(user.skills)
  && user.skills.length > 0
);

function AppContent() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [view, setView] = useState('landing');
  const [signupRole, setSignupRole] = useState('provider');

  const navigate = (requestedView, requestedRole = 'provider', replace = false) => {
    const nextView = VALID_VIEWS.has(requestedView) ? requestedView : 'landing';
    const nextRole = VALID_SIGNUP_ROLES.has(requestedRole) ? requestedRole : 'provider';
    const targetHash = nextView === 'signup' ? `#/signup?role=${nextRole}` : `#/${nextView}`;

    setView(nextView);
    setSignupRole(nextRole);
    if (window.location.hash !== targetHash) {
      const state = { view: nextView, signupRole: nextRole };
      if (replace) window.history.replaceState(state, '', targetHash);
      else window.history.pushState(state, '', targetHash);
    }
  };

  useEffect(() => {
    const syncFromLocation = (event) => {
      const state = event?.state;
      if (state && VALID_VIEWS.has(state.view)) {
        setView(state.view);
        setSignupRole(VALID_SIGNUP_ROLES.has(state.signupRole) ? state.signupRole : 'provider');
        return;
      }
      const parsed = parseNavigationHash();
      setView(parsed.view);
      setSignupRole(parsed.signupRole);
    };

    const parsed = parseNavigationHash();
    setView(parsed.view);
    setSignupRole(parsed.signupRole);
    const normalizedHash = parsed.view === 'signup' ? `#/signup?role=${parsed.signupRole}` : `#/${parsed.view}`;
    window.history.replaceState(parsed, '', normalizedHash);
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (view === 'dashboard' || view === 'onboarding') navigate('login', 'provider', true);
      return;
    }

    const destination = user.role === 'customer'
      ? 'dashboard'
      : (isProviderProfileComplete(user) ? 'dashboard' : 'onboarding');
    if (['login', 'signup', 'onboarding', 'dashboard'].includes(view) && view !== destination) {
      navigate(destination, user.role, true);
    }
  }, [loading, user, view]);

  if (loading) return <div className="dashboard-loading"><p>{t('common.loading_session')}</p></div>;

  const handleNavigate = (nextView, role = 'provider') => navigate(nextView, role);
  const views = {
    landing: <LandingPage onNavigate={handleNavigate} />,
    login: <Login onNavigate={handleNavigate} />,
    signup: <Signup onNavigate={handleNavigate} initialRole={signupRole} />,
    onboarding: <OnboardingFlow onNavigate={handleNavigate} />,
    dashboard: user?.role === 'customer'
      ? <EmployerDashboard onNavigate={handleNavigate} />
      : <UserDashboard onNavigate={handleNavigate} />
  };

  return views[view] || views.landing;
}

function App() {
  return <AccessibilityProvider><AuthProvider><AppContent /></AuthProvider></AccessibilityProvider>;
}

export default App;
