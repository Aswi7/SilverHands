import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Type, Eye, MapPin, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Signup = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  
  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('provider');
  const [prefLang, setPrefLang] = useState('en');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoState('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(position.coords.longitude.toFixed(6));
        setLatitude(position.coords.latitude.toFixed(6));
        setGeoState('success');
      },
      (err) => {
        console.error(err);
        setGeoState('error');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!longitude || !latitude) {
      setError('Location coordinates are required.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name,
        phone,
        password,
        role,
        preferredLanguage: prefLang,
        location: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        }
      });
      onNavigate('onboarding');
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

            {/* Geolocation Section */}
            <div className="flex flex-col gap-3 border-t pt-4 border-cream-dark/30">
              <label className="text-sm font-bold">Location Coordinates</label>
              
              <button
                type="button"
                onClick={handleGetLocation}
                className={`w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl ${outlineBtnTheme}`}
              >
                <MapPin className="h-5 w-5 text-terracotta" />
                {t('auth.detect_location')}
              </button>
              
              {geoState === 'detecting' && (
                <p className="text-xs text-center text-forest animate-pulse">Detecting Coordinates...</p>
              )}
              {geoState === 'success' && (
                <p className="text-xs text-center text-green-600 font-semibold">{t('auth.location_detected')}</p>
              )}
              {geoState === 'error' && (
                <p className="text-xs text-center text-red-500 font-semibold">{t('auth.location_failed')}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="latitude" className="text-xs text-gray-500">{t('auth.latitude')}</label>
                  <input
                    type="number"
                    step="any"
                    id="latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                    className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="longitude" className="text-xs text-gray-500">{t('auth.longitude')}</label>
                  <input
                    type="number"
                    step="any"
                    id="longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                    className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                  />
                </div>
              </div>
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
