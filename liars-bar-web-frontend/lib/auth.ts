import { ApiError, LoginRequest, LoginResponse } from "@/types/api";
import { getToken, setToken } from "./util";

const API_BASE_URL = "htttp://10.0.0.175:3000";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("auth_token");
  const user = localStorage.getItem("user");

  return !!(token && user);
}

export function getUser() {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export async function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("auth_token");
  localStorage.removeItem("user");

  const token = getToken();
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function login(credentials: LoginRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "login failed bruh");
  }

  const data: LoginResponse = await response.json();
  const { access_token } = data;
  setToken(access_token);
}
