import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Type, 
  Eye, 
  Globe, 
  LogOut, 
  Sparkles, 
  Briefcase, 
  MessageSquare, 
  TrendingUp, 
  User, 
  Settings, 
  Home, 
  Bell, 
  Bookmark, 
  BookmarkCheck, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Info,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Calendar,
  AlertCircle,
  Bot,
  X
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import { SafetyTipsCard } from '../components/TrustSafety';
import { MatchExplanation } from '../components/MatchExplanation';
import { ChatInterface } from '../components/ChatInterface';
import { useAccessibility, SpeakerButton } from '../context/AccessibilityContext';
import { forecastData } from '../data/forecastData';

const UserDashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout, updateUserInState } = useAuth();

  // Accessibility Global Settings
  const { setPanelOpen, highContrast, fontSize } = useAccessibility();

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
    // If the user hasn't completed onboarding, they might have no skills yet.
    // For the sake of the MVP demo, if Asha Devi is logged in, default match cooking.
    const hasSkillMatch = event.relevantCategories.some(cat => 
      userSkillCategories.some(skill => skill.toLowerCase().includes(cat.toLowerCase()))
    );
    const isRelevant = hasSkillMatch || (user?.name === 'Asha Devi' && event.relevantCategories.includes('cooking'));
    return { ...event, isRelevant };
  });

  const topForecast = relevantForecasts.find(f => f.isRelevant) || relevantForecasts[0];

  const handlePrepareListing = (forecast) => {
    setSelectedForecast(forecast);
    setListingForm({
      title: forecast.suggestionTitle,
      category: forecast.suggestionCategory,
      description: `I am offering ${forecast.suggestionTitle.toLowerCase()} services for the upcoming ${forecast.eventName}.`,
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
      setActiveTab('profile'); // Send them to profile to see the new listing
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
      const { data } = await api.post(`/ai/extract-skills`, { bio: bioText });
      
      if (data && data.skills) {
        setExtractedSkills(data.skills);
        
        // Save the new bio and skills to the backend automatically
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

  // Navigation Items
  const sidebarItems = [
    { id: 'matches', label: t('dashboard.provider.tabs.matches'), icon: Sparkles },
    { id: 'forecast', label: t('dashboard.provider.tabs.forecast') || 'Forecasts', icon: Calendar },
    { id: 'applications', label: t('dashboard.provider.tabs.applications'), icon: Briefcase },
    { id: 'earnings', label: t('dashboard.provider.tabs.earnings'), icon: TrendingUp },
    { id: 'messages', label: t('dashboard.provider.tabs.messages'), icon: MessageSquare },
    { id: 'profile', label: t('dashboard.provider.tabs.profile'), icon: User },
    { id: 'settings', label: t('dashboard.provider.tabs.settings'), icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${bgTheme} transition-colors duration-200 font-sans`}>
      
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
          {sidebarItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                  isActive 
                    ? 'text-terracotta' 
                    : (highContrast ? 'text-white' : 'text-charcoal-light hover:text-terracotta')
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'text-terracotta' : 'text-charcoal-light'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </button>
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
              <SpeakerButton text={`Good morning, ${user?.name || 'Lakshmi'}. Welcome back to your SilverHands Provider Dashboard.`} id="provider-dashboard-greeting" />
            </h1>
          </div>

          {/* Quick Accessibility and Profile Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Aa Accessibility Controls */}
            <button 
              onClick={() => setPanelOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                highContrast ? 'border-white hover:bg-white hover:text-black bg-black text-white' : 'border-cream-dark hover:bg-cream-dark/30 text-charcoal'
              }`}
              aria-label="Open Accessibility Panel"
            >
              <Type className="h-4 w-4" />
              <span>{t('dashboard.provider.options')}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`relative h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${
                  highContrast ? 'border-white' : 'border-cream-dark hover:bg-cream-dark/30'
                }`}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-terracotta" />
                )}
              </button>

              {/* Notification Dropdown panel */}
              {showNotifDropdown && (
                <div className={`absolute right-0 mt-2 w-80 rounded-2xl p-4 z-50 text-left ${cardTheme}`}>
                  <h4 className="font-bold border-b pb-2 mb-2">Notifications</h4>
                  <div className="flex flex-col gap-2.5">
                    {notifications.map(n => (
                      <div key={n.id} className="text-xs flex flex-col gap-1 border-b pb-2 last:border-0 border-cream-dark/30">
                        <p className={`${n.unread ? 'font-bold' : ''}`}>{n.text}</p>
                        <span className="text-gray-400 font-mono">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Language */}
            <div className="flex items-center gap-1.5">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                highContrast ? 'border border-white bg-black' : 'bg-forest'
              }`}>
                {(user?.name || 'L')[0]}
              </div>
            </div>

          </div>

        </header>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main className="grow p-4 md:p-8 pb-24 md:pb-8">

          {/* ================= VIEW: MY MATCHES (AI CENTERPIECE) ================= */}
          {activeTab === 'matches' && (
            <div className="flex flex-col gap-6 text-left">
              
              {/* Dynamic Opportunity Forecast Banner */}
              {topForecast && (
                <div className={`p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 ${
                  highContrast 
                    ? 'border-white bg-black text-white' 
                    : 'bg-gradient-to-r from-orange-50 to-amber-50 border-terracotta text-charcoal'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl shrink-0 mt-1">{topForecast.eventName.split(' ')[0]}</div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-lg text-terracotta flex items-center gap-2">
                        {topForecast.eventName} is coming up! 
                        <span className="px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-[10px] uppercase font-bold tracking-wider">
                          AI Forecast
                        </span>
                      </h4>
                      <p className="text-sm font-semibold mt-1">{topForecast.insight}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        *AI estimate based on historical seasonal patterns
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePrepareListing(topForecast)}
                    className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${primaryBtnTheme}`}
                  >
                    <Sparkles className="h-4 w-4" />
                    Prepare My Listing
                  </button>
                </div>
              )}

              {/* AI learning preference banner */}
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
                highContrast 
                  ? 'border-white bg-black text-white' 
                  : 'bg-teal-50 border-teal-200 text-forest'
              }`}>
                <Info className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">
                    {t('dashboard.provider.matches.ai_tip')}
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex flex-col gap-4 border-b pb-4 border-cream-dark/30">
                
                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase flex items-center mr-2">{t('dashboard.provider.matches.category')}</span>
                  {[
                    { id: 'all', label: t('dashboard.provider.matches.all_categories') },
                    { id: 'cooking', label: t('dashboard.provider.matches.cooking') },
                    { id: 'tutoring', label: t('dashboard.provider.matches.tutoring') },
                    { id: 'gardening', label: t('dashboard.provider.matches.gardening') },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        activeCategory === cat.id
                          ? (highContrast ? 'bg-white text-black border-white' : 'bg-terracotta text-white border-terracotta')
                          : (highContrast ? 'border-white bg-black text-white hover:bg-white hover:text-black' : 'bg-white border-cream-dark hover:bg-cream-dark/20 text-charcoal-light')
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Distance / Mode Filters */}
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  
                  {/* Distance selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 uppercase">{t('dashboard.provider.matches.distance')}</span>
                    <div className="flex rounded-lg overflow-hidden border border-cream-dark">
                      {[
                        { id: 'all', label: t('dashboard.provider.matches.any') },
                        { id: 'near', label: t('dashboard.provider.matches.nearby') }
                      ].map(dist => (
                        <button
                          key={dist.id}
                          onClick={() => setActiveDistance(dist.id)}
                          className={`px-3 py-1.5 border-r last:border-0 ${
                            activeDistance === dist.id 
                              ? 'bg-forest text-white' 
                              : 'bg-white text-charcoal hover:bg-cream-dark/10'
                          }`}
                        >
                          {dist.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 uppercase">{t('dashboard.provider.matches.mode')}</span>
                    <div className="flex rounded-lg overflow-hidden border border-cream-dark">
                      {[
                        { id: 'all', label: t('dashboard.provider.matches.all') },
                        { id: 'online', label: t('dashboard.provider.matches.online') },
                        { id: 'offline', label: t('dashboard.provider.matches.offline') }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setActiveMode(mode.id)}
                          className={`px-3 py-1.5 border-r last:border-0 ${
                            activeMode === mode.id 
                              ? 'bg-forest text-white' 
                              : 'bg-white text-charcoal hover:bg-cream-dark/10'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Opportunity Matches grid */}
              {isLoading ? (
                <div className={`p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-4 ${cardTheme}`}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
                  <p className={`text-sm font-bold ${textSecondaryTheme}`}>Loading nearby opportunities...</p>
                </div>
              ) : error ? (
                <div className={`p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-4 border border-red-200 bg-red-50 text-red-600`}>
                  <p className="text-sm font-bold">{error}</p>
                  <button onClick={() => window.location.reload()} className="text-terracotta underline text-xs font-bold">Retry</button>
                </div>
              ) : filteredOpportunities.length === 0 ? (
                /* EMPTY STATE */
                <div className={`p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-4 ${cardTheme}`}>
                  <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
                    🌾
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold">{t('dashboard.provider.matches.empty_title')}</h3>
                    <p className={`text-sm ${textSecondaryTheme} mt-1 max-w-sm mx-auto`}>
                      {t('dashboard.provider.matches.empty_desc')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className={`px-6 py-2.5 text-sm font-bold ${outlineBtnTheme}`}
                  >
                    {t('dashboard.provider.matches.complete_profile')}
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {filteredOpportunities.map((opp) => {
                    const isBookmarked = bookmarkedIds.includes(opp.id);
                    return (
                      <div 
                        key={opp.id} 
                        className={`p-6 rounded-3xl border transition-all hover:-translate-y-0.5 flex flex-col justify-between relative overflow-hidden ${
                          highContrast 
                            ? 'border-white bg-black text-white hover:border-yellow-400' 
                            : 'bg-white border-cream-dark shadow-sm hover:shadow-md hover:border-cream-dark'
                        }`}
                      >
                        {/* Match Score circular Badge */}
                        <div className={`absolute top-4 right-4 h-14 w-14 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold leading-none ${
                          highContrast ? 'border-2 border-white bg-black' : 'bg-terracotta shadow-sm'
                        }`}>
                          <span className="text-base">{opp.score}%</span>
                          <span className="text-[8px] uppercase font-bold">{t('dashboard.provider.matches.match')}</span>
                        </div>

                        <div className="flex flex-col gap-3 text-left">
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'
                            }`}>
                              {opp.category}
                            </span>
                          </div>

                          <h3 className="text-xl font-extrabold pr-14 leading-tight font-serif">{opp.title}</h3>
                          <p className={`text-sm ${textSecondaryTheme} leading-relaxed`}>{opp.description}</p>

                          {/* AI Match Rationale explanation */}
                          <MatchExplanation opp={opp} highContrast={highContrast} />

                          {/* Details Metadata */}
                          <div className="grid grid-cols-2 gap-3 text-xs border-t pt-3 mt-1 border-cream-dark/30">
                            <span className="flex items-center gap-1 font-bold text-forest">
                              <IndianRupee className="h-3.5 w-3.5" /> {opp.rate}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-gray-500">
                              <MapPin className="h-3.5 w-3.5" /> {opp.location}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-gray-500 col-span-2">
                              <Clock className="h-3.5 w-3.5" /> {t('dashboard.provider.matches.posted')} {opp.posted}
                            </span>
                          </div>

                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-6 border-t pt-4 border-cream-dark/30">
                          <button
                            onClick={() => {
                              alert(`Applied for "${opp.title}" opportunity match!`);
                            }}
                            className={`grow font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 ${primaryBtnTheme}`}
                          >
                            {t('dashboard.provider.matches.interested')}
                          </button>
                          <button
                            onClick={() => {
                              alert(`Archived "${opp.title}" match`);
                            }}
                            className={`px-4 rounded-xl text-sm font-bold ${outlineBtnTheme}`}
                          >
                            {t('dashboard.provider.matches.maybe_later')}
                          </button>
                          <button
                            onClick={() => toggleBookmark(opp.id)}
                            className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-all ${
                              isBookmarked
                                ? (highContrast ? 'border-white bg-white text-black' : 'bg-forest/10 border-forest text-forest')
                                : (highContrast ? 'border-white bg-black text-white hover:bg-white hover:text-black' : 'border-cream-dark hover:bg-cream-dark/20 text-gray-400')
                            }`}
                            aria-label="Bookmark Opportunity"
                          >
                            {isBookmarked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ================= VIEW: OPPORTUNITY FORECAST ================= */}
          {activeTab === 'forecast' && (
            <div className="flex flex-col gap-6 text-left">
              
              <div className="border-b pb-4 border-cream-dark/30 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-terracotta" />
                    Opportunity Forecast
                  </h2>
                  <p className={`text-sm ${textSecondaryTheme} mt-2`}>
                    Plan ahead and prepare your services. <br/>
                    <span className="italic text-xs text-gray-500">*AI estimate based on historical seasonal patterns</span>
                  </p>
                </div>
              </div>

              <div className="grid gap-6">
                {relevantForecasts.map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden transition-all ${
                      event.isRelevant
                        ? (highContrast ? 'border-yellow-400 bg-black' : 'border-terracotta bg-orange-50/30')
                        : cardTheme
                    }`}
                  >
                    {event.isRelevant && (
                      <div className="absolute top-0 right-0 bg-terracotta text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Relevant to you
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{event.eventName.split(' ')[0]}</span>
                        <div>
                          <h3 className="font-serif text-2xl font-bold">{event.eventName.slice(2)}</h3>
                          <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> {event.dateRange}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Relevant Categories</span>
                        <div className="flex gap-2 mt-1">
                          {event.relevantCategories.map(cat => (
                            <span key={cat} className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              highContrast ? 'border border-white text-white' : 'bg-cream-dark/30 text-charcoal'
                            }`}>
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`md:w-72 shrink-0 p-5 rounded-2xl flex flex-col justify-center border border-dashed ${
                      highContrast ? 'border-gray-600' : 'bg-white border-terracotta/30 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="font-bold text-lg text-green-700">Demand {event.demandUplift}</span>
                      </div>
                      <p className={`text-sm ${textSecondaryTheme} leading-relaxed`}>{event.insight}</p>
                      
                      {event.isRelevant && (
                        <button
                          onClick={() => handlePrepareListing(event)}
                          className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                            highContrast ? 'bg-white text-black hover:bg-yellow-400' : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-md'
                          }`}
                        >
                          <Sparkles className="h-4 w-4" />
                          Prepare My Listing
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= VIEW: APPLICATIONS KANBAN ================= */}
          {activeTab === 'applications' && (
            <div className="flex flex-col gap-6 text-left">
              
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.applications.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.applications.desc')}
                </p>
              </div>

              {/* Kanban Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                
                {/* Column 1: Applied */}
                <div className={`p-4 rounded-2xl border ${highContrast ? 'border-white' : 'bg-cream-dark/10 border-cream-dark/50'}`}>
                  <h4 className="font-serif font-bold text-base mb-3 flex justify-between items-center text-charcoal">
                    <span>{t('dashboard.provider.applications.applied')}</span>
                    <span className="text-xs bg-cream-dark/40 px-2 py-0.5 rounded font-mono">1</span>
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 ${cardTheme}`}>
                      <span className="font-bold block text-sm">Primary School English Tutor</span>
                      <p className={textSecondaryTheme}>By: Mrunal Patel</p>
                      <span className="font-mono text-gray-400 block border-t pt-2">Applied: Aug 15, 2026</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Contacted */}
                <div className={`p-4 rounded-2xl border ${highContrast ? 'border-white' : 'bg-cream-dark/10 border-cream-dark/50'}`}>
                  <h4 className="font-serif font-bold text-base mb-3 flex justify-between items-center text-forest">
                    <span>{t('dashboard.provider.applications.contacted')}</span>
                    <span className="text-xs bg-cream-dark/40 px-2 py-0.5 rounded font-mono">1</span>
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 ${cardTheme} border-l-4 border-l-forest`}>
                      <span className="font-bold block text-sm">Traditional South Indian Cooking</span>
                      <p className={textSecondaryTheme}>By: Col. Raghavan</p>
                      <span className="font-semibold text-forest block">📞 Phone Interview scheduled</span>
                      <span className="font-mono text-gray-400 block border-t pt-2">Contacted: Today 10 AM</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Confirmed */}
                <div className={`p-4 rounded-2xl border ${highContrast ? 'border-white' : 'bg-cream-dark/10 border-cream-dark/50'}`}>
                  <h4 className="font-serif font-bold text-base mb-3 flex justify-between items-center text-teal-600">
                    <span>{t('dashboard.provider.applications.confirmed')}</span>
                    <span className="text-xs bg-cream-dark/40 px-2 py-0.5 rounded font-mono">1</span>
                  </h4>
                  <div className="flex flex-col gap-3">
                    <div className={`p-4 rounded-xl text-xs flex flex-col gap-2 ${cardTheme} border-l-4 border-l-teal-500`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">Houseplant Care & Gardening</span>
                        <CheckCircle className="h-4 w-4 text-teal-500 shrink-0" />
                      </div>
                      <p className={textSecondaryTheme}>By: Asha Devi</p>
                      <span className="font-semibold text-teal-600">📅 Gigs starts next Monday</span>
                      <span className="font-mono text-gray-400 block border-t pt-2">Confirmed: Aug 14, 2026</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= VIEW: EARNINGS ================= */}
          {activeTab === 'earnings' && (
            <div className="flex flex-col gap-6 text-left">
              
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.earnings.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.earnings.desc')}
                </p>
              </div>

              {/* Total Card */}
              <div className={`p-8 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left ${cardTheme}`}>
                <div className="sm:col-span-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.provider.earnings.this_month')}</span>
                  <h3 className="text-4xl font-extrabold text-forest mt-1 flex items-center justify-center sm:justify-start">
                    <IndianRupee className="h-8 w-8" />
                    12,400
                  </h3>
                  <p className="text-xs text-green-600 mt-1">✓ Direct bank deposits complete</p>
                </div>
                <div className="flex flex-col justify-center gap-1.5 border-t sm:border-t-0 sm:border-l border-cream-dark/50 pt-4 sm:pt-0 sm:pl-6 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{t('dashboard.provider.earnings.total_hours')}</span>
                    <p className="text-base font-bold">36 Hours</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{t('dashboard.provider.earnings.services_provided')}</span>
                    <p className="text-base font-bold">3 Local Households</p>
                  </div>
                </div>
              </div>

              {/* Stylized Bar Chart Placeholder */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 ${cardTheme}`}>
                <h4 className="font-bold text-sm text-gray-400 uppercase">Monthly Earnings chart</h4>
                
                <div className="h-48 flex items-end gap-5 border-b border-cream-dark/50 pb-2">
                  {/* Columns */}
                  {[
                    { month: 'Mar', value: '40%' },
                    { month: 'Apr', value: '55%' },
                    { month: 'May', value: '30%' },
                    { month: 'Jun', value: '70%' },
                    { month: 'Jul', value: '85%' },
                    { month: 'Aug', value: '92%' }
                  ].map((col, index) => (
                    <div key={index} className="grow flex flex-col items-center gap-2">
                      <div 
                        style={{ height: col.value }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          index === 5 
                            ? (highContrast ? 'bg-white' : 'bg-terracotta') 
                            : (highContrast ? 'bg-gray-700' : 'bg-forest')
                        }`} 
                      />
                      <span className="text-xs font-bold text-gray-500 font-mono">{col.month}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW: MESSAGES ================= */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.provider.messages.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.provider.messages.desc')}
                </p>
              </div>

              <ChatInterface 
                user={user} 
                highContrast={highContrast} 
                onNavigate={onNavigate} 
                onPrepareListing={() => handlePrepareListing(topForecast)} 
              />
            </div>
          )}

          {/* ================= VIEW: MY PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30 mb-6">
                <h2 className="font-serif text-2xl font-bold">My Profile</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  View your details and update your AI-extracted skills.
                </p>
              </div>

              {/* Profile Overview Card */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 mb-2 ${cardTheme}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center font-serif text-2xl font-extrabold shadow-sm ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
                      {user?.name ? user.name[0] : 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif">{user?.name || 'User Name'}</h3>
                      <p className={`text-sm mt-0.5 ${textSecondaryTheme}`}>
                        {user?.phone || 'No phone'} • Language: <span className="uppercase font-semibold">{user?.preferredLanguage || 'en'}</span>
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-center ${
                    highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'
                  }`}>
                    {user?.role === 'provider' ? 'Service Provider' : 'User'}
                  </span>
                </div>

                {user?.bio && (
                  <div className="mt-4 pt-4 border-t border-cream-dark/30">
                    <h4 className="text-sm font-bold text-forest mb-2 flex items-center gap-1.5">
                      <User className="h-4 w-4" /> My Bio
                    </h4>
                    <p className={`text-sm leading-relaxed ${textSecondaryTheme} italic bg-cream/20 p-4 rounded-xl border border-cream-dark/30`}>
                      "{user.bio}"
                    </p>
                  </div>
                )}
              </div>

              {/* My Published Services (Listings) */}
              {user?.role === 'provider' && providerListings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-cream-dark/30">
                  <h4 className="text-sm font-bold text-forest mb-4 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" /> My Published Services
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerListings.map(listing => (
                      <div key={listing._id} className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                        highContrast ? 'border-white bg-black' : 'border-cream-dark bg-white shadow-sm'
                      }`}>
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-sm text-charcoal">{listing.title}</h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            highContrast ? 'bg-yellow-400 text-black' : 'bg-terracotta text-white'
                          }`}>
                            Active
                          </span>
                        </div>
                        <span className="text-xs text-forest font-semibold uppercase">{listing.category}</span>
                        <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${highContrast ? 'text-gray-300' : 'text-gray-500'}`}>
                          {listing.description}
                        </p>
                        <div className="mt-2 pt-2 border-t border-cream-dark/20 flex justify-between items-center text-sm font-bold">
                          <span className="flex items-center gap-1">
                            <span className="flex items-center"><IndianRupee className="h-3 w-3" />{listing.rateAmount}</span>
                            <span className={`text-[10px] uppercase font-semibold ${highContrast ? 'text-gray-400' : 'text-gray-500'}`}>
                              {listing.rateType === 'package' ? `/ ${listing.packageDuration || 'Package'}` : '/ Day'}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio / AI Extraction Section */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 mt-6 ${cardTheme}`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Bot className="h-5 w-5 text-terracotta" />
                  Update Skills via AI
                </h3>
                <p className={`text-sm ${textSecondaryTheme}`}>
                  Tell us about your experience in your own words, and our AI will automatically map your skills.
                </p>
                
                <div className="relative">
                  <textarea 
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="e.g. I have 15 years of experience as a high school math teacher, and I also love baking cakes for birthdays..."
                    rows="4"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border focus:outline-none focus:ring-1 focus:ring-terracotta focus:border-terracotta pr-12 ${
                      highContrast ? 'border-white bg-black text-white' : 'border-cream-dark bg-cream-dark/20 text-charcoal'
                    }`}
                  />
                  <button 
                    onClick={handleListenBio}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
                      isListeningBio 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                        : (highContrast ? 'bg-white text-black hover:bg-yellow-400' : 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20')
                    }`}
                    title="Dictate with voice"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExtractSkills}
                    disabled={isExtracting || !bioText.trim()}
                    className={`flex items-center justify-center gap-2 px-6 ${primaryBtnTheme} ${isExtracting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isExtracting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Extracting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Extract Skills
                      </>
                    )}
                  </button>
                  {extractError && <span className="text-red-500 text-xs font-bold">{extractError}</span>}
                </div>

                {/* Extracted Skills UI */}
                {extractedSkills.length > 0 && (
                  <div className="mt-4 border-t border-cream-dark/30 pt-4">
                    <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-forest">Extracted Skills Review</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedSkills.map((skill, index) => {
                        // Check if it's the new object format or the old string format fallback
                        const isObject = typeof skill === 'object';
                        const skillName = isObject ? skill.skillName : skill;
                        const confidence = isObject ? skill.confidence : 1;
                        const isLowConfidence = confidence < 0.7;

                        return (
                          <div 
                            key={index} 
                            className={`flex flex-col gap-1 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                              isLowConfidence 
                                ? 'bg-orange-50 border-orange-200 text-orange-800' 
                                : highContrast ? 'border-white bg-black text-white' : 'bg-teal-50 text-forest border-teal-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{skillName}</span>
                              <button 
                                onClick={() => handleRemoveExtractedSkill(index)}
                                className={`hover:text-red-500 focus:outline-none ${isLowConfidence ? 'text-orange-500' : ''}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {isObject && (
                              <div className={`text-[10px] font-normal flex gap-2 ${isLowConfidence ? 'text-orange-600' : 'text-teal-600'}`}>
                                <span>Level: {skill.experienceLevel}</span>
                                <span>•</span>
                                <span>Category: {skill.category}</span>
                              </div>
                            )}
                            {isLowConfidence && (
                              <p className="text-[10px] text-orange-600 italic mt-1">Not sure about this one — please confirm</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW: SETTINGS (STUB) ================= */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">Account Settings</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  Manage preferences, privacy settings, and bank details.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className={`p-6 rounded-3xl ${cardTheme} flex flex-col gap-3`}>
                  <h4 className="font-bold text-sm text-forest">Preferences</h4>
                  <div className="flex justify-between items-center text-xs">
                    <span>Email notifications</span>
                    <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  </div>
                  <div className="flex justify-between items-center text-xs border-t pt-3 border-cream-dark/30">
                    <span>SMS Alert matches</span>
                    <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                  </div>
                </div>

                <div className={`p-6 rounded-3xl ${cardTheme} flex flex-col justify-center items-center text-center gap-2`}>
                  <AlertCircle className="h-8 w-8 text-forest" />
                  <h4 className="font-bold text-sm">Need Help?</h4>
                  <p className="text-xs text-gray-500">Contact SilverHands dedicated support helpline at: <strong>+91 99999-88888</strong></p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- PREPARE LISTING MODAL (Module 7 Full Form) --- */}
      {showForecastModal && selectedForecast && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto backdrop-blur-sm">
          <div className={`w-full max-w-xl rounded-3xl p-8 relative shadow-2xl mb-12 ${
            highContrast ? 'bg-black border-2 border-white text-white' : 'bg-white text-charcoal'
          }`}>
            <button 
              onClick={() => setShowForecastModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isCreatingListing}
            >
              <X className={`h-6 w-6 ${highContrast ? 'text-white' : 'text-gray-500'}`} />
            </button>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center shrink-0 border border-orange-200">
                  <Sparkles className="h-8 w-8 text-terracotta" />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold">Create Service Listing</h3>
                  <p className={`text-sm ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                    Publish your offering to meet the upcoming <strong>{selectedForecast.eventName}</strong> demand.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase">Service Title</label>
                  <input
                    type="text"
                    value={listingForm.title}
                    onChange={(e) => setListingForm({...listingForm, title: e.target.value})}
                    className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all ${
                      highContrast 
                        ? 'bg-black border-white focus:border-yellow-400 text-white' 
                        : 'bg-white border-cream-dark focus:border-terracotta text-charcoal'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase">Category</label>
                  <input
                    type="text"
                    value={listingForm.category}
                    onChange={(e) => setListingForm({...listingForm, category: e.target.value})}
                    className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all ${
                      highContrast 
                        ? 'bg-black border-white focus:border-yellow-400 text-white' 
                        : 'bg-white border-cream-dark focus:border-terracotta text-charcoal'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-gray-500 uppercase">Rate Structure</label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="rateType" 
                          value="daily" 
                          checked={listingForm.rateType === 'daily'}
                          onChange={(e) => setListingForm({...listingForm, rateType: e.target.value})}
                          className="w-4 h-4 text-terracotta"
                        />
                        <span className="text-sm font-semibold">One-Day Rate</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="rateType" 
                          value="package" 
                          checked={listingForm.rateType === 'package'}
                          onChange={(e) => setListingForm({...listingForm, rateType: e.target.value})}
                          className="w-4 h-4 text-terracotta"
                        />
                        <span className="text-sm font-semibold">Package Rate</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase">
                      {listingForm.rateType === 'daily' ? 'Amount (per day)' : 'Total Package Amount'}
                    </label>
                    <input
                      type="number"
                      value={listingForm.rateAmount}
                      onChange={(e) => setListingForm({...listingForm, rateAmount: e.target.value})}
                      placeholder="e.g. 500"
                      className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all ${
                        highContrast 
                          ? 'bg-black border-white focus:border-yellow-400 text-white' 
                          : 'bg-white border-cream-dark focus:border-terracotta text-charcoal'
                      }`}
                    />
                  </div>

                  {listingForm.rateType === 'package' && (
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase">Package Duration</label>
                      <input
                        type="text"
                        value={listingForm.packageDuration}
                        onChange={(e) => setListingForm({...listingForm, packageDuration: e.target.value})}
                        placeholder="e.g. 3 Days or 1 Week"
                        className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all ${
                          highContrast 
                            ? 'bg-black border-white focus:border-yellow-400 text-white' 
                            : 'bg-white border-cream-dark focus:border-terracotta text-charcoal'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    rows={4}
                    value={listingForm.description}
                    onChange={(e) => setListingForm({...listingForm, description: e.target.value})}
                    className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all ${
                      highContrast 
                        ? 'bg-black border-white focus:border-yellow-400 text-white' 
                        : 'bg-white border-cream-dark focus:border-terracotta text-charcoal'
                    }`}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmitListing}
                disabled={isCreatingListing}
                className={`w-full py-4 rounded-xl font-bold mt-4 text-base transition-all ${
                  isCreatingListing ? 'opacity-70 cursor-not-allowed' : ''
                } ${primaryBtnTheme}`}
              >
                {isCreatingListing ? 'Publishing...' : 'Publish Listing'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default UserDashboard;
