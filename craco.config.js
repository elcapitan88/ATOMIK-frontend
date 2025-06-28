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
    configure: (webpackConfig) => {
      // Only modify in production mode
      if (process.env.NODE_ENV === 'production') {
        // Find babel-loader more safely
        const loaders = webpackConfig.module.rules.find(rule => rule.oneOf)?.oneOf || [];
        
        // Update babel-loader config if found
        loaders.forEach(rule => {
          if (rule.loader && rule.loader.includes('babel-loader') && rule.options) {
            // Find preset-env
            const presetEnv = rule.options.presets?.find(
              preset => Array.isArray(preset) && preset[0]?.includes('preset-env')
            );
            
            // Update its configuration if found
            if (presetEnv && Array.isArray(presetEnv)) {
              presetEnv[1] = {
                ...presetEnv[1],
                targets: { esmodules: true },
                useBuiltIns: 'usage',
                corejs: 3
              };
            }
          }
        });
        
        // Optimize chunk splitting
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          maxInitialRequests: 30,
          maxAsyncRequests: 30,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              enforce: true,
            },
          },
        };
        
        // Enable tree shaking
        webpackConfig.optimization.usedExports = true;
        webpackConfig.optimization.providedExports = true;
        webpackConfig.optimization.sideEffects = false;
        
        // Bundle analyzer for development insights
        if (process.env.ANALYZE) {
          const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
          webpackConfig.plugins.push(new BundleAnalyzerPlugin());
        }
      }
      
      return webpackConfig;
    }
  }
};