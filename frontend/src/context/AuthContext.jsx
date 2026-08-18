import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        if (data.preferredLanguage) {
          i18n.changeLanguage(data.preferredLanguage);
        }
      } catch (err) {
        // No active session cookie
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedIn();
  }, [i18n]);

  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    setUser(data);
    if (data.preferredLanguage) {
      i18n.changeLanguage(data.preferredLanguage);
    }
    return data;
  };

  const signup = async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    setUser(data);
    if (data.preferredLanguage) {
      i18n.changeLanguage(data.preferredLanguage);
    }
    return data;
  };

  const googleLogin = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    setUser(data);
    if (data.preferredLanguage) {
      i18n.changeLanguage(data.preferredLanguage);
    }
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const updateUserInState = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.preferredLanguage) {
      i18n.changeLanguage(updatedUser.preferredLanguage);
    }
  };

  const sendOtp = async (phone) => {
    return await api.post('/auth/send-otp', { phone });
  };

  const verifyOtp = async (data) => {
    const res = await api.post('/auth/verify-otp', data);
    setUser(res.data);
    if (res.data.preferredLanguage) {
      i18n.changeLanguage(res.data.preferredLanguage);
    }
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout, updateUserInState, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
