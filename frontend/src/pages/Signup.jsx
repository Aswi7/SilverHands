import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Signup.css';

const Signup = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('provider');
  const [prefLang, setPrefLang] = useState('en');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  
  const [geoState, setGeoState] = useState(''); // 'detecting', 'success', 'error'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoState('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLongitude(position.coords.longitude.toFixed(6));
        setLatitude(position.coords.latitude.toFixed(6));
        setGeoState('success');
      },
      (err) => {
        console.error(err);
        setGeoState('error');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!longitude || !latitude) {
      setError('Location coordinates are required.');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name,
        phone,
        password,
        role,
        preferredLanguage: prefLang,
        location: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude)
        }
      });
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <header className="signup-header">
        <h1>SilverHands</h1>
        <LanguageSwitcher />
      </header>

      <div className="signup-card">
        <h2>{t('auth.signup_title')}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">{t('auth.name')}</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">{t('auth.phone')}</label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>{t('auth.role')}</label>
            <div className="radio-group">
              <label className={`radio-label ${role === 'provider' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="provider"
                  checked={role === 'provider'}
                  onChange={() => setRole('provider')}
                />
                {t('roles.provider')}
              </label>
              <label className={`radio-label ${role === 'customer' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={role === 'customer'}
                  onChange={() => setRole('customer')}
                />
                {t('roles.customer')}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="prefLang">{t('auth.preferred_language')}</label>
            <select
              id="prefLang"
              value={prefLang}
              onChange={(e) => setPrefLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          <div className="form-group location-section">
            <label>Location Coordinates</label>
            <button
              type="button"
              onClick={handleGetLocation}
              className={`location-detect-btn ${geoState}`}
            >
              {geoState === 'detecting' ? '...' : t('auth.detect_location')}
            </button>
            {geoState === 'success' && <p className="success-note">{t('auth.location_detected')}</p>}
            {geoState === 'error' && <p className="error-note">{t('auth.location_failed')}</p>}

            <div className="coords-row">
              <div>
                <label htmlFor="latitude">{t('auth.latitude')}</label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="longitude">{t('auth.longitude')}</label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="signup-submit-btn">
            {loading ? '...' : t('auth.signup_btn')}
          </button>
        </form>

        <p className="auth-toggle" onClick={() => onNavigate('login')}>
          {t('auth.have_account')}
        </p>
      </div>
    </div>
  );
};

export default Signup;
