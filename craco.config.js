const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services'),
    },
    configure: (webpackConfig, { env, paths }) => {
      // Optimize bundle for modern browsers
      if (env === 'production') {
        // Target ES2017 features for modern browsers
        webpackConfig.module.rules[1].oneOf.forEach(rule => {
          if (rule.loader && rule.loader.includes('babel-loader') && rule.options) {
            // Update preset-env options
            rule.options.presets.forEach(preset => {
              if (Array.isArray(preset) && preset[0] && preset[0].includes('preset-env')) {
                // Modern browser targets
                preset[1].targets = {
                  esmodules: true
                };
                // Disable unnecessary polyfills
                preset[1].useBuiltIns = 'usage';
                preset[1].corejs = 3;
              }
            });
          }
        });
        
        // Optimize chunks
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          automaticNameDelimiter: '~',
          cacheGroups: {
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        };
      }
      
      return webpackConfig;
    },
  }
};