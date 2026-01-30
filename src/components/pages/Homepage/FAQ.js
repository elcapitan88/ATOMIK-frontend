import React, { useState } from 'react';
import { Box, Container, Heading, Text, VStack, Icon } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const MotionBox = motion(Box);

const faqs = [
  {
    question: "What is automated trading for beginners?",
    answer: "Automated trading for beginners is a way to execute trades automatically based on pre-set rules or signals, without needing to manually place each trade. With Atomik, you simply connect your TradingView alerts to your broker, and trades happen automatically when your conditions are met. No programming or coding experience required."
  },
  {
    question: "How do I automate my trading without programming?",
    answer: "Atomik makes it simple - no coding needed! Just connect your broker account, set up TradingView alerts with our webhook URL, and configure your trading parameters through our user-friendly interface. Our platform handles all the technical complexity, so you can focus on your trading strategy."
  },
  {
    question: "Can I connect TradingView alerts to my broker automatically?",
    answer: "Yes! This is exactly what Atomik specializes in. We provide webhook URLs that you paste into your TradingView alerts. When your alert triggers, it automatically sends a trade signal to your connected broker. Works with any TradingView strategy or indicator."
  },
  {
    question: "Is automated trading legal and safe?",
    answer: "Yes, automated trading is completely legal and widely used by professional traders. Atomik uses encrypted connections and secure API authentication to protect your data. We never store your broker login credentials - we use secure API connections that you can revoke at any time."
  },
  {
    question: "How much does trading automation cost?",
    answer: "Atomik offers transparent, flat-rate pricing with no per-trade fees. You can automate unlimited trades for one monthly price. We offer a 7-day free trial so you can test the platform risk-free. No hidden costs or surprise charges."
  },
  {
    question: "What brokers does Atomik support?",
    answer: "Atomik works with brokers including Tradovate, NinjaTrader, and others. We also support prop trading firms like Apex and other funded account providers. We're continuously adding new broker integrations. Contact us for specific requests."
  },
  {
    question: "Can I use Atomik with my prop firm account?",
    answer: "Absolutely! Atomik is designed to work seamlessly with prop trading firms and funded accounts. Many of our users automate their strategies on Apex and other prop firm platforms while following their rules and guidelines."
  },
  {
    question: "Do I need TradingView to use Atomik?",
    answer: "While TradingView is our most popular integration, you can also use other signal sources. TradingView is recommended because it offers powerful charting, thousands of indicators, and makes it easy to create automated alerts for any trading strategy."
  },
  {
    question: "How does Atomik Trading work?",
    answer: "Atomik acts as a bridge between your trading signals and your broker. When you receive a signal (from TradingView alerts or other sources), Atomik automatically places the trade on your broker account according to your pre-configured settings. You maintain full control over position sizing, risk management, and which signals to trade."
  }
];

const FAQItem = ({ question, answer, isOpen, onToggle, index }) => (
  <MotionBox
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
  >
    <Box
      borderBottom="1px solid rgba(255, 255, 255, 0.06)"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        w: '2px',
        bg: isOpen ? 'rgba(0, 198, 224, 1)' : 'transparent',
        borderRadius: 'full',
        transition: 'all 0.3s',
        boxShadow: isOpen ? '0 0 8px rgba(0, 198, 224, 0.4)' : 'none',
      }}
    >
      {/* Question row */}
      <Box
        as="button"
        w="full"
        py={5}
        pl={5}
        pr={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        onClick={onToggle}
        bg={isOpen ? 'rgba(0, 198, 224, 0.03)' : 'transparent'}
        transition="background 0.3s"
        textAlign="left"
        _hover={{
          bg: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <Text
          color={isOpen ? 'white' : 'whiteAlpha.800'}
          fontSize={{ base: "sm", md: "md" }}
          fontWeight={isOpen ? '600' : '500'}
          pr={4}
          transition="color 0.3s, font-weight 0.3s"
        >
          {question}
        </Text>
        <Box
          flexShrink={0}
          w="28px"
          h="28px"
          borderRadius="full"
          bg={isOpen ? 'rgba(0, 198, 224, 0.1)' : 'rgba(255, 255, 255, 0.04)'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="all 0.3s"
        >
          <Icon
            as={ChevronDown}
            color={isOpen ? 'rgba(0, 198, 224, 1)' : 'whiteAlpha.400'}
            boxSize={4}
            transition="transform 0.3s ease, color 0.3s"
            transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          />
        </Box>
      </Box>

      {/* Answer panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <MotionBox
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.3 }, opacity: { duration: 0.25, delay: 0.05 } }}
            overflow="hidden"
          >
            <Box pl={5} pr={6} pb={5}>
              <Text
                color="whiteAlpha.700"
                fontSize={{ base: "sm", md: "md" }}
                lineHeight="1.8"
              >
                {answer}
              </Text>
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  </MotionBox>
);

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    setOpenIndex(prev => prev === index ? null : index);
  };

  return (
    <>
      <Helmet>
        {/* FAQ Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "name": "Automated Trading FAQ - Frequently Asked Questions",
              "description": "Common questions about automated trading for beginners, TradingView integration, and prop trading automation",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is automated trading for beginners?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Automated trading for beginners is a method where computer programs execute trades based on pre-set rules, without needing to manually place each trade. With Atomik, you simply connect your TradingView alerts to your broker, and trades happen automatically when your conditions are met. No programming or coding experience required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How do I automate my trading without programming?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik makes it simple - no coding needed! Just connect your broker account, set up TradingView alerts with our webhook URL, and configure your trading parameters through our user-friendly interface. Our platform handles all the technical complexity, so you can focus on your trading strategy."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I connect TradingView alerts to my broker automatically?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! This is exactly what Atomik specializes in. We provide webhook URLs that you paste into your TradingView alerts. When your alert triggers, it automatically sends a trade signal to your connected broker. Works with any TradingView strategy or indicator."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is automated trading legal and safe?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, automated trading is completely legal and widely used by professional traders. Atomik uses encrypted connections and secure API authentication to protect your data. We never store your broker login credentials - we use secure API connections that you can revoke at any time."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How much does trading automation cost?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik offers transparent, flat-rate pricing with no per-trade fees. You can automate unlimited trades for one monthly price. We offer a 7-day free trial so you can test the platform risk-free. No hidden costs or surprise charges."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What brokers does Atomik support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik works with brokers including Tradovate, NinjaTrader, and others. We also support prop trading firms like Apex and other funded account providers. We're continuously adding new broker integrations. Contact us for specific requests."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I use Atomik with my prop firm account?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely! Atomik is designed to work seamlessly with prop trading firms and funded accounts. Many of our users automate their strategies on Apex and other prop firm platforms while following their rules and guidelines."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need TradingView to use Atomik?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "While TradingView is our most popular integration, you can also use other signal sources. TradingView is recommended because it offers powerful charting, thousands of indicators, and makes it easy to create automated alerts for any trading strategy."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does Atomik Trading work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik acts as a bridge between your trading signals and your broker. When you receive a signal (from TradingView alerts or other sources), Atomik automatically places the trade on your broker account according to your pre-configured settings. You maintain full control over position sizing, risk management, and which signals to trade."
                  }
                }
              ]
            }
          `}
        </script>
      </Helmet>

      <Box
        as="section"
        id="faq"
        py={{ base: 16, md: 24 }}
        bg="black"
        position="relative"
        overflow="hidden"
        aria-label="Frequently Asked Questions about automated trading"
      >
        {/* Background */}
        <Box
          position="absolute"
          inset="0"
          bg="linear-gradient(180deg, transparent 0%, rgba(0,198,224,0.02) 50%, transparent 100%)"
          pointerEvents="none"
        />

        <Container maxW="3xl" px={{ base: 4, md: 8 }}>
          <VStack spacing={{ base: 10, md: 14 }}>
            {/* Header */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <VStack spacing={4} textAlign="center" maxW="600px">
                <Heading
                  as="h2"
                  size={{ base: "xl", md: "2xl" }}
                  color="white"
                  fontWeight="bold"
                  fontFamily="'Satoshi', sans-serif"
                >
                  Common
                  <Text
                    as="span"
                    bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                    bgClip="text"
                    px={2}
                  >
                    Questions
                  </Text>
                </Heading>
                <Text color="whiteAlpha.600" fontSize={{ base: "md", md: "lg" }}>
                  Everything you need to know about getting started
                </Text>
              </VStack>
            </MotionBox>

            {/* FAQ List */}
            <Box
              w="full"
              bg="rgba(255, 255, 255, 0.02)"
              borderRadius="2xl"
              border="1px solid rgba(255, 255, 255, 0.06)"
              overflow="hidden"
            >
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => toggleItem(index)}
                  index={index}
                />
              ))}
            </Box>
          </VStack>
        </Container>
      </Box>
    </>
  );
};

export default FAQ;
