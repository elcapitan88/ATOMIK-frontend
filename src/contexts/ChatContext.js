import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import chatApi, { chatService } from '../services/api/chat';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState({});
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Get token from localStorage and set up monitoring
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  
  // Monitor localStorage for token changes
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken !== token) {
        console.log('🔍 ChatContext: Token updated in localStorage');
        setToken(currentToken);
      }
    };
    
    // Check every second for token changes
    const interval = setInterval(checkToken, 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  // Load initial data when user is authenticated
  useEffect(() => {
    console.log('🔍 ChatContext: useEffect triggered', { 
      user: !!user, 
      token: !!token, 
      hasUser: user ? user.id : 'no-user', 
      hasToken: token ? 'yes' : 'no',
      tokenType: typeof token,
      tokenValue: token ? token.substring(0, 20) + '...' : 'null'
    });
    if (user && token) {
      console.log('🔍 ChatContext: User and token available - Loading initial data...');
      loadChannels();
      loadSettings();
      connectToRealTime();
    } else {
      console.log('🔍 ChatContext: User or token not available yet - skipping initialization', {
        userAvailable: !!user,
        tokenAvailable: !!token
      });
    }
    
    return () => {
      console.log('🔍 ChatContext: useEffect cleanup - disconnecting SSE');
      chatService.disconnect();
    };
  }, [user, token]);

  // Load messages when chat opens with an active channel (safeguard)
  useEffect(() => {
    if (isOpen && activeChannelId && !messages[activeChannelId]) {
      console.log('🔍 ChatContext: Loading messages for opened chat channel:', activeChannelId);
      loadMessages(activeChannelId);
    }
  }, [isOpen, activeChannelId]);

  // Real-time connection
  const connectToRealTime = () => {
    console.log('🔍 ChatContext: connectToRealTime called', { token: !!token });
    if (!token) {
      console.log('❌ ChatContext: No token available for SSE connection');
      return;
    }

    console.log('🔍 ChatContext: Attempting to connect to SSE...');
    chatService.connect(token);
    
    chatService.on('connected', () => {
      setIsConnected(true);
    });

    chatService.on('disconnected', () => {
      setIsConnected(false);
    });

    chatService.on('error', (error) => {
      console.error('Chat connection error:', error);
      setIsConnected(false);
    });

    // Handle real-time message events
    chatService.on('new_message', (message) => {
      console.log('🔍 ChatContext: Received new_message event:', message);
      setMessages(prev => {
        const currentMessages = prev[message.channel_id] || [];
        
        // Check if message already exists (deduplicate)
        const existingMessage = currentMessages.find(msg => 
          msg.id === message.id || 
          (msg.is_optimistic && msg.content === message.content && msg.user_id === message.user_id)
        );
        
        if (existingMessage) {
          // Replace optimistic message or ignore duplicate
          return {
            ...prev,
            [message.channel_id]: currentMessages.map(msg =>
              (msg.id === message.id || (msg.is_optimistic && msg.content === message.content && msg.user_id === message.user_id))
                ? { ...message, isOptimistic: false }
                : msg
            )
          };
        } else {
          // Add new message
          return {
            ...prev,
            [message.channel_id]: [
              ...currentMessages,
              message
            ]
          };
        }
      });
    });

    chatService.on('message_updated', (message) => {
      setMessages(prev => ({
        ...prev,
        [message.channel_id]: (prev[message.channel_id] || []).map(msg =>
          msg.id === message.id ? message : msg
        )
      }));
    });

    chatService.on('message_deleted', (data) => {
      setMessages(prev => ({
        ...prev,
        [data.channel_id]: (prev[data.channel_id] || []).filter(msg =>
          msg.id !== data.id
        )
      }));
    });
  };

  const loadChannels = async () => {
    console.log('🔍 ChatContext: Loading channels...');
    try {
      console.log('🔍 ChatContext: Calling getChannels API...');
      const channelsData = await chatApi.getChannels();
      console.log('🔍 ChatContext: Channels received:', channelsData);
      
      // If no channels exist, try to initialize the chat system
      if (channelsData.length === 0) {
        console.log('🔍 ChatContext: No channels found, attempting to initialize chat system...');
        try {
          const initResult = await chatApi.initializeChatSystem();
          console.log('🔍 ChatContext: Chat system initialized:', initResult);
          
          // Try loading channels again
          console.log('🔍 ChatContext: Reloading channels after initialization...');
          const newChannelsData = await chatApi.getChannels();
          console.log('🔍 ChatContext: New channels received:', newChannelsData);
          setChannels(newChannelsData);
          
          if (newChannelsData.length > 0 && !activeChannelId) {
            const generalChannel = newChannelsData.find(c => c.name === 'general') || newChannelsData[0];
            console.log('🔍 ChatContext: Setting active channel:', generalChannel);
            setActiveChannelId(generalChannel.id);
          }
        } catch (initError) {
          console.error('❌ ChatContext: Failed to initialize chat system:', initError);
          console.error('❌ ChatContext: Init error details:', {
            status: initError.response?.status,
            statusText: initError.response?.statusText,
            data: initError.response?.data,
            message: initError.message
          });
          setError('Failed to initialize chat system. Please contact support.');
        }
      } else {
        console.log('🔍 ChatContext: Setting channels:', channelsData);
        setChannels(channelsData);
        
        // Set default active channel to general
        if (channelsData.length > 0 && !activeChannelId) {
          const generalChannel = channelsData.find(c => c.name === 'general') || channelsData[0];
          console.log('🔍 ChatContext: Setting active channel:', generalChannel);
          setActiveChannelId(generalChannel.id);
        }
      }
    } catch (error) {
      console.error('❌ ChatContext: Error loading channels:', error);
      console.error('❌ ChatContext: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      setError('Failed to load chat channels');
    }
  };

  const loadMessages = async (channelId, options = {}) => {
    if (!channelId) return;
    
    setIsLoading(true);
    try {
      const messagesData = await chatApi.getChannelMessages(channelId, options);
      setMessages(prev => ({
        ...prev,
        [channelId]: messagesData.messages
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await chatApi.getChatSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
  };

  const sendMessage = async (channelId, content, replyToId = null) => {
    console.log('🔍 ChatContext: sendMessage called', { channelId, content, replyToId });
    
    // Create optimistic message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      channel_id: channelId,
      user_id: user?.id,
      user_name: user?.full_name || user?.username || 'You',
      content,
      reply_to_id: replyToId,
      created_at: new Date().toISOString(),
      is_edited: false,
      reactions: [],
      is_optimistic: true
    };
    
    // Add optimistic message immediately to UI
    setMessages(prev => ({
      ...prev,
      [channelId]: [
        ...(prev[channelId] || []),
        optimisticMessage
      ]
    }));
    
    try {
      console.log('🔍 ChatContext: Calling chatApi.sendMessage...');
      const result = await chatApi.sendMessage(channelId, { content, reply_to_id: replyToId });
      console.log('🔍 ChatContext: Message sent successfully:', result);
      
      // Replace optimistic message with real message
      if (result) {
        setMessages(prev => ({
          ...prev,
          [channelId]: (prev[channelId] || []).map(msg =>
            msg.id === optimisticMessage.id ? { ...result, isOptimistic: false } : msg
          )
        }));
      }
      
      // Message will also be added via real-time event (which will be deduplicated)
    } catch (error) {
      console.error('❌ ChatContext: Error sending message:', error);
      console.error('❌ ChatContext: Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Remove failed optimistic message
      setMessages(prev => ({
        ...prev,
        [channelId]: (prev[channelId] || []).filter(msg => msg.id !== optimisticMessage.id)
      }));
      
      setError('Failed to send message');
    }
  };

  const editMessage = async (messageId, content) => {
    try {
      await chatApi.editMessage(messageId, content);
      // Message will be updated via real-time event
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await chatApi.deleteMessage(messageId);
      // Message will be removed via real-time event
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
    }
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await chatApi.addReaction(messageId, emoji);
      // Reaction will be added via real-time event
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const removeReaction = async (messageId, emoji) => {
    try {
      await chatApi.removeReaction(messageId, emoji);
      // Reaction will be removed via real-time event
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const selectChannel = (channelId) => {
    console.log('🔍 ChatContext: selectChannel called', { channelId, existingMessages: !!messages[channelId] });
    setActiveChannelId(channelId);
    if (!messages[channelId]) {
      console.log('🔍 ChatContext: Loading messages for channel:', channelId);
      loadMessages(channelId);
    }
  };

  const toggleChat = () => {
    console.log('🔍 ChatContext: toggleChat called', { isOpen, channelsCount: channels.length });
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // If opening chat and no channels loaded, try to load them
    if (newIsOpen && channels.length === 0) {
      console.log('🔍 ChatContext: No channels found on open, loading...');
      loadChannels();
    }
    
    // If opening chat and not connected to SSE, connect now
    if (newIsOpen && !isConnected) {
      console.log('🔍 ChatContext: Chat opening - checking SSE connection...', {
        hasUser: !!user,
        hasToken: !!token,
        isConnected: isConnected,
        userId: user?.id
      });
      
      if (user && token) {
        console.log('🔍 ChatContext: User and token available - establishing SSE connection...');
        connectToRealTime();
      } else {
        console.log('❌ ChatContext: Cannot establish SSE - missing auth data', {
          user: !!user,
          token: !!token
        });
      }
    }
    
    // If opening chat and we have an active channel but no messages, load them
    if (newIsOpen && activeChannelId && !messages[activeChannelId]) {
      console.log('🔍 ChatContext: Loading messages for active channel on open:', activeChannelId);
      loadMessages(activeChannelId);
    }
  };

  const getTotalUnreadCount = () => {
    return channels.reduce((total, channel) => total + (channel.unread_count || 0), 0);
  };

  const refreshChannels = async () => {
    console.log('🔍 ChatContext: Manual refresh channels called');
    await loadChannels();
  };

  const value = {
    // State
    isOpen,
    channels,
    activeChannelId,
    messages: messages[activeChannelId] || [],
    settings,
    isLoading,
    error,
    isConnected,
    
    // Actions
    toggleChat,
    selectChannel,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    loadMessages,
    
    // Helpers
    getTotalUnreadCount,
    refreshChannels,
    
    // Data
    currentUser: user
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};