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
  X,
  Mic,
  MicOff,
  Pencil,
  Check,
  Plus
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import { SafetyTipsCard } from '../components/TrustSafety';
import { MatchExplanation } from '../components/MatchExplanation';
import ChatInterface from '../components/ChatInterface';
import MatchCard from '../components/MatchCard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAccessibility, SpeakerButton } from '../context/AccessibilityContext';
import { forecastData } from '../data/forecastData';

const UserDashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout, updateUserInState } = useAuth();

  // Accessibility Global Settings
  const { setPanelOpen, highContrast, fontSize, speechLocale } = useAccessibility();

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('providerDashboardTab') || 'matches';
  });
  const [activeChatMatchId, setActiveChatMatchId] = useState(null);

  const [applications, setApplications] = useState([]);
  
  useEffect(() => {
    if (activeTab === 'applications' && user?._id) {
      api.get(`/applications/user/${user._id}`)
        .then(res => setApplications(res.data))
        .catch(err => console.error(err));
    }
  }, [activeTab, user]);

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      await api.patch(`/applications/${appId}/${newStatus === 'completed' ? 'complete' : newStatus === 'in_progress' ? 'check-in' : 'status'}`, { status: newStatus });
      setApplications(applications.map(app => app._id === appId ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  useEffect(() => {
    sessionStorage.setItem('providerDashboardTab', activeTab);
  }, [activeTab]);

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
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 12500,
    thisMonthEarnings: 4500,
    completedServicesCount: 8,
    recentEarnings: []
  });

  const fetchEarningsData = async () => {
    try {
      const { data } = await api.get('/earnings');
      if (data) {
        setEarningsData({
          totalEarnings: data.totalEarnings || 0,
          thisMonthEarnings: data.thisMonthEarnings || 0,
          completedServicesCount: data.completedServicesCount || 0,
          recentEarnings: Array.isArray(data.recentEarnings) ? data.recentEarnings : []
        });
      }
    } catch (err) {
      console.error("Failed to load earnings from database:", err);
    }
  };

  useEffect(() => {
    if (user?._id) {
      api.get(`/listings/provider/${user._id}`)
        .then(res => setProviderListings(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Failed to load listings", err));
    }
    if (user?._id && user.role === 'provider') {
      fetchEarningsData();
    }
  }, [user, activeTab]);

  // Provider Ranked Forecasts and states
  const [rankedForecasts, setRankedForecasts] = useState([]);
  const [isLoadingForecasts, setIsLoadingForecasts] = useState(false);
  const [forecastCategoryFilter, setForecastCategoryFilter] = useState('all');
  const [forecastDateFilter, setForecastDateFilter] = useState('all');
  const [forecastLocationFilter, setForecastLocationFilter] = useState('all');
  const [forecastRelevanceFilter, setForecastRelevanceFilter] = useState('all');
  const [forecastReligionFilter, setForecastReligionFilter] = useState('all');

  useEffect(() => {
    if (activeTab === 'forecast' && user) {
      setIsLoadingForecasts(true);
      
      Promise.all([
        api.get('/forecasts/upcoming'),
        api.get('/forecasts/relevant')
      ])
      .then(([upcomingRes, relevantRes]) => {
        const events = Array.isArray(upcomingRes.data) ? upcomingRes.data : [];
        const rankings = relevantRes.data?.rankings || [];

        const enriched = events.map(event => {
          const matchedRank = rankings.find(r => r.id === event._id.toString());
          return {
            id: event._id.toString(),
            eventName: event.name,
            relevantCategories: event.affectedServices || [],
            demandUplift: event.expectedDemand || '+25%',
            insight: event.description,
            dateRange: new Date(event.startDate).toLocaleDateString([], {month: 'short', day: 'numeric'}) + ' to ' + new Date(event.endDate).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'}),
            relevanceScore: matchedRank ? matchedRank.relevanceScore : 30,
            explanation: matchedRank ? matchedRank.explanation : '',
            isRelevant: matchedRank ? matchedRank.relevanceScore >= 60 : false,
            religion: event.religion || 'None',
            region: event.region || 'National',
            suggestionCategory: event.category,
            suggestionTitle: event.name + ' Services'
          };
        });

        enriched.sort((a, b) => b.relevanceScore - a.relevanceScore);
        setRankedForecasts(enriched);
      })
      .catch(err => {
        console.error("Failed to fetch verified forecasts:", err);
        // Fallback local calculations
        const fallback = forecastData.map(f => {
          const hasMatch = f.relevantCategories.some(cat => 
            (user.skills || []).some(s => (s.category || '').toLowerCase().includes(cat.toLowerCase()))
          );
          return {
            ...f,
            relevanceScore: hasMatch ? 80 : 30,
            explanation: hasMatch ? `Recommended because your profile matches the ${f.relevantCategories[0] || 'service'} category.` : 'General seasonal opportunity.',
            isRelevant: hasMatch,
            religion: 'None',
            region: 'National'
          };
        });
        fallback.sort((a, b) => b.relevanceScore - a.relevanceScore);
        setRankedForecasts(fallback);
      })
      .finally(() => {
        setIsLoadingForecasts(false);
      });
    }
  }, [activeTab, user]);

  const topForecast = rankedForecasts.find(f => f.isRelevant) || rankedForecasts[0];

  const handlePrepareListing = (forecast) => {
    setSelectedForecast(forecast);
    setListingForm({
      title: t(`forecast.${forecast.id}.suggestionTitle`, forecast.suggestionTitle),
      category: forecast.suggestionCategory,
      description: t('forecast.prefill_desc', 'I am offering {{title}} services for the upcoming {{event}}.', {
        title: t(`forecast.${forecast.id}.suggestionTitle`, forecast.suggestionTitle).toLowerCase(),
        event: t(`forecast.${forecast.id}.eventName`, forecast.eventName)
      }),
      rateType: 'daily',
      rateAmount: '500',
      packageDuration: ''
    });
    setShowForecastModal(true);
  };

  // Provider reviews states
  const [providerReviews, setProviderReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(5.0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const fetchProviderReviews = async () => {
    if (!user?._id) return;
    try {
      setIsLoadingReviews(true);
      const { data } = await api.get(`/reviews/provider/${user._id}`);
      if (data) {
        setProviderReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageRating(data.averageRating !== undefined ? data.averageRating : 5.0);
        setReviewCount(data.count !== undefined ? data.count : 0);
      }
    } catch (err) {
      console.error("Failed to fetch provider reviews:", err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'profile' && user) {
      fetchProviderReviews();
    }
  }, [activeTab, user]);

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
  const [bioText, setBioText] = useState('');
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [isListeningBio, setIsListeningBio] = useState(false);

  // Profile Editing & Persistence State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newManualSkill, setNewManualSkill] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '',
    city: '',
    age: '',
    preferredLanguage: 'en',
    bio: '',
    availability: true,
    skills: []
  });

  // Sync state with user when user loads
  useEffect(() => {
    if (user) {
      setBioText(prev => prev || user.bio || '');
      setExtractedSkills(prev => prev.length ? prev : (Array.isArray(user.skills) ? user.skills : []));
      setProfileForm({
        name: user.name || '',
        city: user.city || '',
        age: user.age || '',
        preferredLanguage: user.preferredLanguage || 'en',
        bio: user.bio || '',
        availability: user.availability !== undefined ? user.availability : true,
        skills: Array.isArray(user.skills) ? user.skills : []
      });
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(false);
    try {
      const skillsToSave = (profileForm.skills || []).map(s => 
        typeof s === 'object' ? s : { category: 'other', skillName: s, experienceLevel: 'Not specified', confidence: 1.0 }
      );

      const { data } = await api.put('/users/profile', {
        name: profileForm.name,
        city: profileForm.city,
        age: profileForm.age,
        preferredLanguage: profileForm.preferredLanguage,
        bio: profileForm.bio,
        availability: profileForm.availability,
        skills: skillsToSave
      });

      if (updateUserInState && data) {
        updateUserInState(data);
      }
      setIsEditingProfile(false);
      setProfileSuccessMsg(true);
      setTimeout(() => setProfileSuccessMsg(false), 5000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert(err.response?.data?.message || "Failed to save profile details.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddSkillToProfile = (e) => {
    e.preventDefault();
    if (newManualSkill.trim()) {
      const updated = [...(profileForm.skills || []), newManualSkill.trim()];
      setProfileForm({ ...profileForm, skills: updated });
      setNewManualSkill('');
    }
  };

  const handleRemoveSkillFromProfile = (indexToRemove) => {
    const updated = (profileForm.skills || []).filter((_, idx) => idx !== indexToRemove);
    setProfileForm({ ...profileForm, skills: updated });
  };

  const handleAcceptMatch = async (opp) => {
    try {
      const matchId = opp.matchId || opp.id;
      if (matchId) {
        await api.put(`/matches/${matchId}/status`, { status: 'ACCEPTED' });
        try {
          await api.post('/chat/conversations', { matchId });
        } catch (cErr) {
          console.warn('Conv notice:', cErr.message);
        }
      }
      setOpportunities(prev => prev.map(item => item.id === opp.id ? { ...item, matchStatus: 'ACCEPTED' } : item));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Failed to accept match request:', err);
      alert(err.response?.data?.message || 'Failed to accept match request.');
    }
  };

  const handleRejectMatch = async (opp) => {
    try {
      const matchId = opp.matchId || opp.id;
      if (matchId) {
        await api.put(`/matches/${matchId}/status`, { status: 'REJECTED' });
      }
      setOpportunities(prev => prev.map(item => item.id === opp.id ? { ...item, matchStatus: 'REJECTED' } : item));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Failed to decline match request:', err);
      alert(err.response?.data?.message || 'Failed to decline match request.');
    }
  };

  // Dedicated Provider Match Requests State
  const [providerMatchRequests, setProviderMatchRequests] = useState([]);
  const [isLoadingMatchRequests, setIsLoadingMatchRequests] = useState(false);
  const [providerMatchSubTab, setProviderMatchSubTab] = useState('active'); // 'active' | 'previous'

  const fetchProviderMatchRequests = async () => {
    setIsLoadingMatchRequests(true);
    try {
      const { data } = await api.get('/matches/my-requests');
      setProviderMatchRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch provider match requests:', err);
    } finally {
      setIsLoadingMatchRequests(false);
    }
  };

  const handleAcceptProviderMatch = async (match) => {
    try {
      const { data } = await api.put(`/matches/${match._id}/status`, { status: 'ACCEPTED' });
      try {
        await api.post('/chat/conversations', { matchId: match._id });
      } catch (convErr) {
        console.warn('Conversation creation notice:', convErr.message);
      }
      setProviderMatchRequests(prev => prev.map(m => m._id === match._id ? data : m));
      setOpportunities(prev => prev.map(opp => opp.matchId === match._id ? { ...opp, matchStatus: 'ACCEPTED' } : opp));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Accept match error:', err);
      alert(err.response?.data?.message || 'Failed to accept application.');
    }
  };

  const handleConfirmProviderMatch = async (match) => {
    try {
      const { data } = await api.put(`/matches/${match._id}/status`, { status: 'CONFIRMED' });
      setProviderMatchRequests(prev => prev.map(m => m._id === match._id ? data : m));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Confirm service error:', err);
      alert(err.response?.data?.message || 'Failed to confirm service details.');
    }
  };

  const handleCompleteProviderMatch = async (match) => {
    try {
      const opp = match.requestId || match.opportunity;
      const rateStr = opp?.rate || '1500';
      const parsed = parseInt(rateStr.replace(/[^0-9]/g, ''), 10);
      const agreedVal = isNaN(parsed) ? 1500 : parsed;

      const { data } = await api.put(`/matches/${match._id}/status`, { 
        status: 'COMPLETED',
        paymentReceived: true,
        agreedAmount: match.agreedAmount || agreedVal
      });
      setProviderMatchRequests(prev => prev.map(m => m._id === match._id ? data : m));
      await fetchProviderMatchRequests();
      await fetchEarningsData();
    } catch (err) {
      console.error('Complete service error:', err);
      alert(err.response?.data?.message || 'Failed to complete service.');
    }
  };

  const handleCancelProviderMatch = async (match) => {
    try {
      const { data } = await api.put(`/matches/${match._id}/status`, { status: 'CANCELLED' });
      setProviderMatchRequests(prev => prev.map(m => m._id === match._id ? data : m));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Cancel service error:', err);
      alert(err.response?.data?.message || 'Failed to cancel application.');
    }
  };

  const handleContactProviderFromMatch = async (match) => {
    try {
      const matchId = (typeof match === 'object' && match !== null) ? (match._id || match.matchId || match.id) : match;
      if (matchId) {
        try {
          await api.post('/chat/conversations', { matchId });
        } catch (cErr) {
          console.warn('Conv notice:', cErr.message);
        }
        setActiveChatMatchId(matchId);
      }
      await fetchProviderMatchRequests();
      setActiveTab('messages');
    } catch (err) {
      console.error('Failed to open chat:', err);
      setActiveTab('messages');
    }
  };

  const handleRejectProviderMatch = async (match) => {
    try {
      const { data } = await api.put(`/matches/${match._id}/status`, { status: 'REJECTED' });
      setProviderMatchRequests(prev => prev.map(m => m._id === match._id ? data : m));
      setOpportunities(prev => prev.map(opp => opp.matchId === match._id ? { ...opp, matchStatus: 'REJECTED' } : opp));
      await fetchProviderMatchRequests();
    } catch (err) {
      console.error('Reject match error:', err);
      alert(err.response?.data?.message || 'Failed to decline application.');
    }
  };

  useEffect(() => {
    if (user && user.role === 'provider') {
      fetchProviderMatchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === 'match-requests') {
      fetchProviderMatchRequests();
    }
  }, [activeTab, user]);

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
          matchId: req.matchId,
          matchStatus: req.matchStatus || 'PENDING',
          title: req.title,
          category: req.category,
          score: req.score || 50,
          scoreBreakdown: req.scoreBreakdown || null,
          rate: req.rate || "Negotiable",
          location: req.mode === 'online' ? 'Online' : (req.city ? (req.city.charAt(0).toUpperCase() + req.city.slice(1)) : 'Delhi'),
          mode: req.mode || "offline",
          posted: new Date(req.createdAt).toLocaleDateString(),
          description: req.description,
          employerId: req.customer?._id || req.customer
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
    { id: 'match-requests', label: 'Match Requests', icon: BookmarkCheck },
    { id: 'forecast', label: t('dashboard.provider.tabs.forecast', 'Forecasts'), icon: Calendar },
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
            
            {/* Language Switcher */}
            <div className="flex items-center gap-1 text-sm">
              <Globe className="h-4 w-4 text-terracotta" />
              <LanguageSwitcher />
            </div>
            
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
                    <div className="text-3xl shrink-0 mt-1">{t(`forecast.${topForecast.id}.eventName`, topForecast.eventName).split(' ')[0]}</div>
                    <div className="flex flex-col text-left">
                      <h4 className="font-bold text-lg text-terracotta flex items-center gap-2">
                        {t(`forecast.${topForecast.id}.eventName`, topForecast.eventName)} {t('forecast.coming_up', 'is coming up!')}
                        <span className="px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-[10px] uppercase font-bold tracking-wider">
                          {t('forecast.ai_badge', 'AI Forecast')}
                        </span>
                      </h4>
                      <p className="text-sm font-semibold mt-1">{t(`forecast.${topForecast.id}.insight`, topForecast.insight)}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {t('forecast.disclaimer', '*AI estimate based on historical seasonal patterns')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePrepareListing(topForecast)}
                    className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm ${primaryBtnTheme}`}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('forecast.prepare_btn', 'Prepare My Listing')}
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
                          
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'
                            }`}>
                              {opp.category}
                            </span>
                            {opp.matchStatus === 'ACCEPTED' ? (
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                ✓ Accepted Connection
                              </span>
                            ) : opp.matchStatus === 'REJECTED' ? (
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                Declined
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                New Match Request
                              </span>
                            )}
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

                        {/* Action buttons based on Match Connection Status */}
                        <div className="flex items-center gap-2 mt-6 border-t pt-4 border-cream-dark/30">
                          {opp.matchStatus === 'ACCEPTED' || opp.matchStatus === 'CONTACTED' ? (
                            <button
                              onClick={() => handleContactProviderFromMatch(opp.matchId || opp.id || opp)}
                              className="grow font-bold rounded-xl text-sm py-2.5 bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>Contact / Chat Customer</span>
                            </button>
                          ) : opp.matchStatus === 'REJECTED' ? (
                            <button
                              disabled
                              className="grow font-bold rounded-xl text-sm py-2.5 bg-gray-100 text-gray-400 cursor-not-allowed text-center"
                            >
                              You Declined This Request
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleAcceptMatch(opp)}
                                className={`grow font-bold rounded-xl text-sm py-2.5 flex items-center justify-center gap-1.5 ${primaryBtnTheme}`}
                              >
                                <Check className="h-4 w-4" />
                                <span>Accept Match</span>
                              </button>
                              <button
                                onClick={() => handleRejectMatch(opp)}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                              >
                                <X className="h-4 w-4" />
                                <span>Decline</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => toggleBookmark(opp.id)}
                            className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center transition-all ${
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

          {/* ================= VIEW: MATCH REQUESTS / APPLICATIONS ================= */}
          {activeTab === 'match-requests' && (() => {
            const activeApplications = providerMatchRequests.filter(m => {
              const st = (m.status || 'APPLIED').toUpperCase();
              return ['APPLIED', 'PENDING', 'ACCEPTED', 'CONTACTED', 'CONFIRMED'].includes(st);
            });
            const previousApplications = providerMatchRequests.filter(m => {
              const st = (m.status || 'APPLIED').toUpperCase();
              return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(st);
            });

            const displayedMatches = providerMatchSubTab === 'active' 
              ? activeApplications 
              : previousApplications;

            return (
              <div className="flex flex-col gap-6 text-left">
                <div className="border-b pb-3 border-cream-dark/30 flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Application Tracker</h2>
                    <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                      Track and manage customer requests through Applied, Accepted, Confirmed, and Completed stages.
                    </p>
                  </div>
                  <button
                    onClick={fetchProviderMatchRequests}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-cream-dark hover:bg-gray-100 flex items-center gap-1.5"
                  >
                    <span>🔄 Refresh Applications</span>
                  </button>
                </div>

                {/* Sub-tab Navigation Buttons: [Active Applications] [Previous Applications] (NO '0' counters) */}
                <div className="flex flex-wrap gap-2.5 border-b border-cream-dark/30 pb-3">
                  <button
                    onClick={() => setProviderMatchSubTab('active')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                      providerMatchSubTab === 'active'
                        ? (highContrast ? 'bg-white text-black' : 'bg-terracotta text-white shadow-md')
                        : 'bg-cream-dark/20 text-charcoal hover:bg-cream-dark/40'
                    }`}
                  >
                    <span>Active Applications</span>
                  </button>

                  <button
                    onClick={() => setProviderMatchSubTab('previous')}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
                      providerMatchSubTab === 'previous'
                        ? (highContrast ? 'bg-white text-black' : 'bg-forest text-white shadow-md')
                        : 'bg-cream-dark/20 text-charcoal hover:bg-cream-dark/40'
                    }`}
                  >
                    <span>Previous Applications</span>
                  </button>
                </div>

                {isLoadingMatchRequests ? (
                  <div className="p-12 text-center font-bold text-forest animate-pulse flex justify-center items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Fetching applications from MongoDB...</span>
                  </div>
                ) : displayedMatches.length === 0 ? (
                  <div className={`p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3 ${cardTheme}`}>
                    <BookmarkCheck className="h-12 w-12 text-gray-400" />
                    <h3 className="font-serif text-xl font-bold">
                      {providerMatchSubTab === 'active'
                        ? 'No active applications'
                        : 'No previous applications yet.'}
                    </h3>
                    {providerMatchSubTab === 'active' && (
                      <p className={`text-sm ${textSecondaryTheme} max-w-md mx-auto`}>
                        When a customer applies for your service, their request will appear here.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2">
                    {displayedMatches.map((match) => (
                      <MatchCard
                        key={match._id}
                        match={match}
                        userRole="provider"
                        highContrast={highContrast}
                        onAccept={handleAcceptProviderMatch}
                        onReject={handleRejectProviderMatch}
                        onConfirm={handleConfirmProviderMatch}
                        onStartService={handleCompleteProviderMatch}
                        onCompleteService={handleCompleteProviderMatch}
                        onCancel={handleCancelProviderMatch}
                        onContact={handleContactProviderFromMatch}
                        onOpenChat={handleContactProviderFromMatch}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================= VIEW: OPPORTUNITY FORECAST ================= */}
          {activeTab === 'forecast' && (() => {
            // Filter logic
            const displayedForecasts = rankedForecasts.filter(event => {
              if (forecastCategoryFilter !== 'all') {
                const hasCat = event.relevantCategories.includes(forecastCategoryFilter) || event.suggestionCategory === forecastCategoryFilter;
                if (!hasCat) return false;
              }
              if (forecastDateFilter !== 'all') {
                const startM = new Date(event.startDate).getMonth() + 1; // 1-indexed month
                if (forecastDateFilter === 'summer' && (startM < 4 || startM > 5)) return false;
                if (forecastDateFilter === 'monsoon' && (startM < 7 || startM > 8)) return false;
                if (forecastDateFilter === 'winter' && (startM < 10 || startM > 12)) return false;
                if (forecastDateFilter === 'reopening' && startM !== 6) return false;
              }
              if (forecastLocationFilter !== 'all') {
                if (forecastLocationFilter === 'city' && event.region?.toLowerCase() === 'national') return false;
                if (forecastLocationFilter === 'national' && event.region?.toLowerCase() !== 'national') return false;
              }
              if (forecastRelevanceFilter === 'high') {
                if (!event.isRelevant && event.relevanceScore < 60) return false;
              }
              if (forecastReligionFilter !== 'all') {
                if (event.religion?.toLowerCase() !== forecastReligionFilter.toLowerCase()) return false;
              }
              return true;
            });

            const personalizedForecasts = rankedForecasts.filter(e => e.isRelevant || e.relevanceScore >= 60).slice(0, 3);

            return (
              <div className="flex flex-col gap-8 text-left">
                
                {/* Header */}
                <div className="border-b pb-4 border-cream-dark/30 flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-3xl font-bold flex items-center gap-2">
                      <TrendingUp className="h-8 w-8 text-terracotta" />
                      {t('forecast.page_title', 'Opportunity Forecast')}
                    </h2>
                    <p className={`text-sm ${textSecondaryTheme} mt-2`}>
                      {t('forecast.page_subtitle', 'Plan ahead and prepare your services based on personalized regional demands.')} <br/>
                      <span className="italic text-xs text-gray-500">{t('forecast.disclaimer', '*AI estimate based on historical seasonal patterns and profile relevance')}</span>
                    </p>
                  </div>
                </div>

                {isLoadingForecasts ? (
                  <div className="py-12 text-center text-xs font-bold text-forest animate-pulse flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta" /> Calculating personalized forecast relevance scores...
                  </div>
                ) : (
                  <>
                    {/* Personalized Section: Most Relevant For You */}
                    <div className="flex flex-col gap-4">
                      <h3 className="font-serif text-2xl font-bold flex items-center gap-2 text-terracotta">
                        ⭐ Most Relevant For You
                      </h3>
                      {personalizedForecasts.length === 0 ? (
                        <div className={`p-8 text-center rounded-3xl text-xs text-gray-500 border border-dashed ${cardTheme}`}>
                          Update your skills or bio in your Profile tab to generate personalized recommendations!
                        </div>
                      ) : (
                        <div className="grid gap-6 md:grid-cols-3">
                          {personalizedForecasts.map((event) => (
                            <div 
                              key={event.id}
                              className={`p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 relative overflow-hidden transition-all hover:shadow-md ${
                                highContrast ? 'border-yellow-400 bg-black text-white' : 'border-terracotta bg-orange-50/20'
                              }`}
                            >
                              <div className="absolute top-0 right-0 bg-terracotta text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-0.5 uppercase tracking-wider">
                                <Sparkles className="h-3 w-3 text-yellow-200" /> Match {event.relevanceScore}%
                              </div>

                              <div className="flex flex-col gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{event.eventName.split(' ')[0]}</span>
                                  <h4 className="font-serif text-lg font-bold truncate">{event.eventName.substring(event.eventName.indexOf(' ') + 1)}</h4>
                                </div>

                                <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" /> {event.dateRange}
                                </span>

                                <p className={`text-xs mt-1.5 p-2.5 rounded-xl border leading-relaxed bg-white text-charcoal font-medium ${
                                  highContrast ? 'bg-black border-white' : 'border-orange-100'
                                }`}>
                                  💡 {event.explanation || `Highly relevant to your services around the ${event.eventName} season.`}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 mt-2 border-t pt-3 border-cream-dark/20">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-gray-500">Demand Uplift:</span>
                                  <span className="font-bold text-green-700">{event.demandUplift}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-gray-500">Service:</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-cream-dark/30 text-charcoal uppercase tracking-wider">
                                    {event.suggestionCategory}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handlePrepareListing(event)}
                                  className={`mt-2 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    highContrast ? 'bg-white text-black hover:bg-yellow-400' : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-sm'
                                  }`}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  View Opportunity
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* All Forecasts Section: All Upcoming Opportunities */}
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="border-b pb-3 border-cream-dark/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                          📅 All Upcoming Opportunities
                        </h3>
                        
                        {/* Filters Controls */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {/* Category Filter */}
                          <select 
                            value={forecastCategoryFilter}
                            onChange={(e) => setForecastCategoryFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-cream-dark rounded-xl font-bold text-charcoal focus:outline-none"
                          >
                            <option value="all">All Categories</option>
                            <option value="cooking">Cooking</option>
                            <option value="tailoring">Tailoring</option>
                            <option value="tutoring">Tutoring</option>
                            <option value="caregiving">Caregiving</option>
                            <option value="errands">Errands</option>
                            <option value="home-services">Home Services</option>
                          </select>

                          {/* Date Filter */}
                          <select 
                            value={forecastDateFilter}
                            onChange={(e) => setForecastDateFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-cream-dark rounded-xl font-bold text-charcoal focus:outline-none"
                          >
                            <option value="all">All Dates</option>
                            <option value="summer">Summer (Apr - May)</option>
                            <option value="monsoon">Monsoon (Jul - Aug)</option>
                            <option value="winter">Festive & Winter (Oct - Dec)</option>
                            <option value="reopening">School Prep (June)</option>
                          </select>

                          {/* Location Filter */}
                          <select 
                            value={forecastLocationFilter}
                            onChange={(e) => setForecastLocationFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-cream-dark rounded-xl font-bold text-charcoal focus:outline-none"
                          >
                            <option value="all">All Locations</option>
                            <option value="national">National / State</option>
                            <option value="city">City / Local</option>
                          </select>

                          {/* Relevance filter */}
                          <select 
                            value={forecastRelevanceFilter}
                            onChange={(e) => setForecastRelevanceFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-cream-dark rounded-xl font-bold text-charcoal focus:outline-none"
                          >
                            <option value="all">All Relevance</option>
                            <option value="high">Highly Relevant</option>
                          </select>

                          {/* Religion Filter */}
                          <select 
                            value={forecastReligionFilter}
                            onChange={(e) => setForecastReligionFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-cream-dark rounded-xl font-bold text-charcoal focus:outline-none"
                          >
                            <option value="all">All Traditions</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Islamic">Islamic</option>
                            <option value="Christian">Christian</option>
                            <option value="Sikh">Sikh</option>
                            <option value="Buddhist">Buddhist</option>
                            <option value="Jain">Jain</option>
                            <option value="None">Non-religious</option>
                          </select>
                        </div>
                      </div>

                      {displayedForecasts.length === 0 ? (
                        <div className={`p-12 text-center rounded-3xl text-xs text-gray-400 ${cardTheme}`}>
                          No opportunities match your current filters. Try resetting the filters.
                        </div>
                      ) : (
                        <div className="grid gap-6">
                          {displayedForecasts.map((event) => (
                            <div 
                              key={event.id} 
                              className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden transition-all ${
                                event.isRelevant
                                  ? (highContrast ? 'border-yellow-400 bg-black text-white' : 'border-terracotta bg-orange-50/10')
                                  : cardTheme
                              }`}
                            >
                              {event.isRelevant && (
                                <div className="absolute top-0 right-0 bg-terracotta text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl shadow-sm flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" /> {t('forecast.relevant_badge', 'Highly Recommended')}
                                </div>
                              )}
                              
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">{event.eventName.split(' ')[0]}</span>
                                  <div>
                                    <h3 className="font-serif text-2xl font-bold">{event.eventName.substring(event.eventName.indexOf(' ') + 1)}</h3>
                                    <span className="text-sm font-bold text-gray-500 flex items-center gap-1">
                                      <Calendar className="h-4 w-4" /> {event.dateRange}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  <span className="text-xs font-bold text-gray-500 uppercase">{t('forecast.relevant_categories', 'Relevant Categories')}</span>
                                  <div className="flex gap-2 mt-1">
                                    {event.relevantCategories.map(cat => (
                                      <span key={cat} className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                        highContrast ? 'border border-white text-white' : 'bg-cream-dark/30 text-charcoal'
                                      }`}>
                                        {t(`customer.categories.${cat}`, cat)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className={`md:w-80 shrink-0 p-5 rounded-2xl flex flex-col justify-center border border-dashed ${
                                highContrast ? 'border-gray-600' : 'bg-white border-cream-dark/50 shadow-sm'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="h-5 w-5 text-green-600" />
                                  <span className="font-bold text-lg text-green-700">{t('forecast.demand_label', 'Demand')} {event.demandUplift}</span>
                                </div>
                                <p className={`text-sm ${textSecondaryTheme} leading-relaxed`}>{event.insight}</p>
                                
                                <button
                                  onClick={() => handlePrepareListing(event)}
                                  className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                    highContrast ? 'bg-white text-black hover:bg-yellow-400' : 'bg-forest hover:bg-forest-hover text-white shadow-md'
                                  }`}
                                >
                                  <Sparkles className="h-4 w-4" />
                                  {t('forecast.prepare_btn', 'Prepare My Listing')}
                                </button>
                              </div>

                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            );
          })()}



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
                  <span className="text-xs font-bold text-gray-400 uppercase">This Month's Earnings</span>
                  <h3 className="text-4xl font-extrabold text-forest mt-1 flex items-center justify-center sm:justify-start">
                    <IndianRupee className="h-8 w-8" />
                    {earningsData.thisMonthEarnings}
                  </h3>
                  <p className="text-xs text-green-600 mt-1">✓ Direct bank deposits complete</p>
                </div>
                <div className="flex flex-col justify-center gap-1.5 border-t sm:border-t-0 sm:border-l border-cream-dark/50 pt-4 sm:pt-0 sm:pl-6 text-left">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Total Earnings</span>
                    <p className="text-base font-bold flex items-center">
                      <IndianRupee className="h-4 w-4" /> {earningsData.totalEarnings}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Completed Services</span>
                    <p className="text-base font-bold">{earningsData.completedServicesCount} Households</p>
                  </div>
                </div>
              </div>

              {/* Recent Earnings list */}
              <div className="flex flex-col gap-4">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                  📊 Recent Earnings Activity
                </h3>
                {earningsData.recentEarnings.length === 0 ? (
                  <div className={`p-8 text-center rounded-3xl text-xs text-gray-400 border border-dashed ${cardTheme}`}>
                    Completed tasks and verified payments will generate persistent transaction history here.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {earningsData.recentEarnings.map((earning) => (
                      <div 
                        key={earning._id} 
                        className={`p-4 rounded-3xl border flex items-center justify-between hover:shadow-sm transition-all ${cardTheme}`}
                      >
                        <div>
                          <h4 className="font-bold text-sm text-forest leading-snug">{earning.serviceName}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Customer: {earning.customerId?.name || 'Verified Household'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            Completed on {new Date(earning.earnedAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-lg text-terracotta flex items-center justify-end gap-0.5">
                            <IndianRupee className="h-4.5 w-4.5" />
                            {earning.amount}
                          </span>
                          <span className="text-[9px] font-extrabold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wider mt-1.5 inline-block">
                            Paid
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

              <ErrorBoundary>
                <ChatInterface 
                  user={user} 
                  highContrast={highContrast} 
                  initialMatchId={activeChatMatchId}
                  onNavigate={onNavigate} 
                  onPrepareListing={() => handlePrepareListing(topForecast)} 
                />
              </ErrorBoundary>
            </div>
          )}

          {/* ================= VIEW: MY PROFILE ================= */}
          {activeTab === 'profile' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="border-b pb-3 border-cream-dark/30 mb-6 flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-2xl font-bold">My Profile</h2>
                  <p className={`text-sm ${textSecondaryTheme} mt-1`}>
                    Manage your provider details, skills, bio, and matchmaking settings.
                  </p>
                </div>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-terracotta text-white hover:bg-terracotta-hover shadow-sm transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsEditingProfile(false)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-200 text-charcoal hover:bg-gray-300 transition-all"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel Editing</span>
                  </button>
                )}
              </div>

              {/* Profile Saved Success Banner */}
              {profileSuccessMsg && (
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-forest font-bold text-sm flex items-center justify-between shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-teal-600" />
                    <span>Profile Saved Successfully! Saved to MongoDB & 768-dim Vector Embedding generated.</span>
                  </div>
                  <button onClick={() => setProfileSuccessMsg(false)}><X className="h-4 w-4" /></button>
                </div>
              )}

              {/* Profile Overview / Edit Card */}
              <div className={`p-6 rounded-3xl flex flex-col gap-4 mb-2 ${cardTheme}`}>
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-cream-dark/30">
                  <div className="flex items-center gap-4">
                    <div className={`h-16 w-16 rounded-full flex items-center justify-center font-serif text-2xl font-extrabold shadow-sm ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
                      {user?.name ? user.name[0] : 'P'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold font-serif">{user?.name || 'Provider'}</h3>
                      <p className={`text-sm mt-0.5 ${textSecondaryTheme}`}>
                        {user?.phone || 'No phone'} • City: <span className="font-semibold capitalize">{user?.city || 'Delhi'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-center ${
                      highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'
                    }`}>
                      Provider
                    </span>
                    {user?.isOnboarded ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wider text-center bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Complete Profile
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wider text-center bg-amber-100 text-amber-800 border border-amber-200">
                        ⚠️ Profile Incomplete
                      </span>
                    )}
                  </div>
                </div>

                {!isEditingProfile ? (
                  /* READ-ONLY PROFILE DISPLAY */
                  <div className="flex flex-col gap-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 rounded-2xl border border-cream-dark/30 bg-cream/20">
                        <span className="text-xs text-gray-500 font-bold uppercase">Preferred Language</span>
                        <p className="font-bold text-charcoal capitalize mt-0.5">{user?.preferredLanguage === 'ta' ? 'Tamil' : user?.preferredLanguage === 'hi' ? 'Hindi' : 'English'}</p>
                      </div>
                      <div className="p-3 rounded-2xl border border-cream-dark/30 bg-cream/20">
                        <span className="text-xs text-gray-500 font-bold uppercase">Age</span>
                        <p className="font-bold text-charcoal mt-0.5">{user?.age ? `${user.age} years` : 'Not specified'}</p>
                      </div>
                      <div className="p-3 rounded-2xl border border-cream-dark/30 bg-cream/20">
                        <span className="text-xs text-gray-500 font-bold uppercase">Availability Status</span>
                        <p className={`font-bold mt-0.5 ${user?.availability !== false ? 'text-teal-700' : 'text-red-600'}`}>
                          {user?.availability !== false ? '● Available for Work' : '○ Currently Unavailable'}
                        </p>
                      </div>
                    </div>

                    {user?.bio && (
                      <div>
                        <h4 className="text-sm font-bold text-forest mb-2 flex items-center gap-1.5">
                          <User className="h-4 w-4" /> Description / Bio
                        </h4>
                        <p className={`text-sm leading-relaxed ${textSecondaryTheme} italic bg-cream/20 p-4 rounded-xl border border-cream-dark/30`}>
                          "{user.bio}"
                        </p>
                      </div>
                    )}

                    {Array.isArray(user?.skills) && user.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-forest mb-2 flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-terracotta" /> Saved Skills ({user.skills.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {user.skills.map((skill, idx) => {
                            const skillName = typeof skill === 'object' ? skill.skillName : skill;
                            return (
                              <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-forest border border-teal-200">
                                {skillName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Ratings & Reviews Section */}
                    <div className="border-t pt-5 border-cream-dark/30 mt-2">
                      <h4 className="text-sm font-extrabold text-forest mb-3 flex items-center gap-1.5">
                        ⭐ Ratings & Reviews
                      </h4>
                      
                      <div className="flex items-center gap-4 bg-cream/10 p-4 border border-cream-dark/20 rounded-2xl mb-4">
                        <div className="text-center shrink-0 pr-4 border-r border-cream-dark/30">
                          <p className="text-3xl font-extrabold text-forest">{reviewCount > 0 ? averageRating.toFixed(1) : 'No ratings'}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                            {reviewCount > 0 ? `Based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}` : 'No ratings yet'}
                          </p>
                        </div>
                        {reviewCount > 0 ? (
                          <div className="text-yellow-500 text-lg tracking-widest leading-none font-bold">
                            {"★".repeat(Math.round(averageRating)) + "☆".repeat(5 - Math.round(averageRating))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 font-semibold italic">Complete services to start collecting ratings!</p>
                        )}
                      </div>

                      {isLoadingReviews ? (
                        <p className="text-xs text-forest animate-pulse font-bold">Loading reviews...</p>
                      ) : providerReviews.length === 0 ? (
                        <p className="text-xs text-gray-500 font-semibold italic bg-gray-50/50 p-4 border rounded-2xl text-center">
                          No reviews have been written for you yet.
                        </p>
                      ) : (
                        <div className="space-y-3.5">
                          {providerReviews.map((rev) => (
                            <div key={rev._id} className="p-4 bg-gray-50/50 border border-cream-dark/20 rounded-2xl text-xs space-y-1.5">
                              <div className="flex justify-between items-center">
                                <div className="text-yellow-500 font-bold tracking-widest text-sm leading-none">
                                  {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                                </div>
                                <span className="text-[10px] text-gray-400 font-bold">
                                  {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              {rev.comment && (
                                <p className="italic text-gray-600 font-medium leading-relaxed">
                                  "{rev.comment}"
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400 font-bold text-right">
                                — {rev.reviewerId?.name || 'Anonymous customer'} ({rev.reviewerId?.city || 'Delhi'})
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* EDITABLE PROFILE FORM */
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500">Full Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                          className={`px-4 py-2.5 rounded-xl text-sm ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500">City / Location</label>
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                          required
                          placeholder="e.g. Delhi, Mumbai"
                          className={`px-4 py-2.5 rounded-xl text-sm ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500">Age</label>
                        <input
                          type="number"
                          value={profileForm.age}
                          onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                          placeholder="Age (e.g. 62)"
                          className={`px-4 py-2.5 rounded-xl text-sm ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase text-gray-500">Preferred Language</label>
                        <select
                          value={profileForm.preferredLanguage}
                          onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value })}
                          className={`px-4 py-2.5 rounded-xl text-sm ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                        >
                          <option value="en">English</option>
                          <option value="ta">தமிழ் (Tamil)</option>
                          <option value="hi">हिन्दी (Hindi)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase text-gray-500">Description / Bio</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows="3"
                        placeholder="Describe your experience and services offered..."
                        className={`w-full px-4 py-2.5 rounded-xl text-sm ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                      />
                    </div>

                    <div className="flex items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        id="availCheck"
                        checked={profileForm.availability}
                        onChange={(e) => setProfileForm({ ...profileForm, availability: e.target.checked })}
                        className="h-4 w-4 text-terracotta rounded border-gray-300"
                      />
                      <label htmlFor="availCheck" className="text-sm font-bold cursor-pointer">
                        Active & Available for Work Matchmaking
                      </label>
                    </div>

                    {/* Skills Manager */}
                    <div className="flex flex-col gap-2 border-t pt-4 border-cream-dark/30">
                      <label className="text-xs font-bold uppercase text-gray-500">Manage Skills</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(profileForm.skills || []).map((skill, index) => {
                          const skillName = typeof skill === 'object' ? skill.skillName : skill;
                          return (
                            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-forest border border-teal-200">
                              <span>{skillName}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSkillFromProfile(index)}
                                className="hover:text-red-500"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newManualSkill}
                          onChange={(e) => setNewManualSkill(e.target.value)}
                          placeholder="Add skill (e.g. Cooking, Tutoring)"
                          className={`flex-grow px-3 py-2 rounded-xl text-xs ${highContrast ? 'bg-black border border-white text-white' : 'border border-cream-dark bg-cream/10'}`}
                        />
                        <button
                          type="button"
                          onClick={handleAddSkillToProfile}
                          className="px-4 py-2 bg-forest text-white font-bold text-xs rounded-xl hover:bg-forest-hover flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" /> Add
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t pt-4 border-cream-dark/30">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold border border-cream-dark hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-terracotta text-white hover:bg-terracotta-hover shadow-md flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving to MongoDB...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

              </div>

              {/* My Published Services (Listings) */}
              {user?.role === 'provider' && Array.isArray(providerListings) && providerListings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-cream-dark/30">
                  <h4 className="text-sm font-bold text-forest mb-4 flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" /> My Published Services
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerListings.filter(Boolean).map(listing => (
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
              <div className={`p-6 rounded-3xl flex flex-col gap-4 mt-6 border ${
                highContrast ? 'border-white bg-black' : 'bg-white border-cream-dark shadow-sm'
              }`}>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-terracotta" />
                  Update Skills via AI
                </h3>

                {/* AI Balloon */}
                <div className="flex items-start gap-3 mt-2">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${highContrast ? 'border border-white text-white' : 'bg-forest text-white'}`}>
                    <Bot className="h-6 w-6" />
                  </div>
                  <div className={`p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed ${highContrast ? 'border border-white bg-black text-white' : 'bg-teal-50 border border-teal-100 text-forest shadow-sm'}`}>
                    "Hello again! Tell me about any new skills or experience you want to offer. You can type it below or just use your voice, and I'll automatically map it to your profile!"
                  </div>
                </div>

                {/* User Input Frame */}
                <div className="flex items-end gap-3 mt-2">
                  <div className="flex-grow flex flex-col gap-2 relative">
                    <textarea 
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="e.g. I am great at baking cookies and teaching traditional stitching..."
                      rows="3"
                      className={`w-full px-4 py-3 rounded-2xl text-base transition-all ${
                        highContrast 
                          ? 'bg-black border-2 border-white text-white focus:border-yellow-400' 
                          : 'bg-cream-dark/20 border border-cream-dark text-charcoal focus:border-terracotta focus:ring-1 focus:ring-terracotta'
                      }`}
                    />
                  </div>

                  {/* Pulsing Voice Mic Button */}
                  <div className="relative shrink-0 mb-1">
                    {isListeningBio && (
                      <span className="absolute inset-0 rounded-2xl bg-terracotta opacity-70 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={handleListenBio}
                      className={`relative z-10 h-[52px] w-[52px] rounded-2xl flex items-center justify-center text-white transition-all ${
                        isListeningBio 
                          ? 'bg-red-500 animate-pulse shadow-lg' 
                          : (highContrast ? 'bg-white text-black border border-black hover:bg-yellow-400' : 'bg-terracotta hover:bg-terracotta-hover shadow-md hover:shadow-lg')
                      }`}
                      aria-label="Toggle Voice Input"
                    >
                      {isListeningBio ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>
                  </div>
                </div>

                {isListeningBio && (
                  <p className="text-xs text-red-500 font-bold text-center mt-1 animate-pulse">
                    🎤 Listening (Speaking active)...
                  </p>
                )}
                
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
                {Array.isArray(extractedSkills) && extractedSkills.length > 0 && (
                  <div className="mt-4 border-t border-cream-dark/30 pt-4">
                    <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-forest">Extracted Skills Review</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedSkills.filter(Boolean).map((skill, index) => {
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
                  <h3 className="text-2xl font-serif font-bold">{t('listing.modal_title', 'Create Service Listing')}</h3>
                  <p className={`text-sm ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('listing.modal_subtitle', 'Publish your offering to meet the upcoming')} <strong>{t(`forecast.${selectedForecast.id}.eventName`, selectedForecast.eventName)}</strong> {t('listing.demand_suffix', 'demand.')}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <div>
                  <label className="text-sm font-bold text-gray-500 uppercase">{t('listing.title_label', 'Service Title')}</label>
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
                  <label className="text-sm font-bold text-gray-500 uppercase">{t('listing.category_label', 'Category')}</label>
                  <input
                    type="text"
                    value={t(`customer.categories.${listingForm.category}`, listingForm.category)}
                    disabled
                    className={`w-full p-3 rounded-xl border mt-1 focus:outline-none transition-all opacity-70 ${
                      highContrast 
                        ? 'bg-black border-white text-white' 
                        : 'bg-cream-dark/20 border-cream-dark text-charcoal'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2">
                    <label className="text-sm font-bold text-gray-500 uppercase">{t('listing.rate_structure_label', 'Rate Structure')}</label>
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
                        <span className="text-sm font-semibold">{t('listing.one_day_rate', 'One-Day Rate')}</span>
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
                        <span className="text-sm font-semibold">{t('listing.package_rate', 'Package Rate')}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-gray-500 uppercase">
                      {listingForm.rateType === 'daily' ? t('listing.amount_per_day', 'Amount (per day)') : t('listing.total_package_amount', 'Total Package Amount')}
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
                      <label className="text-sm font-bold text-gray-500 uppercase">{t('listing.package_duration_label', 'Package Duration')}</label>
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
                  <label className="text-sm font-bold text-gray-500 uppercase">{t('listing.description_label', 'Description')}</label>
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
                {isCreatingListing ? t('listing.publishing_btn', 'Publishing...') : t('listing.publish_btn', 'Publish Listing')}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default UserDashboard;
