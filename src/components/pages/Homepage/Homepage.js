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
          <LazyComponent component={TrustSecurity} id="trust-security-section" />
          <LazyComponent component={IntegrationPartners} id="integration-partners-section" />
        </Box>
        <Footer />
      </Box>
    </>
  );
};

export default Homepage;