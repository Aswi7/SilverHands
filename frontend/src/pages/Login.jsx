import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Type, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAccessibility } from '../context/AccessibilityContext';

const Login = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const { highContrast, setPanelOpen } = useAccessibility();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      if (!credentialResponse?.credential) {
        setError(t('auth.google_login_failed'));
        return;
      }
      await googleLogin(credentialResponse.credential);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.google_login_failed'));
    } finally {
      setLoading(false);
    }
  };

  // Accessibility styling configurations
  const bgTheme = highContrast ? 'bg-black text-white' : 'bg-cream text-charcoal';
  const cardTheme = highContrast ? 'border-2 border-white bg-black' : 'bg-white border border-cream-dark shadow-sm';
  const textSecondaryTheme = highContrast ? 'text-gray-300' : 'text-charcoal-light';
  
  const inputTheme = highContrast 
    ? 'bg-black border-2 border-white text-white focus:border-yellow-400' 
    : 'bg-cream-dark/20 border border-cream-dark text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta';

  const primaryBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black font-bold h-[48px]'
    : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-md hover:shadow-lg font-bold h-[48px] rounded-2xl transition-all';

  return (
    <div className={`min-h-screen pb-16 font-sans ${bgTheme} transition-colors duration-200`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 w-full border-b ${highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/90 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-extrabold ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
              S
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              SilverHands
            </span>
          </div>

          {/* Accessibility Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setPanelOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-cream-dark hover:bg-cream-dark/30'}`}
              aria-label={t('accessibility.options')}
            >
              <Type className="h-4 w-4" />
              <span>{t('accessibility.options')}</span>
            </button>

            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* LOGIN FORM CONTAINER */}
      <main className="mx-auto max-w-lg px-4 mt-12 md:px-8">
        <div className={`p-8 rounded-3xl ${cardTheme}`}>
          <h2 className="font-serif text-3xl font-bold text-center mb-6">{t('auth.login_title')}</h2>
          
          {error && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            
            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-bold">{t('auth.phone')}</label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder={t('auth.phone_placeholder')}
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-bold">{t('auth.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
            >
              {loading ? '...' : t('auth.login_btn')}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 h-px ${highContrast ? 'bg-white' : 'bg-cream-dark'}`} />
            <span className={`text-sm font-bold ${textSecondaryTheme}`}>{t('common.or')}</span>
            <div className={`flex-1 h-px ${highContrast ? 'bg-white' : 'bg-cream-dark'}`} />
          </div>

          <div className={`flex justify-center ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError(t('auth.google_login_failed'))}
              useOneTap={false}
              theme={highContrast ? 'filled_black' : 'outline'}
              text="continue_with"
              shape="pill"
              size="large"
            />
          </div>

          {/* Toggle auth view */}
          <p 
            onClick={() => onNavigate('signup')}
            className="text-center mt-6 text-sm font-bold text-terracotta hover:underline cursor-pointer"
          >
            {t('auth.no_account')}
          </p>
        </div>
      </main>

    </div>
  );
};

export default Login;
