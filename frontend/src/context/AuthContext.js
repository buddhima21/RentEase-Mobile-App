import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser as loginAPI, registerUser as registerAPI, getProfile } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // { _id, name, email, role, phone, token }
  const [isLoading, setIsLoading] = useState(true); // true while restoring session
  const [authError, setAuthError] = useState(null);

  // ── Restore session on app launch ──
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        // Verify token is still valid by calling /me
        try {
          const freshProfile = await getProfile();
          const restoredUser = { ...freshProfile, token };
          setUser(restoredUser);
          await AsyncStorage.setItem('userData', JSON.stringify(restoredUser));
        } catch (err) {
          // Token expired or invalid
          await AsyncStorage.multiRemove(['userToken', 'userData']);
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Session restore error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login ──
  const login = useCallback(async (email, password, role) => {
    setAuthError(null);
    try {
      const data = await loginAPI(email, password, role);
      // data = { _id, name, email, role, phone, token }
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Something went wrong. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  // ── Sign Up ──
  const signup = useCallback(async (name, email, password, role, phone) => {
    setAuthError(null);
    try {
      const data = await registerAPI({ name, email, password, role, phone });
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    setUser(null);
    setAuthError(null);
  }, []);

  // ── Clear error ──
  const clearError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authError,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Custom hook for consuming AuthContext */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
