
// Dynamically extract version from service worker URL query string (from app.js sw.js?v=...)
function getVersionFromUrl() {
  const match = self.location.search && self.location.search.match(/[?&]v=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : 'unknown';
}
self.APP_VERSION = getVersionFromUrl();

self.addEventListener('install', event => {
  console.log('Service worker installed, version:', self.APP_VERSION);
  // Optionally, clear old caches here if using caches
});

self.addEventListener('fetch', event => {
  // Let requests go through
});
