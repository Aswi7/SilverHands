import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Type, Eye, Volume2, Globe, VolumeX, Sparkles } from 'lucide-react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const { i18n } = useTranslation();
  
  // 1. Accessibility Core States
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem('sh_font_size') || 'normal';
  });
  
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('sh_high_contrast') === 'true';
  });

  const [ttsEnabled, setTtsEnabledState] = useState(() => {
    return localStorage.getItem('sh_tts_enabled') === 'true';
  });

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('sh_language') || 'en';
  });

  // Drawer visibility state
  const [panelOpen, setPanelOpen] = useState(false);

  // Active speaking element track (for TTS animation)
  const [speakingId, setSpeakingId] = useState(null);

  // Sync state changes to local storage & DOM attributes
  useEffect(() => {
    localStorage.setItem('sh_font_size', fontSize);
    const root = document.documentElement;
    if (fontSize === 'normal') {
      root.style.fontSize = '16px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '20px';
    } else if (fontSize === 'xlarge') {
      root.style.fontSize = '24px';
    }
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('sh_high_contrast', highContrast);
    const body = document.body;
    if (highContrast) {
      body.classList.add('high-contrast');
      document.documentElement.classList.add('dark'); // standard dark utility
    } else {
      body.classList.remove('high-contrast');
      document.documentElement.classList.remove('dark');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('sh_tts_enabled', ttsEnabled);
    if (!ttsEnabled) {
      // Stop any speech immediately if toggled off
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
    }
  }, [ttsEnabled]);

  useEffect(() => {
    localStorage.setItem('sh_language', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Setters
  const setFontSize = (size) => setFontSizeState(size);
  const setHighContrast = (bool) => setHighContrastState(bool);
  const setTtsEnabled = (bool) => setTtsEnabledState(bool);
  const setLanguage = (lang) => setLanguageState(lang);

  // Text-To-Speech Play Handler
  const speakText = (text, elementId) => {
    if (!ttsEnabled || !window.speechSynthesis) return;

    // If currently speaking this block, cancel it (toggle behavior)
    if (speakingId === elementId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    // Stop ongoing speech
    window.speechSynthesis.cancel();
    setSpeakingId(elementId);

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set voice match for localized language
    const voices = window.speechSynthesis.getVoices();
    if (language === 'hi') {
      const hiVoice = voices.find(v => v.lang.includes('HI') || v.lang.includes('hi'));
      if (hiVoice) utterance.voice = hiVoice;
    } else if (language === 'ta') {
      const taVoice = voices.find(v => v.lang.includes('TA') || v.lang.includes('ta'));
      if (taVoice) utterance.voice = taVoice;
    }

    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = () => {
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      setFontSize,
      highContrast,
      setHighContrast,
      ttsEnabled,
      setTtsEnabled,
      language,
      setLanguage,
      panelOpen,
      setPanelOpen,
      speakText,
      speakingId
    }}>
      {children}
      <AccessibilityDrawer />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};


/* ==========================================================================
   SPEAKER BUTTON COMPONENT (TTS Assist)
   ========================================================================== */
export const SpeakerButton = ({ text, id }) => {
  const { ttsEnabled, speakText, speakingId, highContrast } = useAccessibility();

  if (!ttsEnabled) return null;

  const isSpeaking = speakingId === id;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        speakText(text, id);
      }}
      className={`p-1.5 rounded-lg border transition-all inline-flex items-center justify-center shrink-0 ${
        isSpeaking 
          ? (highContrast ? 'bg-white text-black border-white animate-pulse' : 'bg-orange-100 border-terracotta text-terracotta animate-pulse scale-105')
          : (highContrast ? 'border-white text-white bg-black hover:bg-white hover:text-black' : 'border-cream-dark bg-white hover:bg-cream-dark/20 text-charcoal-light')
      }`}
      title={isSpeaking ? "Click to Stop Speaking" : "Click to Read Aloud"}
      aria-label={isSpeaking ? "Stop reading" : "Read text aloud"}
    >
      <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-bounce' : ''}`} />
      
      {/* Speaking mock wave bars */}
      {isSpeaking && (
        <span className="flex items-center gap-0.5 ml-1.5 h-3">
          <span className="w-0.5 h-2 rounded bg-current animate-[speakingWave_0.6s_infinite_alternate]"></span>
          <span className="w-0.5 h-3 rounded bg-current animate-[speakingWave_0.6s_infinite_alternate_0.2s]"></span>
          <span className="w-0.5 h-1.5 rounded bg-current animate-[speakingWave_0.6s_infinite_alternate_0.4s]"></span>
        </span>
      )}
    </button>
  );
};


/* ==========================================================================
   SLIDE-IN ACCESSIBILITY DRAWER
   ========================================================================== */
const AccessibilityDrawer = () => {
  const {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    ttsEnabled,
    setTtsEnabled,
    language,
    setLanguage,
    panelOpen,
    setPanelOpen
  } = useAccessibility();

  if (!panelOpen) return null;

  // Theming
  const bgTheme = highContrast ? 'bg-black text-white border-l-2 border-white' : 'bg-cream text-charcoal';
  const cardTheme = highContrast ? 'border-2 border-white bg-black' : 'bg-white border border-cream-dark shadow-sm';
  const buttonActiveTheme = highContrast 
    ? 'bg-white text-black font-bold border-2 border-white shadow-sm' 
    : 'bg-terracotta text-white font-bold shadow-md';
  const buttonInactiveTheme = highContrast
    ? 'border-2 border-white/60 text-white bg-black hover:bg-white/10'
    : 'bg-white border border-cream-dark text-charcoal hover:bg-cream-dark/30';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={() => setPanelOpen(false)}></div>
      
      {/* Sliding Panel */}
      <aside className={`relative w-80 h-full p-6 flex flex-col gap-6 shadow-2xl justify-between animate-[slideInRight_0.25s_ease-out] ${bgTheme}`}>
        
        <div className="flex flex-col gap-5 text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4 border-cream-dark/20">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <Type className="h-5 w-5 text-terracotta" />
              Easy Read Assist
            </h2>
            <button 
              onClick={() => setPanelOpen(false)}
              className="p-1 rounded-full hover:bg-cream-dark/30 transition-colors"
              aria-label="Close panel"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-charcoal-light">
            Adjust styling and features below to make SilverHands easier to read, hear, and navigate.
          </p>

          {/* Section 1: Font Size */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold flex items-center gap-1.5">
              <Type className="h-4.5 w-4.5 text-forest" />
              Text Size (Aa)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFontSize('normal')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  fontSize === 'normal' ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`py-2 rounded-xl text-base font-bold transition-all ${
                  fontSize === 'large' ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Large
              </button>
              <button
                onClick={() => setFontSize('xlarge')}
                className={`py-2 rounded-xl text-lg font-bold transition-all ${
                  fontSize === 'xlarge' ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Huge
              </button>
            </div>
          </div>

          {/* Section 2: Contrast Mode */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold flex items-center gap-1.5">
              <Eye className="h-4.5 w-4.5 text-forest" />
              Contrast Colors
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setHighContrast(false)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !highContrast ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Standard Colors
              </button>
              <button
                onClick={() => setHighContrast(true)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  highContrast ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                High Contrast
              </button>
            </div>
          </div>

          {/* Section 3: Screen Reader / TTS */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold flex items-center gap-1.5">
              <Volume2 className="h-4.5 w-4.5 text-forest" />
              Voice Assist (Read Aloud)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTtsEnabled(false)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  !ttsEnabled ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Voice Off
              </button>
              <button
                onClick={() => setTtsEnabled(true)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  ttsEnabled ? buttonActiveTheme : buttonInactiveTheme
                }`}
              >
                Voice On
              </button>
            </div>
            {ttsEnabled && (
              <p className="text-[10px] text-teal-800 bg-teal-50/50 p-2 rounded-lg leading-normal">
                ✓ Speaker icons will appear next to headings. Click them to hear text read aloud.
              </p>
            )}
          </div>

          {/* Section 4: Language Selector */}
          <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold flex items-center gap-1.5">
              <Globe className="h-4.5 w-4.5 text-forest" />
              Language Selector
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`w-full p-3 rounded-xl border text-sm focus:outline-none transition-all ${
                highContrast 
                  ? 'bg-black text-white border-white focus:border-yellow-400 font-bold' 
                  : 'bg-white border-cream-dark text-charcoal focus:border-terracotta'
              }`}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

        </div>

        {/* Footer Guarantee */}
        <div className={`p-4 rounded-2xl flex items-center gap-2 border text-[10px] leading-tight ${
          highContrast ? 'border-white/40 bg-white/10' : 'border-cream-dark/50 bg-white'
        }`}>
          <Sparkles className="h-5 w-5 text-terracotta shrink-0" />
          <span className="text-left font-semibold">Settings are saved locally and will apply automatically on your next visit.</span>
        </div>

      </aside>
    </div>
  );
};
