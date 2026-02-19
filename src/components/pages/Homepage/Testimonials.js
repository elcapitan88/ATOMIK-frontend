import React, { useState, useEffect, useCallback } from 'react';
import { Box, Container, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

const testimonials = [
  {
    quote: "Started working with Cruz and Atomik about 3 weeks ago and it's been nothing but a 10/10 experience. Cruz was great at communication, making sure all my questions and concerns were addressed. Highly recommend working with not only Cruz, but Atomik as a whole. It's an amazing concept and I can't wait to see the future of it.",
    author: "@Dezzy",
    role: "Automated Trader"
  },
  {
    quote: "Joining Atomik Trading has been one of the best decisions I've made for my trading journey. The support and education have been next-level — huge shoutout to Cruz, whose guidance, clarity, and no-BS approach make all the difference. I've grown as a trader and gained confidence and consistency I never had before. If you're on the fence, take the leap.",
    author: "@Joebags71",
    role: "Automated Trader"
  },
  {
    quote: "Atomik Trading has been incredible! Getting set up with automated trading on my Apex accounts was seamless. So much room to grow here with automation — I can't wait to see what's next.",
    author: "@aslater.18",
    role: "Prop Trader"
  }
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  return (
    <Box
      py={{ base: 16, md: 24 }}
      bg="black"
      position="relative"
      overflow="hidden"
    >
      {/* Background */}
      <Box
        position="absolute"
        inset="0"
        bg="radial-gradient(circle at 50% 50%, rgba(0,198,224,0.04) 0%, transparent 60%)"
        pointerEvents="none"
      />

      <Container maxW="4xl" px={{ base: 6, md: 8 }}>
        <VStack spacing={{ base: 10, md: 14 }}>
          {/* Section Header */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <VStack spacing={4} textAlign="center">
              <Heading
                as="h2"
                size={{ base: "xl", md: "2xl" }}
                color="white"
                fontWeight="bold"
                fontFamily="'Satoshi', sans-serif"
              >
                What Our
                <Text
                  as="span"
                  bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                  bgClip="text"
                  px={2}
                >
                  Traders
                </Text>
                Say
              </Heading>
              <Text color="whiteAlpha.600" fontSize={{ base: "md", md: "lg" }}>
                Real feedback from real users
              </Text>
            </VStack>
          </MotionBox>

          {/* Quote Spotlight */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            w="full"
          >
            <Box
              position="relative"
              p={{ base: 8, md: 12 }}
              bg="rgba(255, 255, 255, 0.03)"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              border="1px solid rgba(255, 255, 255, 0.08)"
              minH={{ base: "280px", md: "240px" }}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Large decorative quotation mark */}
              <Text
                position="absolute"
                top={{ base: 2, md: 4 }}
                left={{ base: 4, md: 8 }}
                fontSize={{ base: "6xl", md: "8xl" }}
                fontFamily="Georgia, serif"
                color="rgba(0, 198, 224, 0.15)"
                lineHeight="1"
                userSelect="none"
                pointerEvents="none"
              >
                &ldquo;
              </Text>

              {/* Quote content with crossfade */}
              <VStack spacing={6} position="relative" zIndex={1} justify="center" minH={{ base: "200px", md: "160px" }}>
                <AnimatePresence mode="wait">
                  <MotionBox
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    w="full"
                  >
                    <VStack spacing={6}>
                      <Text
                        color="whiteAlpha.900"
                        fontSize={{ base: "md", md: "lg" }}
                        lineHeight="1.8"
                        textAlign="center"
                        fontStyle="italic"
                        maxW="700px"
                        mx="auto"
                      >
                        &ldquo;{testimonials[activeIndex].quote}&rdquo;
                      </Text>

                      <VStack spacing={1}>
                        <Text
                          color="white"
                          fontSize="md"
                          fontWeight="600"
                        >
                          {testimonials[activeIndex].author}
                        </Text>
                        <Text
                          color="rgba(0, 198, 224, 0.8)"
                          fontSize="sm"
                          fontWeight="500"
                        >
                          {testimonials[activeIndex].role}
                        </Text>
                      </VStack>
                    </VStack>
                  </MotionBox>
                </AnimatePresence>
              </VStack>
            </Box>
          </MotionBox>

          {/* Navigation pills */}
          <HStack spacing={3} justify="center">
            {testimonials.map((t, index) => (
              <Box
                key={t.author}
                as="button"
                onClick={() => setActiveIndex(index)}
                px={4}
                py={2}
                borderRadius="full"
                bg={index === activeIndex ? 'rgba(0, 198, 224, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                border="1px solid"
                borderColor={index === activeIndex ? 'rgba(0, 198, 224, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                color={index === activeIndex ? 'rgba(0, 198, 224, 1)' : 'whiteAlpha.500'}
                fontSize="sm"
                fontWeight={index === activeIndex ? '600' : '400'}
                transition="all 0.3s"
                cursor="pointer"
                _hover={{
                  bg: 'rgba(0, 198, 224, 0.1)',
                  borderColor: 'rgba(0, 198, 224, 0.3)',
                  color: 'rgba(0, 198, 224, 0.8)',
                }}
                aria-label={`View testimonial from ${t.author}`}
              >
                {t.author}
              </Box>
            ))}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Testimonials;
