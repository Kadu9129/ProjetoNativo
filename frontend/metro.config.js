const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite uses a WebAssembly asset in the web worker.
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer, used by expo-sqlite on web, requires cross-origin isolation.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  return middleware(request, response, next);
};

module.exports = config;
