import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Type, Eye, MapPin, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Signup = ({ onNavigate, initialRole = 'provider' }) => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  
  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);
  const [prefLang, setPrefLang] = useState('en');
  const [cityName, setCityName] = useState('Delhi');
  
  const CITY_COORDINATES = {
    'delhi': [77.2090, 28.6139],
    'new delhi': [77.2090, 28.6139],
    'connaught place': [77.2197, 28.6304],
    'mumbai': [72.8777, 19.0760],
    'bengaluru': [77.5946, 12.9716],
    'bangalore': [77.5946, 12.9716],
    'chennai': [80.2707, 13.0827],
    'kolkata': [88.3639, 22.5726],
    'noida': [77.3910, 28.5355],
    'gurgaon': [77.0266, 28.4595]
  };
  
  const [geoState, setGeoState] = useState(''); // 'detecting', 'success', 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    const cityKey = cityName.trim().toLowerCase();
    const coords = CITY_COORDINATES[cityKey] || [77.2090, 28.6139]; // Default to Delhi coordinates

    setLoading(true);
    try {
      await signup({
        name,
        phone,
        email: email.trim() || undefined,
        password,
        role,
        preferredLanguage: prefLang,
        location: {
          longitude: coords[0],
          latitude: coords[1]
        }
      });
      if (role === 'customer') {
        onNavigate('dashboard');
      } else {
        onNavigate('onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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

  const outlineBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black h-[48px]'
    : 'border border-cream-dark hover:bg-cream-dark/30 text-charcoal h-[48px] rounded-2xl transition-all';

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

      {/* SIGNUP FORM CONTAINER */}
      <main className="mx-auto max-w-lg px-4 mt-8 md:px-8">
        <div className={`p-8 rounded-3xl ${cardTheme}`}>
          <h2 className="font-serif text-3xl font-bold text-center mb-6">{t('auth.signup_title')}</h2>
          
          {error && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
            
            {/* Full Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-bold">{t('auth.name')}</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Asha Devi"
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              />
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

            {/* Email (Optional) */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold">
                Email <span className={`font-normal ${textSecondaryTheme}`}>(Optional)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
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

            {/* Role Selection (Tappable Cards) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">{t('auth.role')}</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRole('provider')}
                  className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${
                    role === 'provider'
                      ? (highContrast ? 'bg-white text-black border-white' : 'bg-orange-50 border-terracotta text-terracotta')
                      : (highContrast ? 'border-white text-white bg-black' : 'border-cream-dark text-charcoal hover:bg-cream-dark/20')
                  }`}
                >
                  <span className="text-base">👩‍🌾</span>
                  {t('roles.provider').split(' ')[0]}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${
                    role === 'customer'
                      ? (highContrast ? 'bg-white text-black border-white' : 'bg-teal-50 border-forest text-forest')
                      : (highContrast ? 'border-white text-white bg-black' : 'border-cream-dark text-charcoal hover:bg-cream-dark/20')
                  }`}
                >
                  <span className="text-base">🤝</span>
                  {t('roles.customer').split(' ')[0]}
                </button>
              </div>
            </div>

            {/* Preferred Language */}
            <div className="flex flex-col gap-2">
              <label htmlFor="prefLang" className="text-sm font-bold">{t('auth.preferred_language')}</label>
              <select
                id="prefLang"
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>

            {/* City Location Section */}
            <div className="flex flex-col gap-2 border-t pt-4 border-cream-dark/30">
              <label htmlFor="cityName" className="text-sm font-bold">
                {t('auth.city_location', 'City / Location')}
              </label>
              <input
                type="text"
                id="cityName"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                required
                placeholder="e.g. Delhi, Mumbai, Noida"
                className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
              />
              <p className="text-[10px] text-gray-500">
                Enter your city name. We will use this to show jobs and opportunities nearby.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
            >
              {loading ? '...' : t('auth.signup_btn')}
            </button>
          </form>

          {/* Toggle auth view */}
          <p 
            onClick={() => onNavigate('login')}
            className="text-center mt-6 text-sm font-bold text-terracotta hover:underline cursor-pointer"
          >
            {t('auth.have_account')}
          </p>
        </div>
      </main>

    </div>
  );
};

export default Signup;
