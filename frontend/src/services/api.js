import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Determine the API base URL based on the platform:
 * - Web: localhost
 * - Expo Go (physical device): extract host IP from Expo's dev server URI
 */
function getBaseUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:5001/api';
  }

  // Android Emulator uses 10.0.2.2 to access localhost of the host machine
  // Android Emulator must use 10.0.2.2 to access the Mac's localhost
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }

  // Expo Go on physical device – use the dev server's host IP
  const debuggerHost =
    Constants.expoConfig?.hostUri || // SDK 49+
    Constants.manifest?.debuggerHost || // older SDKs
    '';
  const hostIp = debuggerHost.split(':')[0];

  if (hostIp) {
    return `http://${hostIp}:5001/api`;
  }

  // Fallback
  return 'http://172.28.8.99:5001/api';
}

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token ──
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // silently continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ──
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear stored auth
      await AsyncStorage.multiRemove(['userToken', 'userData']);
    }
    return Promise.reject(error);
  }
);

export default API;
