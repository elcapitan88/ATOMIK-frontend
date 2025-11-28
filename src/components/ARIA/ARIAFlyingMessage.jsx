// components/ARIA/ARIAFlyingMessage.jsx
// Animated message bubble that flies from pill to panel with delightful effects

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ARIAFlyingMessage.css';

const ARIAFlyingMessage = ({
  message,
  startPosition,
  isVisible,
  onAnimationComplete
}) => {
  // Calculate positions with safety checks
  const positions = useMemo(() => {
    const start = {
      x: startPosition?.x || (typeof window !== 'undefined' ? window.innerWidth / 2 : 500),
      y: startPosition?.y || 50
    };
    const end = {
      x: typeof window !== 'undefined' ? window.innerWidth - 220 : 800,
      y: 180
    };
    // Control point for bezier curve (creates the arc)
    // More pronounced arc - goes higher for better visibility
    const control = {
      x: start.x + (end.x - start.x) * 0.5, // Peak at midpoint
      y: Math.min(start.y, end.y) - 150 // Higher arc (was 80)
    };
    return { start, end, control };
  }, [startPosition]);

  // Generate sparkle particles
  const sparkles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      delay: i * 0.05,
      offsetX: (Math.random() - 0.5) * 40,
      offsetY: (Math.random() - 0.5) * 40,
      scale: 0.5 + Math.random() * 0.5
    }));
  }, [isVisible]);

  // Main bubble animation with natural arc
  // Slowed down to 750ms for better visibility
  const bubbleVariants = {
    initial: {
      x: positions.start.x,
      y: positions.start.y,
      scale: 1,
      opacity: 1,
    },
    animate: {
      x: [positions.start.x, positions.control.x, positions.end.x],
      y: [positions.start.y, positions.control.y, positions.end.y],
      scale: [1, 1.1, 0.8],
      opacity: [1, 1, 0],
      transition: {
        duration: 0.75, // Slower for better visibility (was 0.45)
        ease: [0.25, 0.1, 0.25, 1], // Smoother easing curve
        times: [0, 0.5, 1],
      }
    },
    exit: {
      scale: 0.5,
      opacity: 0,
      transition: { duration: 0.1 }
    }
  };

  // Rotation follows the arc direction
  const rotationVariants = {
    initial: { rotate: 0 },
    animate: {
      rotate: [0, -12, 8, 0], // More pronounced rotation
      transition: {
        duration: 0.75,
        ease: "easeOut",
        times: [0, 0.3, 0.7, 1]
      }
    }
  };

  // Sparkle particle animation
  const sparkleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (custom) => ({
      scale: [0, custom.scale, 0],
      opacity: [0, 1, 0],
      x: [0, custom.offsetX * 1.5], // Wider spread
      y: [0, custom.offsetY * 1.5],
      transition: {
        duration: 0.6, // Longer sparkle duration
        delay: custom.delay,
        ease: "easeOut"
      }
    })
  };

  // Trail/comet effect
  const trailVariants = {
    initial: {
      scaleX: 0,
      opacity: 0,
      originX: 1
    },
    animate: {
      scaleX: [0, 2, 0], // Longer trail
      opacity: [0, 0.7, 0],
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Glow pulse effect
  const glowVariants = {
    initial: { scale: 1, opacity: 0.6 },
    animate: {
      scale: [1, 1.5, 1.2],
      opacity: [0.6, 0.9, 0],
      transition: {
        duration: 0.75,
        ease: "easeOut"
      }
    }
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && message && (
        <motion.div
          className="aria-flying-container"
          variants={bubbleVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {/* Glow effect behind bubble */}
          <motion.div
            className="aria-flying-glow"
            variants={glowVariants}
            initial="initial"
            animate="animate"
          />

          {/* Main message bubble */}
          <motion.div
            className="aria-flying-message"
            variants={rotationVariants}
            initial="initial"
            animate="animate"
          >
            <div className="aria-flying-message-content">
              {message.length > 40 ? `${message.substring(0, 40)}...` : message}
            </div>

            {/* Sparkle particles */}
            <div className="aria-flying-sparkles">
              {sparkles.map((sparkle) => (
                <motion.div
                  key={sparkle.id}
                  className="aria-flying-sparkle"
                  variants={sparkleVariants}
                  initial="initial"
                  animate="animate"
                  custom={sparkle}
                />
              ))}
            </div>
          </motion.div>

          {/* Comet trail */}
          <motion.div
            className="aria-flying-trail"
            variants={trailVariants}
            initial="initial"
            animate="animate"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ARIAFlyingMessage;
