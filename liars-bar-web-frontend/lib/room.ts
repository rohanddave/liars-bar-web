import {
  ApiError,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetails,
} from "@/types/api";
import { getToken } from "./util";

const API_BASE_URL = "http://10.0.0.175:3000";

export async function createRoom(
  request: CreateRoomRequest
): Promise<CreateRoomResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(`${API_BASE_URL}/room`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to create room");
  }

  return response.json();
}

export async function joinRoom(
  roomId: string,
  request: JoinRoomRequest
): Promise<JoinRoomResponse> {
  const token = getToken();

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(`${API_BASE_URL}/room/${roomId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to join room");
  }

  return response.json();
}

export async function getRoomDetails(roomId: string): Promise<RoomDetails> {
  const token = getToken();

  if (!token) {
    throw new Error("No access token found");
  }

  const response = await fetch(`${API_BASE_URL}/room/${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || "Failed to get room details");
  }

  return response.json();
}
