import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import api from '../services/api';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { user, updateUserInState } = useAuth() || {};
  const { setLanguage } = useAccessibility();

  const handleLanguageChange = async (newLang) => {
    setLanguage(newLang);
    if (user) {
      try {
        const { data } = await api.put('/users/profile', { preferredLanguage: newLang });
        if (updateUserInState) {
          updateUserInState(data);
        }
      } catch (err) {
        console.error('Failed to sync language preference with backend:', err.message);
      }
    }
  };

  return (
    <div className="lang-switcher">
      <label htmlFor="lang-select">{t('accessibility.language_selector')}: </label>
      <select 
        id="lang-select"
        value={i18n.language} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="lang-select"
      >
        <option value="en">English</option>
        <option value="ta">தமிழ் (Tamil)</option>
        <option value="hi">हिन्दी (Hindi)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
