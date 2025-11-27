// components/ARIA/ARIAAssistant.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Send, X, Minimize2, Volume2 } from 'lucide-react';
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

const ARIAAssistant = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTips, setShowTips] = useState(true);
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
      // Use real ARIA API
      console.log('[ARIA] Calling ariaApi.sendMessage...');
      const response = await ariaApi.sendMessage(message, 'text');
      console.log('[ARIA] Response received:', response);

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

      // Text-to-speech for ARIA responses (disabled for now)
      // if (response.response.text && 'speechSynthesis' in window) {
      //   const utterance = new SpeechSynthesisUtterance(response.response.text);
      //   utterance.rate = 0.9;
      //   utterance.pitch = 1.1;
      //   window.speechSynthesis.speak(utterance);
      // }

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
    </div>
  );
};

export default ARIAAssistant;