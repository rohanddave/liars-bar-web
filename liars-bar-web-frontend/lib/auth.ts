import { LoginRequest } from "@/types/api";
import { authApi, usersApi } from "@/api";
import { getToken } from "./util";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const token = getToken();
  return !!token;
}

export async function getUser() {
  if (typeof window === "undefined") return null;

  // Try to get user from localStorage first
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
  }

  // If not in localStorage or invalid, fetch from API
  try {
    const user = await usersApi.getCurrentUser();
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Error during logout:', error);
  }
  
  // Always clear local storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  }
}

export async function login(credentials: LoginRequest): Promise<void> {
  try {
    await authApi.login(credentials);
    
    // Fetch and store user data
    const user = await usersApi.getCurrentUser();
    localStorage.setItem("user", JSON.stringify(user));
    
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || "Login failed");
  }
}
