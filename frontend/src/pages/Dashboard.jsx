import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Type, 
  Eye, 
  Globe, 
  LogOut, 
  MapPin, 
  Plus, 
  Clock, 
  Compass, 
  Laptop, 
  User, 
  Sparkles,
  Bot 
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';

const Dashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout, updateUserInState } = useAuth();
  
  // Accessibility States
  const [fontSize, setFontSize] = useState('normal'); 
  const [highContrast, setHighContrast] = useState(false);

  // Customer states
  const [reqTitle, setReqTitle] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqCategory, setReqCategory] = useState('tech');
  const [reqLng, setReqLng] = useState('');
  const [reqLat, setReqLat] = useState('');
  const [reqGeoState, setReqGeoState] = useState('');
  const [customerSuccess, setCustomerSuccess] = useState(false);
  const [customerError, setCustomerError] = useState('');

  // Provider states
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [providerError, setProviderError] = useState('');
  const [provGeoState, setProvGeoState] = useState('');
  const [maxDistance, setMaxDistance] = useState(5000); // 5km default

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

  // --- Customer Handlers ---
  const handleDetectRequestLocation = () => {
    if (!navigator.geolocation) {
      setReqGeoState('error');
      return;
    }
    setReqGeoState('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setReqLng(position.coords.longitude.toFixed(6));
        setReqLat(position.coords.latitude.toFixed(6));
        setReqGeoState('success');
      },
      (err) => {
        console.error(err);
        setReqGeoState('error');
      }
    );
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setCustomerError('');
    setCustomerSuccess(false);

    if (!reqLng || !reqLat) {
      setCustomerError('Location coordinates are required.');
      return;
    }

    try {
      await api.post('/requests', {
        title: reqTitle,
        description: reqDesc,
        category: reqCategory,
        location: {
          longitude: parseFloat(reqLng),
          latitude: parseFloat(reqLat)
        }
      });
      setCustomerSuccess(true);
      setReqTitle('');
      setReqDesc('');
      setReqGeoState('');
      setReqLng('');
      setReqLat('');
    } catch (err) {
      setCustomerError(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  // --- Provider Handlers ---
  const fetchNearbyRequests = async () => {
    setRequestsLoading(true);
    setProviderError('');
    try {
      const params = { maxDistance };
      if (user?.location?.coordinates) {
        params.longitude = user.location.coordinates[0];
        params.latitude = user.location.coordinates[1];
      }
      const { data } = await api.get('/requests/nearby', { params });
      setNearbyRequests(data);
    } catch (err) {
      setProviderError(err.response?.data?.message || 'Failed to fetch nearby requests.');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleUpdateProviderLocation = () => {
    if (!navigator.geolocation) {
      setProvGeoState('error');
      return;
    }
    setProvGeoState('detecting');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        try {
          const { data } = await api.put('/users/location', { longitude, latitude });
          setProvGeoState('success');
          if (user) {
            updateUserInState({
              ...user,
              location: data.location
            });
          }
        } catch (err) {
          console.error(err);
          setProvGeoState('error');
        }
      },
      (err) => {
        console.error(err);
        setProvGeoState('error');
      }
    );
  };

  useEffect(() => {
    if (user && user.role === 'provider') {
      fetchNearbyRequests();
    }
  }, [user, maxDistance]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center font-bold text-gray-500">
        Loading session...
      </div>
    );
  }

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

  const outlineBtnTheme = highContrast
    ? 'border-2 border-white bg-black text-white hover:bg-white hover:text-black h-[48px]'
    : 'border border-cream-dark hover:bg-cream-dark/30 text-charcoal h-[48px] rounded-2xl transition-all';

  return (
    <div className={`min-h-screen pb-16 font-sans ${bgTheme} transition-colors duration-200`}>
      
      {/* HEADER */}
      <header className={`sticky top-0 z-50 w-full border-b ${highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-cream/90 backdrop-blur-md'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-serif text-xl font-extrabold ${highContrast ? 'border-2 border-white bg-black text-white' : 'bg-terracotta text-white'}`}>
              S
            </span>
            <span className="font-serif text-2xl font-bold tracking-tight">
              SilverHands
            </span>
            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold ${highContrast ? 'border border-white bg-black text-white' : 'bg-forest/10 text-forest'}`}>
              {t(`roles.${user.role}`).split(' ')[0]}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
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

            <button 
              onClick={handleLogout} 
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600'}`}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* DASHBOARD CONTAINER */}
      <main className="mx-auto max-w-5xl px-4 mt-8 md:px-8 text-left">
        <h2 className="font-serif text-3xl font-extrabold mb-8">{t('welcome', { name: user.name })}</h2>

        {user.role === 'customer' ? (
          /* ================= CUSTOMER PANEL ================= */
          <div className={`mx-auto max-w-2xl p-8 rounded-3xl ${cardTheme}`}>
            <h3 className="font-serif text-2xl font-bold mb-6 text-terracotta flex items-center gap-2">
              <Plus className="h-6 w-6" />
              {t('customer.create_request')}
            </h3>
            
            {customerSuccess && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-green-100 text-green-700 border border-green-200">{t('customer.request_success')}</div>}
            {customerError && <div className="p-3 mb-4 rounded-xl text-center text-sm bg-red-100 text-red-700 border border-red-200">{customerError}</div>}

            <form onSubmit={handleCreateRequest} className="flex flex-col gap-5">
              
              {/* Need Title */}
              <div className="flex flex-col gap-2">
                <label htmlFor="reqTitle" className="text-sm font-bold">{t('customer.title')}</label>
                <input
                  type="text"
                  id="reqTitle"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  required
                  placeholder="e.g. Help setting up smart television"
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label htmlFor="reqCategory" className="text-sm font-bold">{t('customer.category')}</label>
                <select
                  id="reqCategory"
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                >
                  <option value="tech">{t('customer.categories.tech')}</option>
                  <option value="errands">{t('customer.categories.errands')}</option>
                  <option value="companionship">{t('customer.categories.companionship')}</option>
                  <option value="cooking">{t('customer.categories.cooking')}</option>
                  <option value="gardening">{t('customer.categories.gardening')}</option>
                  <option value="other">{t('customer.categories.other')}</option>
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label htmlFor="reqDesc" className="text-sm font-bold">{t('customer.description')}</label>
                <textarea
                  id="reqDesc"
                  rows="4"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  required
                  placeholder="Describe your need in detail..."
                  className={`px-4 py-3 rounded-xl text-base ${inputTheme}`}
                ></textarea>
              </div>

              {/* Service Location */}
              <div className="flex flex-col gap-3 border-t pt-4 border-cream-dark/30">
                <label className="text-sm font-bold">Service Location Coordinates</label>
                
                <button
                  type="button"
                  onClick={handleDetectRequestLocation}
                  className={`w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl ${outlineBtnTheme}`}
                >
                  <MapPin className="h-5 w-5 text-terracotta" />
                  {t('auth.detect_location')}
                </button>
                {reqGeoState === 'detecting' && <p className="text-xs text-center text-forest animate-pulse">Detecting Location...</p>}
                {reqGeoState === 'success' && <p className="text-xs text-center text-green-600 font-semibold">{t('auth.location_detected')}</p>}
                {reqGeoState === 'error' && <p className="text-xs text-center text-red-500 font-semibold">{t('auth.location_failed')}</p>}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reqLat" className="text-xs text-gray-500">{t('auth.latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      id="reqLat"
                      value={reqLat}
                      onChange={(e) => setReqLat(e.target.value)}
                      required
                      className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reqLng" className="text-xs text-gray-500">{t('auth.longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      id="reqLng"
                      value={reqLng}
                      onChange={(e) => setReqLng(e.target.value)}
                      required
                      className={`px-3 py-2 rounded-lg text-sm ${inputTheme}`}
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                className={`w-full font-bold flex items-center justify-center ${primaryBtnTheme} mt-2`}
              >
                {t('customer.submit_request_btn')}
              </button>
            </form>
          </div>
        ) : (
          /* ================= PROVIDER PANEL ================= */
          <div className="grid gap-8 md:grid-cols-3 items-start">
            
            {/* Left Controls Card */}
            <div className={`p-6 rounded-3xl flex flex-col gap-5 ${cardTheme}`}>
              <h3 className="font-serif text-xl font-bold text-forest border-b pb-2 border-cream-dark/30 flex items-center gap-1.5">
                <Compass className="h-5 w-5" />
                Location Settings
              </h3>
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">My Active Coordinates:</span>
                <p className="text-sm font-bold bg-cream-dark/10 p-3 border border-cream-dark/30 rounded-xl font-mono">
                  {user.location?.coordinates[1]?.toFixed(5)}, {user.location?.coordinates[0]?.toFixed(5)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleUpdateProviderLocation}
                className={`w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl ${outlineBtnTheme}`}
              >
                <MapPin className="h-5 w-5 text-terracotta" />
                {t('provider.update_location')}
              </button>
              {provGeoState === 'detecting' && <p className="text-xs text-center text-forest animate-pulse">Detecting GPS...</p>}
              {provGeoState === 'success' && <p className="text-xs text-center text-green-600 font-semibold">Location updated successfully!</p>}
              {provGeoState === 'error' && <p className="text-xs text-center text-red-500 font-semibold">Could not fetch coordinates.</p>}

              <div className="flex flex-col gap-2 border-t pt-4 border-cream-dark/30">
                <label htmlFor="radius-select" className="text-sm font-bold flex items-center gap-1"><Clock className="h-4 w-4" />Search Radius</label>
                <select
                  id="radius-select"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className={`px-3 py-2 rounded-xl text-base ${inputTheme}`}
                >
                  <option value="1000">1 km</option>
                  <option value="3000">3 km</option>
                  <option value="5000">5 km (Default)</option>
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                </select>
              </div>
            </div>

            {/* Right Requests Panel */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-terracotta" />
                {t('provider.nearby_requests')}
              </h3>

              {providerError && <div className="p-3 rounded-xl text-sm bg-red-100 text-red-700 border border-red-200">{providerError}</div>}

              {requestsLoading ? (
                <p className="text-base text-gray-500 animate-pulse">Loading local opportunities...</p>
              ) : nearbyRequests.length === 0 ? (
                <div className={`p-12 text-center rounded-3xl ${cardTheme}`}>
                  <p className="text-base text-gray-500 italic">
                    {t('provider.no_nearby_requests', { distance: maxDistance })}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {nearbyRequests.map((request) => (
                    <div 
                      key={request._id} 
                      className={`p-6 rounded-2xl border transition-all hover:-translate-y-0.5 flex flex-col gap-4 ${
                        highContrast 
                          ? 'border-white hover:border-yellow-400 bg-black text-white' 
                          : 'bg-white border-cream-dark shadow-sm hover:border-terracotta'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          highContrast ? 'border border-white bg-black text-white' : 'bg-teal-50 text-forest border border-teal-200'
                        }`}>
                          {t(`customer.categories.${request.category}`)}
                        </span>
                      </div>

                      <h4 className="text-xl font-bold">{request.title}</h4>
                      <p className={`text-base leading-relaxed ${textSecondaryTheme}`}>{request.description}</p>
                      
                      <div className="flex justify-between items-center text-xs border-t pt-3 border-cream-dark/30 text-gray-400">
                        <span className="flex items-center gap-1 font-semibold text-indigo-400">
                          <User className="h-3.5 w-3.5" /> By: {request.customer?.name}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3.5 w-3.5" /> {request.location.coordinates[1].toFixed(4)}, {request.location.coordinates[0].toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        )}
      </main>

    </div>
  );
};

export default Dashboard;
