// components/ARIA/useARIA.js
// Custom hook for ARIA state management - Pill + Panel Architecture

import { useState, useRef, useEffect, useCallback } from 'react';
import { ariaApi } from '../../services/api/ariaApi';

// Example commands for users
export const EXAMPLE_COMMANDS = [
  "What are my positions?",
  "Show active strategies",
  "How did I do today?",
  "Turn on Purple Reign",
  "What's my P&L?"
];

export const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'aria',
  message: "Hi! I'm ARIA, your trading assistant. Ask me about your positions, strategies, or say commands like 'Turn on Purple Reign strategy'.",
  timestamp: new Date()
};

export const useARIA = () => {
  // UI State
  const [isPillFocused, setIsPillFocused] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Animation State
  const [flyingMessage, setFlyingMessage] = useState(null);
  const [flyingMessagePosition, setFlyingMessagePosition] = useState(null);

  // Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [chatHistory, setChatHistory] = useState([WELCOME_MESSAGE]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Input State
  const [pillInput, setPillInput] = useState('');
  const [panelInput, setPanelInput] = useState('');

  // Pagination State
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showConversationList, setShowConversationList] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pillRef = useRef(null);
  const panelInputRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        // Auto-send voice commands
        handleSendMessage(transcript, 'voice');
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        console.log('[ARIA] Loading conversations...');
        const response = await ariaApi.getConversations();
        if (response.success && response.conversations) {
          setConversations(response.conversations);
          console.log('[ARIA] Loaded', response.conversations.length, 'conversations');

          // Load most recent conversation if exists
          if (response.conversations.length > 0) {
            const mostRecent = response.conversations[0];
            await loadConversation(mostRecent.id);
          }
        }
      } catch (error) {
        console.error('[ARIA] Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, []);

  // Load messages for a specific conversation
  const loadConversation = async (conversationId) => {
    if (!conversationId) return;

    try {
      setIsLoadingHistory(true);
      console.log('[ARIA] Loading conversation:', conversationId);

      const response = await ariaApi.getMessages(conversationId);
      if (response.success) {
        const messages = response.messages.map(msg => ({
          id: msg.id,
          type: msg.type === 'user' ? 'user' : 'aria',
          message: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        if (messages.length === 0) {
          setChatHistory([WELCOME_MESSAGE]);
        } else {
          setChatHistory(messages);
        }

        setActiveConversationId(conversationId);
        setHasMoreMessages(response.has_more);
        setShowTips(messages.length === 0);
        console.log('[ARIA] Loaded', messages.length, 'messages');
      }
    } catch (error) {
      console.error('[ARIA] Failed to load conversation:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load more messages when scrolling up
  const loadMoreMessages = async () => {
    if (!activeConversationId || isLoadingHistory || !hasMoreMessages) return;

    try {
      setIsLoadingHistory(true);
      const oldestId = chatHistory[0]?.id;

      if (oldestId === 'welcome') return;

      console.log('[ARIA] Loading more messages before:', oldestId);
      const response = await ariaApi.getMessages(activeConversationId, { before_id: oldestId });

      if (response.success && response.messages.length > 0) {
        const newMessages = response.messages.map(msg => ({
          id: msg.id,
          type: msg.type === 'user' ? 'user' : 'aria',
          message: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        setChatHistory(prev => [...newMessages, ...prev]);
        setHasMoreMessages(response.has_more);
        console.log('[ARIA] Loaded', newMessages.length, 'more messages');
      }
    } catch (error) {
      console.error('[ARIA] Failed to load more messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle scroll for pagination
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMoreMessages && !isLoadingHistory) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingHistory, activeConversationId, chatHistory]);

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      console.log('[ARIA] Starting new conversation');
      setChatHistory([WELCOME_MESSAGE]);
      setActiveConversationId(null);
      setHasMoreMessages(false);
      setShowTips(true);
      setPendingConfirmation(null);
      setShowConversationList(false);

      const response = await ariaApi.getConversations();
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (error) {
      console.error('[ARIA] Failed to start new conversation:', error);
    }
  };

  // Switch to a different conversation
  const switchConversation = async (conversationId) => {
    if (conversationId === activeConversationId) {
      setShowConversationList(false);
      return;
    }

    await loadConversation(conversationId);
    setShowConversationList(false);
    setPendingConfirmation(null);
  };

  // Delete a conversation
  const deleteConversation = async (conversationId, e) => {
    if (e) e.stopPropagation();
    try {
      console.log('[ARIA] Deleting conversation:', conversationId);
      await ariaApi.deleteConversation(conversationId);

      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (conversationId === activeConversationId) {
        await startNewConversation();
      }
    } catch (error) {
      console.error('[ARIA] Failed to delete conversation:', error);
    }
  };

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Send message (from pill or panel)
  const handleSendMessage = async (message, source = 'pill') => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    console.log('[ARIA] User sending message:', trimmedMessage, 'from:', source);
    setShowTips(false);

    // Get pill position for flying animation (only if from pill and panel not open)
    if (source === 'pill' && !isPanelOpen && pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      setFlyingMessage(trimmedMessage);
      setFlyingMessagePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    // Clear inputs
    if (source === 'pill') {
      setPillInput('');
    } else {
      setPanelInput('');
    }

    // Open panel if not open
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: trimmedMessage,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('[ARIA] Calling ariaApi.sendMessage with conversation:', activeConversationId);
      const response = await ariaApi.sendMessage(trimmedMessage, 'text', null, activeConversationId);
      console.log('[ARIA] Response received:', response);

      // Update conversation ID if a new one was created
      if (response.conversation_id && response.conversation_id !== activeConversationId) {
        console.log('[ARIA] New conversation created:', response.conversation_id);
        setActiveConversationId(response.conversation_id);

        const convResponse = await ariaApi.getConversations();
        if (convResponse.success) {
          setConversations(convResponse.conversations);
        }
      }

      const ariaMessage = {
        id: Date.now() + 1,
        type: 'aria',
        message: response.response?.message || response.response?.text || 'I received your message.',
        timestamp: new Date(),
        requires_confirmation: response.requires_confirmation,
        interaction_id: response.interaction_id,
        action_result: response.action_result
      };

      console.log('[ARIA] Displaying response:', ariaMessage.message);
      setChatHistory(prev => [...prev, ariaMessage]);

      if (response.requires_confirmation) {
        console.log('[ARIA] Confirmation required for interaction:', response.interaction_id);
        setPendingConfirmation({
          interaction_id: response.interaction_id,
          message: response.response.text
        });
      }

    } catch (error) {
      console.error('[ARIA] Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'aria',
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Clear flying message after animation completes (450ms animation + 50ms buffer)
      setTimeout(() => {
        setFlyingMessage(null);
        setFlyingMessagePosition(null);
      }, 500);
    }
  };

  // Handle confirmation response
  const handleConfirmation = async (confirmed) => {
    if (!pendingConfirmation) return;

    console.log('[ARIA] User confirmation:', confirmed ? 'YES' : 'NO', 'for interaction:', pendingConfirmation.interaction_id);

    try {
      console.log('[ARIA] Calling ariaApi.sendConfirmation...');
      const response = await ariaApi.sendConfirmation(pendingConfirmation.interaction_id, confirmed);
      console.log('[ARIA] Confirmation response:', response);

      const ariaMessage = {
        id: Date.now(),
        type: 'aria',
        message: response.response?.message || response.response?.text || (confirmed ? 'Action confirmed.' : 'Action cancelled.'),
        timestamp: new Date(),
        action_result: response.action_result
      };

      setChatHistory(prev => [...prev, ariaMessage]);
      setPendingConfirmation(null);

    } catch (error) {
      console.error('[ARIA] Confirmation error:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'aria',
        message: 'Error processing confirmation. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };

  // Handle example command click
  const handleExampleClick = (example) => {
    setShowTips(false);
    handleSendMessage(example, 'panel');
  };

  // Open panel
  const openPanel = () => {
    setIsPanelOpen(true);
  };

  // Close panel
  const closePanel = () => {
    setIsPanelOpen(false);
  };

  // Toggle panel
  const togglePanel = () => {
    setIsPanelOpen(prev => !prev);
  };

  // Focus pill
  const focusPill = () => {
    setIsPillFocused(true);
  };

  // Blur pill
  const blurPill = () => {
    setIsPillFocused(false);
  };

  // Show/hide ARIA completely
  const showARIA = () => setIsHidden(false);
  const hideARIA = () => setIsHidden(true);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to focus pill
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (pillRef.current) {
          const input = pillRef.current.querySelector('input');
          if (input) input.focus();
        }
        setIsPillFocused(true);
      }

      // Escape to close panel or clear pill
      if (e.key === 'Escape') {
        if (isPanelOpen) {
          setIsPanelOpen(false);
        } else if (isPillFocused) {
          setPillInput('');
          setIsPillFocused(false);
        }
      }

      // Cmd/Ctrl + N for new conversation
      if ((e.metaKey || e.ctrlKey) && e.key === 'n' && isPanelOpen) {
        e.preventDefault();
        startNewConversation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, isPillFocused]);

  return {
    // UI State
    isPillFocused,
    isPanelOpen,
    isListening,
    isLoading,
    isHidden,

    // Animation State
    flyingMessage,
    flyingMessagePosition,

    // Chat State
    conversations,
    activeConversationId,
    chatHistory,
    pendingConfirmation,

    // Input State
    pillInput,
    setPillInput,
    panelInput,
    setPanelInput,

    // Pagination State
    hasMoreMessages,
    isLoadingHistory,
    showTips,
    showConversationList,
    setShowConversationList,

    // Refs
    pillRef,
    chatContainerRef,
    panelInputRef,

    // Actions
    focusPill,
    blurPill,
    openPanel,
    closePanel,
    togglePanel,
    toggleVoiceRecognition,
    handleSendMessage,
    handleConfirmation,
    handleExampleClick,
    handleScroll,
    startNewConversation,
    switchConversation,
    deleteConversation,
    loadMoreMessages,
    showARIA,
    hideARIA,

    // Constants
    EXAMPLE_COMMANDS,
    WELCOME_MESSAGE
  };
};

export default useARIA;
