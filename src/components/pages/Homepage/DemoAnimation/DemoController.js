import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Create context for animation state
export const DemoAnimationContext = createContext();

// Custom hook to use the animation context
export const useDemoAnimation = () => {
  const context = useContext(DemoAnimationContext);
  if (!context) {
    throw new Error('useDemoAnimation must be used within a DemoAnimationProvider');
  }
  return context;
};

// Main controller component
export const DemoController = ({ 
  children, 
  initialStep = 0, 
  autoPlay = true, 
  stepDuration = 8000 
}) => {
  // Animation state
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [typingText, setTypingText] = useState('');
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Current mouse position state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  
  // Refs for intervals and timeouts
  const stepInterval = useRef(null);
  const typingInterval = useRef(null);
  const animationFrameRef = useRef(null);
  const animationStartTimeRef = useRef(null);
  
  // Total number of steps in the demo
  const totalSteps = 4;
  
  // Typewriter effect function
  const typeText = (text, speed = 50) => {
    let i = 0;
    setTypingText('');
    
    // Clear any existing typing interval
    if (typingInterval.current) {
      clearInterval(typingInterval.current);
    }
    
    // Set up new interval for typing effect
    typingInterval.current = setInterval(() => {
      if (i < text.length) {
        setTypingText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval.current);
      }
    }, speed);
  };

  // Mouse animation functions
  const moveMouse = (x, y, duration = 500) => {
    const startPosition = { ...mousePosition };
    const startTime = performance.now();
    
    const animateMouseMove = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easing function for smoother movement
      const easeProgress = easeOutQuad(progress);
      
      const newX = startPosition.x + (x - startPosition.x) * easeProgress;
      const newY = startPosition.y + (y - startPosition.y) * easeProgress;
      
      setMousePosition({ x: newX, y: newY });
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateMouseMove);
      }
    };
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(animateMouseMove);
  };
  
  const simulateClick = (x, y, callback) => {
    // Move mouse to position first
    moveMouse(x, y, 800);
    
    // After mouse arrives, trigger click
    setTimeout(() => {
      setIsClicking(true);
      
      // Reset click state after a short delay
      setTimeout(() => {
        setIsClicking(false);
        if (callback) callback();
      }, 200);
    }, 900); // Slightly longer than move duration to ensure arrival
  };
  
  // Handle step change - triggers animations
  const goToStep = (stepIndex) => {
    // Validate step index
    const validIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
    
    setCurrentStep(validIndex);
    setIsAnimating(true);
    setAnimationProgress(0);
    animationStartTimeRef.current = performance.now();
    
    // Reset animation frame for progress tracking
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Start tracking animation progress
    const trackProgress = (timestamp) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = Math.min(elapsed / stepDuration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1 && isAnimating) {
        animationFrameRef.current = requestAnimationFrame(trackProgress);
      } else if (progress >= 1) {
        setIsAnimating(false);
        animationStartTimeRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(trackProgress);
    
    // Handle step-specific animations
    switch (validIndex) {
      case 0: // Broker connection
        // Start with mouse at a neutral position
        setMousePosition({ x: 200, y: 100 });
        
        setTimeout(() => {
          // Move to connect button
          simulateClick(430, 150, () => {
            // After clicking, trigger any additional animations for this step
            setTimeout(() => {
              // Move to authentication form fields
              moveMouse(280, 220);
            }, 500);
          });
        }, 1000);
        break;
        
      case 1: // Webhook creation
        setMousePosition({ x: 150, y: 130 });
        
        setTimeout(() => {
          // Move to webhook button
          simulateClick(200, 170, () => {
            // After clicking, type webhook info
            setTimeout(() => {
              typeText('https://api.atomiktrading.io/webhook/abc123xyz');
              
              // Move to save button after typing
              setTimeout(() => {
                simulateClick(400, 280);
              }, 2000);
            }, 500);
          });
        }, 1000);
        break;
        
      case 2: // Strategy configuration
        setMousePosition({ x: 180, y: 110 });
        
        setTimeout(() => {
          // Move to activate strategy button
          simulateClick(350, 150, () => {
            // Select strategy details
            setTimeout(() => {
              simulateClick(280, 220, () => {
                // Toggle activation switch
                setTimeout(() => {
                  simulateClick(380, 260);
                }, 800);
              });
            }, 1000);
          });
        }, 1000);
        break;
        
      case 3: // Live trading
        setMousePosition({ x: 150, y: 100 });
        
        setTimeout(() => {
          // Move over chart
          moveMouse(300, 180);
          
          setTimeout(() => {
            // Move to buy button
            simulateClick(400, 320, () => {
              // After clicking buy
              typeText('Executing BUY order: ES × 1 @ market');
            });
          }, 2000);
        }, 1000);
        break;
        
      default:
        break;
    }
  };
  
  // Go to next step
  const nextStep = () => {
    goToStep((currentStep + 1) % totalSteps);
  };
  
  // Go to previous step
  const prevStep = () => {
    goToStep((currentStep - 1 + totalSteps) % totalSteps);
  };
  
  // Toggle pause state
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  // Set up auto-cycling through steps
  useEffect(() => {
    // Clear existing interval
    if (stepInterval.current) {
      clearInterval(stepInterval.current);
      stepInterval.current = null;
    }
    
    // Only set up interval if not paused
    if (!isPaused) {
      stepInterval.current = setInterval(() => {
        nextStep();
      }, stepDuration);
    }
    
    // Cleanup on unmount
    return () => {
      if (stepInterval.current) {
        clearInterval(stepInterval.current);
      }
      if (typingInterval.current) {
        clearInterval(typingInterval.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPaused, currentStep, stepDuration]);
  
  // Prepare context value
  const contextValue = {
    currentStep,
    isAnimating,
    isPaused,
    typingText,
    animationProgress,
    mousePosition,
    isClicking,
    nextStep,
    prevStep,
    goToStep,
    togglePause,
    typeText,
    moveMouse,
    simulateClick,
    totalSteps
  };
  
  return (
    <DemoAnimationContext.Provider value={contextValue}>
      {children}
    </DemoAnimationContext.Provider>
  );
};

// Utility easing function for smoother animations
const easeOutQuad = (t) => t * (2 - t);

export default DemoController;