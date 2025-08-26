import { apiClient } from "./client";
import {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetails,
} from "../types/api";

export const roomsApi = {
  /**
   * POST /rooms
   * Create a new room
   */
  createRoom: async (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
    const response = await apiClient.post("/room", data);
    return response.data;
  },

  /**
   * POST /rooms/:id/join
   * Join an existing room
   */
  joinRoom: async (
    roomId: string,
    data: JoinRoomRequest
  ): Promise<JoinRoomResponse> => {
    const response = await apiClient.post(`/room/${roomId}/join`, data);
    return response.data;
  },

  /**
   * GET /rooms/:id
   * Get room details
   */
  getRoomDetails: async (roomId: string): Promise<RoomDetails> => {
    const response = await apiClient.get(`/room/${roomId}`);
    return response.data;
  },

  /**
   * POST /rooms/:id/leave
   * Leave a room
   */
  leaveRoom: async (roomId: string): Promise<void> => {
    await apiClient.post(`/room/${roomId}/leave`);
  },
};
