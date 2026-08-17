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
  Settings, 
  Plus, 
  Bell, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Info,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  User,
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
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Accessibility Global Settings
  const { setPanelOpen, highContrast, fontSize } = useAccessibility();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('postings');

  // AI Listing Form States
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Structured Preview Fields (Editable inline)
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
      status: "open", // 'open', 'in-progress', 'filled'
      applicantsCount: 3
    },
    {
      id: 2,
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
      id: 3,
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

  // Mock Candidate list for matched profiles



  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('landing');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Handlers ---
  const handleAutofillInput = () => {
    setRawText("I need a patient person who can cook home-cooked meals for my diabetic father every weekday morning. He likes Gujarati and Gujarati-style food. Preferably someone living near Connaught Place.");
  };

  const handleAIStructureListing = async () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    
    try {
      const { data } = await api.post('/ai/structure-listing', { requestText: rawText });
      
      if (data) {
        setPreviewTitle(data.title || "Opportunity");
        setPreviewCategory(data.category || "other");
        setPreviewDesc(data.cleanedDescription || rawText);
        setPreviewPay(data.suggestedPayRange || "Negotiable");
        setPreviewTiming(data.suggestedTiming || "Not specified");
        
        // Mode isn't extracted by our schema, so we default to offline
        setPreviewMode("offline");
      }
    } catch (error) {
      console.error('AI Structuring failed:', error);
      // Fallback if AI fails: pre-fill with raw data so user isn't blocked
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

      // Append returned data format to mock postings for immediate UI response
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
      // Replace alert with a less obtrusive approach or keep it for MVP
      alert(`Successfully published "${previewTitle}" opportunity list!`);
    } catch (err) {
      console.error('Failed to publish opportunity:', err);
      alert(err.response?.data?.message || 'Failed to publish opportunity. Please try again.');
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
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black font-bold h-[48px]'
    : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-md hover:shadow-lg font-bold h-[48px] rounded-2xl transition-all';

  const secondaryBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black h-[48px]'
    : 'bg-forest hover:bg-forest-hover text-white shadow-md hover:shadow-lg font-bold h-[48px] rounded-2xl transition-all';

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
    <div className={`min-h-screen flex flex-col md:flex-row ${bgTheme} transition-colors duration-200 font-sans`}>
      
      {/* 1. LEFT SIDEBAR (Desktop) / BOTTOM NAV (Mobile) */}
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
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'settings' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>{t('dashboard.employer.tabs.settings')}</span>
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
          </nav>
        </div>

        {/* Mobile Bottom Navigation fallback */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex justify-around items-center py-2 px-1 bg-white border-cream-dark shadow-lg">
          <button
            onClick={() => setActiveTab('post')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'post' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Plus className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.post')}</span>
          </button>
          <button
            onClick={() => setActiveTab('postings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'postings' || activeTab === 'candidates' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.postings')}</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'messages' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.messages', 'Messages')}</span>
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'safety' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.safety', 'Safety')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>{t('dashboard.employer.tabs.settings', 'Settings')}</span>
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
              <SpeakerButton text={t('dashboard.employer.speaking_greeting', 'Good morning, Colonel Raghavan. Welcome back to your SilverHands Employer Dashboard.')} id="employer-dashboard-greeting" />
            </h1>
          </div>

          {/* Quick Accessibility and Bell Controls */}
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

            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>

            {/* Profile badge */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
              highContrast ? 'border border-white bg-black' : 'bg-forest'
            }`}>
              R
            </div>

          </div>

        </header>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main className="grow p-4 md:p-8 pb-24 md:pb-8 text-left">

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

              {/* Structured preview card (editable inline) */}
              {showPreview && (
                <div className="flex flex-col gap-5 mt-4">
                  <h4 className="font-serif text-lg font-bold text-forest flex items-center gap-1.5">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {t('dashboard.employer.post.preview_title')}
                  </h4>

                  <form onSubmit={handlePublishOpportunity} className={`p-6 rounded-3xl flex flex-col gap-4 border-2 ${
                    highContrast ? 'border-white bg-black' : 'border-cream-dark bg-white shadow-md'
                  }`}>
                    
                    {/* Inline edit title */}
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

                    {/* Inline edit Category */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewCategory" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_category')}</label>
                      <select 
                        id="previewCategory"
                        value={previewCategory} 
                        onChange={(e) => setPreviewCategory(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                      >
                        <option value="cooking">{t('customer.categories.cooking', 'Cooking / Meal Prep')}</option>
                        <option value="tailoring">{t('customer.categories.tailoring', 'Tailoring / Alterations')}</option>
                        <option value="tutoring">{t('customer.categories.tutoring', 'Tutoring')}</option>
                        <option value="traditional-crafts">{t('customer.categories.traditional-crafts', 'Traditional Crafts')}</option>
                        <option value="caregiving">{t('customer.categories.caregiving', 'Caregiving')}</option>
                        <option value="mentoring">{t('customer.categories.mentoring', 'Mentoring')}</option>
                        <option value="consulting">{t('customer.categories.consulting', 'Consulting')}</option>
                        <option value="home-services">{t('customer.categories.home-services', 'Home Services')}</option>
                        <option value="tech-support">{t('customer.categories.tech-support', 'Tech Support')}</option>
                        <option value="gardening">{t('customer.categories.gardening', 'Gardening / Plant Care')}</option>
                        <option value="errands">{t('customer.categories.errands', 'Errands / Deliveries')}</option>
                        <option value="other">{t('customer.categories.other', 'Other')}</option>
                      </select>
                    </div>

                    {/* Inline edit Description */}
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

                    {/* Suggested Pay Range */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewPay" className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_pay')}</label>
                      <input 
                        type="text" 
                        id="previewPay"
                        value={previewPay} 
                        onChange={(e) => setPreviewPay(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                      />
                    </div>

                    {/* Location/Online toggle pills */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-gray-500">{t('dashboard.employer.post.field_mode')}</span>
                      <div className="flex gap-2">
                        {['offline', 'online'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPreviewMode(mode)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                              previewMode === mode 
                                ? 'bg-forest text-white border-forest' 
                                : 'bg-white border-cream-dark text-charcoal hover:bg-cream-dark/10'
                            }`}
                          >
                            {mode === 'online' ? t('customer.modes.online', 'Online/Virtual') : t('customer.modes.offline', 'In Person (Offline)')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timing */}
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

                    {/* Submit publish */}
                    <button 
                      type="submit" 
                      className={`w-full flex items-center justify-center gap-1.5 ${primaryBtnTheme} mt-4`}
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
              
              <div className="border-b pb-3 border-cream-dark/30 flex justify-between items-end">
                <div>
                  <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.postings.title')}</h2>
                  <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                    {t('dashboard.employer.postings.desc')}
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab('post')}
                  className={`hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm ${primaryBtnTheme}`}
                >
                  <Plus className="h-4 w-4" />
                  {t('dashboard.employer.postings.post_new')}
                </button>
              </div>

              {/* Postings Card Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {postings.map(post => (
                  <div 
                    key={post.id} 
                    className={`p-6 rounded-3xl flex flex-col justify-between ${cardTheme}`}
                  >
                    <div>
                      {/* Status Badges */}
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          post.category === 'tech' ? 'bg-orange-50 text-terracotta border border-orange-200' : 'bg-teal-50 text-forest border border-teal-200'
                        }`}>
                          {t('customer.categories.' + post.category, post.category)}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          post.status === 'open' 
                            ? 'bg-green-100 text-green-700' 
                            : (post.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')
                        }`}>
                          {post.status === 'open' ? t('dashboard.employer.postings.status_open', 'open') : (post.status === 'in-progress' ? t('dashboard.employer.postings.status_in_progress', 'in-progress') : t('dashboard.employer.postings.status_filled', 'filled'))}
                        </span>
                      </div>

                      <h3 className="font-serif text-xl font-bold mb-2">{post.title}</h3>
                      <p className={`text-sm ${textSecondaryTheme} leading-relaxed mb-4`}>{post.desc}</p>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-3 text-xs border-t pt-3 border-cream-dark/30 text-gray-500 mb-4">
                        <span className="flex items-center gap-1 font-bold text-forest">
                          <IndianRupee className="h-3.5 w-3.5" /> {post.pay}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-terracotta" /> {post.mode === 'online' ? t('customer.modes.online_short', 'Online') : t('customer.modes.offline_short', 'In Person')}
                        </span>
                        <span className="flex items-center gap-1 col-span-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> {post.timing}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t pt-4 border-cream-dark/30">
                      {post.id !== "mock1" && post.id !== 2 && post.id !== 3 ? (
                        <button
                          onClick={async () => {
                            setSelectedPosting(post);
                            setActiveTab('candidates');
                            setIsLoadingMatches(true);
                            setMatchedCandidates([]);
                            try {
                              const { data } = await api.get(`/requests/${post.id}/matches`);
                              setMatchedCandidates(data || []);
                            } catch (err) {
                              console.error('Failed to fetch matches', err);
                            } finally {
                              setIsLoadingMatches(false);
                            }
                          }}
                          className={`grow font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 ${secondaryBtnTheme}`}
                        >
                          <Users className="h-4 w-4" />
                          {t('dashboard.employer.postings.view_matches', { count: post.applicantsCount || 0 })}
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2 grow text-center">{t('dashboard.employer.postings.ai_searching')}</p>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= VIEW 3: MATCHED CANDIDATES ================= */}
          {activeTab === 'candidates' && selectedPosting && (
            <div className="flex flex-col gap-6 text-left">
              
              {/* Back to postings header */}
              <div>
                <button 
                  onClick={() => {
                    setSelectedPosting(null);
                    setActiveTab('postings');
                  }}
                  className={`text-xs font-bold text-terracotta flex items-center gap-1 hover:underline`}
                >
                  {t('dashboard.employer.candidates.back')}
                </button>
                
                <h2 className="font-serif text-2xl font-bold mt-2 pr-12">{t('dashboard.employer.candidates.title')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.candidates.desc')} <strong>{selectedPosting.title}</strong>
                </p>
              </div>

              {/* Matched Candidates Grid */}
              <div className="grid gap-6">
                {isLoadingMatches && (
                  <div className="p-8 flex justify-center items-center text-forest animate-pulse font-bold">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Finding best AI matches...
                  </div>
                )}
                {!isLoadingMatches && matchedCandidates.length === 0 && (
                  <div className="p-8 text-center text-gray-500 italic">
                    No candidates found yet. Try expanding your criteria.
                  </div>
                )}
                {!isLoadingMatches && matchedCandidates.map((match) => {
                  const cand = match.provider;
                  if (!cand) return null;
                  return (
                  <div 
                    key={match._id} 
                    className={`p-6 rounded-3xl flex flex-col sm:flex-row gap-5 relative overflow-hidden ${cardTheme}`}
                  >
                    
                    {/* Circle Match Score badge */}
                    <div className={`absolute top-4 right-4 h-14 w-14 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold leading-none ${
                      highContrast ? 'border-2 border-white bg-black' : 'bg-forest shadow-sm'
                    }`}>
                      <span className="text-base">{match.score}%</span>
                      <span className="text-[8px] uppercase font-bold">{t('dashboard.employer.candidates.match')}</span>
                    </div>

                    {/* Left: Avatar placeholder */}
                    <div className={`h-16 w-16 rounded-full shrink-0 flex items-center justify-center text-2xl font-serif font-extrabold ${
                      highContrast ? 'border-2 border-white text-white' : 'bg-orange-100 text-terracotta border border-orange-200'
                    }`}>
                      {cand.name ? cand.name[0] : '?'}
                    </div>

                    {/* Right Info info-dense panel */}
                    <div className="grow flex flex-col gap-2.5">
                      
                      {/* Name, Age, Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xl font-bold">{cand.name || 'Anonymous Provider'}</h4>
                        <span className={`text-xs ${textSecondaryTheme}`}>{cand.role === 'provider' ? 'Provider' : ''}</span>
                        
                        {/* Badges list */}
                        <div className="flex gap-1.5 flex-wrap">
                           <VerificationBadge key="ID" type="ID" highContrast={highContrast} />
                        </div>
                      </div>

                      {/* AI summary block */}
                      <MatchExplanation opp={{ ...match, rationale: "Matched based on skills and proximity." }} highContrast={highContrast} />

                      {/* Info details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                        <span>💪 <strong>{t('dashboard.employer.candidates.skills')}</strong> {cand.skills && cand.skills.length > 0 ? cand.skills.slice(0, 3).map(s => typeof s === 'object' ? s.skillName : s).join(', ') : 'Not specified'}</span>
                        <span>📅 <strong>{t('dashboard.employer.candidates.availability')}</strong> {cand.availability ? 'Available' : 'Unavailable'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 border-t pt-4 border-cream-dark/30">
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          className={`px-6 text-sm font-bold ${outlineBtnTheme}`}
                        >
                          {t('dashboard.employer.candidates.view_profile')}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.post('/applications', {
                                opportunityId: selectedPosting.id,
                                providerId: cand._id,
                                employerId: user._id
                              });
                              setActiveTab('messages');
                            } catch (err) {
                              console.error(err);
                              setActiveTab('messages');
                            }
                          }}
                          className={`px-6 text-sm font-bold flex items-center gap-1.5 ${primaryBtnTheme}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          {t('dashboard.employer.candidates.contact')}
                        </button>
                      </div>

                    </div>

                  </div>
                )})}
              </div>

            </div>
          )}

          {/* ================= VIEW 4: SETTINGS (STUB) ================= */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.settings.title', 'Account Settings')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.settings.desc', 'Manage preferences, billing, and help support contacts.')}
                </p>
              </div>

              <div className={`p-6 rounded-3xl ${cardTheme} flex flex-col gap-3`}>
                <h4 className="font-serif font-bold text-sm text-forest">{t('dashboard.employer.settings.helpline', 'Helpline assistance')}</h4>
                <p className="text-sm">{t('dashboard.employer.settings.helpline_desc', 'For employer billing, corporate sponsorships, and verified listing checks, please call:')} <strong>+91 99999-77777</strong></p>
              </div>
            </div>
          )}

          {/* ================= VIEW 6: MESSAGES ================= */}
          {activeTab === 'messages' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">{t('dashboard.employer.messages.title', 'Candidate Messages')}</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  {t('dashboard.employer.messages.desc', 'Communicate securely with senior citizens and homemakers matching your gigs.')}
                </p>
              </div>

              <ChatInterface user={user} highContrast={highContrast} onNavigate={onNavigate} />
            </div>
          )}

          {/* ================= VIEW 5: SAFETY CENTER ================= */}
          {activeTab === 'safety' && (
            <div className="flex flex-col gap-8 text-left pb-16">
              
              {/* Header */}
              <div className="border-b pb-4 border-cream-dark/30">
                <h2 className="font-serif text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-7 w-7 text-forest" />
                  {t('safety.employer.title', 'Trust & Safety Center')}
                </h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1.5 max-w-2xl`}>
                  {t('safety.employer.desc', 'SilverHands leverages smart local validation and AI guard tools to keep our community safe. Review live alerts, report accounts, or write neighborhood endorsements below.')}
                </p>
              </div>

              {/* Core Layout Grid */}
              <div className="grid gap-8 lg:grid-cols-3">
                
                {/* Left Columns - Alert Banner, Chat Demo, Reviews Feed */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                  
                  {/* AI Safety Guard Banner Demonstration */}
                  <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${cardTheme}`}>
                    <div className="flex items-center gap-2 border-b pb-2 border-cream-dark/20">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
                      <h3 className="font-serif font-bold text-base text-charcoal">{t('safety.employer.demo_title', 'Demo: AI scam detection in action')}</h3>
                    </div>

                    <p className="text-xs text-charcoal-light">
                      {t('safety.employer.demo_desc', 'Below is a preview simulation of a secure message thread where our AI scanner flagged a suspicious message:')}
                    </p>

                    {/* Chat Simulation Box */}
                    <div className={`border rounded-2xl overflow-hidden ${
                      highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/20 shadow-inner'
                    }`}>
                      {/* Chat Header */}
                      <div className="px-4 py-2 bg-cream-dark/20 border-b border-cream-dark/20 flex items-center justify-between text-xs font-bold">
                        <span>💬 {t('safety.employer.chat_header', 'Secure chat with candidate: Ramesh S.')}</span>
                        <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full font-sans">{t('safety.employer.active_match', 'Active Match')}</span>
                      </div>

                      {/* Scam warning banner inserted above chat message */}
                      <div className="p-3 bg-white border-b border-cream-dark/20">
                        <ScamAlertBanner 
                          message={t('safety.employer.alert_message', 'This message requests an advance cash transfer before work has commenced. This violates community safety guidelines.')}
                          onLearnMore={() => alert("Scam Guards detect UPI IDs, bank details, and keywords like 'advance', 'upfront', 'deposit' in initial chats to protect elders from online fraud.")}
                          onReport={() => setIsReportOpen(true)}
                          highContrast={highContrast}
                        />
                      </div>

                      {/* Chat Message Bubble */}
                      <div className="p-4 flex flex-col gap-3">
                        <div className="self-start max-w-[85%] rounded-2xl p-3 text-xs bg-cream-dark/30 text-charcoal text-left">
                          <p className="font-bold text-forest mb-0.5">Ramesh S.</p>
                          <p>{t('safety.employer.chat_body', 'Namaste. I am ready to start cooking for your father tomorrow morning. Please transfer a ₹3,500 security advance to my GPay number 98765-54321 today so I can purchase custom organic groceries.')}</p>
                          <span className="text-[9px] text-charcoal-light mt-1 block">{t('safety.employer.sent_time', 'Sent 12:35 PM')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Reviews Feed */}
                  <div className="flex flex-col gap-4">
                    <h3 className="font-serif text-xl font-bold">{t('safety.employer.endorsements_title', 'Recent Neighborhood Endorsements')}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {reviewsList.map((rev, idx) => (
                        <ReviewCard 
                          key={idx}
                          reviewerName={rev.reviewerName}
                          date={rev.date}
                          rating={rev.rating}
                          text={rev.text}
                          highContrast={highContrast}
                        />
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column - Submit Review & Rotating Tips card */}
                <div className="flex flex-col gap-6">
                  
                  {/* Safety Tips mobile/supplemental widget */}
                  <div className="block md:hidden">
                    <SafetyTipsCard highContrast={highContrast} />
                  </div>

                  {/* Submit Review Form */}
                  <SubmitReviewForm 
                    onSubmit={(newRev) => setReviewsList([
                      {
                        reviewerName: "You",
                        date: newRev.date,
                        rating: newRev.rating,
                        text: newRev.comment
                      },
                      ...reviewsList
                    ])}
                    highContrast={highContrast}
                  />

                  {/* safety guarantee card */}
                  <div className={`p-5 rounded-3xl border text-xs leading-relaxed ${
                    highContrast ? 'border-white bg-black' : 'bg-white border-cream-dark/50 text-charcoal-light'
                  }`}>
                     <h4 className="font-serif font-bold text-sm text-charcoal mb-2">{t('safety.employer.guarantee_title', 'Our Safety Guarantee')}</h4>
                    <p className="mb-2">✓ {t('safety.employer.guarantee_1', 'All providers undergo digital identity verification before matching.')}</p>
                    <p className="mb-2">✓ {t('safety.employer.guarantee_2', 'Dynamic 2dsphere location search prevents matching with distant unknown accounts.')}</p>
                    <p>✓ {t('safety.employer.guarantee_3', 'Endorsements can only be submitted by verified residents inside the same block group.')}</p>
                  </div>

                </div>

              </div>

              {/* Report & Block Modal Overlay */}
              <ReportBlockModal 
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                onSubmit={(report) => {
                  alert(`Report submitted! You have reported Ramesh S. for: "${report.reason}". This user has been blocked from contacting you.`);
                }}
                targetName="Ramesh S."
                highContrast={highContrast}
              />

            </div>
          )}

        </main>
      </div>

      {/* 4. CANDIDATE PROFILE MODAL OVERLAY */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          
          <div className={`w-full max-w-xl rounded-3xl p-6 relative overflow-hidden flex flex-col gap-5 ${
            highContrast ? 'border-2 border-white bg-black' : 'bg-white shadow-xl border border-cream-dark'
          }`}>
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-4 border-b pb-4 border-cream-dark/30 text-left">
              <div className="h-16 w-16 rounded-full flex items-center justify-center font-serif text-2xl font-bold bg-orange-100 text-terracotta">
                {selectedCandidate.name[0]}
              </div>
              <div>
                <h3 className="text-2xl font-bold font-serif">{selectedCandidate.name}</h3>
                <p className={`text-sm ${textSecondaryTheme}`}>
                  {t('dashboard.employer.candidates.modal_age_rating', 'Age {{age}} • Rating {{rating}} ★', { age: selectedCandidate.age, rating: selectedCandidate.rating })}
                </p>
              </div>
            </div>

            {/* Content stats */}
            <div className="flex flex-col gap-4 text-left text-sm max-h-[60vh] overflow-y-auto">
              
              {/* Verification indicators */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.employer.candidates.verification_checks', 'Verification Checks')}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.verified.map(v => (
                    <VerificationBadge key={v} type={v} highContrast={highContrast} />
                  ))}
                </div>
              </div>

              {/* Skills Chips */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.employer.candidates.specialized_skills', 'Specialized Skills')}</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(s => (
                    <span key={s} className="bg-teal-50 text-forest border border-teal-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                      {t(`customer.skills.${s.toLowerCase().replace(' ', '_')}`, s)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">{t('dashboard.employer.candidates.availability_summary', 'Availability Summary')}</span>
                <p className="font-bold text-charcoal">{t(`customer.availability.${selectedCandidate.availability.toLowerCase().replace(' ', '_')}`, selectedCandidate.availability)}</p>
              </div>

              {/* Reviews section */}
              <div className="flex flex-col gap-2.5 border-t pt-4 border-cream-dark/30">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {t('dashboard.employer.candidates.past_reviews', 'Past Neighbor Reviews ({{count}})', { count: selectedCandidate.reviewsCount })}
                </span>
                
                {selectedCandidate.reviews.map((r, idx) => (
                  <div key={idx} className="p-3 bg-cream/30 border border-cream-dark/50 rounded-xl">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-forest">{r.author}</span>
                      <span className="text-amber-500 font-bold">{"★".repeat(r.rating)}</span>
                    </div>
                    <p className="text-xs italic text-gray-600">"{r.comment}"</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Chat connection trigger CTA */}
            <div className="border-t pt-4 border-cream-dark/30 flex gap-3">
              <button 
                onClick={() => setSelectedCandidate(null)}
                className={`grow ${outlineBtnTheme}`}
              >
                {t('dashboard.employer.candidates.close_profile', 'Close Profile')}
              </button>
              <button 
                onClick={() => {
                  setSelectedCandidate(null);
                  setActiveTab('messages');
                }}
                className={`grow ${primaryBtnTheme}`}
              >
                {t('dashboard.employer.candidates.start_chat', 'Start Chat')}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default EmployerDashboard;
