import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import { Helmet } from 'react-helmet-async';

// Import critical above-the-fold components eagerly
import Navbar from './Navbar';
import Hero from './Hero';
import Footer from './Footer';

// Lazy load below-the-fold components
const Statistics = lazy(() => import('./Statistics'));
const Features = lazy(() => import('./Features'));
const HowToUse = lazy(() => import('./HowToUse'));
const FAQ = lazy(() => import('./FAQ'));
const TrustSecurity = lazy(() => import('./TrustSecurity'));
const IntegrationPartners = lazy(() => import('./IntegrationPartners'));

// LazyComponent with Intersection Observer
const LazyComponent = ({ component: Component, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before it becomes visible
    );
    
    const currentRef = document.getElementById(props.id || 'lazy-component');
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [props.id]);
  
  // Only render the component when it's visible or has already loaded
  useEffect(() => {
    if (isVisible && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [isVisible, hasLoaded]);
  
  return (
    <div id={props.id || 'lazy-component'}>
      {hasLoaded ? (
        <Suspense fallback={<Box height="300px" display="flex" alignItems="center" justifyContent="center"><Spinner /></Box>}>
          <Component {...props} />
        </Suspense>
      ) : (
        <Box height="300px" /> // Placeholder before component loads
      )}
    </div>
  );
};

const Homepage = () => {
  return (
    <>
      <Helmet>
        <title>Automated Trading for Beginners - No Coding Required | Atomik Trading</title>
        <meta name="description" content="Learn how to automate your trading with TradingView alerts. Perfect for beginners and prop traders. Connect any broker, no programming required. Start your 14-day free trial." />
        <meta name="keywords" content="automated trading, how to automate trading, beginner automated trading, TradingView alerts, trading automation for beginners, no coding trading, prop trading automation" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Automated Trading for Beginners - No Coding Required | Atomik Trading" />
        <meta property="og:description" content="Learn how to automate your trading with TradingView alerts. Perfect for beginners and prop traders. Connect any broker, no programming required." />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Automated Trading for Beginners - No Coding Required" />
        <meta name="twitter:description" content="Learn how to automate your trading with TradingView alerts. Perfect for beginners and prop traders. Connect any broker, no programming required." />
        
        {/* Additional SEO tags */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <link rel="canonical" href="https://atomiktrading.io/" />
        
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
          <LazyComponent component={Statistics} id="statistics-section" />
          <LazyComponent component={Features} id="features-section" />
          <LazyComponent component={HowToUse} id="how-to-use-section" />
          <LazyComponent component={FAQ} id="faq-section" />
          <LazyComponent component={TrustSecurity} id="trust-security-section" />
          <LazyComponent component={IntegrationPartners} id="integration-partners-section" />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default Homepage;