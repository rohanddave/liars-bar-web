import { apiClient } from './client';
import { User } from '../types/api';

export const usersApi = {
  /**
   * GET /users/me
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};