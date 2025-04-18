const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const { resolve } = require('path');

// Updated to use the www subdomain as your canonical domain
const SITE_URL = 'https://www.atomiktrading.io';
const LAST_MOD_DATE = new Date().toISOString().split('T')[0];

// ONLY include pages that actually exist in your App.js routes and are publicly accessible
const urls = [
  // Core public pages from your actual routes
  { url: '/', changefreq: 'monthly', priority: 1.0, lastmod: LAST_MOD_DATE },
  { url: '/start', changefreq: 'monthly', priority: 0.9, lastmod: LAST_MOD_DATE },
  { url: '/pricing', changefreq: 'monthly', priority: 0.8, lastmod: LAST_MOD_DATE },
  
  // Add any other ACTUAL public pages here if you create them
];

// Rest of the function remains the same
async function generateSitemap() {
  try {
    const smStream = new SitemapStream({ hostname: SITE_URL });
    const writeStream = createWriteStream(resolve('./public/sitemap.xml'));
    smStream.pipe(writeStream);
    urls.forEach(url => smStream.write(url));
    smStream.end();
    
    console.log(`✅ Sitemap generated successfully at ${new Date().toLocaleTimeString()}`);
    console.log(`📂 Location: public/sitemap.xml`);
    console.log(`🔗 Total URLs: ${urls.length}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

generateSitemap();

console.log('\n--- After deployment, remember to: ---');
console.log('1. Submit your sitemap to Google Search Console');
console.log('2. Ensure robots.txt references your sitemap');
console.log('3. Verify the sitemap is accessible at', `${SITE_URL}/sitemap.xml`);