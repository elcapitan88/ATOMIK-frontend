// components/ARIA/ARIAPill.jsx
// Top-center input pill for ARIA - Entry point for queries and voice
// Enhanced with delightful animations

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Sparkles, Mic, MicOff, Send, Loader2 } from 'lucide-react';
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
  disabled,
  isLoading
}, ref) => {
  const inputRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const iconControls = useAnimation();

  // Focus input when pill is focused
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  // Animate icon on focus
  useEffect(() => {
    if (isFocused) {
      iconControls.start({
        rotate: [0, -10, 10, -5, 5, 0],
        scale: [1, 1.2, 1],
        transition: { duration: 0.5, ease: "easeOut" }
      });
    }
  }, [isFocused, iconControls]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (value.trim() && !isSending) {
      setIsSending(true);
      // Brief sending animation
      await new Promise(resolve => setTimeout(resolve, 150));
      onSubmit(value);
      setIsSending(false);
    }
  };

  // Determine current state
  const getState = () => {
    if (isSending) return 'sending';
    if (isListening) return 'listening';
    if (isFocused) return 'focused';
    return 'idle';
  };

  // Animation variants for the pill container
  const pillVariants = {
    idle: {
      scale: 1,
      y: 0,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
    },
    focused: {
      scale: 1.02,
      y: -2,
      boxShadow: '0 16px 48px rgba(0, 198, 224, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 2px rgba(0, 198, 224, 0.4)'
    },
    sending: {
      scale: 0.96,
      y: 0,
      boxShadow: '0 4px 16px rgba(0, 198, 224, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    },
    listening: {
      scale: 1.02,
      y: -2,
      boxShadow: '0 16px 48px rgba(0, 198, 224, 0.35), 0 0 0 3px rgba(0, 198, 224, 0.3)'
    }
  };

  // Icon animation variants
  const iconVariants = {
    idle: { rotate: 0, scale: 1 },
    focused: { rotate: 0, scale: 1.1 },
    listening: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Send button variants
  const sendButtonVariants = {
    initial: { scale: 0, opacity: 0, rotate: -90 },
    animate: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    },
    exit: {
      scale: 0,
      opacity: 0,
      rotate: 90,
      transition: { duration: 0.15 }
    },
    tap: { scale: 0.85 }
  };

  // Voice button animation
  const voiceButtonVariants = {
    idle: { scale: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    listening: {
      scale: [1, 1.1, 1],
      backgroundColor: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.5)', 'rgba(239, 68, 68, 0.3)'],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={`aria-pill-v2 ${isListening ? 'voice-active' : ''} ${isFocused ? 'focused' : ''} ${isPanelOpen ? 'panel-open' : ''} ${isSending ? 'sending' : ''}`}
      variants={pillVariants}
      initial="idle"
      animate={getState()}
      whileHover={!isFocused && !isListening ? { scale: 1.02, y: -1 } : {}}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="aria-pill-shimmer"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '200%', opacity: 0.3 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />

      {/* ARIA Icon with animation */}
      <motion.div
        className="aria-pill-icon"
        animate={iconControls}
        variants={iconVariants}
      >
        <Sparkles size={18} />
      </motion.div>

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
        disabled={disabled || isListening || isSending}
      />

      {/* Action Buttons */}
      <div className="aria-pill-actions">
        {/* Loading indicator when sending */}
        <AnimatePresence mode="wait">
          {isSending ? (
            <motion.div
              key="loader"
              className="aria-pill-loader"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{
                rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                scale: { duration: 0.2 }
              }}
            >
              <Loader2 size={16} />
            </motion.div>
          ) : value.trim() ? (
            <motion.button
              key="send"
              className="aria-pill-send"
              onClick={handleSubmit}
              variants={sendButtonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              whileTap="tap"
              whileHover={{ scale: 1.1, boxShadow: '0 4px 12px rgba(0, 198, 224, 0.5)' }}
              title="Send message"
            >
              <Send size={16} />
            </motion.button>
          ) : null}
        </AnimatePresence>

        {/* Voice Button */}
        <motion.button
          className={`aria-pill-voice ${isListening ? 'listening' : ''}`}
          onClick={onVoiceToggle}
          variants={voiceButtonVariants}
          animate={isListening ? 'listening' : 'idle'}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="mic-off"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
              >
                <MicOff size={16} />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
              >
                <Mic size={16} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Voice Active Pulse Rings */}
      <AnimatePresence>
        {isListening && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`pulse-${i}`}
                className="aria-pill-pulse"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{
                  scale: [1, 2, 2.5],
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut hint */}
      <AnimatePresence>
        {!isFocused && !value && !isListening && (
          <motion.div
            className="aria-pill-hint"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ delay: 0.5 }}
          >
            <kbd>⌘</kbd><kbd>K</kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

ARIAPill.displayName = 'ARIAPill';

export default ARIAPill;
