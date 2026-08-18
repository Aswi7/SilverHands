import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Type, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Mic, 
  MicOff, 
  Plus, 
  X, 
  Pencil, 
  Sparkles, 
  Bot, 
  Sun,
  Sunset,
  Moon,
  Laptop,
  Globe
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

const OnboardingFlow = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { updateUserInState } = useAuth();
  const { highContrast, setPanelOpen, speechLocale } = useAccessibility();

  // Active Wizard Step (1: Basic Info, 2: Skills, 3: Availability, 4: Review)
  const [step, setStep] = useState(1);

  // --- Step 1: Basic Info States ---
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [prefLang, setPrefLang] = useState(i18n.language || 'en');

  useEffect(() => {
    if (prefLang && prefLang !== i18n.language) {
      i18n.changeLanguage(prefLang);
    }
  }, [prefLang, i18n]);

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationState, setLocationState] = useState(''); // 'detecting', 'success', 'error'

  // --- Step 2: Skills & AI States ---
  const [chatText, setChatText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [skills, setSkills] = useState([]);
  const [manualSkill, setManualSkill] = useState('');
  const [showPopIn, setShowPopIn] = useState(false);

  // --- Step 3: Availability States ---
  const [availableDays, setAvailableDays] = useState([]); // ['Mon', 'Tue', ...]
  const [timeSlots, setTimeSlots] = useState([]); // ['morning', 'afternoon', 'evening']
  const [deliveryMode, setDeliveryMode] = useState('both'); // 'online', 'offline', 'both'

  // --- Step 4: Review States ---
  const [aiBio, setAiBio] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // --- Handlers & Helpers ---

  // Step 1: Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationState('error');
      return;
    }
    setLocationState('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocationState('success');
      },
      (err) => {
        console.error(err);
        setLocationState('error');
      }
    );
  };

  // Step 2: Voice Simulation & AI Skill Extraction
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice dictation is not supported by your browser.");
      return;
    }

    if (isListening) return;

    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setChatText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (chatText && chatText.length > 20) {
        extractSkills(chatText);
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [chatText]);

  const extractSkills = async (text) => {
    if (!text || text.trim().length === 0) return;
    setShowPopIn(true);
    try {
      const { data } = await api.post('/ai/extract-skills', { bio: text, language: i18n.language });
      if (data && data.skills) {
        const extractedNames = data.skills.map(s => typeof s === 'object' ? s.skillName : s);
        setSkills((prev) => {
          const newSkills = [...prev];
          extractedNames.forEach(skill => {
            if (!newSkills.some(s => (typeof s === 'object' ? s.skillName : s) === skill)) {
              newSkills.push(skill);
            }
          });
          return newSkills;
        });
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
    } finally {
      setShowPopIn(false);
    }
  };

  const handleAddManualSkill = (e) => {
    e.preventDefault();
    if (manualSkill.trim() && !skills.includes(manualSkill.trim())) {
      setSkills([...skills, manualSkill.trim()]);
      setManualSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Step 3: Toggles
  const toggleDay = (day) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const toggleTimeSlot = (slot) => {
    if (timeSlots.includes(slot)) {
      setTimeSlots(timeSlots.filter(s => s !== slot));
    } else {
      setTimeSlots([...timeSlots, slot]);
    }
  };

  // Step 4: Confirm Creation
  useEffect(() => {
    if (step === 4 && !aiBio && !isGeneratingBio) {
      const generateBio = async () => {
        setIsGeneratingBio(true);
        try {
          const availabilityString = `${availableDays.join(', ')} during ${timeSlots.join(', ')}`;
          const { data } = await api.post('/ai/generate-bio', {
            name: name || 'User',
            age: age || '--',
            skills: skills,
            availability: availabilityString,
            language: i18n.language
          });
          if (data && data.generatedBio) {
            setAiBio(data.generatedBio);
          }
        } catch (error) {
          console.error('Bio generation failed:', error);
          setAiBio(`${name || 'User'}, aged ${age || '--'}, is a warm neighborhood member offering services nearby.`);
        } finally {
          setIsGeneratingBio(false);
        }
      };
      generateBio();
    }
  }, [step, aiBio, isGeneratingBio, availableDays, timeSlots, skills, age, name, i18n.language]);

  useEffect(() => {
    if (step !== 4) setAiBio('');
  }, [step]);

  const handleConfirmProfile = async () => {
    try {
      const formattedSkills = skills.map(skill => {
        if (typeof skill === 'object') return skill;
        return {
          category: 'other',
          skillName: skill,
          experienceLevel: 'Not specified',
          confidence: 1.0
        };
      });

      const { data: updatedProfile } = await api.put('/users/profile', {
        name: name.trim(),
        preferredLanguage: prefLang,
        skills: formattedSkills,
        bio: aiBio,
        availability: availableDays.length > 0 && timeSlots.length > 0
      });

      const { data: locationResult } = await api.put('/users/location', {
        latitude: Number(latitude),
        longitude: Number(longitude)
      });
      
      if (updateUserInState && updatedProfile) {
        updateUserInState({
          ...updatedProfile,
          location: locationResult.location || updatedProfile.location
        });
      }
      
      onNavigate('dashboard');
    } catch (err) {
      console.error('Failed to save profile details', err);
      onNavigate('dashboard');
    }
  };

  // Styles computed depending on accessibility settings
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

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

      {/* WIZARD CONTAINER */}
      <main className="mx-auto max-w-3xl px-4 mt-8 md:px-8">
        
        {/* RESPONSIVE PROGRESS INDICATOR */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            
            {/* Background line */}
            <div className={`absolute top-6 left-6 right-6 h-1 z-0 ${highContrast ? 'bg-white' : 'bg-cream-dark/50'}`} />
            
            {/* Step 1 */}
            <button 
              onClick={() => setStep(1)} 
              className="flex flex-col items-center gap-2 z-10 focus:outline-none"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                step === 1 
                  ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta') 
                  : (step > 1 
                      ? (highContrast ? 'bg-black text-white border-white' : 'bg-forest text-white border-forest') 
                      : (highContrast ? 'bg-black text-white border-white' : 'bg-white text-charcoal border-cream-dark'))
              }`}>
                {step > 1 ? <Check className="h-6 w-6" /> : "1"}
              </div>
              <span className={`text-[11px] sm:text-xs font-bold text-center max-w-[70px] sm:max-w-none ${step === 1 ? 'text-terracotta' : textSecondaryTheme}`}>
                {t('onboarding.step1_nav')}
              </span>
            </button>

            {/* Step 2 */}
            <button 
              onClick={() => name && age && phone && setStep(2)} 
              disabled={!name || !age || !phone}
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                step === 2 
                  ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta') 
                  : (step > 2 
                      ? (highContrast ? 'bg-black text-white border-white' : 'bg-forest text-white border-forest') 
                      : (highContrast ? 'bg-black text-white border-white' : 'bg-white text-charcoal border-cream-dark'))
              }`}>
                {step > 2 ? <Check className="h-6 w-6" /> : "2"}
              </div>
              <span className={`text-[11px] sm:text-xs font-bold text-center max-w-[70px] sm:max-w-none ${step === 2 ? 'text-terracotta' : textSecondaryTheme}`}>
                {t('onboarding.step2_nav')}
              </span>
            </button>

            {/* Step 3 */}
            <button 
              onClick={() => skills.length > 0 && setStep(3)} 
              disabled={skills.length === 0}
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                step === 3 
                  ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta') 
                  : (step > 3 
                      ? (highContrast ? 'bg-black text-white border-white' : 'bg-forest text-white border-forest') 
                      : (highContrast ? 'bg-black text-white border-white' : 'bg-white text-charcoal border-cream-dark'))
              }`}>
                {step > 3 ? <Check className="h-6 w-6" /> : "3"}
              </div>
              <span className={`text-[11px] sm:text-xs font-bold text-center max-w-[70px] sm:max-w-none ${step === 3 ? 'text-terracotta' : textSecondaryTheme}`}>
                {t('onboarding.step3_nav')}
              </span>
            </button>

            {/* Step 4 */}
            <button 
              onClick={() => availableDays.length > 0 && setStep(4)} 
              disabled={availableDays.length === 0}
              className="flex flex-col items-center gap-2 z-10 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all ${
                step === 4 
                  ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta') 
                  : (highContrast ? 'bg-black text-white border-white' : 'bg-white text-charcoal border-cream-dark')
              }`}>
                4
              </div>
              <span className={`text-[11px] sm:text-xs font-bold text-center max-w-[70px] sm:max-w-none ${step === 4 ? 'text-terracotta' : textSecondaryTheme}`}>
                {t('onboarding.step4_nav')}
              </span>
            </button>

          </div>
        </div>

        {/* STEP CONTENT SWITCHER */}
        <div className={`p-8 rounded-3xl ${cardTheme}`}>

          {/* ================= STEP 1: BASIC INFO ================= */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              
              <div className="text-left border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('onboarding.tell_about_yourself')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('onboarding.step1_desc')}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 text-left">
                
                {/* Full Name */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-bold">{t('auth.name')}</label>
                  <input 
                    type="text" 
                    id="name"
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder={t('auth.name_placeholder')}
                    required
                    className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                  />
                </div>

                {/* Age */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="age" className="text-sm font-bold">{t('onboarding.age')}</label>
                  <input 
                    type="number" 
                    id="age"
                    value={age} 
                    onChange={(e) => setAge(e.target.value)} 
                    placeholder={t('onboarding.age_placeholder')}
                    required
                    className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm font-bold">{t('auth.phone')}</label>
                  <input 
                    type="text" 
                    id="phone"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder={t('auth.phone_placeholder')}
                    required
                    className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                  />
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

              </div>

              {/* Location Coordinates */}
              <div className="flex flex-col gap-3 text-left border-t pt-6 border-cream-dark/50">
                <label className="text-sm font-bold">{t('onboarding.my_location')}</label>
                
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className={`w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl ${outlineBtnTheme}`}
                >
                  <MapPin className="h-5 w-5 text-terracotta" />
                  {t('onboarding.use_current_location')}
                </button>

                {locationState === 'detecting' && (
                  <p className="text-xs text-forest animate-pulse text-center">{t('auth.detecting_coordinates')}</p>
                )}
                {locationState === 'success' && (
                  <p className="text-xs text-green-600 text-center">{t('auth.location_detected')}: {latitude}, {longitude}</p>
                )}
                {locationState === 'error' && (
                  <p className="text-xs text-red-500 text-center">{t('auth.location_failed')}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="lat" className="text-xs text-gray-500">{t('auth.latitude')}</label>
                    <input 
                      type="number" 
                      step="any"
                      id="lat"
                      value={latitude} 
                      onChange={(e) => setLatitude(e.target.value)} 
                      placeholder="e.g. 28.6304"
                      className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="lng" className="text-xs text-gray-500">{t('auth.longitude')}</label>
                    <input 
                      type="number" 
                      step="any"
                      id="lng"
                      value={longitude} 
                      onChange={(e) => setLongitude(e.target.value)} 
                      placeholder="e.g. 77.2197"
                      className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                    />
                  </div>
                </div>

              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-4 mt-6 border-t pt-6 border-cream-dark/50">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!name || !age || !phone || !latitude || !longitude}
                  className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-base disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtnTheme}`}
                >
                  {t('onboarding.next_skills')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP 2: SKILLS CHAT ================= */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              
              <div className="text-left border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('onboarding.what_are_you_good_at')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('onboarding.step2_desc')}
                </p>
              </div>

              {/* MOCK CHAT WRAPPER */}
              <div className={`p-6 rounded-2xl text-left flex flex-col gap-4 ${highContrast ? 'border border-white bg-black' : 'bg-cream/40 border border-cream-dark/50'}`}>
                
                {/* AI Balloon */}
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${highContrast ? 'border border-white text-white' : 'bg-forest text-white'}`}>
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none max-w-[85%] text-sm sm:text-base leading-relaxed ${highContrast ? 'border border-white bg-black' : 'bg-white border border-cream-dark shadow-sm'}`}>
                    {t('onboarding.ai_bot_greeting')}
                  </div>
                </div>

                {/* User Input Frame */}
                <div className="flex items-end gap-3 mt-4">
                  <div className="flex-grow flex flex-col gap-2">
                    <label htmlFor="chatInput" className="text-xs text-gray-500 font-bold">{t('provider.skills')}</label>
                    <textarea 
                      id="chatInput"
                      rows="3"
                      value={chatText} 
                      onChange={(e) => setChatText(e.target.value)} 
                      placeholder={t('onboarding.describe_skills_placeholder')}
                      className={`w-full px-4 py-3 rounded-2xl text-base ${inputTheme}`}
                    />
                  </div>

                  {/* Pulsing Voice Mic Button */}
                  <div className="relative">
                    {isListening && (
                      <span className="absolute inset-0 rounded-2xl bg-terracotta opacity-70 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`relative z-10 h-[56px] w-[56px] rounded-2xl flex items-center justify-center text-white ${
                        isListening 
                          ? 'bg-red-500 animate-pulse' 
                          : (highContrast ? 'bg-white text-black border border-black' : 'bg-terracotta hover:bg-terracotta-hover')
                      }`}
                      aria-label="Toggle Voice Input"
                    >
                      {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                {isListening && (
                  <p className="text-xs text-red-500 font-bold text-center mt-1">
                    {t('onboarding.listening_active')}
                  </p>
                )}

              </div>

              {/* SKILLS TAGS LIST */}
              <div className="text-left mt-4">
                <h4 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-terracotta" />
                  {t('onboarding.your_skills_profile')}
                </h4>

                {/* Processing Indicator */}
                {showPopIn && (
                  <p className="text-xs text-teal-600 font-semibold mb-2 animate-pulse">{t('onboarding.ai_parsing_skills')}</p>
                )}

                <div className="flex flex-wrap gap-2.5 min-h-[48px] p-3 rounded-2xl border border-dashed border-cream-dark/50 bg-cream/10">
                  {skills.length === 0 ? (
                    <span className="text-xs text-gray-500 italic p-1">{t('onboarding.no_skills_yet')}</span>
                  ) : (
                    skills.map((skill) => (
                      <div 
                        key={skill} 
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                          highContrast 
                            ? 'border border-white bg-black text-white' 
                            : 'bg-teal-50 text-forest border border-teal-200 animate-[pulse_0.3s_ease-out]'
                        }`}
                      >
                        <span>{skill}</span>
                        <button 
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-red-500 focus:outline-none"
                          aria-label={`Remove skill ${skill}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Manual Add Skills */}
                <form onSubmit={handleAddManualSkill} className="flex gap-2 mt-4">
                  <input 
                    type="text" 
                    value={manualSkill}
                    onChange={(e) => setManualSkill(e.target.value)}
                    placeholder={t('onboarding.manual_skill_placeholder')}
                    className={`flex-grow px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                  />
                  <button 
                    type="submit" 
                    className={`px-4 rounded-xl flex items-center justify-center font-bold ${outlineBtnTheme}`}
                  >
                    <Plus className="h-5 w-5" />
                    <span>{t('onboarding.add_btn')}</span>
                  </button>
                </form>

              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 border-t pt-6 border-cream-dark/50">
                <button 
                  onClick={() => setStep(1)} 
                  className={`flex items-center justify-center gap-2 px-6 ${outlineBtnTheme}`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t('common.back')}
                </button>
                <button 
                  onClick={() => setStep(3)}
                  disabled={skills.length === 0}
                  className={`flex items-center justify-center gap-2 px-8 ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {t('onboarding.next_availability')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP 3: AVAILABILITY ================= */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              
              <div className="text-left border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('onboarding.when_are_you_free')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('onboarding.step3_desc')}
                </p>
              </div>

              {/* Day Selection */}
              <div className="text-left flex flex-col gap-3">
                <label className="text-sm font-bold flex items-center gap-1.5">
                  <Calendar className="h-5 w-5 text-terracotta" />
                  {t('onboarding.available_days')}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {daysOfWeek.map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`h-[48px] w-[64px] font-bold text-sm rounded-xl border-2 transition-all ${
                          isSelected 
                            ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta')
                            : (highContrast ? 'border-white bg-black text-white hover:bg-white hover:text-black' : 'bg-white border-cream-dark hover:bg-cream-dark/30')
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Selection */}
              <div className="text-left flex flex-col gap-3 border-t pt-6 border-cream-dark/50">
                <label className="text-sm font-bold flex items-center gap-1.5">
                  <Clock className="h-5 w-5 text-forest" />
                  {t('onboarding.preferred_time')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Morning */}
                  <button
                    type="button"
                    onClick={() => toggleTimeSlot('morning')}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      timeSlots.includes('morning')
                        ? (highContrast ? 'bg-white text-black border-white' : 'bg-amber-50 border-amber-500')
                        : (highContrast ? 'border-white bg-black text-white' : 'bg-white border-cream-dark hover:bg-cream-dark/30')
                    }`}
                  >
                    <Sun className="h-6 w-6 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-sm">{t('onboarding.morning')}</h4>
                      <p className={`text-xs ${textSecondaryTheme}`}>{t('onboarding.morning_time')}</p>
                    </div>
                  </button>

                  {/* Afternoon */}
                  <button
                    type="button"
                    onClick={() => toggleTimeSlot('afternoon')}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      timeSlots.includes('afternoon')
                        ? (highContrast ? 'bg-white text-black border-white' : 'bg-orange-50 border-orange-500')
                        : (highContrast ? 'border-white bg-black text-white' : 'bg-white border-cream-dark hover:bg-cream-dark/30')
                    }`}
                  >
                    <Sunset className="h-6 w-6 text-orange-500" />
                    <div>
                      <h4 className="font-bold text-sm">{t('onboarding.afternoon')}</h4>
                      <p className={`text-xs ${textSecondaryTheme}`}>{t('onboarding.afternoon_time')}</p>
                    </div>
                  </button>

                  {/* Evening */}
                  <button
                    type="button"
                    onClick={() => toggleTimeSlot('evening')}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      timeSlots.includes('evening')
                        ? (highContrast ? 'bg-white text-black border-white' : 'bg-indigo-50 border-indigo-500')
                        : (highContrast ? 'border-white bg-black text-white' : 'bg-white border-cream-dark hover:bg-cream-dark/30')
                    }`}
                  >
                    <Moon className="h-6 w-6 text-indigo-500" />
                    <div>
                      <h4 className="font-bold text-sm">{t('onboarding.evening')}</h4>
                      <p className={`text-xs ${textSecondaryTheme}`}>{t('onboarding.evening_time')}</p>
                    </div>
                  </button>

                </div>
              </div>

              {/* Delivery Mode Selection */}
              <div className="text-left flex flex-col gap-3 border-t pt-6 border-cream-dark/50">
                <label className="text-sm font-bold flex items-center gap-1.5">
                  <Laptop className="h-5 w-5 text-teal-600" />
                  {t('onboarding.service_delivery_mode')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['offline', 'online', 'both'].map((mode) => {
                    const isSelected = deliveryMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setDeliveryMode(mode)}
                        className={`h-[48px] font-bold text-sm rounded-xl border-2 transition-all capitalize ${
                          isSelected 
                            ? (highContrast ? 'bg-white text-black border-white' : 'bg-forest text-white border-forest')
                            : (highContrast ? 'border-white bg-black text-white hover:bg-white hover:text-black' : 'bg-white border-cream-dark hover:bg-cream-dark/30')
                        }`}
                      >
                        {mode === 'both' ? t('onboarding.both') : (mode === 'online' ? t('onboarding.online_only') : t('onboarding.offline_only'))}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 border-t pt-6 border-cream-dark/50">
                <button 
                  onClick={() => setStep(2)} 
                  className={`flex items-center justify-center gap-2 px-6 ${outlineBtnTheme}`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t('common.back')}
                </button>
                <button 
                  onClick={() => setStep(4)}
                  disabled={availableDays.length === 0 || timeSlots.length === 0}
                  className={`flex items-center justify-center gap-2 px-8 ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {t('onboarding.next_review')}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP 4: REVIEW PROFILE ================= */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              
              <div className="text-left border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('onboarding.review_profile_title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('onboarding.step4_desc')}
                </p>
              </div>

              {/* MOCK PROFILE CARD PREVIEW */}
              <div className={`p-8 rounded-3xl text-left flex flex-col gap-6 relative overflow-hidden ${highContrast ? 'border-2 border-white bg-black' : 'bg-gradient-to-tr from-amber-50/40 via-white to-teal-50/20 border border-cream-dark shadow-md'}`}>
                
                {/* Visual Top Decorative Corner */}
                <div className={`absolute top-0 right-0 h-24 w-24 rounded-bl-full opacity-20 ${highContrast ? 'bg-white' : 'bg-terracotta'}`} />
                
                {/* Header: Initial Photo & Name */}
                <div className="flex flex-col sm:flex-row items-center gap-5 border-b pb-5 border-cream-dark/30">
                  <div className={`h-20 w-20 rounded-full flex items-center justify-center font-serif text-3xl font-extrabold shadow-sm ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
                    {name ? name[0] : 'U'}
                  </div>
                  <div className="flex-grow text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-2xl font-bold">{name || 'User Name'}</h3>
                      <button onClick={() => setStep(1)} aria-label="Edit Basic Info" className="text-terracotta hover:opacity-80">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className={`text-sm ${textSecondaryTheme} flex items-center justify-center sm:justify-start gap-1 mt-1`}>
                      <User className="h-4 w-4" /> {t('onboarding.age')}: {age || '--'}
                    </p>
                    <p className={`text-sm ${textSecondaryTheme} flex items-center justify-center sm:justify-start gap-1 mt-0.5`}>
                      <MapPin className="h-4 w-4" /> {t('auth.location_coordinates')}: {latitude}, {longitude}
                    </p>
                  </div>
                </div>

                {/* AI Bio Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-forest uppercase tracking-wider flex items-center gap-1.5">
                      <Bot className="h-4 w-4" />
                      {t('provider.bio')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'}`}>
                      {t('ai.ai_written')}
                    </span>
                  </div>
                  {isGeneratingBio ? (
                    <div className="flex items-center gap-2 text-sm text-teal-600 bg-cream/10 p-4 rounded-xl border border-cream-dark/30 border-dashed animate-pulse">
                      <div className="h-4 w-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin"></div>
                      {t('ai.generating_bio')}
                    </div>
                  ) : (
                    <p className="text-base italic leading-relaxed text-charcoal bg-cream/10 p-4 rounded-xl border border-cream-dark/30 border-dashed">
                      "{aiBio}"
                    </p>
                  )}
                </div>

                {/* Skills tags preview */}
                <div className="flex flex-col gap-2 border-t pt-4 border-cream-dark/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-forest uppercase tracking-wider">{t('provider.skills')}</span>
                    <button onClick={() => setStep(2)} aria-label="Edit Skills" className="text-terracotta hover:opacity-80">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span 
                        key={skill} 
                        className={`px-3 py-1 rounded-lg text-sm font-bold ${
                          highContrast ? 'border border-white bg-black text-white' : 'bg-teal-50 text-forest border border-teal-200'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Availability details preview */}
                <div className="flex flex-col gap-2 border-t pt-4 border-cream-dark/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-forest uppercase tracking-wider">{t('onboarding.step3_nav')}</span>
                    <button onClick={() => setStep(3)} aria-label="Edit Availability" className="text-terracotta hover:opacity-80">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm mt-1">
                    <div>
                      <span className="font-semibold block text-gray-500">{t('onboarding.available_days')}:</span>
                      <span className="font-bold text-charcoal">{availableDays.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-500">{t('onboarding.preferred_time')}:</span>
                      <span className="font-bold text-charcoal capitalize">{timeSlots.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-semibold block text-gray-500">{t('onboarding.service_delivery_mode')}:</span>
                      <span className="font-bold text-charcoal capitalize">{deliveryMode}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center mt-6 border-t pt-6 border-cream-dark/50">
                <button 
                  onClick={() => setStep(3)} 
                  className={`flex items-center justify-center gap-2 px-6 ${outlineBtnTheme}`}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t('common.back')}
                </button>
                <button 
                  onClick={handleConfirmProfile}
                  className={`flex items-center justify-center gap-2 px-8 ${primaryBtnTheme}`}
                >
                  {t('onboarding.confirm_create_profile')}
                  <Check className="h-5 w-5" />
                </button>
              </div>

            </div>
          )}

        </div>

        {/* SKIP FOR NOW LINK */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`text-sm font-semibold underline hover:no-underline transition-all ${textSecondaryTheme}`}
          >
            {t('onboarding.skip_for_now')}
          </button>
        </div>

      </main>

    </div>
  );
};

export default OnboardingFlow;
