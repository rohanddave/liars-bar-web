import {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  ApiError,
  RoomDetails,
} from "../types/api";
import { AuthService } from "./auth";

const API_BASE_URL = "http://10.0.0.175:3000";

export class RoomService {
  static async createRoom(
    request: CreateRoomRequest
  ): Promise<CreateRoomResponse> {
    const token = AuthService.getToken();

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

  static async joinRoom(
    roomId: string,
    request: JoinRoomRequest
  ): Promise<JoinRoomResponse> {
    const token = AuthService.getToken();

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

  static async getRoomDetails(roomId: string): Promise<RoomDetails> {
    const token = AuthService.getToken();

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
}
