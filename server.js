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

// Serve static files with improved caching strategy
app.use(express.static(path.join(__dirname, 'build'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // HTML files: no cache for HTML to ensure fresh content
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } 
    // JavaScript and CSS files: long-term caching with versioning in filename
    else if (filePath.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Images, fonts, and other media: aggressive caching
    else if (filePath.match(/\.(jpg|jpeg|png|gif|ico|svg|webp|avif|woff|woff2|ttf|otf|eot)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Everything else: moderate caching
    else {
      res.setHeader('Cache-Control', 'public, max-age=604800');
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