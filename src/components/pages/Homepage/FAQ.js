import React, { useState } from 'react';
import { Box, Container, Heading, Text, VStack, Collapse, useDisclosure, Icon } from '@chakra-ui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

const MotionBox = motion(Box);

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <MotionBox
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    bg="rgba(255, 255, 255, 0.1)"
    backdropFilter="blur(10px)"
    borderRadius="xl"
    border="1px solid rgba(255, 255, 255, 0.18)"
    overflow="hidden"
    _hover={{
      borderColor: "rgba(0, 198, 224, 0.3)",
      boxShadow: "0 8px 32px 0 rgba(0, 198, 224, 0.1)"
    }}
    transition="all 0.3s"
  >
    <Box
      p={6}
      cursor="pointer"
      onClick={onToggle}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
      transition="all 0.3s"
    >
      <Heading as="h3" size="md" color="white" pr={4}>
        {question}
      </Heading>
      <Icon 
        as={isOpen ? ChevronUp : ChevronDown} 
        color="rgba(0, 198, 224, 1)" 
        boxSize={5}
        transition="all 0.3s"
      />
    </Box>
    <Collapse in={isOpen}>
      <Box px={6} pb={6}>
        <Text color="whiteAlpha.800" fontSize="md" lineHeight="tall">
          {answer}
        </Text>
      </Box>
    </Collapse>
  </MotionBox>
);

const FAQ = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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
      answer: "Yes, automated trading is completely legal and widely used by professional traders. Atomik uses bank-grade security and enterprise encryption to protect your data. We never store your broker login credentials - we use secure API connections that you can revoke at any time."
    },
    {
      question: "How much does trading automation cost?",
      answer: "Atomik offers transparent, flat-rate pricing with no per-trade fees. You can automate unlimited trades for one monthly price. We offer a 14-day free trial so you can test the platform risk-free. No hidden costs or surprise charges."
    },
    {
      question: "What brokers does Atomik support?",
      answer: "Atomik works with major brokers including Interactive Brokers, Tradovate, and many others. We also support prop trading firms like TopStep, Apex, and other funded account providers. If your broker has API access, we can likely integrate with it."
    },
    {
      question: "Can I use Atomik with my prop firm account?",
      answer: "Absolutely! Atomik is designed to work seamlessly with prop trading firms and funded accounts. Many of our users successfully automate their strategies on TopStep, Apex, and other prop firm platforms while following all their rules and guidelines."
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
                    "text": "Yes, automated trading is completely legal and widely used by professional traders. Atomik uses bank-grade security and enterprise encryption to protect your data. We never store your broker login credentials - we use secure API connections that you can revoke at any time."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How much does trading automation cost?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik offers transparent, flat-rate pricing with no per-trade fees. You can automate unlimited trades for one monthly price. We offer a 14-day free trial so you can test the platform risk-free. No hidden costs or surprise charges."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What brokers does Atomik support?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Atomik works with major brokers including Interactive Brokers, Tradovate, and many others. We also support prop trading firms like TopStep, Apex, and other funded account providers. If your broker has API access, we can likely integrate with it."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I use Atomik with my prop firm account?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Absolutely! Atomik is designed to work seamlessly with prop trading firms and funded accounts. Many of our users successfully automate their strategies on TopStep, Apex, and other prop firm platforms while following all their rules and guidelines."
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
        py={20}
        bg="black"
        position="relative"
        overflow="hidden"
        aria-label="Frequently Asked Questions about automated trading"
      >
      {/* Background Elements */}
      <Box
        position="absolute"
        top="20%"
        right="10%"
        width="30%"
        height="30%"
        bgGradient="radial(circle, rgba(0,198,224,0.1) 0%, rgba(0,0,0,0) 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />

      <Container maxW="4xl" px={{ base: 4, md: 8 }}>
        <VStack spacing={12}>
          {/* Section Title */}
          <VStack spacing={4} textAlign="center" maxW="800px">
            <Heading
              as="h2"
              size="2xl"
              color="white"
              fontWeight="bold"
            >
              Frequently Asked Questions About
              <Text
                as="span"
                bgGradient="linear(to-r, rgba(0,198,224,1), rgba(0,198,224,0.6))"
                bgClip="text"
                px={2}
              >
                Automated Trading
              </Text>
            </Heading>
            <Text color="whiteAlpha.800" fontSize="lg">
              Everything beginners need to know about getting started with trading automation
            </Text>
          </VStack>

          {/* FAQ Items */}
          <VStack spacing={4} w="full">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openItems[index]}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default FAQ;