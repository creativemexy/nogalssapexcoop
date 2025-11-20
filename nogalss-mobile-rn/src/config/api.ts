// API Configuration
// For physical device testing, use your computer's IP address
// Your computer IP: 192.168.8.107
import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // In development
    if (Platform.OS === 'web') {
      // Web can use localhost
      return 'http://localhost:3000';
    } else {
      // Mobile devices need the computer's IP address
      return 'http://192.168.8.107:3000';
    }
  }
  // Production
  return 'https://noggalssapexcoop.org';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/mobile/login',
  LOGOUT: '/api/auth/mobile/logout',
  LEADER_STATS: '/api/leader/dashboard-stats',
  MEMBER_CONTRIBUTIONS: '/api/member/contributions',
  MEMBER_LOAN_ELIGIBILITY: '/api/member/loan-eligibility',
  MEMBER_VIRTUAL_ACCOUNT: '/api/member/virtual-account',
  MEMBER_COOPERATIVE: '/api/member/cooperative',
  FINANCE_STATS: '/api/finance/dashboard-stats',
  PUSH_TOKEN: '/api/mobile/push-token',
};

