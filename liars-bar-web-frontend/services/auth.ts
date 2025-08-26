import { LoginRequest, LoginResponse, ApiError } from '../types/api';

const API_BASE_URL = 'http://10.0.0.175:3000';

export class AuthService{
  static async login(credentials: LoginRequest): Promise<LoginResponse>{
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),

    });

    if(!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'login failed bruh');
    }
    return response.json();
  }

  static async logout(): Promise<void> {
    const token = this.getToken();
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
  }
  static getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  static setToken(token: string): void{
    localStorage.setItem('accessToken', token);
  }
  static removeToken(): void{
    localStorage.removeItem('accessToken');
  }
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

}