import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Type, Eye, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { login, googleLogin, sendOtp, verifyOtp } = useAuth();
  
  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(() => {
    const providerState = window.history.state || {};
    return providerState.role || 'provider';
  });

  // Sync Root Font Size
  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'normal') {
      root.style.fontSize = '16px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '20px';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '24px';
    }
    return () => {
      root.style.fontSize = '16px';
    };
  }, [fontSize]);

  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (step === 'phone') {
        await sendOtp(phone);
        setStep('otp');
      } else {
        // Find state in history if passed from provider entry
        const providerState = window.history.state || {};
        
        await verifyOtp({ 
          phone, 
          otp,
          role: role,
          name: providerState.name || 'User',
          age: providerState.age,
          category: providerState.category
        });
        onNavigate('dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      if (!credentialResponse?.credential) {
        setError('Google Sign-In failed. Please try again.');
        return;
      }
      await googleLogin(credentialResponse.credential);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
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
              onClick={cycleFontSize}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-cream-dark hover:bg-cream-dark/30'}`}
              aria-label="Toggle Font Size"
            >
              <Type className="h-4 w-4" />
              <span>Aa</span>
            </button>

            <button 
              onClick={() => setHighContrast(!highContrast)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${highContrast ? 'border-white bg-white text-black' : 'border-cream-dark hover:bg-cream-dark/30'}`}
              aria-label="Toggle High Contrast"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Contrast</span>
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
            
            {/* Role Selection (Tappable Cards) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Select Role / भूमिका चुनें</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    role === 'provider'
                      ? (highContrast ? 'border-yellow-400 bg-white/10' : 'border-terracotta bg-orange-50/50 text-terracotta')
                      : (highContrast ? 'border-white bg-black text-white' : 'border-cream-dark hover:bg-cream-dark/20')
                  }`}
                >
                  <span className="font-bold text-sm">Earn / कमाएं</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center ${
                    role === 'customer'
                      ? (highContrast ? 'border-yellow-400 bg-white/10' : 'border-forest bg-teal-50/50 text-forest')
                      : (highContrast ? 'border-white bg-black text-white' : 'border-cream-dark hover:bg-cream-dark/20')
                  }`}
                >
                  <span className="font-bold text-sm">Hire / काम दें</span>
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-bold">{t('auth.phone')}</label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="e.g. 9876543210"
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              />
            </div>

            {/* Password / OTP */}
            {step === 'phone' ? (
              <button
                type="submit"
                disabled={loading || !phone}
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
              >
                {loading ? '...' : t('auth.login_btn', 'Get OTP')}
              </button>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="otp" className="text-sm font-bold">OTP</label>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    placeholder="Enter OTP"
                    className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !otp}
                  className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                >
                  {loading ? '...' : 'Verify OTP & Login'}
                </button>
              </>
            )}


          </form>

          <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 h-px ${highContrast ? 'bg-white' : 'bg-cream-dark'}`} />
            <span className={`text-sm font-bold ${textSecondaryTheme}`}>OR</span>
            <div className={`flex-1 h-px ${highContrast ? 'bg-white' : 'bg-cream-dark'}`} />
          </div>

          <div className={`flex justify-center ${loading ? 'pointer-events-none opacity-50' : ''}`}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Sign-In failed. Please try again.')}
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
