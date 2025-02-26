// Enhanced server.js for Railway deployment
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Add debug logging to trace requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files with caching disabled for HTML (important for SPAs)
app.use(express.static(path.join(__dirname, 'build'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // No cache for HTML files
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Cache for everything else
      res.setHeader('Cache-Control', 'max-age=31536000');
    }
  }
}));

// For API requests that should be proxied to your backend
app.use('/api', (req, res) => {
  res.redirect(`https://api.atomiktrading.io${req.url}`);
});

// Always return the main index.html for any route (SPA client-side routing)
app.get('*', (req, res) => {
  console.log(`[${new Date().toISOString()}] Serving index.html for: ${req.url}`);
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current directory: ${__dirname}`);
  console.log(`Build path: ${path.join(__dirname, 'build')}`);
});