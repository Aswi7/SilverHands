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

const EmployerDashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

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

  // Mock Postings Database
  const [postings, setPostings] = useState([
    {
      id: 1,
      title: "Smart TV & Gadgets Setup Tutor",
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
  const candidatesDatabase = {
    1: [ // Applicants for TV & Gadgets Tutor
      {
        id: 101,
        name: "Suresh Patel",
        age: 65,
        score: 94,
        rationale: "Suresh has 25 years background in telecom engineering and is free on weekend afternoons.",
        verified: ["ID", "Background", "References"],
        skills: ["Smartphone Tutoring", "Smart TV Configuration", "Technical Support", "Patient Teacher"],
        availability: "Saturdays & Sundays (Afternoon)",
        rating: 5.0,
        reviewsCount: 12,
        reviews: [
          { author: "Amit S.", rating: 5, comment: "Suresh was extremely patient. He spent two hours showing my grandfather how to use video calls." }
        ]
      },
      {
        id: 102,
        name: "Col. Raghavan (Retd.)",
        age: 68,
        score: 87,
        rationale: "Raghavan has extensive tech setup skills and live within 3km of Vasant Kunj.",
        verified: ["ID", "References"],
        skills: ["Gadgets configuration", "Computer training", "Android setup"],
        availability: "Weekends & Weekdays",
        rating: 4.8,
        reviewsCount: 8,
        reviews: [
          { author: "Kiran R.", rating: 5, comment: "Very professional and methodical. Highly recommended for senior tech tutoring." }
        ]
      }
    ],
    2: [ // Applicants for Gujarati Home Chef
      {
        id: 201,
        name: "Asha Devi",
        age: 62,
        score: 95,
        rationale: "Asha Devi has 15 years experience cooking Gujarati dishes and is free on your exact morning timeslots.",
        verified: ["ID", "Background", "Health Check"],
        skills: ["Gujarati Cuisine", "Diabetic Meal prep", "Low-Salt diet planning", "Traditional Spices"],
        availability: "Weekday Mornings (8:00 AM - 12:00 PM)",
        rating: 4.9,
        reviewsCount: 22,
        reviews: [
          { author: "Mrunal Patel", rating: 5, comment: "Asha cooks just like home. Her diabetic meals are tasty and low in oil." }
        ]
      }
    ]
  };

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

  const handleAIStructureListing = () => {
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    
    // Simulate AI parsing text and generating structured fields in 1.5 seconds
    setTimeout(() => {
      setPreviewTitle("Gujarati Chef for Diabetic Father");
      setPreviewCategory("cooking");
      setPreviewDesc("Prepare healthy, low-sugar Gujarati home-cooked meals every weekday morning for an elderly diabetic parent near Connaught Place.");
      setPreviewPay("₹350/hr");
      setPreviewMode("offline");
      setPreviewTiming("Weekday Mornings (8:00 AM - 10:00 AM)");
      
      setIsAnalyzing(false);
      setShowPreview(true);
    }, 1500);
  };

  const handlePublishOpportunity = (e) => {
    e.preventDefault();
    const newPosting = {
      id: postings.length + 1,
      title: previewTitle,
      category: previewCategory,
      desc: previewDesc,
      pay: previewPay,
      mode: previewMode,
      timing: previewTiming,
      status: "open",
      applicantsCount: 0
    };

    setPostings([newPosting, ...postings]);
    setRawText('');
    setShowPreview(false);
    setActiveTab('postings');
    alert(`Successfully published "${previewTitle}" opportunity list!`);
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
              <span>Post Opportunity</span>
            </button>
            <button
              onClick={() => setActiveTab('postings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'postings' || activeTab === 'candidates' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Briefcase className="h-5 w-5" />
              <span>My Postings</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-all ${
                activeTab === 'settings' ? activeSidebarItemTheme : inactiveSidebarItemTheme
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
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
            <span>Post</span>
          </button>
          <button
            onClick={() => setActiveTab('postings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'postings' || activeTab === 'candidates' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span>Postings</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'text-forest' : 'text-charcoal-light'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Logout button */}
        <div className="hidden md:block p-4 border-t border-cream-dark/30">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
              highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600'
            }`}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* TOP GREETER BAR */}
        <header className={`border-b sticky top-0 z-30 px-4 py-3 md:px-8 flex items-center justify-between ${
          highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/90 backdrop-blur-md'
        }`}>
          
          <div className="text-left">
            <h1 className="text-xl font-bold font-serif md:text-2xl flex items-center gap-1.5">
              Good morning, Col. Raghavan 🌸
            </h1>
          </div>

          {/* Quick Accessibility and Bell Controls */}
          <div className="flex items-center gap-3">
            
            {/* Accessibility Controls */}
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

            {/* Profile badge */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
              highContrast ? 'border border-white bg-black' : 'bg-forest'
            }`}>
              R
            </div>

          </div>

        </header>

        {/* 3. MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-grow p-4 md:p-8 pb-24 md:pb-8 text-left">

          {/* ================= VIEW 1: POST OPPORTUNITY ================= */}
          {activeTab === 'post' && (
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">Post an Opportunity</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  Write what you need naturally. Our AI will structure it into a neat matching listing.
                </p>
              </div>

              {/* Text Area Card */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 ${cardTheme}`}>
                
                <div className="flex justify-between items-center">
                  <label htmlFor="rawText" className="text-sm font-bold">Describe what you need in your own words</label>
                  <button 
                    type="button" 
                    onClick={handleAutofillInput} 
                    className="text-xs font-semibold text-terracotta underline hover:no-underline"
                  >
                    💡 Insert Sample Request
                  </button>
                </div>

                <textarea
                  id="rawText"
                  rows="4"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. I need a patient person who can teach my daughter basic math and algebra twice a week online..."
                  className={`w-full px-4 py-3 rounded-2xl text-base ${inputTheme}`}
                />

                <div className="flex justify-end items-center gap-3">
                  <span className="text-xs text-forest font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-terracotta animate-pulse" />
                    AI will structure this listing
                  </span>
                  
                  <button
                    onClick={handleAIStructureListing}
                    disabled={isAnalyzing || !rawText.trim()}
                    className={`px-8 ${primaryBtnTheme} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isAnalyzing ? "Analyzing..." : "Structure Listing"}
                  </button>
                </div>

              </div>

              {/* Structured preview card (editable inline) */}
              {showPreview && (
                <div className="flex flex-col gap-5 mt-4">
                  <h4 className="font-serif text-lg font-bold text-forest flex items-center gap-1.5">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    AI Structured Listing Preview
                  </h4>

                  <form onSubmit={handlePublishOpportunity} className={`p-6 rounded-3xl flex flex-col gap-4 border-2 ${
                    highContrast ? 'border-white bg-black' : 'border-cream-dark bg-white shadow-md'
                  }`}>
                    
                    {/* Inline edit title */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewTitle" className="text-xs font-bold text-gray-500">Title</label>
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
                      <label htmlFor="previewCategory" className="text-xs font-bold text-gray-500">Category Tag</label>
                      <select 
                        id="previewCategory"
                        value={previewCategory} 
                        onChange={(e) => setPreviewCategory(e.target.value)}
                        className={`px-3 py-2 rounded-xl text-sm ${inputTheme}`}
                      >
                        <option value="tech">Technology</option>
                        <option value="cooking">Cooking / Meal Prep</option>
                        <option value="gardening">Gardening / Plant Care</option>
                        <option value="errands">Errands / Deliveries</option>
                      </select>
                    </div>

                    {/* Inline edit Description */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewDesc" className="text-xs font-bold text-gray-500">Description</label>
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
                      <label htmlFor="previewPay" className="text-xs font-bold text-gray-500">Suggested Pay Range</label>
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
                      <span className="text-xs font-bold text-gray-500">Location Mode</span>
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
                            {mode === 'online' ? 'Online/Virtual' : 'In Person (Offline)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timing */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="previewTiming" className="text-xs font-bold text-gray-500">Required Timing</label>
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
                      Publish Opportunity
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
                  <h2 className="font-serif text-2xl font-bold">My Postings</h2>
                  <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                    Manage requests and inspect candidates matched by our AI matching engine.
                  </p>
                </div>
                
                <button
                  onClick={() => setActiveTab('post')}
                  className={`hidden sm:flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm ${primaryBtnTheme}`}
                >
                  <Plus className="h-4 w-4" />
                  Post New Opportunity
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
                          {post.category}
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          post.status === 'open' 
                            ? 'bg-green-100 text-green-700' 
                            : (post.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')
                        }`}>
                          {post.status}
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
                          <MapPin className="h-3.5 w-3.5 text-terracotta" /> {post.mode === 'online' ? 'Online' : 'In Person'}
                        </span>
                        <span className="flex items-center gap-1 col-span-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400" /> {post.timing}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 border-t pt-4 border-cream-dark/30">
                      {candidatesDatabase[post.id] ? (
                        <button
                          onClick={() => {
                            setSelectedPosting(post);
                            setActiveTab('candidates');
                          }}
                          className={`flex-grow font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 ${secondaryBtnTheme}`}
                        >
                          <Users className="h-4 w-4" />
                          View Matches ({post.applicantsCount})
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400 italic py-2 flex-grow text-center">AI is searching for candidate matches...</p>
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
                  ← Back to My Postings
                </button>
                
                <h2 className="font-serif text-2xl font-bold mt-2 pr-12">Matched Candidates</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  Matching candidates for your listing: <strong>{selectedPosting.title}</strong>
                </p>
              </div>

              {/* Matched Candidates Grid */}
              <div className="grid gap-6">
                {(candidatesDatabase[selectedPosting.id] || []).map((cand) => (
                  <div 
                    key={cand.id} 
                    className={`p-6 rounded-3xl flex flex-col sm:flex-row gap-5 relative overflow-hidden ${cardTheme}`}
                  >
                    
                    {/* Circle Match Score badge */}
                    <div className={`absolute top-4 right-4 h-14 w-14 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold leading-none ${
                      highContrast ? 'border-2 border-white bg-black' : 'bg-forest shadow-sm'
                    }`}>
                      <span className="text-base">{cand.score}%</span>
                      <span className="text-[8px] uppercase font-bold">Match</span>
                    </div>

                    {/* Left: Avatar placeholder */}
                    <div className={`h-16 w-16 rounded-full shrink-0 flex items-center justify-center text-2xl font-serif font-extrabold ${
                      highContrast ? 'border-2 border-white text-white' : 'bg-orange-100 text-terracotta border border-orange-200'
                    }`}>
                      {cand.name[0]}
                    </div>

                    {/* Right Info info-dense panel */}
                    <div className="flex-grow flex flex-col gap-2.5">
                      
                      {/* Name, Age, Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xl font-bold">{cand.name}</h4>
                        <span className={`text-xs ${textSecondaryTheme}`}>Age {cand.age}</span>
                        
                        {/* Badges list */}
                        <div className="flex gap-1">
                          {cand.verified.map(v => (
                            <span 
                              key={v} 
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                highContrast ? 'border border-white bg-black' : 'bg-green-50 text-green-700 border border-green-200'
                              }`}
                              title={`${v} verified by SilverHands`}
                            >
                              <Shield className="h-2.5 w-2.5" />
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI summary block */}
                      <div className={`p-3 rounded-xl border border-dashed flex items-start gap-2 ${
                        highContrast ? 'border-white bg-black' : 'bg-amber-50/50 border-amber-200 text-charcoal'
                      }`}>
                        <Sparkles className="h-4 w-4 shrink-0 text-terracotta mt-0.5" />
                        <p className="text-xs leading-relaxed font-semibold">
                          "{cand.rationale}"
                        </p>
                      </div>

                      {/* Info details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
                        <span>💪 <strong>Skills:</strong> {cand.skills.slice(0, 3).join(', ')}</span>
                        <span>📅 <strong>Availability:</strong> {cand.availability}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 border-t pt-4 border-cream-dark/30">
                        <button
                          onClick={() => setSelectedCandidate(cand)}
                          className={`px-6 text-sm font-bold ${outlineBtnTheme}`}
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            alert(`Contact details shared! Start a chat with ${cand.name} using the message console.`);
                          }}
                          className={`px-6 text-sm font-bold flex items-center gap-1.5 ${primaryBtnTheme}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                          Contact Candidate
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= VIEW 4: SETTINGS (STUB) ================= */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
              <div className="border-b pb-3 border-cream-dark/30">
                <h2 className="font-serif text-2xl font-bold">Account Settings</h2>
                <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                  Manage preferences, billing, and help support contacts.
                </p>
              </div>

              <div className={`p-6 rounded-3xl ${cardTheme} flex flex-col gap-3`}>
                <h4 className="font-serif font-bold text-sm text-forest">Helpline assistance</h4>
                <p className="text-sm">For employer billing, corporate sponsorships, and verified listing checks, please call: <strong>+91 99999-77777</strong></p>
              </div>
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
                <p className={`text-sm ${textSecondaryTheme}`}>Age {selectedCandidate.age} • Rating {selectedCandidate.rating} ★</p>
              </div>
            </div>

            {/* Content stats */}
            <div className="flex flex-col gap-4 text-left text-sm max-h-[60vh] overflow-y-auto">
              
              {/* Verification indicators */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase">Verification Checks</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.verified.map(v => (
                    <span key={v} className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills Chips */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-gray-400 uppercase">Specialized Skills</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map(s => (
                    <span key={s} className="bg-teal-50 text-forest border border-teal-200 px-2.5 py-1 rounded-xl text-xs font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Availability Summary</span>
                <p className="font-bold text-charcoal">{selectedCandidate.availability}</p>
              </div>

              {/* Reviews section */}
              <div className="flex flex-col gap-2.5 border-t pt-4 border-cream-dark/30">
                <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  Past Neighbor Reviews ({selectedCandidate.reviewsCount})
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
                className={`flex-grow ${outlineBtnTheme}`}
              >
                Close Profile
              </button>
              <button 
                onClick={() => {
                  setSelectedCandidate(null);
                  alert(`Starting secure chat session with ${selectedCandidate.name}...`);
                }}
                className={`flex-grow ${primaryBtnTheme}`}
              >
                Start Chat
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default EmployerDashboard;
