import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Type, 
  Globe, 
  LogOut, 
  Sparkles, 
  Briefcase, 
  Settings, 
  Plus, 
  MapPin, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  Shield, 
  MessageSquare, 
  X, 
  Star, 
  Users
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import { 
  VerificationBadge, 
  RatingDisplay, 
  ReviewCard, 
  SubmitReviewForm, 
  ScamAlertBanner, 
  ReportBlockModal, 
  SafetyTipsCard 
} from '../components/TrustSafety';
import { MatchExplanation } from '../components/MatchExplanation';
import { ChatInterface } from '../components/ChatInterface';
import { useAccessibility, SpeakerButton } from '../context/AccessibilityContext';

const EmployerDashboard = ({ onNavigate }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();

  // Accessibility Global Settings
  const { setPanelOpen, highContrast } = useAccessibility();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('postings');

  // AI Listing Form States
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Structured Preview Fields
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewCategory, setPreviewCategory] = useState('tech');
  const [previewDesc, setPreviewDesc] = useState('');
  const [previewPay, setPreviewPay] = useState('');
  const [previewMode, setPreviewMode] = useState('offline');
  const [previewTiming, setPreviewTiming] = useState('');

  // Selected Posting for Candidates view
  const [selectedPosting, setSelectedPosting] = useState(null);

  // Candidate Profile Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Safety Center States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reviewsList, setReviewsList] = useState([
    { reviewerName: "Asha G.", date: "12/04/2026", rating: 5, text: "Suresh taught my father how to use digital banking. He was incredibly patient." },
    { reviewerName: "Vijay K.", date: "09/02/2026", rating: 4, text: "Punctual and very polite. Helped weed our terrace flowerbeds perfectly." }
  ]);

  // Mock Postings Database
  const [postings, setPostings] = useState([
    {
      id: "mock1",
      title: "Smartphone & Smart TV Setup Tutor",
      category: "tech",
      desc: "Need a patient teacher to explain smartphone features and configure a smart television once a week.",
      pay: "₹400/hr",
      mode: "offline",
      timing: "Weekends (Afternoons)",
      status: "open",
      applicantsCount: 3
    },
    {
      id: "mock2",
      title: "Gujarati Home Chef for Elderly Father",
      category: "cooking",
      desc: "Prepare healthy, low-sugar Gujarati home-cooked meals every weekday morning for an elderly diabetic parent.",
      pay: "₹350/hr",
      mode: "offline",
      timing: "Weekday Mornings (8:00 AM - 10:00 AM)",
      status: "in-progress",
      applicantsCount: 2
    },
    {
      id: "mock3",
      title: "Terrace Garden Maintenance helper",
      category: "gardening",
      desc: "Suggest winter flowers and help weeding a terrace garden twice a month.",
      pay: "₹300/hr",
      mode: "offline",
      timing: "Bi-weekly Saturdays",
      status: "filled",
      applicantsCount: 1
    }
  ]);

  // Candidate Profiles
  const candidateProfiles = [
    {
      id: "c1",
      name: "Ramesh Kumar",
      age: 64,
      role: "Senior Tech Guide & Educator",
      matchScore: 94,
      distance: "1.2 km away",
      rating: 4.9,
      reviewsCount: 18,
      skills: ["Smartphone Tutor", "TV Setup", "Internet Banking", "WhatsApp Helper"],
      availability: "Mon, Wed, Sat (Afternoons)",
      badges: ["phone", "id", "community", "References"],
      bio: "Retired BSNL telecom technician with 35 years of network experience. I enjoy teaching senior citizens how to navigate smartphones without fear.",
      scoreBreakdown: { skillOverlap: 95, distance: '1.2km', availabilityOverlap: true }
    },
    {
      id: "c2",
      name: "Asha Devi",
      age: 62,
      role: "Culinary & Baking Specialist",
      matchScore: 89,
      distance: "0.8 km away",
      rating: 5.0,
      reviewsCount: 24,
      skills: ["Low-Oil Cooking", "Sweets & Snacks", "Dietary Needs", "Gujarati Thali"],
      availability: "Mon to Fri (Mornings)",
      badges: ["phone", "id", "Health Check"],
      bio: "Homemaker for over 38 years specializing in diabetic-friendly traditional Indian meals and baked festival snacks.",
      scoreBreakdown: { skillOverlap: 90, distance: '0.8km', availabilityOverlap: true }
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutofillInput = () => {
    setRawText("I need a patient person who can cook home-cooked meals for my diabetic father every weekday morning. He likes Gujarati and Gujarati-style food. Preferably someone living near Connaught Place.");
  };

  const handleAIStructureListing = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const { data } = await api.post('/ai/structure-listing', { requestText: rawText, language: i18n.language });
      
      if (data) {
        setPreviewTitle(data.title || "Opportunity");
        setPreviewCategory(data.category || "other");
        setPreviewDesc(data.cleanedDescription || rawText);
        setPreviewPay(data.suggestedPayRange || "Negotiable");
        setPreviewTiming(data.suggestedTiming || "Not specified");
        setPreviewMode("offline");
      }
    } catch (error) {
      console.error('AI Structuring failed:', error);
      setPreviewTitle("Opportunity");
      setPreviewCategory("other");
      setPreviewDesc(rawText);
      setPreviewPay("Negotiable");
      setPreviewTiming("Not specified");
      setPreviewMode("offline");
    } finally {
      setIsAnalyzing(false);
      setShowPreview(true);
    }
  };

  const handlePublishOpportunity = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        title: previewTitle,
        description: previewDesc,
        category: previewCategory,
        rate: previewPay,
        timing: previewTiming,
        mode: previewMode,
        location: {
          longitude: user?.location?.coordinates?.[0] || 0,
          latitude: user?.location?.coordinates?.[1] || 0
        }
      };

      const { data } = await api.post('/requests', payload);

      const newPosting = {
        id: data._id,
        title: data.title,
        category: data.category,
        desc: data.description,
        pay: data.rate,
        mode: data.mode,
        timing: data.timing,
        status: data.status,
        applicantsCount: 0
      };

      setPostings([newPosting, ...postings]);
      setRawText('');
      setShowPreview(false);
      setActiveTab('postings');
      alert(`Successfully published "${previewTitle}" opportunity!`);
    } catch (err) {
      console.error('Failed to publish opportunity:', err);
      alert(err.response?.data?.message || 'Failed to publish opportunity. Please try again.');
    }
  };

  // Accessibility Styling Tokens
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
    ? 'border-2 border-yellow-400 bg-black text-yellow-400 hover:bg-yellow-400 hover:text-black font-bold'
    : 'bg-forest hover:bg-forest-hover text-white shadow-md hover:shadow-lg transition-all';

  const outlineBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black h-[48px]'
    : 'border border-cream-dark hover:bg-cream-dark/30 text-charcoal h-[48px] rounded-2xl transition-all';

  const activeSidebarItemTheme = highContrast
    ? 'border-2 border-white bg-white text-black font-bold'
    : 'bg-forest text-white font-bold shadow-md';

  const inactiveSidebarItemTheme = highContrast
    ? 'border border-transparent text-white hover:border-white'
    : 'text-charcoal hover:bg-cream-dark/20';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${bgTheme} transition-colors duration-200 font-sans pb-16 md:pb-0`}>
      
      {/* 1. LEFT SIDEBAR */}
      <aside className={`w-full md:w-64 md:min-h-screen shrink-0 border-r md:sticky md:top-0 z-40 ${
        highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-white'
      } flex md:flex-col justify-between`}>
        
        <div className="w-full">
          {/* Logo Branding */}
          <div className="hidden md:flex items-center gap-2 p-6 border-b border-cream-dark/30 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-extrabold ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
              S
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              SilverHands
            </span>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex flex-col gap-2 p-4">
            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'post' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Plus className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.post')}</span>
            </button>
            <button
              onClick={() => setActiveTab('postings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'postings' || activeTab === 'candidates' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Briefcase className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.postings')}</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'messages' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.messages')}</span>
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'safety' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.safety')}</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'settings' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.settings')}</span>
            </button>
          </nav>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center py-2 px-1 bg-white border-cream-dark shadow-lg">
          <button
            onClick={() => setActiveTab('post')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'post' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Plus className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.post')}</span>
          </button>
          <button
            onClick={() => setActiveTab('postings')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'postings' || activeTab === 'candidates' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.postings')}</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'messages' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.messages')}</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'safety' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.safety')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'settings' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.settings')}</span>
          </button>
        </nav>

        {/* Sidebar bottom safety tips widget */}
        <div className="hidden md:block p-4 border-t border-cream-dark/30">
          <SafetyTipsCard highContrast={highContrast} />
        </div>

        {/* Logout button */}
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

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="grow flex flex-col min-w-0">
        
        {/* TOP GREETER BAR */}
        <header className={`border-b sticky top-0 z-30 px-4 py-3 md:px-8 flex items-center justify-between ${
          highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/90 backdrop-blur-md'
        }`}>
          
          <div className="text-left">
            <h1 className="text-xl font-bold font-serif md:text-2xl flex items-center gap-1.5">
              <span>{t('dashboard.employer.greeting', { name: user?.name || 'Col. Raghavan' })}</span>
              <SpeakerButton text={t('dashboard.employer.greeting', { name: user?.name || 'Col. Raghavan' })} id="employer-dashboard-greeting" />
            </h1>
          </div>

          {/* Quick Accessibility and Language Controls */}
          <div className="flex items-center gap-3">
            
            <button 
              onClick={() => setPanelOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                highContrast ? 'border-white hover:bg-white hover:text-black bg-black text-white' : 'border-cream-dark hover:bg-cream-dark/30 text-charcoal'
              }`}
              aria-label={t('accessibility.options')}
            >
              <Type className="h-4 w-4" />
              <span>{t('dashboard.provider.options')}</span>
            </button>

            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>

            {/* Profile initial badge dynamically computed */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
              highContrast ? 'border border-white bg-black' : 'bg-forest'
            }`}>
              {(user?.name || 'C')[0]}
            </div>

          </div>

        </header>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main className="grow p-4 md:p-8 text-left">

          {/* ================= VIEW 1: POST OPPORTUNITY ================= */}
          {activeTab === 'post' && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.post.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.post.desc')}
                </p>
              </div>

              {/* Text Area Card */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 ${cardTheme}`}>
                
                <div className="flex justify-between items-center">
                  <label htmlFor="rawText" className="text-sm font-bold">{t('dashboard.employer.post.describe')}</label>
                  <button 
                    type="button" 
                    onClick={handleAutofillInput} 
                    className="text-xs font-semibold text-terracotta underline hover:no-underline"
                  >
                    {t('dashboard.employer.post.sample')}
                  </button>
                </div>

                <textarea
                  id="rawText"
                  rows="4"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={t('dashboard.employer.post.placeholder')}
                  className={`w-full px-4 py-3 rounded-2xl text-base ${inputTheme}`}
                />

                <div className="flex justify-end items-center gap-3">
                  <span className="text-xs text-forest font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-terracotta animate-pulse" />
                    {t('dashboard.employer.post.ai_structure')}
                  </span>
                  
                  <button
                    onClick={handleAIStructureListing}
                    disabled={isAnalyzing || !rawText.trim()}
                    className={`px-8 ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isAnalyzing ? t('dashboard.employer.post.analyzing') : t('dashboard.employer.post.analyze_btn')}
                  </button>
                </div>

              </div>

              {/* Structured preview card */}
              {showPreview && (
                <div className="flex flex-col gap-5 mt-4">
                  <h4 className="font-serif text-lg font-bold text-forest flex items-center gap-1.5">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {t('dashboard.employer.post.preview_title')}
                  </h4>

                  <form onSubmit={handlePublishOpportunity} className={`p-6 rounded-3xl flex flex-col gap-4 border-2 ${
                    highContrast ? 'border-white bg-black' : 'border-cream-dark bg-white shadow-md'
                  }`}>
                    
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewTitle" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_title')}</label>
                      <input 
                        type="text" 
                        id="previewTitle"
                        value={previewTitle} 
                        onChange={(e) => setPreviewTitle(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-base font-bold ${inputTheme}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="previewCategory" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_category')}</label>
                        <select 
                          id="previewCategory"
                          value={previewCategory} 
                          onChange={(e) => setPreviewCategory(e.target.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-bold ${inputTheme}`}
                        >
                          <option value="tech">{t('customer.categories.tech')}</option>
                          <option value="cooking">{t('customer.categories.cooking')}</option>
                          <option value="gardening">{t('customer.categories.gardening')}</option>
                          <option value="errands">{t('customer.categories.errands')}</option>
                          <option value="companionship">{t('customer.categories.companionship')}</option>
                          <option value="other">{t('customer.categories.other')}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="previewPay" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_pay')}</label>
                        <input 
                          type="text" 
                          id="previewPay"
                          value={previewPay} 
                          onChange={(e) => setPreviewPay(e.target.value)}
                          className={`px-3 py-2 rounded-xl text-sm font-bold ${inputTheme}`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewDesc" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_desc')}</label>
                      <textarea 
                        id="previewDesc"
                        rows="3" 
                        value={previewDesc} 
                        onChange={(e) => setPreviewDesc(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="previewMode" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_mode')}</label>
                        <select 
                          id="previewMode"
                          value={previewMode} 
                          onChange={(e) => setPreviewMode(e.target.value)}
                          className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                        >
                          <option value="offline">{t('onboarding.offline_only')}</option>
                          <option value="online">{t('onboarding.online_only')}</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label htmlFor="previewTiming" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_timing')}</label>
                        <input 
                          type="text" 
                          id="previewTiming"
                          value={previewTiming} 
                          onChange={(e) => setPreviewTiming(e.target.value)}
                          className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full mt-2 font-bold ${primaryBtnTheme}`}
                    >
                      {t('dashboard.employer.post.publish_btn')}
                    </button>

                  </form>
                </div>
              )}

            </div>
          )}

          {/* ================= VIEW 2: MY POSTINGS ================= */}
          {activeTab === 'postings' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3 border-cream-dark/30">
                <div>
                  <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.postings.title')}</h2>
                  <p className={`text-sm ${textSecondaryTheme} mt-0.5`}>
                    {t('dashboard.employer.postings.desc')}
                  </p>
                </div>

                <button 
                  onClick={() => setActiveTab('post')} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${secondaryBtnTheme}`}
                >
                  <Plus className="h-4 w-4" />
                  {t('dashboard.employer.postings.post_new')}
                </button>
              </div>

              {/* Postings Cards Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {postings.map((p) => (
                  <div key={p.id} className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 ${cardTheme}`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-forest/10 px-2 py-0.5 rounded">
                          {t(`customer.categories.${p.category}`) || p.category}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          p.status === 'open' ? 'bg-green-100 text-green-800' : (p.status === 'in-progress' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800')
                        }`}>
                          {p.status}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-bold mt-2">{p.title}</h3>
                      <p className={`text-xs mt-2 leading-relaxed ${textSecondaryTheme}`}>{p.desc}</p>
                    </div>

                    <div className="border-t pt-4 border-cream-dark/20 flex flex-col gap-3">
                      <div className="flex justify-between items-center text-xs font-bold text-charcoal">
                        <span>{p.pay}</span>
                        <span className="text-gray-500 font-normal">{p.timing}</span>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedPosting(p);
                          setActiveTab('candidates');
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${primaryBtnTheme}`}
                      >
                        <Users className="h-4 w-4" />
                        {t('dashboard.employer.postings.view_matches', { count: p.applicantsCount })}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= VIEW 3: CANDIDATES MATCH ================= */}
          {activeTab === 'candidates' && (
            <div className="flex flex-col gap-6">
              
              <div className="flex items-center gap-3 border-b pb-3 border-cream-dark/30">
                <button 
                  onClick={() => setActiveTab('postings')} 
                  className={`p-2 rounded-xl border text-xs font-bold ${outlineBtnTheme}`}
                >
                  ← {t('dashboard.employer.candidates.back')}
                </button>
                <div>
                  <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.candidates.title')}</h2>
                  <p className={`text-sm ${textSecondaryTheme}`}>
                    {t('dashboard.employer.candidates.desc')} <span className="font-bold text-charcoal">{selectedPosting?.title || 'Selected Request'}</span>
                  </p>
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {candidateProfiles.map((candidate) => (
                  <div key={candidate.id} className={`p-6 rounded-3xl border flex flex-col justify-between gap-5 ${cardTheme}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg text-white bg-forest`}>
                            {candidate.name[0]}
                          </div>
                          <div>
                            <h3 className="font-serif text-lg font-bold">{candidate.name}</h3>
                            <span className={`text-xs ${textSecondaryTheme}`}>{t('dashboard.employer.candidates.age', { age: candidate.age })} • {candidate.distance}</span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-terracotta border border-orange-100">
                          {candidate.matchScore}% {t('dashboard.employer.candidates.match')}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.badges.map(b => (
                          <VerificationBadge key={b} type={b} highContrast={highContrast} />
                        ))}
                      </div>

                      <MatchExplanation 
                        score={candidate.matchScore} 
                        scoreBreakdown={candidate.scoreBreakdown}
                        highContrast={highContrast}
                      />

                      <div className="text-xs space-y-1">
                        <p><span className="font-bold">{t('dashboard.employer.candidates.skills')}</span> {candidate.skills.join(', ')}</p>
                        <p><span className="font-bold">{t('dashboard.employer.candidates.availability')}</span> {candidate.availability}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-4 border-cream-dark/20">
                      <button 
                        onClick={() => setSelectedCandidate(candidate)}
                        className={`flex-grow py-2.5 rounded-xl text-xs font-bold ${outlineBtnTheme}`}
                      >
                        {t('dashboard.employer.candidates.view_profile')}
                      </button>
                      <button 
                        onClick={() => setActiveTab('messages')}
                        className={`flex-grow py-2.5 rounded-xl text-xs font-bold ${primaryBtnTheme}`}
                      >
                        {t('dashboard.employer.candidates.contact')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= VIEW 4: MESSAGES ================= */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-6">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.messages.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.messages.desc')}
                </p>
              </div>

              <ChatInterface 
                user={user} 
                highContrast={highContrast}
                onNavigate={onNavigate}
              />
            </div>
          )}

          {/* ================= VIEW 5: SAFETY CENTER ================= */}
          {activeTab === 'safety' && (
            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
              
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.safety.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1 leading-relaxed`}>
                  {t('dashboard.employer.safety.desc')}
                </p>
              </div>

              {/* Demo Scam Shield Simulation */}
              <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                <h3 className="font-serif text-lg font-bold">{t('dashboard.employer.safety.demo_title')}</h3>
                <p className={`text-xs ${textSecondaryTheme}`}>
                  {t('dashboard.employer.safety.demo_desc')}
                </p>

                <div className="p-4 rounded-2xl bg-cream-dark/20 border border-cream-dark/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold border-b pb-2">
                    <span>{t('dashboard.employer.safety.chat_sim_header')}</span>
                    <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{t('dashboard.employer.safety.active_match_badge')}</span>
                  </div>

                  <ScamAlertBanner 
                    message="AI Flagged: Candidate requested ₹3,500 advance money before work started."
                    onLearnMore={() => alert("SilverHands safety policy prohibits advance cash demands.")}
                    onReport={() => setIsReportOpen(true)}
                    highContrast={highContrast}
                  />
                </div>
              </div>

              {/* Endorsements and Guarantee */}
              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Recent Endorsements */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                  <h3 className="font-serif text-lg font-bold">{t('dashboard.employer.safety.endorsements_title')}</h3>
                  <div className="flex flex-col gap-3">
                    {reviewsList.map((rev, idx) => (
                      <ReviewCard key={idx} {...rev} highContrast={highContrast} />
                    ))}
                  </div>

                  <SubmitReviewForm 
                    onSubmit={(newRev) => setReviewsList([newRev, ...reviewsList])}
                    highContrast={highContrast}
                  />
                </div>

                {/* Safety Guarantee */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                  <h3 className="font-serif text-lg font-bold">{t('dashboard.employer.safety.guarantee_title')}</h3>
                  <div className="space-y-3 text-xs leading-relaxed text-charcoal-light">
                    <p>{t('dashboard.employer.safety.guarantee_item1')}</p>
                    <p>{t('dashboard.employer.safety.guarantee_item2')}</p>
                    <p>{t('dashboard.employer.safety.guarantee_item3')}</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= VIEW 6: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
              <div className="border-b pb-4 border-cream-dark/50">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.settings.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.settings.desc')}
                </p>
              </div>

              <div className={`p-6 rounded-3xl border flex flex-col gap-3 ${cardTheme}`}>
                <h3 className="font-bold text-base">{t('dashboard.provider.settings.need_help')}</h3>
                <p className="text-xs text-charcoal-light leading-relaxed">
                  {t('dashboard.employer.settings.helpline')}
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* CANDIDATE MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border text-left flex flex-col gap-4 animate-[slideUp_0.25s_ease-out] ${
            highContrast ? 'bg-black text-white border-white' : 'bg-white border-cream-dark'
          }`}>
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif text-xl font-bold">{selectedCandidate.name}</h3>
              <button onClick={() => setSelectedCandidate(null)} className="p-1 rounded-full hover:bg-cream-dark/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs leading-relaxed text-charcoal-light">{selectedCandidate.bio}</p>

            <div className="flex flex-wrap gap-1.5">
              {selectedCandidate.badges.map(b => (
                <VerificationBadge key={b} type={b} highContrast={highContrast} />
              ))}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setSelectedCandidate(null)} className={`px-4 py-2 rounded-xl text-xs font-bold ${outlineBtnTheme}`}>
                {t('common.close')}
              </button>
              <button 
                onClick={() => {
                  setSelectedCandidate(null);
                  setActiveTab('messages');
                }}
                className={`px-6 py-2 rounded-xl text-xs font-bold ${primaryBtnTheme}`}
              >
                {t('dashboard.employer.candidates.contact')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      <ReportBlockModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSubmit={(rep) => alert("Report filed with SilverHands safety team.")}
        targetName="Suspicious Account"
        highContrast={highContrast}
      />

    </div>
  );
};

export default EmployerDashboard;
