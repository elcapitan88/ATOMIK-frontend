import axiosInstance from '../axiosConfig';

const BASE_URL = '/api/v1/chat';

// Channel API calls
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

// Message API calls
export const getChannelMessages = async (channelId, options = {}) => {
  const { limit = 50, before } = options;
  const params = new URLSearchParams({ limit: limit.toString() });
  
  if (before) {
    params.append('before', before.toString());
  }
  
  const response = await axiosInstance.get(`${BASE_URL}/channels/${channelId}/messages?${params}`);
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

// Reaction API calls
export const addReaction = async (messageId, emoji) => {
  const response = await axiosInstance.post(`${BASE_URL}/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

export const removeReaction = async (messageId, emoji) => {
  const response = await axiosInstance.delete(`${BASE_URL}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  return response.data;
};

// Settings API calls
export const getChatSettings = async () => {
  const response = await axiosInstance.get(`${BASE_URL}/settings`);
  return response.data;
};

export const updateChatSettings = async (settings) => {
  const response = await axiosInstance.put(`${BASE_URL}/settings`, settings);
  return response.data;
};

// System initialization
export const initializeChatSystem = async () => {
  const response = await axiosInstance.post(`${BASE_URL}/initialize-dev`);
  return response.data;
};

// Server-Sent Events for real-time updates
export const createChatEventSource = (token) => {
  const eventSource = new EventSource(`/api/v1/chat/events?token=${token}`);
  return eventSource;
};

// Chat service class for managing state and real-time updates
export class ChatService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  // Connect to real-time events
  connect(token) {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = createChatEventSource(token);
      
      this.eventSource.onopen = () => {
        console.log('Chat SSE connected');
        this.isConnected = true;
        this.emit('connected');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (error) {
          console.error('Error parsing SSE event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Chat SSE error:', error);
        this.isConnected = false;
        this.emit('error', error);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!this.isConnected) {
            console.log('Attempting to reconnect to chat SSE...');
            this.connect(token);
          }
        }, 5000);
      };

      this.eventSource.onclose = () => {
        console.log('Chat SSE disconnected');
        this.isConnected = false;
        this.emit('disconnected');
      };

    } catch (error) {
      console.error('Error creating chat SSE connection:', error);
    }
  }

  // Disconnect from real-time events
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  // Handle incoming events
  handleEvent(event) {
    const { type, data, channel_id } = event;
    
    switch (type) {
      case 'ping':
        // Keepalive ping, ignore
        break;
      case 'new_message':
        this.emit('new_message', data);
        break;
      case 'message_updated':
        this.emit('message_updated', data);
        break;
      case 'message_deleted':
        this.emit('message_deleted', data);
        break;
      case 'reaction_added':
        this.emit('reaction_added', data);
        break;
      case 'reaction_removed':
        this.emit('reaction_removed', data);
        break;
      default:
        console.log('Unknown chat event type:', type, data);
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in chat event callback:', error);
        }
      });
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export a singleton instance
export const chatService = new ChatService();

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
  initializeChatSystem,
  
  // Real-time service
  chatService,
  createChatEventSource
};