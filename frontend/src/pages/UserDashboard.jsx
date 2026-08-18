import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Type, 
  Globe, 
  LogOut, 
  Sparkles, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  User, 
  Settings, 
  Bell, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Info,
  Calendar,
  X,
  Mic,
  MicOff
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import { SafetyTipsCard } from '../components/TrustSafety';
import { MatchExplanation } from '../components/MatchExplanation';
import { ChatInterface } from '../components/ChatInterface';
import { useAccessibility, SpeakerButton } from '../context/AccessibilityContext';
import { forecastData } from '../data/forecastData';

const UserDashboard = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUserInState } = useAuth();

  // Accessibility Global Settings
  const { setPanelOpen, highContrast, speechLocale } = useAccessibility();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('matches');

  // Filter States
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDistance, setActiveDistance] = useState('all');
  const [activeMode, setActiveMode] = useState('all');

  // Saved/Bookmarked Matches
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Asha Devi matched with your cooking skill!", time: "5m ago", unread: true },
    { id: 2, text: "New English tutoring opportunity nearby", time: "2h ago", unread: true },
    { id: 3, text: "Application confirmed for Math Tuitions", time: "1d ago", unread: false }
  ]);

  // Forecast state
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState(null);
  
  // Listing Creation Form state
  const [listingForm, setListingForm] = useState({ 
    title: '', 
    category: '', 
    description: '', 
    rateType: 'daily', 
    rateAmount: '', 
    packageDuration: '' 
  });
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  
  // Provider Active Listings
  const [providerListings, setProviderListings] = useState([]);
  
  useEffect(() => {
    if (user?._id) {
      api.get(`/listings/provider/${user._id}`)
        .then(res => setProviderListings(res.data))
        .catch(err => console.error("Failed to load listings", err));
    }
  }, [user]);

  // Derive relevant forecasts
  const userSkillCategories = user?.skills?.map(s => typeof s === 'object' ? (s.category || s.skillName) : s) || [];
  const relevantForecasts = forecastData.map(event => {
    const hasSkillMatch = event.relevantCategories.some(cat => 
      userSkillCategories.some(skill => skill.toLowerCase().includes(cat.toLowerCase()))
    );
    const isRelevant = hasSkillMatch || (user?.name === 'Asha Devi' && event.relevantCategories.includes('cooking'));
    return { ...event, isRelevant };
  });

  const topForecast = relevantForecasts.find(f => f.isRelevant) || relevantForecasts[0];

  const handlePrepareListing = (forecast) => {
    setSelectedForecast(forecast);
    const title = forecast.suggestionTitleKey ? t(forecast.suggestionTitleKey) : forecast.suggestionTitle;
    const eventName = forecast.eventNameKey ? t(forecast.eventNameKey) : forecast.eventName;

    setListingForm({
      title: title,
      category: forecast.suggestionCategory,
      description: `I am offering ${title.toLowerCase()} services for the upcoming ${eventName}.`,
      rateType: 'daily',
      rateAmount: '500',
      packageDuration: ''
    });
    setShowForecastModal(true);
  };

  const handleSubmitListing = async () => {
    if (!listingForm.title || !listingForm.category || !listingForm.rateAmount || !listingForm.description) {
      alert("Please fill all required fields.");
      return;
    }
    setIsCreatingListing(true);
    try {
      const { data } = await api.post('/listings', listingForm);
      setProviderListings([data, ...providerListings]);
      setShowForecastModal(false);
      setActiveTab('profile');
    } catch (error) {
      console.error("Error creating listing", error);
      alert("Failed to create listing.");
    } finally {
      setIsCreatingListing(false);
    }
  };

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Profile AI Extraction State
  const [bioText, setBioText] = useState(user?.bio || '');
  const [extractedSkills, setExtractedSkills] = useState(user?.skills || []);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [isListeningBio, setIsListeningBio] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Voice Dictation for Bio
  const handleListenBio = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice dictation.");
      return;
    }

    if (isListeningBio) return;

    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListeningBio(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setBioText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListeningBio(false);
    };

    recognition.onend = () => setIsListeningBio(false);

    recognition.start();
  };

  const handleExtractSkills = async () => {
    if (!bioText.trim() || !user?._id) return;
    
    setIsExtracting(true);
    setExtractError(null);
    
    try {
      const { data } = await api.post(`/ai/extract-skills`, { bio: bioText, language: i18n.language });
      
      if (data && data.skills) {
        setExtractedSkills(data.skills);
        
        const profileUpdate = await api.put('/users/profile', {
          bio: bioText,
          skills: data.skills
        });
        
        if (updateUserInState && profileUpdate.data) {
          updateUserInState(profileUpdate.data);
        }
      }
    } catch (error) {
      console.error(error);
      setExtractError(error.response?.data?.message || error.message || 'Failed to extract skills');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveExtractedSkill = (indexToRemove) => {
    setExtractedSkills(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // --- Opportunity Matches State ---
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !user._id) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const maxDist = activeDistance === 'near' ? 5000 : 50000;
        const { data } = await api.get(`/requests/nearby?maxDistance=${maxDist}`);
        
        const mappedData = data.map((req) => ({
          id: req._id,
          title: req.title,
          category: req.category,
          score: req.score || 50,
          scoreBreakdown: req.scoreBreakdown || null,
          rate: req.rate || "Negotiable",
          location: req.mode === 'online' ? 'Online' : (req.location?.coordinates ? `Coordinates: [${req.location.coordinates[0].toFixed(2)}, ${req.location.coordinates[1].toFixed(2)}]` : 'Unknown'),
          mode: req.mode || "offline",
          posted: new Date(req.createdAt).toLocaleDateString(),
          description: req.description
        }));
        
        setOpportunities(mappedData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (activeTab === 'matches') {
      fetchRequests();
    }
  }, [user, activeDistance, activeTab]);

  // Filter logic
  const filteredOpportunities = opportunities.filter(opp => {
    const categoryMatch = activeCategory === 'all' || opp.category === activeCategory;
    const modeMatch = activeMode === 'all' || opp.mode === activeMode;
    return categoryMatch && modeMatch;
  });

  const toggleBookmark = (id) => {
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter(bId => bId !== id));
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
    }
  };

  // --- Accessibility Styling Tokens ---
  const bgTheme = highContrast ? 'bg-black text-white' : 'bg-cream text-charcoal';
  const cardTheme = highContrast ? 'border-2 border-white bg-black' : 'bg-white border border-cream-dark shadow-sm';
  const textSecondaryTheme = highContrast ? 'text-gray-300' : 'text-charcoal-light';
  
  const inputTheme = highContrast 
    ? 'bg-black border-2 border-white text-white focus:border-yellow-400' 
    : 'bg-cream-dark/20 border border-cream-dark text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta';

  const primaryBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black font-bold h-12'
    : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-md hover:shadow-lg font-bold h-12 rounded-2xl transition-all';

  const outlineBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black h-12'
    : 'border border-cream-dark hover:bg-cream-dark/30 text-charcoal h-12 rounded-2xl transition-all';

  const activeSidebarItemTheme = highContrast
    ? 'border-2 border-white bg-white text-black font-bold'
    : 'bg-terracotta text-white font-bold shadow-md';

  const inactiveSidebarItemTheme = highContrast
    ? 'border border-transparent text-white hover:border-white'
    : 'text-charcoal hover:bg-cream-dark/20';

  // Navigation Items with explicit i18n keys
  const sidebarItems = [
    { id: 'matches', label: t('nav.short.matches'), icon: Sparkles },
    { id: 'forecast', label: t('nav.short.forecast'), icon: Calendar },
    { id: 'applications', label: t('nav.short.applications'), icon: Briefcase },
    { id: 'earnings', label: t('nav.short.earnings'), icon: TrendingUp },
    { id: 'messages', label: t('nav.short.messages'), icon: MessageSquare },
    { id: 'profile', label: t('nav.short.profile'), icon: User },
    { id: 'settings', label: t('nav.short.settings'), icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${bgTheme} transition-colors duration-200 font-sans pb-16 md:pb-0`}>
      
      {/* 1. LEFT SIDEBAR (Desktop) / BOTTOM NAV (Mobile) */}
      <aside className={`w-full md:w-64 md:min-h-screen shrink-0 border-r md:sticky md:top-0 z-40 ${
        highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-white'
      } flex md:flex-col justify-between`}>
        
        {/* Sidebar Top branding */}
        <div className="w-full">
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-cream-dark/30 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-extrabold ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
              S
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              SilverHands
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex flex-col gap-2 p-4">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                    isActive ? activeSidebarItemTheme : inactiveSidebarItemTheme
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center py-2 px-1 bg-white border-cream-dark shadow-lg">
          {sidebarItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
                  isActive 
                    ? 'text-terracotta' 
                    : (highContrast ? 'text-white' : 'text-charcoal-light hover:text-terracotta')
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-[55px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar bottom safety tips widget */}
        <div className="hidden md:block p-4 border-t border-cream-dark/30">
          <SafetyTipsCard highContrast={highContrast} />
        </div>

        {/* Sidebar Footer Logouts */}
        <div className="hidden md:block p-4 border-t border-cream-dark/30">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
              highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600'
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span>{t('dashboard.provider.logout')}</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN LAYOUT */}
      <div className="grow flex flex-col min-w-0">
        
        {/* TOP GREETER BAR */}
        <header className={`border-b sticky top-0 z-30 px-4 py-3 md:px-8 flex items-center justify-between ${
          highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/90 backdrop-blur-md'
        }`}>
          
          <div className="text-left">
            <h1 className="text-xl font-bold font-serif md:text-2xl flex items-center gap-1.5">
              <span>{t('dashboard.provider.greeting', { name: user?.name || 'Lakshmi' })}</span>
              <SpeakerButton text={t('dashboard.provider.greeting', { name: user?.name || 'Lakshmi' })} id="provider-dashboard-greeting" />
            </h1>
          </div>

          {/* Header Controls: Language Switcher, Accessibility Options, Notifications */}
          <div className="flex items-center gap-3">
            
            {/* Language Switcher Dropdown */}
            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>

            {/* Accessibility Options */}
            <button 
              onClick={() => setPanelOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                highContrast ? 'border-white hover:bg-white hover:text-black bg-black text-white' : 'border-cream-dark hover:bg-cream-dark/30 text-charcoal'
              }`}
              aria-label={t('accessibility.options')}
            >
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.provider.options')}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${
                  highContrast ? 'border-white' : 'border-cream-dark hover:bg-cream-dark/30'
                }`}
                aria-label={t('dashboard.provider.notifications.title')}
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-terracotta" />
                )}
              </button>

              {/* Notification Dropdown panel */}
              {showNotifDropdown && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 text-left animate-[fadeIn_0.15s_ease-out] ${
                  highContrast ? 'bg-black text-white border-white' : 'bg-white border-cream-dark'
                }`}>
                  <h4 className="font-bold text-sm border-b pb-2 mb-2">{t('dashboard.provider.notifications.title')}</h4>
                  <div className="flex flex-col gap-2.5">
                    {notifications.map(n => (
                      <div key={n.id} className="text-xs p-2 rounded-lg bg-cream-dark/20 flex flex-col gap-0.5">
                        <span className="font-semibold">{n.text}</span>
                        <span className="text-[10px] text-gray-400">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* TAB CONTENTS */}
        <main className="p-4 md:p-8 grow">
          
          {/* ================= TAB 1: MATCHES ================= */}
          {activeTab === 'matches' && (
            <div className="flex flex-col gap-6">
              
              {/* TOP FORECAST HIGHLIGHT BANNER */}
              {topForecast && (
                <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-sm ${
                  highContrast ? 'border-yellow-400 bg-black text-yellow-400' : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-teal-500/10 border-orange-200/80 text-charcoal'
                }`}>
                  <div className="flex gap-4 items-start">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-700 shrink-0">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800">
                          {t('forecast.banner_badge')}
                        </span>
                        <span className="text-xs text-charcoal-light font-medium">
                          {topForecast.dateRangeKey ? t(topForecast.dateRangeKey) : topForecast.dateRange}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold mt-1">
                        {topForecast.eventNameKey ? t(topForecast.eventNameKey) : topForecast.eventName} {t('forecast.banner_title')}
                      </h3>
                      <p className="text-xs text-charcoal-light mt-0.5">
                        {topForecast.insightKey ? t(topForecast.insightKey) : topForecast.insight}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrepareListing(topForecast)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all shadow-sm ${
                      highContrast 
                        ? 'border border-yellow-400 bg-yellow-400 text-black hover:bg-yellow-300' 
                        : 'bg-terracotta hover:bg-terracotta-hover text-white'
                    }`}
                  >
                    {t('forecast.prepare_my_listing')}
                  </button>
                </div>
              )}

              {/* AI Explanation Banner */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3 text-left ${
                highContrast ? 'border-white bg-black' : 'bg-teal-50/60 border-teal-100 text-teal-900'
              }`}>
                <Info className="h-5 w-5 text-forest shrink-0" />
                <p className="text-xs leading-relaxed">
                  {t('dashboard.provider.matches.ai_tip')}
                </p>
              </div>

              {/* FILTER TOOLBAR */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${cardTheme}`}>
                
                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-charcoal-light mr-1">{t('dashboard.provider.matches.category')}:</span>
                  {['all', 'cooking', 'tutoring', 'gardening'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        activeCategory === cat
                          ? (highContrast ? 'bg-white text-black border border-white' : 'bg-forest text-white')
                          : (highContrast ? 'border border-white text-white' : 'bg-cream-dark/30 text-charcoal hover:bg-cream-dark/60')
                      }`}
                    >
                      {cat === 'all' ? t('dashboard.provider.matches.all_categories') : (t(`customer.categories.${cat}`) || cat)}
                    </button>
                  ))}
                </div>

                {/* Distance and Mode filters */}
                <div className="flex items-center gap-3">
                  
                  {/* Distance */}
                  <select 
                    value={activeDistance} 
                    onChange={(e) => setActiveDistance(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${inputTheme}`}
                  >
                    <option value="all">{t('dashboard.provider.matches.distance')}: {t('dashboard.provider.matches.any')}</option>
                    <option value="near">{t('dashboard.provider.matches.distance')}: {t('dashboard.provider.matches.nearby')}</option>
                  </select>

                  {/* Mode */}
                  <select 
                    value={activeMode} 
                    onChange={(e) => setActiveMode(e.target.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${inputTheme}`}
                  >
                    <option value="all">{t('dashboard.provider.matches.mode')}: {t('dashboard.provider.matches.all')}</option>
                    <option value="online">{t('dashboard.provider.matches.online')}</option>
                    <option value="offline">{t('dashboard.provider.matches.offline')}</option>
                  </select>

                </div>

              </div>

              {/* MATCHES LIST */}
              {isLoading ? (
                <div className="p-12 text-center text-teal-600 font-bold animate-pulse">
                  {t('ai.ai_searching')}
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500 bg-red-50 rounded-2xl border border-red-100">
                  {error}
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl ${cardTheme} flex flex-col items-center gap-4`}>
                  <Sparkles className="h-12 w-12 text-cream-dark" />
                  <h3 className="font-serif text-xl font-bold">{t('dashboard.provider.matches.empty_title')}</h3>
                  <p className={`text-sm max-w-sm ${textSecondaryTheme}`}>
                    {t('dashboard.provider.matches.empty_desc')}
                  </p>
                  <button onClick={() => setActiveTab('profile')} className={`px-6 py-2.5 rounded-xl font-bold text-xs ${primaryBtnTheme}`}>
                    {t('dashboard.provider.matches.complete_profile')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 text-left">
                  {filteredOpportunities.map((opp) => {
                    const isBookmarked = bookmarkedIds.includes(opp.id);

                    return (
                      <div 
                        key={opp.id}
                        className={`p-6 rounded-3xl border flex flex-col justify-between gap-5 transition-all hover:shadow-md ${cardTheme}`}
                      >
                        {/* Top info */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded w-fit">
                                {t(`customer.categories.${opp.category}`) || opp.category}
                              </span>
                              <h3 className="font-serif text-xl font-bold leading-snug">{opp.title}</h3>
                            </div>

                            {/* Match score badge & bookmark */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                highContrast ? 'border border-white bg-black text-white' : 'bg-orange-50 text-terracotta border border-orange-100'
                              }`}>
                                {opp.score}% {t('dashboard.provider.matches.match')}
                              </span>
                              <button 
                                onClick={() => toggleBookmark(opp.id)}
                                className="p-1.5 rounded-lg hover:bg-cream-dark/30 text-charcoal-light"
                                aria-label="Bookmark Opportunity"
                              >
                                {isBookmarked ? (
                                  <BookmarkCheck className="h-5 w-5 text-terracotta fill-terracotta" />
                                ) : (
                                  <Bookmark className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <p className={`text-xs leading-relaxed line-clamp-3 ${textSecondaryTheme}`}>
                            {opp.description}
                          </p>

                          {/* Dynamic AI Match Breakdown component */}
                          <div className="mt-1">
                            <MatchExplanation 
                              score={opp.score} 
                              scoreBreakdown={opp.scoreBreakdown || { skillOverlap: 85, distance: '1.2km', availabilityOverlap: true }}
                              highContrast={highContrast}
                            />
                          </div>
                        </div>

                        {/* Card Footer Details */}
                        <div className="flex flex-col gap-4 border-t pt-4 border-cream-dark/20">
                          <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-charcoal-light gap-2">
                            <span className="flex items-center gap-1 text-forest font-bold">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {opp.rate}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {opp.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {t('dashboard.provider.matches.posted')} {opp.posted}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                alert(`Interest expressed for ${opp.title}! The employer will be notified.`);
                              }}
                              className={`flex-grow py-2.5 rounded-xl text-xs font-bold ${primaryBtnTheme}`}
                            >
                              {t('dashboard.provider.matches.interested')}
                            </button>
                            <button
                              onClick={() => {
                                setOpportunities(opportunities.filter(o => o.id !== opp.id));
                              }}
                              className={`px-4 py-2.5 rounded-xl text-xs font-bold ${outlineBtnTheme}`}
                            >
                              {t('dashboard.provider.matches.maybe_later')}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ================= TAB 2: FORECAST ================= */}
          {activeTab === 'forecast' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('forecast.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('forecast.desc')}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {relevantForecasts.map((event) => (
                  <div 
                    key={event.id}
                    className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 transition-all ${cardTheme} ${
                      event.isRelevant ? (highContrast ? 'border-yellow-400' : 'border-orange-300 bg-gradient-to-br from-amber-50/40 to-white') : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-terracotta bg-orange-100 px-2.5 py-1 rounded-full">
                          {event.demandUplift} {t('forecast.demand')}
                        </span>
                        <span className="text-xs text-charcoal-light font-medium">
                          {event.dateRangeKey ? t(event.dateRangeKey) : event.dateRange}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold mt-3">
                        {event.eventNameKey ? t(event.eventNameKey) : event.eventName}
                      </h3>
                      <p className="text-xs text-charcoal-light mt-2 leading-relaxed">
                        {event.insightKey ? t(event.insightKey) : event.insight}
                      </p>
                    </div>

                    <div className="border-t pt-4 border-cream-dark/20 flex flex-col gap-3">
                      <div className="text-xs">
                        <span className="text-gray-500 font-semibold block">{t('forecast.suggestion_title')}:</span>
                        <span className="font-bold text-forest">
                          {event.suggestionTitleKey ? t(event.suggestionTitleKey) : event.suggestionTitle}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePrepareListing(event)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold ${primaryBtnTheme}`}
                      >
                        {t('forecast.prepare_my_listing')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: APPLICATIONS ================= */}
          {activeTab === 'applications' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.applications.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.applications.desc')}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { id: 1, title: 'Primary School Math Tutoring', employer: 'Ramesh S.', status: t('dashboard.provider.applications.contacted'), statusBg: 'bg-amber-100 text-amber-800', date: 'Applied 2 days ago' },
                  { id: 2, title: 'Diwali Sweets Catering', employer: 'Sunita P.', status: t('dashboard.provider.applications.confirmed'), statusBg: 'bg-green-100 text-green-800', date: 'Applied 4 days ago' }
                ].map(app => (
                  <div key={app.id} className={`p-5 rounded-2xl border flex items-center justify-between ${cardTheme}`}>
                    <div>
                      <h4 className="font-bold text-base">{app.title}</h4>
                      <p className="text-xs text-charcoal-light mt-0.5">{t('dashboard.provider.applications.employer')}: {app.employer} • {app.date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${app.statusBg}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 4: EARNINGS ================= */}
          {activeTab === 'earnings' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.earnings.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.earnings.desc')}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className={`p-6 rounded-2xl border ${cardTheme}`}>
                  <span className="text-xs text-gray-500 font-bold uppercase">{t('dashboard.provider.earnings.this_month')}</span>
                  <p className="font-serif text-3xl font-bold text-terracotta mt-2">₹12,400</p>
                </div>
                <div className={`p-6 rounded-2xl border ${cardTheme}`}>
                  <span className="text-xs text-gray-500 font-bold uppercase">{t('dashboard.provider.earnings.total_hours')}</span>
                  <p className="font-serif text-3xl font-bold text-forest mt-2">32 {t('common.hours')}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${cardTheme}`}>
                  <span className="text-xs text-gray-500 font-bold uppercase">{t('dashboard.provider.earnings.services_provided')}</span>
                  <p className="font-serif text-3xl font-bold text-amber-600 mt-2">14</p>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${cardTheme}`}>
                <h4 className="font-bold text-base mb-4">{t('dashboard.provider.earnings.monthly_chart')}</h4>
                <div className="h-40 flex items-end justify-between gap-4 border-b pb-2">
                  {['May', 'Jun', 'Jul', 'Aug'].map((m, idx) => {
                    const heights = ['h-16', 'h-24', 'h-28', 'h-36'];
                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-full max-w-[40px] rounded-t-lg bg-terracotta/80 ${heights[idx]}`}></div>
                        <span className="text-xs font-bold text-gray-500">{m}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-green-600 font-semibold mt-4">
                  {t('dashboard.provider.earnings.direct_bank_complete')}
                </p>
              </div>
            </div>
          )}

          {/* ================= TAB 5: MESSAGES ================= */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.messages.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.messages.desc')}
                </p>
              </div>

              <ChatInterface 
                user={user} 
                highContrast={highContrast}
                onNavigate={onNavigate}
                onPrepareListing={() => setActiveTab('forecast')}
              />
            </div>
          )}

          {/* ================= TAB 6: PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.profile.my_profile_title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.profile.my_profile_desc')}
                </p>
              </div>

              {/* Bio & Skills Updater Form */}
              <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                <h3 className="font-bold text-base">{t('dashboard.provider.profile.my_bio')}</h3>
                <p className="text-xs text-charcoal-light">
                  {t('dashboard.provider.profile.tell_experience_words')}
                </p>

                <div className="flex flex-col gap-2">
                  <textarea
                    rows="3"
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder={t('onboarding.describe_skills_placeholder')}
                    className={`w-full p-4 rounded-2xl text-sm ${inputTheme}`}
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleListenBio}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${outlineBtnTheme}`}
                    >
                      {isListeningBio ? <MicOff className="h-4 w-4 text-red-500 animate-pulse" /> : <Mic className="h-4 w-4 text-terracotta" />}
                      <span>{t('dashboard.provider.profile.dictate_voice')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExtractSkills}
                      disabled={isExtracting || !bioText.trim()}
                      className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${primaryBtnTheme} disabled:opacity-50`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{isExtracting ? t('ai.extracting_skills') : t('dashboard.provider.profile.extract_skills')}</span>
                    </button>
                  </div>
                </div>

                {extractError && (
                  <p className="text-xs text-red-500 font-semibold">{extractError}</p>
                )}

                {/* Extracted Skills List */}
                <div className="mt-4 border-t pt-4 border-cream-dark/20">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-terracotta" />
                    {t('dashboard.provider.profile.extracted_review')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedSkills.map((skill, index) => {
                      const skillName = typeof skill === 'object' ? skill.skillName : skill;
                      const confidence = typeof skill === 'object' ? skill.confidence : 1.0;
                      return (
                        <div 
                          key={index}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                            confidence < 0.7 
                              ? 'bg-amber-50 text-amber-800 border border-amber-300' 
                              : 'bg-teal-50 text-forest border border-teal-200'
                          }`}
                        >
                          <span>{skillName}</span>
                          {confidence < 0.7 && (
                            <span className="text-[10px] text-amber-600 font-normal">({t('dashboard.provider.profile.confirm_low_confidence')})</span>
                          )}
                          <button onClick={() => handleRemoveExtractedSkill(index)} className="hover:text-red-500">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Published Listings */}
              <div className="flex flex-col gap-4 border-t pt-6 border-cream-dark/30">
                <h3 className="font-serif text-xl font-bold">{t('dashboard.provider.profile.published_services')}</h3>
                {providerListings.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">{t('dashboard.provider.profile.no_published_services')}</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {providerListings.map(listing => (
                      <div key={listing._id} className={`p-4 rounded-2xl border ${cardTheme}`}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base">{listing.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-800">
                            {t('dashboard.provider.profile.active_badge')}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-light mt-1">{listing.description}</p>
                        <p className="text-xs font-bold text-forest mt-2">₹{listing.rateAmount} / {listing.rateType}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 7: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.settings.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.settings.desc')}
                </p>
              </div>

              <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                <h3 className="font-bold text-base">{t('dashboard.provider.settings.preferences')}</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-terracotta h-4 w-4" />
                  <span className="text-sm font-semibold">{t('dashboard.provider.settings.email_notifs')}</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-terracotta h-4 w-4" />
                  <span className="text-sm font-semibold">{t('dashboard.provider.settings.sms_alerts')}</span>
                </label>
              </div>

              <div className={`p-6 rounded-3xl border flex flex-col gap-3 ${cardTheme}`}>
                <h3 className="font-bold text-base">{t('dashboard.provider.settings.need_help')}</h3>
                <p className="text-xs text-charcoal-light leading-relaxed">
                  {t('dashboard.provider.settings.helpline')}
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CREATE LISTING MODAL */}
      {showForecastModal && selectedForecast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border text-left flex flex-col gap-4 animate-[slideUp_0.25s_ease-out] ${
            highContrast ? 'bg-black text-white border-white' : 'bg-white border-cream-dark'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-terracotta" />
                {t('forecast.create_listing_title')}
              </h3>
              <button onClick={() => setShowForecastModal(false)} className="p-1 rounded-full hover:bg-cream-dark/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">{t('forecast.service_title')}</label>
                <input 
                  type="text" 
                  value={listingForm.title} 
                  onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
                  className={`p-3 rounded-xl text-sm ${inputTheme}`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">{t('customer.category')}</label>
                <input 
                  type="text" 
                  value={listingForm.category} 
                  onChange={(e) => setListingForm({...listingForm, category: e.target.value})}
                  className={`p-3 rounded-xl text-sm ${inputTheme}`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">{t('customer.description')}</label>
                <textarea 
                  rows="3" 
                  value={listingForm.description} 
                  onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                  className={`p-3 rounded-xl text-sm ${inputTheme}`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold">{t('forecast.rate_structure')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button" 
                    onClick={() => setListingForm({...listingForm, rateType: 'daily'})}
                    className={`py-2 rounded-xl text-xs font-bold border ${listingForm.rateType === 'daily' ? 'bg-terracotta text-white' : 'bg-cream-dark/20'}`}
                  >
                    {t('forecast.one_day_rate')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setListingForm({...listingForm, rateType: 'package'})}
                    className={`py-2 rounded-xl text-xs font-bold border ${listingForm.rateType === 'package' ? 'bg-terracotta text-white' : 'bg-cream-dark/20'}`}
                  >
                    {t('forecast.package_rate')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold">{listingForm.rateType === 'daily' ? t('forecast.amount_per_day') : t('forecast.total_package_amount')}</label>
                  <input 
                    type="number" 
                    value={listingForm.rateAmount} 
                    onChange={(e) => setListingForm({...listingForm, rateAmount: e.target.value})}
                    placeholder="e.g. 500"
                    className={`p-3 rounded-xl text-sm ${inputTheme}`}
                  />
                </div>
                {listingForm.rateType === 'package' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold">{t('forecast.package_duration')}</label>
                    <input 
                      type="text" 
                      value={listingForm.packageDuration} 
                      onChange={(e) => setListingForm({...listingForm, packageDuration: e.target.value})}
                      placeholder="e.g. 5 Days"
                      className={`p-3 rounded-xl text-sm ${inputTheme}`}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={() => setShowForecastModal(false)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold ${outlineBtnTheme}`}
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleSubmitListing}
                  disabled={isCreatingListing}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold ${primaryBtnTheme} disabled:opacity-50`}
                >
                  {isCreatingListing ? t('forecast.publishing') : t('forecast.publish_listing')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboard;
