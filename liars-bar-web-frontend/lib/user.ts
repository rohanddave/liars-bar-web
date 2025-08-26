import { ApiError, User } from "@/types/api";
import { getToken } from "./util";

const API_BASE_URL = "http://localhost:3000";

export async function getCurrentUser(): Promise<User> {
  const token = getToken();

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to fetch user info");
  }

  return response.json();
}
