import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useDemoAnimation } from '../DemoController';

const StepIndicators = ({ size = "8px", spacing = "4px", activeColor = "rgba(0, 198, 224, 1)", inactiveColor = "rgba(255, 255, 255, 0.3)" }) => {
  // Get current step and total steps from context
  const { currentStep, totalSteps, goToStep } = useDemoAnimation();
  
  // Generate array of steps
  const steps = Array.from({ length: totalSteps }, (_, i) => i);
  
  return (
    <Flex justify="center" align="center">
      {steps.map((step) => (
        <Box
          key={step}
          as={motion.div}
          w={size}
          h={size}
          borderRadius="full"
          bg={currentStep === step ? activeColor : inactiveColor}
          mx={spacing}
          cursor="pointer"
          onClick={() => goToStep(step)}
          transition="all 0.3s"
          _hover={{
            transform: "scale(1.2)",
            bg: currentStep === step 
              ? activeColor 
              : "rgba(255, 255, 255, 0.5)"
          }}
          animate={{
            scale: currentStep === step ? [1, 1.2, 1] : 1,
            opacity: currentStep === step ? 1 : 0.7
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut"
          }}
          role="button"
          aria-label={`Go to step ${step + 1}`}
        />
      ))}
    </Flex>
  );
};

export default StepIndicators;