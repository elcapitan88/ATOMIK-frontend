import React from 'react';
import { Box } from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import HowToUse from './HowToUse';
import TrustSecurity from './TrustSecurity';
import IntegrationPartners from './IntegrationPartners';
import Statistics from './Statistics';
import Footer from './Footer';



const Homepage = () => {
  return (
    <>
      <Helmet>
        <title>Atomik Trading - Professional Trading Automation Platform</title>
        <meta name="description" content="Professional-grade webhook-based trading automation platform. Connect your favorite broker and automate your trading strategies with ease." />
        <meta name="keywords" content="trading automation, webhook trading, automated trading, trading signals, broker integration, algorithmic trading" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Atomik Trading - Professional Trading Automation Platform" />
        <meta property="og:description" content="Professional-grade webhook-based trading automation platform. Connect your favorite broker and automate your trading strategies with ease." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AutoTrade - Professional Trading Automation Platform" />
        <meta name="twitter:description" content="Professional-grade webhook-based trading automation platform. Connect your favorite broker and automate your trading strategies with ease." />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <link rel="canonical" href="https://yourdomain.com" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {`
            {
              "@context": "http://schema.org",
              "@type": "SoftwareApplication",
              "name": "Atomik Trading",
              "applicationCategory": "BusinessApplication",
              "description": "Professional-grade webhook-based trading automation platform.",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            }
          `}
        </script>
      </Helmet>

      <Box minH="100vh" bg="background" color="text.primary">
        <Navbar />
        <Box as="main">
          <Hero />
          <Statistics />
          <Features />
          <HowToUse />
          <TrustSecurity />
          <IntegrationPartners />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default Homepage;