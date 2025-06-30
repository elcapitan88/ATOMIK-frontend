import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ChakraProvider } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import TagManager from 'react-gtm-module'; // Added GTM import
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import theme from './styles/theme';
import { ConfigCatProvider } from 'configcat-react';
import { WebSocketProvider } from './services/websocket-proxy/contexts/WebSocketContext';

// Import global styles
import './styles/globals.css';

// Initialize Google Tag Manager - replace GTM-XXXXXX with your actual GTM ID
const tagManagerArgs = {
  gtmId: 'GTM-KF3PNRZG', // You'll get this ID when creating your GTM account
  dataLayerName: 'dataLayer',
  events: {
    pageView: true // Send initial pageview
  }
}

TagManager.initialize(tagManagerArgs);

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
      cacheTime: 5 * 60 * 1000,
      refetchOnReconnect: 'always',
      onError: (error) => {
        console.error('Query Error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation Error:', error);
      },
    },
  },
});

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: 'white',
          background: 'rgba(0, 0, 0, 0.8)'
        }}>
          <h1>Something went wrong.</h1>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              background: '#00C6E0',
              border: 'none',
              borderRadius: '5px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  //<React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <ConfigCatProvider sdkKey={process.env.REACT_APP_CONFIGCAT_SDK_KEY}>
              <BrowserRouter 
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <AuthProvider>
                  <WebSocketProvider>
                  <App />
                  </WebSocketProvider>
                </AuthProvider>
              </BrowserRouter>
            </ConfigCatProvider>
          </ChakraProvider>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  //</React.StrictMode>
);

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Handle global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Web Vitals reporting for Core Web Vitals monitoring
import('./reportWebVitals').then(({ default: reportWebVitals }) => {
  reportWebVitals((metric) => {
    // Send to Google Analytics 4 if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
      });
    }
    
    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }
  });
});