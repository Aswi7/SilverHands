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
  AlertCircle
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { SafetyTipsCard } from '../components/TrustSafety';
import { ChatInterface } from '../components/ChatInterface';
import { useAccessibility, SpeakerButton } from '../context/AccessibilityContext';

const UserDashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

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
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Opportunity Matches State ---
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !user.token) return;
      setIsLoading(true);
      setError(null);
      
      try {
        const maxDist = activeDistance === 'near' ? 5000 : 50000;
        const res = await fetch(`http://localhost:5000/api/requests/nearby?maxDistance=${maxDist}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch nearby opportunities');
        }
        
        const data = await res.json();
        
        const mappedData = data.map((req) => ({
          id: req._id,
          title: req.title,
          category: req.category,
          score: Math.floor(Math.random() * (98 - 75) + 75), // Phase 7 placeholder
          rationale: "Matched based on your profile skills and location.", // Phase 7 placeholder
          rate: req.rate || "Negotiable",
          location: req.mode === 'online' ? 'Online' : `Coordinates: [${req.location.coordinates[0].toFixed(2)}, ${req.location.coordinates[1].toFixed(2)}]`,
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
                          <div className={`p-3 rounded-xl border border-dashed flex items-start gap-2 ${
                            highContrast ? 'border-white bg-black' : 'bg-amber-50/50 border-amber-200 text-charcoal'
                          }`}>
                            <Sparkles className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                            <p className="text-xs font-semibold leading-relaxed">
                              "{opp.rationale}"
                            </p>
                          </div>

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

              <ChatInterface user={user} highContrast={highContrast} onNavigate={onNavigate} />
            </div>
          )}

          {/* ================= VIEW: MY PROFILE (STUB) ================= */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">My Matching Profile</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  View and manage details used by the AI matching engine.
                </p>
              </div>

              <div className={`p-6 rounded-3xl flex flex-col gap-4 ${cardTheme}`}>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-terracotta flex items-center justify-center font-bold text-white text-2xl shadow-sm">
                    {(user?.name || 'L')[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{user?.name || 'Lakshmi Devi'}</h3>
                    <p className={`text-xs ${textSecondaryTheme}`}>Role: {user?.role || 'Livelihood Provider'}</p>
                    <p className={`text-xs ${textSecondaryTheme}`}>Phone: {user?.phone || '8888888888'}</p>
                  </div>
                </div>

                <button 
                  onClick={() => onNavigate('onboarding')}
                  className={`flex items-center justify-center gap-2 mt-4 px-6 ${outlineBtnTheme}`}
                >
                  <Sparkles className="h-5 w-5 text-terracotta" />
                  Run AI Onboarding Flow again
                </button>
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

    </div>
  );
};

export default UserDashboard;
