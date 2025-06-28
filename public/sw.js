// Service Worker for Atomik Trading - Performance Optimization
const CACHE_NAME = 'atomik-trading-v1';
const STATIC_CACHE = 'atomik-static-v1';
const DYNAMIC_CACHE = 'atomik-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logos/atomik-logo.svg',
  '/images/dashboard.png',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Assets to cache on first request
const CACHE_ROUTES = [
  '/pricing',
  '/docs',
  '/login',
  '/register'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching for external APIs and non-GET requests
  if (request.method !== 'GET' || 
      url.hostname.includes('api.') ||
      url.hostname.includes('analytics') ||
      url.hostname.includes('gtm') ||
      url.hostname.includes('stripe')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Network request with cache fallback
        return fetch(request)
          .then((response) => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Determine cache strategy
            if (STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
                request.url.includes('.js') ||
                request.url.includes('.css') ||
                request.url.includes('.png') ||
                request.url.includes('.svg')) {
              // Cache static assets
              caches.open(STATIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            } else if (CACHE_ROUTES.some(route => url.pathname.includes(route))) {
              // Cache page routes
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed:', error);
            
            // Return offline fallback for navigation requests
            if (request.destination === 'document') {
              return caches.match('/');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for form submissions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    // Handle background sync tasks
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('Service Worker: Push notification received:', data);
    
    const options = {
      body: data.body,
      icon: '/logos/Atomik-favicon.png',
      badge: '/logos/Atomik-favicon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Details',
          icon: '/icons/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Loaded successfully');