// components/ARIA/ARIAPill.jsx
// Top-center input pill for ARIA - Entry point for queries and voice

import React, { useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, MicOff, Send } from 'lucide-react';
import './ARIAPill.css';

const ARIAPill = forwardRef(({
  value,
  onChange,
  onSubmit,
  onVoiceToggle,
  onFocus,
  onBlur,
  isListening,
  isPanelOpen,
  isFocused,
  disabled
}, ref) => {
  const inputRef = useRef(null);

  // Focus input when pill is focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit(value);
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
    }
  };

  const pillVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    },
    focused: {
      scale: 1.02,
      boxShadow: '0 12px 40px rgba(0, 198, 224, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 2px rgba(0, 198, 224, 0.4)'
    },
    sending: {
      scale: 0.98,
      opacity: 0.8
    },
    listening: {
      scale: 1.02,
      boxShadow: '0 12px 40px rgba(0, 198, 224, 0.4), 0 0 0 3px rgba(0, 198, 224, 0.3)'
    }
  };

  const getCurrentVariant = () => {
    if (isListening) return 'listening';
    if (isFocused) return 'focused';
    return 'idle';
  };

  return (
    <motion.div
      ref={ref}
      className={`aria-pill-v2 ${isListening ? 'voice-active' : ''} ${isFocused ? 'focused' : ''} ${isPanelOpen ? 'panel-open' : ''}`}
      variants={pillVariants}
      initial="idle"
      animate={getCurrentVariant()}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ARIA Icon */}
      <div className="aria-pill-icon">
        <Sparkles size={18} />
      </div>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="text"
        className="aria-pill-input"
        placeholder={isListening ? "Listening..." : "Ask ARIA..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled || isListening}
      />

      {/* Action Buttons */}
      <div className="aria-pill-actions">
        {/* Send Button - show when there's text */}
        <AnimatePresence>
          {value.trim() && (
            <motion.button
              className="aria-pill-send"
              onClick={handleSubmit}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              title="Send message"
            >
              <Send size={16} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Voice Button */}
        <motion.button
          className={`aria-pill-voice ${isListening ? 'listening' : ''}`}
          onClick={onVoiceToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </motion.button>
      </div>

      {/* Voice Active Pulse Animation */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="aria-pill-pulse"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ARIAPill.displayName = 'ARIAPill';

export default ARIAPill;
