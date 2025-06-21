import React from 'react';
import { motion } from 'framer-motion';
import { ATOMIC_TERMS, PROGRESS_MESSAGES } from '../../../utils/constants/atomikTerminology';

/**
 * AtomikAnimations - Branded Animation Components
 * 
 * Collection of atomic-themed loading states, transitions, and celebrations
 * designed for the Trading Lab experience.
 */

// Atomic Loading Spinner
export const AtomicSpinner = ({ size = 'medium', message = PROGRESS_MESSAGES.ANALYZING }) => {
  const sizeMap = {
    small: '2rem',
    medium: '3rem',
    large: '4rem'
  };

  return (
    <div style={styles.spinnerContainer}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{
          ...styles.spinner,
          fontSize: sizeMap[size]
        }}
      >
        ⚛️
      </motion.div>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={styles.spinnerMessage}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

// Quantum Pulse Animation
export const QuantumPulse = ({ color = '#00C6E0', intensity = 'medium' }) => {
  const intensityMap = {
    low: { scale: [1, 1.05, 1], duration: 3 },
    medium: { scale: [1, 1.1, 1], duration: 2 },
    high: { scale: [1, 1.15, 1], duration: 1.5 }
  };

  const config = intensityMap[intensity];

  return (
    <motion.div
      animate={{ scale: config.scale }}
      transition={{
        duration: config.duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{
        ...styles.quantumPulse,
        borderColor: color,
        boxShadow: `0 0 20px ${color}33`
      }}
    />
  );
};

// Network Sync Animation
export const NetworkSyncAnimation = ({ 
  nodes = 3, 
  isActive = true, 
  syncColor = '#00C6E0' 
}) => {
  return (
    <div style={styles.networkContainer}>
      {Array.from({ length: nodes }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: isActive ? 1 : 0.3,
            scale: isActive ? 1 : 0.8
          }}
          transition={{
            duration: 0.5,
            delay: index * 0.2
          }}
          style={{
            ...styles.networkNode,
            backgroundColor: syncColor
          }}
        >
          {isActive && (
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.5
              }}
              style={{
                ...styles.networkPulse,
                backgroundColor: syncColor
              }}
            />
          )}
        </motion.div>
      ))}
      
      {/* Connection Lines */}
      {isActive && nodes > 1 && (
        <svg style={styles.networkSvg}>
          {Array.from({ length: nodes - 1 }).map((_, index) => (
            <motion.line
              key={index}
              x1="50"
              y1={20 + (index * 40)}
              x2="50"
              y2={60 + (index * 40)}
              stroke={syncColor}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1,
                delay: index * 0.3
              }}
            />
          ))}
        </svg>
      )}
    </div>
  );
};

// Success Celebration Animation with Confetti
export const CelebrationAnimation = ({ 
  type = 'network_activated', 
  onComplete = () => {},
  showConfetti = true 
}) => {
  const celebrationConfig = {
    network_activated: {
      icon: '⚛️',
      color: '#00C6E0',
      particles: 20,
      confettiColors: ['#00C6E0', '#0099B3', '#ffffff', '#10B981']
    },
    first_trade: {
      icon: '💰',
      color: '#10B981',
      particles: 15,
      confettiColors: ['#10B981', '#059669', '#ffffff', '#00C6E0']
    },
    sync_complete: {
      icon: '🔗',
      color: '#00C6E0',
      particles: 12,
      confettiColors: ['#00C6E0', '#0099B3', '#ffffff']
    },
    strategy_selected: {
      icon: '✨',
      color: '#F59E0B',
      particles: 18,
      confettiColors: ['#F59E0B', '#D97706', '#ffffff', '#00C6E0']
    }
  };

  const config = celebrationConfig[type] || celebrationConfig.network_activated;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      style={styles.celebrationContainer}
      onAnimationComplete={onComplete}
    >
      {/* Main Icon with Pulse */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: [1, 1.2, 1], 
          rotate: [0, 360] 
        }}
        transition={{ 
          scale: { duration: 0.6, ease: "easeOut" },
          rotate: { duration: 0.8, ease: "easeOut" }
        }}
        style={{
          ...styles.celebrationIcon,
          color: config.color,
          textShadow: `0 0 20px ${config.color}88`
        }}
      >
        {config.icon}
      </motion.div>

      {/* Enhanced Particle Effects */}
      {Array.from({ length: config.particles }).map((_, index) => (
        <motion.div
          key={`particle-${index}`}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
            rotate: 0
          }}
          animate={{
            opacity: 0,
            scale: Math.random() * 0.8 + 0.4,
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 300,
            rotate: Math.random() * 720
          }}
          transition={{
            duration: 2.5,
            delay: index * 0.05,
            ease: "easeOut"
          }}
          style={{
            ...styles.particle,
            backgroundColor: config.color
          }}
        />
      ))}

      {/* Confetti Effect */}
      {showConfetti && Array.from({ length: 30 }).map((_, index) => (
        <motion.div
          key={`confetti-${index}`}
          initial={{
            opacity: 1,
            scale: 0,
            x: 0,
            y: 0,
            rotate: 0
          }}
          animate={{
            opacity: 0,
            scale: [0, 1, 0.8, 0],
            x: (Math.random() - 0.5) * 400,
            y: Math.random() * 400 + 200,
            rotate: Math.random() * 1080
          }}
          transition={{
            duration: 3,
            delay: index * 0.03,
            ease: "easeOut"
          }}
          style={{
            ...styles.confetti,
            backgroundColor: config.confettiColors[index % config.confettiColors.length]
          }}
        />
      ))}

      {/* Multiple Ripple Effects */}
      {[0, 0.2, 0.4].map((delay, index) => (
        <motion.div
          key={`ripple-${index}`}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4 + index, opacity: 0 }}
          transition={{ 
            duration: 2, 
            delay,
            ease: "easeOut" 
          }}
          style={{
            ...styles.ripple,
            borderColor: config.color,
            borderWidth: `${3 - index}px`
          }}
        />
      ))}

      {/* Burst Effect */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: [0, 2, 0],
          opacity: [1, 0.6, 0]
        }}
        transition={{ 
          duration: 0.8,
          ease: "easeOut" 
        }}
        style={{
          ...styles.burst,
          borderColor: config.color,
          boxShadow: `0 0 40px ${config.color}66`
        }}
      />
    </motion.div>
  );
};

// Micro-interaction Button Effect
export const MicroInteractionButton = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  ...props 
}) => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #00C6E0 0%, #0099B3 100%)',
      color: '#000000'
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      color: '#ffffff'
    },
    success: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      color: '#000000'
    }
  };

  return (
    <motion.button
      whileHover={!disabled ? { 
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(0, 198, 224, 0.4)'
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98 
      } : {}}
      initial={false}
      animate={disabled ? {
        opacity: 0.5,
        scale: 1
      } : {
        opacity: 1,
        scale: 1
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      onClick={!disabled ? onClick : undefined}
      style={{
        ...styles.microButton,
        ...variants[variant],
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      {...props}
    >
      <motion.span
        animate={!disabled ? {
          y: [0, -1, 0]
        } : {}}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Performance-optimized Floating Elements
export const FloatingElements = ({ 
  count = 8, 
  color = '#00C6E0',
  speed = 'medium' 
}) => {
  const speedMap = {
    slow: [20, 30],
    medium: [15, 25],
    fast: [10, 20]
  };

  const [min, max] = speedMap[speed];

  return (
    <div style={styles.floatingContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          style={{
            ...styles.floatingElement,
            left: `${Math.random() * 100}%`,
            backgroundColor: color,
            opacity: Math.random() * 0.3 + 0.1
          }}
          animate={{
            y: [0, -100, 0],
            x: [(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: Math.random() * (max - min) + min,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.5
          }}
        />
      ))}
    </div>
  );
};

// Molecular Pattern Background
export const MolecularPattern = ({ 
  density = 'medium', 
  color = '#00C6E0', 
  opacity = 0.1 
}) => {
  const densityMap = {
    low: 8,
    medium: 12,
    high: 16
  };

  const nodeCount = densityMap[density];

  return (
    <div style={styles.molecularContainer}>
      <svg style={styles.molecularSvg}>
        {Array.from({ length: nodeCount }).map((_, index) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          
          return (
            <g key={index}>
              <motion.circle
                cx={`${x}%`}
                cy={`${y}%`}
                r="2"
                fill={color}
                opacity={opacity}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 2,
                  delay: index * 0.1
                }}
              />
              
              {/* Connections to nearby nodes */}
              {index > 0 && Math.random() > 0.6 && (
                <motion.line
                  x1={`${x}%`}
                  y1={`${y}%`}
                  x2={`${Math.random() * 100}%`}
                  y2={`${Math.random() * 100}%`}
                  stroke={color}
                  strokeWidth="1"
                  opacity={opacity * 0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.2
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Progress Bar with Atomic Theme
export const AtomicProgressBar = ({ 
  progress = 0, 
  label = 'Processing...', 
  animated = true 
}) => {
  return (
    <div style={styles.progressContainer}>
      {label && (
        <div style={styles.progressLabel}>
          {label}
        </div>
      )}
      
      <div style={styles.progressTrack}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: animated ? 0.5 : 0 }}
          style={styles.progressFill}
        >
          {animated && (
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
              style={styles.progressGlow}
            />
          )}
        </motion.div>
      </div>
      
      <div style={styles.progressText}>
        {Math.round(progress)}%
      </div>
    </div>
  );
};

// Styles
const styles = {
  spinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  spinner: {
    display: 'inline-block'
  },
  spinnerMessage: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    textAlign: 'center',
    margin: 0
  },
  quantumPulse: {
    width: '100%',
    height: '100%',
    border: '2px solid',
    borderRadius: '50%',
    position: 'absolute',
    top: 0,
    left: 0
  },
  networkContainer: {
    position: 'relative',
    width: '100px',
    height: '120px'
  },
  networkNode: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    position: 'absolute',
    left: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  networkPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  networkSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  celebrationContainer: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 9999,
    pointerEvents: 'none'
  },
  celebrationIcon: {
    fontSize: '4rem',
    textAlign: 'center'
  },
  particle: {
    position: 'absolute',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  ripple: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    border: '2px solid',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  molecularContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  },
  molecularSvg: {
    width: '100%',
    height: '100%'
  },
  progressContainer: {
    width: '100%'
  },
  progressLabel: {
    fontSize: '0.9rem',
    color: '#00C6E0',
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00C6E0, #0099B3)',
    borderRadius: '4px',
    position: 'relative'
  },
  progressGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '20px',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3))',
    borderRadius: '4px'
  },
  progressText: {
    fontSize: '0.8rem',
    color: '#cccccc',
    textAlign: 'center',
    marginTop: '0.5rem'
  },
  confetti: {
    position: 'absolute',
    width: '8px',
    height: '4px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '2px'
  },
  burst: {
    position: 'absolute',
    width: '150px',
    height: '150px',
    border: '3px solid',
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  },
  microButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  floatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    overflow: 'hidden'
  },
  floatingElement: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    bottom: '100%'
  }
};

export default {
  AtomicSpinner,
  QuantumPulse,
  NetworkSyncAnimation,
  CelebrationAnimation,
  MolecularPattern,
  AtomicProgressBar,
  MicroInteractionButton,
  FloatingElements
};