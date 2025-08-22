// components/ARIA/ARIAAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Send, X, Minimize2, Volume2 } from 'lucide-react';
import { ariaApi } from '../../services/api/ariaApi';
import './ARIAAssistant.css';

const ARIAAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'aria',
      message: "Hi! I'm ARIA, your trading assistant. Ask me about your positions, strategies, or say commands like 'Turn on Purple Reign strategy'.",
      timestamp: new Date()
    }
  ]);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

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

  const handleSendMessage = async (message = inputText) => {
    if (!message.trim()) return;

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
      // Use real ARIA API
      const response = await ariaApi.sendMessage(message, 'text');
      
      const ariaMessage = {
        id: Date.now() + 1,
        type: 'aria',
        message: response.response?.message || response.response?.text || 'I received your message.',
        timestamp: new Date(),
        requires_confirmation: response.requires_confirmation,
        interaction_id: response.interaction_id,
        action_result: response.action_result
      };

      setChatHistory(prev => [...prev, ariaMessage]);

      if (response.requires_confirmation) {
        setPendingConfirmation({
          interaction_id: response.interaction_id,
          message: response.response.text
        });
      }

      // Text-to-speech for ARIA responses
      if (response.response.text && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response.response.text);
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }

    } catch (error) {
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

    try {
      // Use real ARIA API for confirmation
      const response = await ariaApi.sendConfirmation(pendingConfirmation.interaction_id, confirmed);
      
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
      <div className="aria-chat">
        {/* Header */}
        <div className="aria-header">
          <div className="aria-header-left">
            <MessageSquare size={20} />
            <span>ARIA Assistant</span>
          </div>
          <div className="aria-header-actions">
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
        <div className="aria-chat-container" ref={chatContainerRef}>
          {chatHistory.map((message) => (
            <div 
              key={message.id} 
              className={`aria-message ${message.type === 'user' ? 'user-message' : 'aria-message'} ${message.isError ? 'error-message' : ''}`}
            >
              <div className="message-content">
                {message.message}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

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
    </div>
  );
};

// Temporary simulation functions - replace with actual API calls
const simulateARIAResponse = async (message) => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const lowerMessage = message.toLowerCase();
  
  // Strategy control commands
  if (lowerMessage.includes('turn on') || lowerMessage.includes('activate')) {
    if (lowerMessage.includes('strategy')) {
      return {
        success: true,
        requires_confirmation: true,
        interaction_id: Date.now(),
        response: {
          text: "I'll activate your Purple Reign strategy. This will affect your automated trading. Confirm: Yes or No?",
          type: "confirmation"
        }
      };
    }
  }

  // Position queries
  if (lowerMessage.includes('position') || lowerMessage.includes('aapl') || lowerMessage.includes('tesla')) {
    return {
      success: true,
      requires_confirmation: false,
      response: {
        text: "📊 Your AAPL position: 100 shares, P&L: $205.00 (+1.36%). Entry price: $150.25, Current: $152.30",
        type: "text"
      }
    };
  }

  // Performance queries
  if (lowerMessage.includes('how did i do') || lowerMessage.includes('today') || lowerMessage.includes('performance')) {
    return {
      success: true,
      requires_confirmation: false,
      response: {
        text: "📈 Today you're up $250.75 with 8 trades. Win rate: 62.5%. Your best trade: TSLA +$125.50",
        type: "text"
      }
    };
  }

  // Strategy status
  if (lowerMessage.includes('strategies') || lowerMessage.includes('active') || lowerMessage.includes('running')) {
    return {
      success: true,
      requires_confirmation: false,
      response: {
        text: "🤖 You have 3 active strategies: Purple Reign (momentum), Bollinger Bounce (mean reversion), and Scalper Pro (scalping). All performing well today.",
        type: "text"
      }
    };
  }

  // Default response
  return {
    success: true,
    requires_confirmation: false,
    response: {
      text: "I understand you said: \"" + message + "\". I can help you with strategy control, position queries, performance analysis, and more. Try saying 'What strategies are active?' or 'What's my AAPL position?'",
      type: "text"
    }
  };
};

const simulateConfirmationResponse = async (interactionId, confirmed) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (confirmed) {
    return {
      success: true,
      confirmed: true,
      response: {
        text: "✅ Purple Reign strategy has been activated. I'll monitor its performance for you.",
        type: "text"
      },
      action_result: {
        action_type: "strategy_control",
        strategy_name: "Purple Reign",
        success: true
      }
    };
  } else {
    return {
      success: true,
      confirmed: false,
      response: {
        text: "Action cancelled. Is there anything else I can help you with?",
        type: "text"
      }
    };
  }
};

export default ARIAAssistant;