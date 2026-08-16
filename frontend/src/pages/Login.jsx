import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Login.css';

const Login = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <h1>SilverHands</h1>
        <LanguageSwitcher />
      </header>

      <div className="login-card">
        <h2>{t('auth.login_title')}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
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

          <button type="submit" disabled={loading} className="login-submit-btn">
            {loading ? '...' : t('auth.login_btn')}
          </button>
        </form>

        <p className="auth-toggle" onClick={() => onNavigate('signup')}>
          {t('auth.no_account')}
        </p>
      </div>
    </div>
  );
};

export default Login;
