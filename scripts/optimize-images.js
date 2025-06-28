const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Image optimization configuration
const IMAGE_CONFIGS = {
  dashboard: {
    input: 'public/images/dashboard.png',
    sizes: [
      { width: 768, suffix: 'mobile' },    // Mobile
      { width: 1024, suffix: 'tablet' },   // Tablet  
      { width: 1745, suffix: 'desktop' }   // Desktop (original size)
    ],
    formats: ['webp', 'jpg']
  },
  logo: {
    input: 'public/logos/atomik-logo.svg',
    // SVG doesn't need optimization, but we'll keep reference
    skipOptimization: true
  }
};

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
}

async function optimizeImage(config) {
  if (config.skipOptimization) {
    console.log(`Skipping optimization for ${config.input}`);
    return;
  }

  const inputPath = path.join(__dirname, '..', config.input);
  const outputDir = path.dirname(inputPath);
  
  console.log(`\nOptimizing ${config.input}...`);

  try {
    // Check if input file exists
    await fs.access(inputPath);
    
    for (const format of config.formats) {
      for (const size of config.sizes) {
        const outputFilename = path.basename(config.input, path.extname(config.input)) 
          + `-${size.suffix}.${format}`;
        const outputPath = path.join(outputDir, outputFilename);

        try {
          // Create optimized image
          const pipeline = sharp(inputPath)
            .resize(size.width, null, {
              withoutEnlargement: true,
              fit: 'inside'
            });

          if (format === 'webp') {
            await pipeline
              .webp({ quality: 85, effort: 6 })
              .toFile(outputPath);
          } else if (format === 'jpg') {
            await pipeline
              .jpeg({ quality: 85, progressive: true })
              .toFile(outputPath);
          }

          const stats = await fs.stat(outputPath);
          const sizeInKB = (stats.size / 1024).toFixed(2);
          console.log(`✅ Created ${outputFilename} (${sizeInKB} KB)`);
        } catch (error) {
          console.error(`❌ Error creating ${outputFilename}:`, error.message);
        }
      }
    }

    // Also create a highly optimized preview for lazy loading
    const previewPath = path.join(
      outputDir, 
      path.basename(config.input, path.extname(config.input)) + '-preview.jpg'
    );
    
    await sharp(inputPath)
      .resize(50, null, { withoutEnlargement: true })
      .blur(10)
      .jpeg({ quality: 50 })
      .toFile(previewPath);
    
    console.log(`✅ Created preview image for lazy loading`);

  } catch (error) {
    console.error(`❌ Error processing ${config.input}:`, error.message);
  }
}

async function generateSizesAttribute() {
  console.log('\n📱 Responsive sizes attribute for <picture> element:');
  console.log('sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 1745px"');
}

async function main() {
  console.log('🖼️  Starting image optimization for Atomik Trading...\n');

  // Ensure sharp is installed
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ Sharp is not installed. Please run: npm install --save-dev sharp');
    process.exit(1);
  }

  // Optimize all configured images
  for (const [name, config] of Object.entries(IMAGE_CONFIGS)) {
    await optimizeImage(config);
  }

  // Generate helper information
  await generateSizesAttribute();

  console.log('\n✨ Image optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your Hero component to use the new responsive images');
  console.log('2. Test loading performance with Lighthouse');
  console.log('3. Consider implementing a CDN for even better performance');
}

// Run the optimization
main().catch(console.error);