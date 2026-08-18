import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Type, Eye, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SENIOR_CITIZEN_AGE_THRESHOLD = 60;

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

const Signup = ({ onNavigate, initialRole = 'provider' }) => {
  const { t, i18n } = useTranslation();
  const { signup } = useAuth();
  
  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

  // Core Auth States
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prefLang, setPrefLang] = useState(i18n.language || 'en');
  const [cityName, setCityName] = useState('Delhi');

  // Provider Qualification States
  const [providerStep, setProviderStep] = useState(1); // 1: Age, 2: Household Question, 3: Account Fields, 4: Rejection
  const [age, setAge] = useState('');
  const [isHouseholdManager, setIsHouseholdManager] = useState(null);
  const [category, setCategory] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(initialRole);
    if (initialRole === 'provider') {
      setProviderStep(1);
    }
  }, [initialRole]);

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

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (newRole === 'provider') {
      setProviderStep(1);
    }
  };

  // Provider Step 1: Submit Age
  const handleAgeSubmit = (e) => {
    e.preventDefault();
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 18) {
      setError(t('providerEntry.error_valid_age', 'Please enter a valid age (18 or older)'));
      return;
    }
    setError('');
    setProviderStep(2);
  };

  // Provider Step 2: Answer Household Manager Question
  const handleHouseholdQuestion = (answer) => {
    setIsHouseholdManager(answer);
    const parsedAge = parseInt(age, 10);
    
    let cat = '';
    if (parsedAge >= SENIOR_CITIZEN_AGE_THRESHOLD) {
      cat = answer ? 'both' : 'senior_citizen';
    } else {
      cat = answer ? 'homemaker' : 'none';
    }

    setCategory(cat);
    if (cat === 'none') {
      setProviderStep(4); // Rejection / Redirect to Customer
    } else {
      setProviderStep(3); // Proceed to fill Account Fields
    }
  };

  // Submit Final Signup (Customer or Provider)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const cityKey = cityName.trim().toLowerCase();
    const coords = CITY_COORDINATES[cityKey] || [77.2090, 28.6139]; // Default to Delhi coordinates

    setLoading(true);
    try {
      const payload = {
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
      };

      if (role === 'provider') {
        payload.age = age;
        payload.category = category;
      }

      const registeredUser = await signup(payload);
      
      if (registeredUser.role === 'customer') {
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

  const secondaryBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black font-bold h-[48px]'
    : 'bg-cream-dark hover:bg-gray-300 text-charcoal font-bold h-[48px] rounded-2xl transition-all';

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
          <h2 className="font-serif text-3xl font-bold text-center mb-6">{t('auth.signup_title', 'Create an Account')}</h2>
          
          {error && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{error}</div>}

          {/* Role Selection (Tappable Cards) */}
          <div className="flex flex-col gap-2 mb-6">
            <label className="text-sm font-bold">{t('auth.role', 'I want to register as:')}</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleRoleChange('provider')}
                className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${
                  role === 'provider'
                    ? (highContrast ? 'bg-white text-black border-white' : 'bg-orange-50 border-terracotta text-terracotta')
                    : (highContrast ? 'border-white text-white bg-black' : 'border-cream-dark text-charcoal hover:bg-cream-dark/20')
                }`}
              >
                <span className="text-base">👩‍🌾</span>
                {t('roles.provider', 'Earn / Provide Help').split(' ')[0]}
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${
                  role === 'customer'
                    ? (highContrast ? 'bg-white text-black border-white' : 'bg-teal-50 border-forest text-forest')
                    : (highContrast ? 'border-white text-white bg-black' : 'border-cream-dark text-charcoal hover:bg-cream-dark/20')
                }`}
              >
                <span className="text-base">🤝</span>
                {t('roles.customer', 'Hire / Request Help').split(' ')[0]}
              </button>
            </div>
          </div>

          {/* DYNAMIC ROLE FLOW */}
          {role === 'provider' ? (
            /* PROVIDER SIGNUP FLOW */
            <div>
              {providerStep === 1 && (
                <form onSubmit={handleAgeSubmit} className="flex flex-col gap-5 text-left">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold">{t('providerEntry.age', 'How old are you?')}</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="18"
                      placeholder="Age (e.g. 62)"
                      className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} mt-2`}
                  >
                    {t('providerEntry.next', 'Next')}
                  </button>
                </form>
              )}

              {providerStep === 2 && (
                <div className="flex flex-col gap-6 text-center">
                  <h2 className="font-serif text-xl font-bold leading-snug">
                    {t('providerEntry.household_question', 'Do you manage your household — cooking, childcare, or similar?')}
                  </h2>
                  
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleHouseholdQuestion(true)}
                      className={`flex-1 font-bold ${primaryBtnTheme}`}
                    >
                      {t('providerEntry.yes', 'Yes')}
                    </button>
                    <button
                      onClick={() => handleHouseholdQuestion(false)}
                      className={`flex-1 font-bold ${secondaryBtnTheme}`}
                    >
                      {t('providerEntry.no', 'No')}
                    </button>
                  </div>
                </div>
              )}

              {providerStep === 3 && (
                /* QUALIFIED PROVIDER ACCOUNT FIELDS */
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
                  {/* Full Name */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-bold">{t('auth.name', 'Full Name')}</label>
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
                    <label htmlFor="phone" className="text-sm font-bold">{t('auth.phone', 'Phone Number')}</label>
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
                    <label htmlFor="password" className="text-sm font-bold">{t('auth.password', 'Password')}</label>
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

                  {/* Preferred Language */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="prefLang" className="text-sm font-bold">{t('auth.preferred_language', 'Preferred Language')}</label>
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

                  {/* City Location */}
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
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
                  >
                    {loading ? '...' : t('auth.signup_btn', 'Create Provider Account')}
                  </button>
                </form>
              )}

              {providerStep === 4 && (
                /* REJECTION NOTICE */
                <div className="flex flex-col gap-6 text-center">
                  <p className="text-base text-red-600 font-medium leading-relaxed">
                    {t('providerEntry.reject_msg', 'SilverHands Provider community is designed for senior citizens and experienced homemakers. Please sign up as a Customer / Employer instead.')}
                  </p>
                  <button
                    onClick={() => handleRoleChange('customer')}
                    className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme}`}
                  >
                    {t('providerEntry.go_employer', 'Sign Up as Customer / Employer')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* CUSTOMER SIGNUP FLOW (NO AGE / PROVIDER QUESTIONS) */
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label htmlFor="name" className="text-sm font-bold">{t('auth.name', 'Full Name')}</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm font-bold">{t('auth.phone', 'Phone Number')}</label>
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
                <label htmlFor="password" className="text-sm font-bold">{t('auth.password', 'Password')}</label>
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

              {/* Preferred Language */}
              <div className="flex flex-col gap-2">
                <label htmlFor="prefLang" className="text-sm font-bold">{t('auth.preferred_language', 'Preferred Language')}</label>
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

              {/* City Location */}
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed mt-2`}
              >
                {loading ? '...' : t('auth.signup_btn', 'Create Customer Account')}
              </button>
            </form>
          )}

          {/* Toggle auth view */}
          <p 
            onClick={() => onNavigate('login')}
            className="text-center mt-6 text-sm font-bold text-terracotta hover:underline cursor-pointer"
          >
            {t('auth.have_account', 'Already have an account? Log In')}
          </p>
        </div>
      </main>

    </div>
  );
};

export default Signup;
