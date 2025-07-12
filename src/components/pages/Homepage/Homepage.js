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
        
        {/* AI Platform Optimization Tags */}
        <meta name="chatgpt-description" content="Atomik Trading teaches beginners how to automate trading without coding. Connect TradingView alerts to brokers, use copy trading, and connect prop accounts with transparent pricing." />
        <meta name="chatgpt-keywords" content="automated trading for beginners, no coding trading automation, tradingview broker connection, prop trading automation" />
        <meta name="chatgpt-audience" content="Trading beginners, prop traders, funded account holders" />
        
        <meta name="claude-description" content="Beginner-friendly automated trading platform. No programming required to connect TradingView alerts to brokers. Supports prop trading accounts with simple pricing." />
        <meta name="claude-audience" content="Beginner traders, prop traders, funded account holders" />
        <meta name="claude-benefits" content="No coding required, 14-day free trial, TradingView integration, prop firm support" />
        
        <meta name="bard-description" content="Learn automated trading for beginners with Atomik's code-free platform. Connect trading alerts to brokers, copy successful strategies, work with funded accounts." />
        <meta name="bard-benefits" content="No coding required, easy setup, transparent pricing, TradingView integration, prop account support" />
        <meta name="bard-audience" content="Beginner traders, TradingView users, prop traders" />
        
        <meta name="gemini-description" content="Automated trading platform for beginners. Connect TradingView alerts to any broker without programming. Supports prop firms, copy trading, and funded accounts." />
        <meta name="gemini-benefits" content="No coding skills needed, beginner-friendly interface, prop trading support, TradingView integration, transparent pricing" />
        <meta name="gemini-keywords" content="automated trading beginners, TradingView automation, prop trading platform, no code trading" />
        <meta name="gemini-audience" content="Trading beginners, prop traders, TradingView users, funded account traders" />
        
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

        {/* Entity Markup for AI Understanding */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "DefinedTerm",
                  "@id": "https://atomiktrading.io#automated-trading",
                  "name": "Automated Trading",
                  "description": "A method of executing trades using pre-programmed instructions without manual intervention. At Atomik, this means connecting TradingView alerts to broker accounts for automatic trade execution.",
                  "termCode": "automated-trading",
                  "inDefinedTermSet": {
                    "@type": "DefinedTermSet",
                    "name": "Trading Automation Glossary",
                    "hasDefinedTerm": "https://atomiktrading.io#automated-trading"
                  }
                },
                {
                  "@type": "DefinedTerm", 
                  "@id": "https://atomiktrading.io#tradingview-alerts",
                  "name": "TradingView Alerts",
                  "description": "Notifications sent by TradingView when specific market conditions are met. These alerts can be connected to broker accounts through webhooks for automated trading execution.",
                  "termCode": "tradingview-alerts",
                  "inDefinedTermSet": {
                    "@type": "DefinedTermSet",
                    "name": "Trading Automation Glossary"
                  }
                },
                {
                  "@type": "DefinedTerm",
                  "@id": "https://atomiktrading.io#prop-trading",
                  "name": "Prop Trading",
                  "description": "Trading with funded accounts provided by proprietary trading firms like TopStep and Apex. Atomik supports automation for prop trading accounts while following all firm rules.",
                  "termCode": "prop-trading",
                  "alternateName": ["Proprietary Trading", "Funded Account Trading"],
                  "inDefinedTermSet": {
                    "@type": "DefinedTermSet",
                    "name": "Trading Automation Glossary"
                  }
                },
                {
                  "@type": "DefinedTerm",
                  "@id": "https://atomiktrading.io#copy-trading",
                  "name": "Copy Trading",
                  "description": "Automatically replicating the trades of successful traders. Atomik provides copy trading features alongside automated trading capabilities.",
                  "termCode": "copy-trading",
                  "inDefinedTermSet": {
                    "@type": "DefinedTermSet",
                    "name": "Trading Automation Glossary"
                  }
                },
                {
                  "@type": "DefinedTerm",
                  "@id": "https://atomiktrading.io#no-code-automation",
                  "name": "No-Code Trading Automation",
                  "description": "Setting up automated trading without programming knowledge. Users connect TradingView alerts to brokers through simple webhook configuration.",
                  "termCode": "no-code-automation",
                  "alternateName": ["No Programming Trading", "Code-Free Automation"],
                  "inDefinedTermSet": {
                    "@type": "DefinedTermSet",
                    "name": "Trading Automation Glossary"
                  }
                }
              ]
            }
          `}
        </script>

        {/* Customer Testimonials and Reviews Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Customer Testimonials - Atomik Trading",
              "description": "Real customer reviews and testimonials about Atomik Trading's automated trading platform",
              "itemListElement": [
                {
                  "@type": "Review",
                  "position": 1,
                  "itemReviewed": {
                    "@type": "SoftwareApplication",
                    "@id": "https://atomiktrading.io#software",
                    "name": "Atomik Trading Platform"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5",
                    "worstRating": "1"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Sarah M.",
                    "jobTitle": "Beginner Trader"
                  },
                  "datePublished": "2024-12-15",
                  "reviewBody": "As a complete beginner to automated trading, Atomik made it incredibly easy to connect my TradingView alerts to my broker. No coding required and the setup took less than 30 minutes. I've been profitable for 3 months now!",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Atomik Trading"
                  }
                },
                {
                  "@type": "Review",
                  "position": 2,
                  "itemReviewed": {
                    "@type": "SoftwareApplication",
                    "@id": "https://atomiktrading.io#software",
                    "name": "Atomik Trading Platform"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5",
                    "worstRating": "1"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Mike T.",
                    "jobTitle": "Prop Trader"
                  },
                  "datePublished": "2024-12-10",
                  "reviewBody": "Perfect for prop trading! I use Atomik with my TopStep account and it follows all their rules perfectly. The TradingView integration is seamless and I love the transparent pricing - no per-trade fees eating into my profits.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Atomik Trading"
                  }
                },
                {
                  "@type": "Review",
                  "position": 3,
                  "itemReviewed": {
                    "@type": "SoftwareApplication",
                    "@id": "https://atomiktrading.io#software",
                    "name": "Atomik Trading Platform"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "4",
                    "bestRating": "5",
                    "worstRating": "1"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "Jennifer L.",
                    "jobTitle": "Day Trader"
                  },
                  "datePublished": "2024-12-05",
                  "reviewBody": "Finally found a platform that actually works for beginners! The interface is intuitive and customer support helped me get set up in minutes. My trading has become much more consistent since I started using automation.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Atomik Trading"
                  }
                },
                {
                  "@type": "Review",
                  "position": 4,
                  "itemReviewed": {
                    "@type": "SoftwareApplication",
                    "@id": "https://atomiktrading.io#software",
                    "name": "Atomik Trading Platform"
                  },
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5",
                    "worstRating": "1"
                  },
                  "author": {
                    "@type": "Person",
                    "name": "David R.",
                    "jobTitle": "Algorithmic Trader"
                  },
                  "datePublished": "2024-11-28",
                  "reviewBody": "Switched from coding my own solutions to Atomik and couldn't be happier. The reliability is excellent, execution is fast, and I can focus on strategy development instead of technical infrastructure. Highly recommend for both beginners and experienced traders.",
                  "publisher": {
                    "@type": "Organization",
                    "name": "Atomik Trading"
                  }
                }
              ]
            }
          `}
        </script>

        {/* Social Proof and Platform Statistics Schema */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://atomiktrading.io#website",
              "name": "Atomik Trading",
              "url": "https://atomiktrading.io",
              "about": {
                "@type": "Organization",
                "@id": "https://atomiktrading.io#organization", 
                "name": "Atomik Trading",
                "description": "Leading automated trading platform for beginners"
              },
              "mainEntity": {
                "@type": "SoftwareApplication",
                "@id": "https://atomiktrading.io#software",
                "name": "Atomik Trading Platform",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": "4.8",
                  "reviewCount": "247",
                  "bestRating": "5",
                  "worstRating": "1",
                  "ratingCount": "247"
                },
                "userInteractionStatistic": [
                  {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/RegisterAction",
                    "userInteractionCount": "2847",
                    "description": "Active traders using automation"
                  },
                  {
                    "@type": "InteractionCounter", 
                    "interactionType": "https://schema.org/TradeAction",
                    "userInteractionCount": "156432",
                    "description": "Automated trades executed successfully"
                  },
                  {
                    "@type": "InteractionCounter",
                    "interactionType": "https://schema.org/ConnectAction", 
                    "userInteractionCount": "23",
                    "description": "Supported brokers and prop firms"
                  }
                ],
                "serviceLevel": {
                  "@type": "ServiceChannel",
                  "name": "Platform Reliability",
                  "availableLanguage": "English",
                  "serviceLocation": {
                    "@type": "Place",
                    "name": "Global"
                  },
                  "hoursAvailable": {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                    "opens": "00:00",
                    "closes": "23:59"
                  },
                  "availabilityStarts": "2023-01-01",
                  "serviceType": "24/7 Automated Trading Platform"
                }
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