const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { resolve } = require('path');

// Configuration variables - adjust these for your site
const SITE_URL = 'https://atomiktrading.io';
const LAST_MOD_DATE = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

// Define your site's URLs with SEO-optimized priorities and change frequencies
const urls = [
  // Core pages - highest priority
  { url: '/', changefreq: 'monthly', priority: 1.0, lastmod: LAST_MOD_DATE },
  
  // Marketing & conversion pages - high priority
  { url: '/pricing', changefreq: 'monthly', priority: 0.9, lastmod: LAST_MOD_DATE },
  { url: '/marketplace', changefreq: 'weekly', priority: 0.8, lastmod: LAST_MOD_DATE },
  
  // Information pages - medium priority
  { url: '/features', changefreq: 'monthly', priority: 0.7, lastmod: LAST_MOD_DATE },
  { url: '/about', changefreq: 'monthly', priority: 0.6, lastmod: LAST_MOD_DATE },
  { url: '/contact', changefreq: 'monthly', priority: 0.6, lastmod: LAST_MOD_DATE },
  
  // Support & documentation - medium to lower priority
  { url: '/faq', changefreq: 'monthly', priority: 0.5, lastmod: LAST_MOD_DATE },
  { url: '/support', changefreq: 'monthly', priority: 0.5, lastmod: LAST_MOD_DATE },
  
  // Blog pages - if you have a blog
  { url: '/blog', changefreq: 'weekly', priority: 0.7, lastmod: LAST_MOD_DATE },
  // Add individual blog posts if you have them
  
  // Legal pages - lower priority but important for trust
  { url: '/terms', changefreq: 'monthly', priority: 0.3, lastmod: LAST_MOD_DATE },
  { url: '/privacy', changefreq: 'monthly', priority: 0.3, lastmod: LAST_MOD_DATE },
];

// Function to generate the sitemap
async function generateSitemap() {
  try {
    // Create a sitemap stream
    const smStream = new SitemapStream({ hostname: SITE_URL });
    
    // Create a write stream to save the sitemap to a file
    const writeStream = createWriteStream(resolve('./public/sitemap.xml'));
    
    // Pipe the sitemap to the file
    smStream.pipe(writeStream);
    
    // Add all URLs to the sitemap
    urls.forEach(url => smStream.write(url));
    
    // End the stream
    smStream.end();
    
    console.log(`✅ Sitemap generated successfully at ${new Date().toLocaleTimeString()}`);
    console.log(`📂 Location: public/sitemap.xml`);
    console.log(`🔗 Total URLs: ${urls.length}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

// Run the generator
generateSitemap();

// Log advice for next steps
console.log('\n--- After deployment, remember to: ---');
console.log('1. Submit your sitemap to Google Search Console');
console.log('2. Ensure robots.txt references your sitemap');
console.log('3. Verify the sitemap is accessible at', `${SITE_URL}/sitemap.xml`);