// components/ARIA/ARIAFlyingMessage.jsx
// Animated message bubble that flies from pill to panel

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ARIAFlyingMessage.css';

const ARIAFlyingMessage = ({
  message,
  startPosition,
  isVisible,
  onAnimationComplete
}) => {
  // Calculate end position (right panel area)
  const endPosition = {
    x: window.innerWidth - 200, // Target the panel area
    y: 150 // Slightly below the header
  };

  const flyVariants = {
    initial: {
      x: startPosition?.x || window.innerWidth / 2,
      y: startPosition?.y || 50,
      scale: 1,
      opacity: 1
    },
    animate: {
      x: endPosition.x,
      y: endPosition.y,
      scale: 0.8,
      opacity: 0.6,
      transition: {
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1] // Apple-like easing
      }
    },
    exit: {
      scale: 0.5,
      opacity: 0,
      transition: {
        duration: 0.15
      }
    }
  };

  // Arc path using custom transition
  const arcVariants = {
    initial: {
      x: startPosition?.x || window.innerWidth / 2,
      y: startPosition?.y || 50,
      scale: 1,
      opacity: 1,
      rotate: 0
    },
    animate: {
      x: [
        startPosition?.x || window.innerWidth / 2,
        (startPosition?.x || window.innerWidth / 2) + 100,
        endPosition.x
      ],
      y: [
        startPosition?.y || 50,
        (startPosition?.y || 50) - 30, // Arc up
        endPosition.y
      ],
      scale: [1, 0.9, 0.7],
      opacity: [1, 0.9, 0],
      rotate: [0, 5, 0],
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1], // Custom bezier for natural arc
        times: [0, 0.4, 1]
      }
    }
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && message && (
        <motion.div
          className="aria-flying-message"
          variants={arcVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="aria-flying-message-content">
            {message.length > 50 ? `${message.substring(0, 50)}...` : message}
          </div>

          {/* Trail effect */}
          <motion.div
            className="aria-flying-trail"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ARIAFlyingMessage;
