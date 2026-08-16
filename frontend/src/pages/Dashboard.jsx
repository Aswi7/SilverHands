import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user, logout, updateUserInState } = useAuth();
  
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

  const handleLogout = async () => {
    try {
      await logout();
      onNavigate('login');
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

  // Fetch nearby requests for provider on load or distance filters updates
  useEffect(() => {
    if (user && user.role === 'provider') {
      fetchNearbyRequests();
    }
  }, [user, maxDistance]);

  if (!user) {
    return (
      <div className="dashboard-loading">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-branding">
          <h1>SilverHands</h1>
          <span className="user-role-badge">{t(`roles.${user.role}`)}</span>
        </div>
        <div className="header-controls">
          <LanguageSwitcher />
          <button onClick={handleLogout} className="logout-btn">
            {t('auth.logout_btn')}
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <h2>{t('welcome', { name: user.name })}</h2>

        {user.role === 'customer' ? (
          /* ================= CUSTOMER DASHBOARD ================= */
          <div className="dashboard-card customer-panel">
            <h3>{t('customer.create_request')}</h3>
            {customerSuccess && <div className="success-message">{t('customer.request_success')}</div>}
            {customerError && <div className="error-message">{customerError}</div>}

            <form onSubmit={handleCreateRequest} className="request-form">
              <div className="form-group">
                <label htmlFor="reqTitle">{t('customer.title')}</label>
                <input
                  type="text"
                  id="reqTitle"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  required
                  placeholder="e.g. Help setting up smart television"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reqCategory">{t('customer.category')}</label>
                <select
                  id="reqCategory"
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value)}
                >
                  <option value="tech">{t('customer.categories.tech')}</option>
                  <option value="errands">{t('customer.categories.errands')}</option>
                  <option value="companionship">{t('customer.categories.companionship')}</option>
                  <option value="cooking">{t('customer.categories.cooking')}</option>
                  <option value="gardening">{t('customer.categories.gardening')}</option>
                  <option value="other">{t('customer.categories.other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="reqDesc">{t('customer.description')}</label>
                <textarea
                  id="reqDesc"
                  rows="4"
                  value={reqDesc}
                  onChange={(e) => setReqDesc(e.target.value)}
                  required
                  placeholder="Explain what needs to be done, schedule, etc."
                ></textarea>
              </div>

              <div className="form-group request-location-section">
                <label>Service Location Coordinates</label>
                <button
                  type="button"
                  onClick={handleDetectRequestLocation}
                  className={`location-detect-btn ${reqGeoState}`}
                >
                  {reqGeoState === 'detecting' ? '...' : t('auth.detect_location')}
                </button>
                {reqGeoState === 'success' && <p className="success-note">{t('auth.location_detected')}</p>}
                {reqGeoState === 'error' && <p className="error-note">{t('auth.location_failed')}</p>}

                <div className="coords-row">
                  <div>
                    <label htmlFor="reqLat">{t('auth.latitude')}</label>
                    <input
                      type="number"
                      step="any"
                      id="reqLat"
                      value={reqLat}
                      onChange={(e) => setReqLat(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="reqLng">{t('auth.longitude')}</label>
                    <input
                      type="number"
                      step="any"
                      id="reqLng"
                      value={reqLng}
                      onChange={(e) => setReqLng(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-request-btn">
                {t('customer.submit_request_btn')}
              </button>
            </form>
          </div>
        ) : (
          /* ================= PROVIDER DASHBOARD ================= */
          <div className="provider-layout">
            <div className="dashboard-card provider-controls-card">
              <h3>My Location Status</h3>
              <p className="location-info-text">
                Current: {user.location?.coordinates[1]?.toFixed(5)}, {user.location?.coordinates[0]?.toFixed(5)}
              </p>
              <button
                type="button"
                onClick={handleUpdateProviderLocation}
                className={`location-detect-btn ${provGeoState}`}
              >
                {provGeoState === 'detecting' ? '...' : t('provider.update_location')}
              </button>
              {provGeoState === 'success' && <p className="success-note">Location updated successfully!</p>}
              {provGeoState === 'error' && <p className="error-note">Could not fetch coordinates.</p>}

              <div className="form-group radius-filter-group">
                <label htmlFor="radius-select">Search Radius</label>
                <select
                  id="radius-select"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                >
                  <option value="1000">1 km</option>
                  <option value="3000">3 km</option>
                  <option value="5000">5 km (Default)</option>
                  <option value="10000">10 km</option>
                  <option value="25000">25 km</option>
                </select>
              </div>
            </div>

            <div className="nearby-requests-panel">
              <h3>{t('provider.nearby_requests')}</h3>
              
              {providerError && <div className="error-message">{providerError}</div>}
              {requestsLoading ? (
                <p className="status-note">Loading nearby requests...</p>
              ) : nearbyRequests.length === 0 ? (
                <div className="dashboard-card empty-requests-card">
                  <p>{t('provider.no_nearby_requests', { distance: maxDistance })}</p>
                </div>
              ) : (
                <div className="requests-grid">
                  {nearbyRequests.map((request) => (
                    <div key={request._id} className="dashboard-card request-card">
                      <div className="request-card-header">
                        <span className="category-badge">{t(`customer.categories.${request.category}`)}</span>
                      </div>
                      <h4>{request.title}</h4>
                      <p className="request-description">{request.description}</p>
                      <div className="request-card-footer">
                        <span className="customer-info-tag">By: {request.customer?.name}</span>
                        <span className="coordinates-tag">
                          Lat/Lng: {request.location.coordinates[1].toFixed(4)}, {request.location.coordinates[0].toFixed(4)}
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
