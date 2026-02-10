// components/ARIA/ARIAAssistant.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Mic, MicOff, Send, X, Minimize2, Volume2, Plus, ChevronLeft, MoreVertical } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ariaApi } from '../../services/api/ariaApi';
import './ARIAAssistant.css';

// Example commands for users
const EXAMPLE_COMMANDS = [
  "What are my positions?",
  "Show active strategies",
  "How did I do today?",
  "Turn on Purple Reign",
  "What's my P&L?"
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  type: 'aria',
  message: "Hi! I'm ARIA, your trading assistant. Ask me about your positions, strategies, or say commands like 'Turn on Purple Reign strategy'.",
  timestamp: new Date()
};

const ARIAAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [chatHistory, setChatHistory] = useState([WELCOME_MESSAGE]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Conversation state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);

  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const scrollPositionRef = useRef(0);

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
        setInputText(transcript);
        setIsListening(false);
        // Auto-send voice commands
        handleSendMessage(transcript);
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
        // Continue with empty state - user can start a new conversation
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
        // Convert messages to chat history format
        const messages = response.messages.map(msg => ({
          id: msg.id,
          type: msg.type === 'user' ? 'user' : 'aria',
          message: msg.content,
          timestamp: new Date(msg.timestamp)
        }));

        // Add welcome message at the beginning if no messages
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

      // Skip if oldest is welcome message
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
      // Save current scroll position before loading
      scrollPositionRef.current = chatContainerRef.current?.scrollHeight || 0;
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

      // Refresh conversations list
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
    e.stopPropagation();
    try {
      console.log('[ARIA] Deleting conversation:', conversationId);
      await ariaApi.deleteConversation(conversationId);

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));

      // If deleted current conversation, start new one
      if (conversationId === activeConversationId) {
        await startNewConversation();
      }
    } catch (error) {
      console.error('[ARIA] Failed to delete conversation:', error);
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

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

  const handleExampleClick = (example) => {
    setInputText(example);
    setShowTips(false);
    handleSendMessage(example);
  };

  const handleSendMessage = async (message = inputText) => {
    if (!message.trim()) return;

    console.log('[ARIA] User sending message:', message.trim());
    setShowTips(false); // Hide tips after first message

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Use real ARIA API with conversation_id
      console.log('[ARIA] Calling ariaApi.sendMessage with conversation:', activeConversationId);
      const response = await ariaApi.sendMessage(message, 'text', null, activeConversationId);
      console.log('[ARIA] Response received:', response);

      // Update conversation ID if a new one was created
      if (response.conversation_id && response.conversation_id !== activeConversationId) {
        console.log('[ARIA] New conversation created:', response.conversation_id);
        setActiveConversationId(response.conversation_id);

        // Refresh conversations list
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
    }
  };

  const handleConfirmation = async (confirmed) => {
    if (!pendingConfirmation) return;

    console.log('[ARIA] User confirmation:', confirmed ? 'YES' : 'NO', 'for interaction:', pendingConfirmation.interaction_id);

    try {
      // Use real ARIA API for confirmation
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Collapsed state (floating pill)
  if (isHidden) {
    return (
      <div className="aria-restore-button" onClick={() => setIsHidden(false)}>
        <MessageSquare size={20} />
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <div className="aria-container">
        <div 
          className={`aria-pill ${isListening ? 'voice-active' : ''}`}
          onClick={() => setIsExpanded(true)}
        >
          <div className="aria-icon">
            <MessageSquare size={20} />
          </div>
          <span className="aria-prompt">Ask ARIA...</span>
          <div 
            className="aria-voice-button"
            onClick={(e) => {
              e.stopPropagation();
              toggleVoiceRecognition();
            }}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </div>
        </div>
      </div>
    );
  }

  // Expanded state (full chat interface)
  return (
    <div className="aria-container">
      <div className={`aria-chat ${showConversationList ? 'with-sidebar' : ''}`}>
        {/* Conversation Sidebar */}
        {showConversationList && (
          <div className="aria-conversation-sidebar">
            <div className="aria-sidebar-header">
              <span>Conversations</span>
              <button
                className="aria-new-chat-btn"
                onClick={startNewConversation}
                title="New Chat"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="aria-conversation-list">
              {conversations.length === 0 ? (
                <div className="aria-no-conversations">
                  No recent conversations
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`aria-conversation-item ${conv.id === activeConversationId ? 'active' : ''}`}
                    onClick={() => switchConversation(conv.id)}
                  >
                    <div className="conversation-title">
                      {conv.title || 'New Conversation'}
                    </div>
                    <div className="conversation-preview">
                      {conv.preview || 'No messages yet'}
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-date">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </span>
                      <button
                        className="conversation-delete-btn"
                        onClick={(e) => deleteConversation(conv.id, e)}
                        title="Delete conversation"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="aria-chat-main">
          {/* Header */}
          <div className="aria-header">
            <div className="aria-header-left">
              <button
                className="aria-header-button"
                onClick={() => setShowConversationList(!showConversationList)}
                title={showConversationList ? 'Hide conversations' : 'Show conversations'}
              >
                {showConversationList ? <ChevronLeft size={16} /> : <MessageSquare size={16} />}
              </button>
              <span>ARIA Assistant</span>
              {conversations.length > 0 && (
                <span className="aria-conversation-count">({conversations.length})</span>
              )}
            </div>
            <div className="aria-header-actions">
              <button
                className="aria-header-button"
                onClick={startNewConversation}
                title="New Chat"
              >
                <Plus size={16} />
              </button>
              <button
                className="aria-header-button"
                onClick={() => setIsExpanded(false)}
                title="Minimize"
              >
                <Minimize2 size={16} />
              </button>
              <button
                className="aria-header-button"
                onClick={() => setIsHidden(true)}
                title="Hide"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="aria-chat-container" ref={chatContainerRef} onScroll={handleScroll}>
            {/* Loading more indicator */}
            {isLoadingHistory && (
              <div className="aria-loading-more">
                <div className="aria-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Loading history...
              </div>
            )}
          {chatHistory.map((message) => (
            <div
              key={message.id}
              className={`aria-message ${message.type === 'user' ? 'user-message' : 'aria-message'} ${message.isError ? 'error-message' : ''}`}
            >
              <div className="message-content">
                {message.type === 'aria' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for markdown elements
                      p: ({children}) => <p className="aria-md-p">{children}</p>,
                      ul: ({children}) => <ul className="aria-md-ul">{children}</ul>,
                      ol: ({children}) => <ol className="aria-md-ol">{children}</ol>,
                      li: ({children}) => <li className="aria-md-li">{children}</li>,
                      strong: ({children}) => <strong className="aria-md-strong">{children}</strong>,
                      em: ({children}) => <em className="aria-md-em">{children}</em>,
                      code: ({inline, children}) =>
                        inline
                          ? <code className="aria-md-code-inline">{children}</code>
                          : <code className="aria-md-code-block">{children}</code>,
                      pre: ({children}) => <pre className="aria-md-pre">{children}</pre>,
                      h1: ({children}) => <h1 className="aria-md-h1">{children}</h1>,
                      h2: ({children}) => <h2 className="aria-md-h2">{children}</h2>,
                      h3: ({children}) => <h3 className="aria-md-h3">{children}</h3>,
                      table: ({children}) => <table className="aria-md-table">{children}</table>,
                      th: ({children}) => <th className="aria-md-th">{children}</th>,
                      td: ({children}) => <td className="aria-md-td">{children}</td>,
                      a: ({href, children}) => <a href={href} target="_blank" rel="noopener noreferrer" className="aria-md-link">{children}</a>,
                    }}
                  >
                    {message.message}
                  </ReactMarkdown>
                ) : (
                  message.message
                )}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {/* Quick Tips / Example Commands */}
          {showTips && chatHistory.length <= 1 && (
            <div className="aria-quick-tips">
              <div className="quick-tips-label">Try asking:</div>
              <div className="quick-tips-buttons">
                {EXAMPLE_COMMANDS.map((cmd, idx) => (
                  <button
                    key={idx}
                    className="quick-tip-button"
                    onClick={() => handleExampleClick(cmd)}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="aria-message aria-message">
              <div className="message-content">
                <div className="aria-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation buttons */}
          {pendingConfirmation && (
            <div className="aria-confirmation">
              <div className="confirmation-text">
                Confirm this action:
              </div>
              <div className="confirmation-buttons">
                <button 
                  className="confirm-button confirm-yes"
                  onClick={() => handleConfirmation(true)}
                >
                  Yes, proceed
                </button>
                <button 
                  className="confirm-button confirm-no"
                  onClick={() => handleConfirmation(false)}
                >
                  No, cancel
                </button>
              </div>
            </div>
          )}
        </div>

          {/* Input Area */}
          <div className="aria-input-area">
            <div className="aria-input-container">
              <button
                className={`aria-voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleVoiceRecognition}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Type a message or use voice..."}
                className="aria-text-input"
                disabled={isLoading || isListening}
              />

              <button
                className="aria-send-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
        {/* End aria-chat-main */}
      </div>
      {/* End aria-chat */}
    </div>
  );
};

export default ARIAAssistant;