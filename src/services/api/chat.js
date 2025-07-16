// Chat API service for REST operations
// Real-time functionality handled by Application WebSocket

import axiosInstance from '../axiosConfig';
import { envConfig } from '@/config/environment';

const BASE_URL = `${envConfig.apiBaseUrl}/api/v1/chat`;

export const getChannels = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/channels`);
  return response.data;
};

export const createChannel = async (channelData) => {
  const response = await axiosInstance.post(`${BASE_URL}/channels`, channelData);
  return response.data;
};

export const updateChannel = async (channelId, channelData) => {
  const response = await axiosInstance.put(`${BASE_URL}/channels/${channelId}`, channelData);
  return response.data;
};

export const getChannelMessages = async (channelId, options = {}) => {
  const { limit = 50, before, after } = options;
  let url = `${BASE_URL}/channels/${channelId}/messages?limit=${limit}`;
  
  if (before) {
    url += `&before=${before}`;
  }
  if (after) {
    url += `&after=${after}`;
  }
  
  const response = await axiosInstance.get(url);
  return response.data;
};

export const sendMessage = async (channelId, messageData) => {
  const response = await axiosInstance.post(`${BASE_URL}/channels/${channelId}/messages`, messageData);
  return response.data;
};

export const editMessage = async (messageId, content) => {
  const response = await axiosInstance.put(`${BASE_URL}/messages/${messageId}`, { content });
  return response.data;
};

export const deleteMessage = async (messageId) => {
  const response = await axiosInstance.delete(`${BASE_URL}/messages/${messageId}`);
  return response.data;
};

export const addReaction = async (messageId, emoji) => {
  const response = await axiosInstance.post(`${BASE_URL}/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

export const removeReaction = async (messageId, emoji) => {
  const response = await axiosInstance.delete(`${BASE_URL}/messages/${messageId}/reactions/${emoji}`);
  return response.data;
};

export const getChatSettings = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/settings`);
  return response.data;
};

export const updateChatSettings = async (settings) => {
  const response = await axiosInstance.put(`${BASE_URL}/settings`, settings);
  return response.data;
};

export const initializeChatSystem = async () => {
  const response = await axiosInstance.post(`${BASE_URL}/initialize-dev`);
  return response.data;
};

// Note: Real-time chat functionality now handled by Application WebSocket
// SSE implementation removed as part of WebSocket migration
// Note: chatService removed - WebSocket implementation will provide real-time functionality

// Default export includes all API functions
export default {
  // Channel methods
  getChannels,
  createChannel,
  updateChannel,
  
  // Message methods
  getChannelMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  
  // Reaction methods
  addReaction,
  removeReaction,
  
  // Settings methods
  getChatSettings,
  updateChatSettings,
  
  // System methods
  initializeChatSystem
};