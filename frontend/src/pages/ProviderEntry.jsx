import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, Eye, Globe } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAccessibility } from '../context/AccessibilityContext';

const SENIOR_CITIZEN_AGE_THRESHOLD = 60;

const ProviderEntry = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { highContrast, fontSize } = useAccessibility();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isHouseholdManager, setIsHouseholdManager] = useState(null);
  const [error, setError] = useState('');

  const handleAgeSubmit = (e) => {
    e.preventDefault();
    const parsedAge = parseInt(age, 10);
    if (!age || isNaN(parsedAge) || parsedAge < 18) {
      setError(t('providerEntry.error_valid_age', 'Please enter a valid age (18 or older)'));
      return;
    }
    setError('');
    setStep(2);
  };

  const handleHouseholdQuestion = (answer) => {
    setIsHouseholdManager(answer);
    const parsedAge = parseInt(age, 10);
    
    let category = '';
    
    if (parsedAge >= SENIOR_CITIZEN_AGE_THRESHOLD) {
      if (answer) category = 'both';
      else category = 'senior_citizen';
    } else {
      if (answer) category = 'homemaker';
      else category = 'none';
    }

    if (category === 'none') {
      setStep(4); // Rejection view
    } else {
      setStep(3); // Go to Name entry step
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('providerEntry.error_name_required', 'Please enter your full name'));
      return;
    }
    setError('');

    const parsedAge = parseInt(age, 10);
    let category = '';
    if (parsedAge >= SENIOR_CITIZEN_AGE_THRESHOLD) {
      if (isHouseholdManager) category = 'both';
      else category = 'senior_citizen';
    } else {
      if (isHouseholdManager) category = 'homemaker';
      else category = 'none';
    }

    // Go to signup view for provider
    onNavigate('signup', 'provider');
  };

  const handleGoEmployer = () => {
    onNavigate('signup', 'customer');
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

          {/* Languages and Contrast toggles */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* FORM CONTAINER */}
      <main className="mx-auto max-w-lg px-4 mt-12 md:px-8">
        <div className={`p-8 rounded-3xl ${cardTheme}`}>
          
          {step === 1 && (
            <form onSubmit={handleAgeSubmit} className="flex flex-col gap-5 text-left">
              <h2 className="font-serif text-3xl font-bold text-center mb-6">
                {t('auth.signup_title', 'Create an Account')}
              </h2>
              
              {error && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{error}</div>}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">{t('providerEntry.age', 'How old are you?')}</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="18"
                  placeholder="Age"
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                />
              </div>

              <button
                type="submit"
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} mt-4`}
              >
                {t('providerEntry.next', 'Next')}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 text-center">
              <h2 className="font-serif text-2xl font-bold leading-snug">
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

          {step === 3 && (
            <form onSubmit={handleNameSubmit} className="flex flex-col gap-5 text-left">
              <h2 className="font-serif text-2xl font-bold text-center mb-4">
                {t('providerEntry.name_heading', 'Almost there!')}
              </h2>
              
              {error && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{error}</div>}

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold">{t('providerEntry.name', 'What is your full name?')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Asha Devi"
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                />
              </div>

              <button
                type="submit"
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} mt-4`}
              >
                {t('providerEntry.next', 'Next')}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 text-center">
              <p className="text-lg text-red-600 font-medium leading-relaxed">
                {t('providerEntry.reject_msg', 'This platform is designed for specific providers. Please consider applying as an Employer instead.')}
              </p>
              <button
                onClick={handleGoEmployer}
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme}`}
              >
                {t('providerEntry.go_employer', 'Go to Employer Signup')}
              </button>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default ProviderEntry;
