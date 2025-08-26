import { apiClient } from './client';
import { LoginRequest, LoginResponse } from '../types/api';
import { setToken } from '../lib/util';

export const authApi = {
  /**
   * POST /auth/login
   * Login with username and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Store the token
    const { access_token } = response.data;
    setToken(access_token);
    
    return response.data;
  },

  /**
   * POST /auth/logout
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always remove local storage even if the request fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },
};