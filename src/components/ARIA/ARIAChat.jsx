// components/ARIA/ARIAChat.jsx
// Core chat UI component - Messages, input, loading states

import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ARIAChat.css';

// Markdown components for custom styling
const markdownComponents = {
  p: ({ children }) => <p className="aria-md-p">{children}</p>,
  ul: ({ children }) => <ul className="aria-md-ul">{children}</ul>,
  ol: ({ children }) => <ol className="aria-md-ol">{children}</ol>,
  li: ({ children }) => <li className="aria-md-li">{children}</li>,
  strong: ({ children }) => <strong className="aria-md-strong">{children}</strong>,
  em: ({ children }) => <em className="aria-md-em">{children}</em>,
  code: ({ inline, children }) =>
    inline
      ? <code className="aria-md-code-inline">{children}</code>
      : <code className="aria-md-code-block">{children}</code>,
  pre: ({ children }) => <pre className="aria-md-pre">{children}</pre>,
  h1: ({ children }) => <h1 className="aria-md-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="aria-md-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="aria-md-h3">{children}</h3>,
  table: ({ children }) => <table className="aria-md-table">{children}</table>,
  th: ({ children }) => <th className="aria-md-th">{children}</th>,
  td: ({ children }) => <td className="aria-md-td">{children}</td>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="aria-md-link">
      {children}
    </a>
  ),
};

// Message animation variants
const messageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 }
};

const ARIAChat = forwardRef(({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  onVoiceToggle,
  isListening,
  isLoading,
  isLoadingHistory,
  hasMoreMessages,
  showTips,
  exampleCommands,
  onExampleClick,
  pendingConfirmation,
  onConfirmation,
  onScroll
}, ref) => {

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim()) {
        onSendMessage(inputValue, 'panel');
      }
    }
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue, 'panel');
    }
  };

  return (
    <div className="aria-chat-v2">
      {/* Messages Container */}
      <div className="aria-chat-messages" ref={ref} onScroll={onScroll}>
        {/* Loading more indicator */}
        <AnimatePresence>
          {isLoadingHistory && (
            <motion.div
              className="aria-loading-more"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="aria-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>Loading history...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className={`aria-chat-message ${message.type === 'user' ? 'user' : 'aria'} ${message.isError ? 'error' : ''}`}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, delay: index === messages.length - 1 ? 0.1 : 0 }}
            >
              <div className="aria-message-content">
                {message.type === 'aria' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.message}
                  </ReactMarkdown>
                ) : (
                  message.message
                )}
              </div>
              <div className="aria-message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick Tips / Example Commands */}
        <AnimatePresence>
          {showTips && messages.length <= 1 && (
            <motion.div
              className="aria-quick-tips"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="aria-tips-label">Try asking:</div>
              <div className="aria-tips-buttons">
                {exampleCommands.map((cmd, idx) => (
                  <motion.button
                    key={idx}
                    className="aria-tip-button"
                    onClick={() => onExampleClick(cmd)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cmd}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="aria-chat-message aria"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="aria-message-content">
                <div className="aria-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation UI */}
        <AnimatePresence>
          {pendingConfirmation && (
            <motion.div
              className="aria-confirmation"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
            >
              <div className="aria-confirmation-text">
                Confirm this action:
              </div>
              <div className="aria-confirmation-buttons">
                <motion.button
                  className="aria-confirm-btn yes"
                  onClick={() => onConfirmation(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Yes, proceed
                </motion.button>
                <motion.button
                  className="aria-confirm-btn no"
                  onClick={() => onConfirmation(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  No, cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="aria-chat-input-area">
        <div className="aria-chat-input-container">
          <motion.button
            className={`aria-chat-voice-btn ${isListening ? 'listening' : ''}`}
            onClick={onVoiceToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>

          <input
            type="text"
            className="aria-chat-input"
            placeholder={isListening ? "Listening..." : "Ask a follow-up..."}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isListening}
          />

          <motion.button
            className="aria-chat-send-btn"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Send message"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
});

ARIAChat.displayName = 'ARIAChat';

export default ARIAChat;
