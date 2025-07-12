import axiosInstance from '../axiosConfig';
import { envConfig } from '../../config/environment';

const BASE_URL = '/api/v1/chat';

// Logging control - set to false to disable all chat logs
const ENABLE_CHAT_LOGS = false;

// Custom logger that respects the logging flag
const chatLog = (...args) => {
  if (ENABLE_CHAT_LOGS) {
    console.log(...args);
  }
};

const chatError = (...args) => {
  if (ENABLE_CHAT_LOGS) {
    console.error(...args);
  }
};

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
  // Use direct backend URL for EventSource since Create React App proxy doesn't handle SSE properly
  const url = `${envConfig.apiBaseUrl}/api/v1/chat/events?token=${token}`;
  chatLog('🔍 ChatService: Creating EventSource with URL:', url);
  const eventSource = new EventSource(url);
  chatLog('🔍 ChatService: EventSource created, readyState:', eventSource.readyState);
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
    chatLog('🔍 ChatService: connect() called with token:', !!token);
    if (this.eventSource) {
      chatLog('🔍 ChatService: Disconnecting existing connection...');
      this.disconnect();
    }

    try {
      chatLog('🔍 ChatService: Creating EventSource connection...');
      this.eventSource = createChatEventSource(token);
      
      chatLog('🔍 ChatService: EventSource object created:', this.eventSource);
      chatLog('🔍 ChatService: Initial readyState:', this.eventSource.readyState);
      chatLog('🔍 ChatService: EventSource URL:', this.eventSource.url);
      
      // Monitor readyState changes
      const checkConnectionState = () => {
        chatLog('🔍 ChatService: readyState check:', {
          readyState: this.eventSource?.readyState,
          states: {
            0: 'CONNECTING',
            1: 'OPEN',
            2: 'CLOSED'
          }
        });
      };
      
      // Check state every second for first 10 seconds
      const stateChecker = setInterval(() => {
        checkConnectionState();
      }, 1000);
      
      setTimeout(() => clearInterval(stateChecker), 10000);

      this.eventSource.onopen = (event) => {
        chatLog('✅ Chat SSE connected successfully!', event);
        chatLog('🔍 ChatService: onopen readyState:', this.eventSource.readyState);
        this.isConnected = true;
        this.emit('connected');
        clearInterval(stateChecker);
      };

      this.eventSource.onmessage = (event) => {
        chatLog('📨 Chat SSE message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          chatLog('📨 Parsed SSE data:', data);
          this.handleEvent(data);
        } catch (error) {
          chatError('❌ Error parsing SSE event:', error, 'Raw data:', event.data);
        }
      };

      this.eventSource.onerror = (error) => {
        chatError('❌ Chat SSE error:', error);
        chatError('❌ EventSource readyState:', this.eventSource?.readyState);
        chatError('❌ EventSource URL:', this.eventSource?.url);
        chatError('❌ Error details:', {
          target: error.target,
          type: error.type,
          timeStamp: error.timeStamp
        });
        
        this.isConnected = false;
        this.emit('error', error);
        clearInterval(stateChecker);
        
        // Log readyState meanings for debugging
        const readyStateMap = {
          0: 'CONNECTING',
          1: 'OPEN', 
          2: 'CLOSED'
        };
        chatError('❌ Connection failed at state:', readyStateMap[this.eventSource?.readyState] || 'Unknown');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!this.isConnected && this.eventSource?.readyState === 2) {
            chatLog('🔄 Attempting to reconnect to chat SSE...');
            this.connect(token);
          }
        }, 5000);
      };

      this.eventSource.onclose = () => {
        chatLog('🔒 Chat SSE connection closed');
        this.isConnected = false;
        this.emit('disconnected');
        clearInterval(stateChecker);
      };

    } catch (error) {
      chatError('❌ Error creating chat SSE connection:', error);
      chatError('❌ Error stack:', error.stack);
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
    chatLog('🔍 ChatService: handleEvent called with:', event);
    const { type, data, channel_id } = event;
    
    switch (type) {
      case 'ping':
        chatLog('📡 ChatService: Received keepalive ping');
        break;
      case 'connection_established':
        chatLog('✅ ChatService: Connection established confirmed');
        break;
      case 'connection_refresh':
        chatLog('🔄 ChatService: Server requested connection refresh - reconnecting...');
        chatLog('🔄 Refresh reason:', event.reason || 'unknown');
        // Force reconnection by disconnecting and letting the error handler reconnect
        this.disconnect();
        // Get current token from localStorage and reconnect
        const token = localStorage.getItem('token');
        if (token) {
          setTimeout(() => {
            chatLog('🔄 ChatService: Executing forced reconnection...');
            this.connect(token);
          }, 1000); // 1 second delay before reconnect
        }
        break;
      case 'new_message':
        chatLog('📨 ChatService: Emitting new_message event:', data);
        this.emit('new_message', data);
        break;
      case 'message_updated':
        chatLog('✏️ ChatService: Emitting message_updated event:', data);
        this.emit('message_updated', data);
        break;
      case 'message_deleted':
        chatLog('🗑️ ChatService: Emitting message_deleted event:', data);
        this.emit('message_deleted', data);
        break;
      case 'reaction_added':
        chatLog('😊 ChatService: Emitting reaction_added event:', data);
        this.emit('reaction_added', data);
        break;
      case 'reaction_removed':
        chatLog('😐 ChatService: Emitting reaction_removed event:', data);
        this.emit('reaction_removed', data);
        break;
      default:
        chatLog('❓ ChatService: Unknown event type:', type, data);
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
          chatError('Error in chat event callback:', error);
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