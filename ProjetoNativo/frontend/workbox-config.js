module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,json,ico,png,svg,ttf,woff,woff2}'],
  globIgnores: ['sw.js', 'workbox-*.js'],
  swDest: 'dist/sw.js',
  navigateFallback: '/index.html',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
};

