// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      const addExcludeToSourceMapLoader = (rules) => {
        (rules || []).forEach(r => {
          const uses = r.use ? (Array.isArray(r.use) ? r.use : [r.use]) : [];
          if (uses.some(u => (u.loader || u).includes('source-map-loader'))) {
            r.exclude = [...(r.exclude || []), /node_modules\/html5-qrcode/];
          }
          if (Array.isArray(r.oneOf)) addExcludeToSourceMapLoader(r.oneOf);
          if (Array.isArray(r.rules)) addExcludeToSourceMapLoader(r.rules);
        });
      };
      addExcludeToSourceMapLoader(webpackConfig.module && webpackConfig.module.rules);
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        (warning) => {
          const msg = (warning && warning.message) || '';
          const res = warning && warning.module && warning.module.resource || '';
          return /Failed to parse source map/.test(msg) && /node_modules[\\/](html5-qrcode)/.test(res);
        }
      ];
      return webpackConfig;
    },
  },
};
