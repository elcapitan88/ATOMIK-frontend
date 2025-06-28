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
        
        {/* Structured Data - Organization Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": ["Organization", "FinancialService"],
              "name": "Atomik Trading",
              "alternateName": ["AtomikTrading", "Atomik"],
              "description": "Beginner-friendly automated trading platform that connects TradingView alerts to brokers without coding. Features copy trading and prop account integration with transparent pricing.",
              "url": "https://atomiktrading.io",
              "logo": {
                "@type": "ImageObject",
                "url": "https://atomiktrading.io/logos/atomik-logo.svg",
                "width": "300",
                "height": "300"
              },
              "image": {
                "@type": "ImageObject",
                "url": "https://atomiktrading.io/images/dashboard.png",
                "width": "1745",
                "height": "914",
                "caption": "Atomik Trading Dashboard - Automated Trading Platform for Beginners"
              },
              "foundingDate": "2023",
              "serviceType": ["Trading Automation Platform", "Financial Technology", "Educational Platform"],
              "areaServed": {
                "@type": "GeoTargeting",
                "name": "Worldwide"
              },
              "audience": {
                "@type": "Audience",
                "audienceType": ["Beginner Traders", "Prop Traders", "TradingView Users", "Funded Account Holders"],
                "geographicArea": "Global"
              },
              "knowsAbout": [
                "Automated Trading",
                "TradingView Integration", 
                "Prop Trading",
                "Copy Trading",
                "Trading Automation for Beginners",
                "No-Code Trading Solutions"
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Automated Trading Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "TradingView Alert Automation",
                      "description": "Connect TradingView alerts directly to your broker for automated trading"
                    }
                  },
                  {
                    "@type": "Offer", 
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Prop Trading Account Integration",
                      "description": "Automated trading for funded accounts from TopStep, Apex, and other prop firms"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service", 
                      "name": "Copy Trading Platform",
                      "description": "Follow and copy successful automated trading strategies"
                    }
                  }
                ]
              },
              "sameAs": [
                "https://x.com/atomiktrades",
                "https://www.youtube.com/@AtomikTrading",
                "https://www.tiktok.com/@atomiktrading"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "support@atomiktrading.io",
                "contactType": "customer service",
                "availableLanguage": "English"
              }
            }
          `}
        </script>

        {/* Enhanced SoftwareApplication Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Atomik Trading Platform",
              "applicationCategory": ["FinanceApplication", "BusinessApplication"],
              "applicationSubCategory": "Trading Automation Software",
              "description": "Learn how to automate your trading with TradingView alerts. Perfect for beginners and prop traders. No coding required - start your automated trading journey today.",
              "operatingSystem": ["Web Browser", "Any"],
              "browserRequirements": "Requires JavaScript enabled",
              "url": "https://atomiktrading.io",
              "downloadUrl": "https://atomiktrading.io/start",
              "screenshot": {
                "@type": "ImageObject",
                "url": "https://atomiktrading.io/images/dashboard.png",
                "caption": "Atomik Trading automation dashboard showing TradingView alert integration"
              },
              "featureList": [
                "TradingView Alert Integration",
                "No-Code Automation Setup", 
                "Prop Trading Account Support",
                "Copy Trading Features",
                "Real-time Performance Monitoring",
                "Multi-Broker Connectivity",
                "Risk Management Tools",
                "Beginner-Friendly Interface"
              ],
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Free Trial",
                  "description": "14-day free trial - no credit card required",
                  "price": "0",
                  "priceCurrency": "USD",
                  "validFor": "P14D",
                  "availability": "https://schema.org/InStock"
                },
                {
                  "@type": "Offer",
                  "name": "Starter Plan", 
                  "description": "Basic automated trading features",
                  "priceSpecification": {
                    "@type": "UnitPriceSpecification",
                    "price": "19.99",
                    "priceCurrency": "USD",
                    "unitCode": "MON"
                  },
                  "availability": "https://schema.org/InStock"
                }
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150",
                "bestRating": "5",
                "worstRating": "1"
              },
              "provider": {
                "@type": "Organization",
                "name": "Atomik Trading",
                "url": "https://atomiktrading.io"
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