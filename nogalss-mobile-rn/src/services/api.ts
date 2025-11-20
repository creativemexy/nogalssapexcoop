import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = '@nogalss_token';
const USER_KEY = '@nogalss_user';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication methods
  async login(email: string, password: string, totp?: string) {
    try {
      console.log('Attempting login to:', API_BASE_URL + API_ENDPOINTS.LOGIN);
      const response = await this.client.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
        totp,
      });

      if (response.data.success && response.data.token) {
        await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        return response.data;
      }

      throw new Error(response.data.error || 'Login failed');
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: API_BASE_URL,
      });

      // Handle network errors with detailed troubleshooting
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        const troubleshooting = `
Cannot connect to server at ${API_BASE_URL}

Quick Fixes:
1. Ensure Next.js server is running: npm run dev
2. Phone and computer must be on SAME WiFi network
3. Check firewall: sudo ufw allow 3000/tcp
4. Test in phone browser: ${API_BASE_URL}
5. Try tunnel mode: npm run start:tunnel (in nogalss-mobile-rn folder)

Your computer IP: ${API_BASE_URL.replace('http://', '').replace(':3000', '')}
`;
        throw new Error(troubleshooting);
      }

      // Handle axios network errors
      if (error.message?.includes('Network Error') || error.message?.includes('timeout') || error.code === 'ERR_NETWORK') {
        const troubleshooting = `
Network Error: Cannot reach ${API_BASE_URL}

Quick Fixes:
1. Check if server is running on port 3000
2. Ensure phone and computer are on SAME WiFi
3. Test connection: Open ${API_BASE_URL} in phone browser
4. Try tunnel mode for remote access
5. Check firewall settings

Current API URL: ${API_BASE_URL}
`;
        throw new Error(troubleshooting);
      }

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }

      if (error.response?.status) {
        throw new Error(`Server error (${error.response.status}): ${error.message || 'Unknown error'}`);
      }

      throw new Error(error.message || 'Login failed. Please check your connection.');
    }
  }

  async logout() {
    try {
      // Call logout API endpoint to log the event on server
      try {
        await this.client.post(API_ENDPOINTS.LOGOUT);
      } catch (error: any) {
        // Even if API call fails, continue with local logout
        console.warn('Logout API call failed, continuing with local logout');
      }
      // Always clear local auth data
      await this.clearAuth();
    } catch (error) {
      // Ensure local auth is cleared even if there's an error
      await this.clearAuth();
      throw error;
    }
  }

  async getStoredUser() {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  async getStoredToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  async clearAuth() {
    // Only clear regular auth, keep biometric credentials if enabled
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  async setStoredCredentials(token: string, user: any) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Leader API methods
  async getLeaderStats() {
    const response = await this.client.get(API_ENDPOINTS.LEADER_STATS);
    return response.data;
  }

  // Member API methods
  async getMemberContributions() {
    const response = await this.client.get(API_ENDPOINTS.MEMBER_CONTRIBUTIONS);
    return response.data;
  }

  async getMemberLoanEligibility() {
    const response = await this.client.get(API_ENDPOINTS.MEMBER_LOAN_ELIGIBILITY);
    return response.data;
  }

  async getMemberVirtualAccount() {
    const response = await this.client.get(API_ENDPOINTS.MEMBER_VIRTUAL_ACCOUNT);
    return response.data;
  }

  async getMemberCooperative() {
    const response = await this.client.get(API_ENDPOINTS.MEMBER_COOPERATIVE);
    return response.data;
  }

  // Finance API methods
  async getFinanceStats() {
    const response = await this.client.get(API_ENDPOINTS.FINANCE_STATS);
    return response.data;
  }
}

export const apiService = new ApiService();

