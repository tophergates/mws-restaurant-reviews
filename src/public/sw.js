const VERSION = 'v5';
const RR_CACHE = {
  name: `rr-static-${VERSION}`,
 
  // IMPORTANT!!!
  // Because we are using webpack dev server, in development a 
  // style.min.css file is not generated. For this reason, it must
  // be left out of the prefetched cache files or the Service Worker 
  // will fail during the install step when in development.
  //
  // During development, comment it out and 
  // before building for production, simply uncomment that line.
  static: [
    '/',
    '/index.html',
    '/restaurant.html',
    '/favicon.ico',
    '/favicon-32x32.png',
    '/favicon-16x16.png',
    '/css/style.min.css',
    'https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab',
    '/js/app.min.js',
    '/js/home.min.js',
    '/js/restaurant.min.js',
    '/images/placeholder.png',
    '/images/1-small.jpg', '/images/1-medium.jpg', '/images/1-large.jpg',
    '/images/2-small.jpg', '/images/2-medium.jpg', '/images/2-large.jpg',
    '/images/3-small.jpg', '/images/3-medium.jpg', '/images/3-large.jpg',
    '/images/4-small.jpg', '/images/4-medium.jpg', '/images/4-large.jpg',
    '/images/5-small.jpg', '/images/5-medium.jpg', '/images/5-large.jpg',
    '/images/6-small.jpg', '/images/6-medium.jpg', '/images/6-large.jpg',
    '/images/7-small.jpg', '/images/7-medium.jpg', '/images/7-large.jpg',
    '/images/8-small.jpg', '/images/8-medium.jpg', '/images/8-large.jpg',
    '/images/9-small.jpg', '/images/9-medium.jpg', '/images/9-large.jpg',
    '/images/10-small.jpg', '/images/10-medium.jpg', '/images/10-large.jpg',
  ]
};
const MAP_CACHE = {
  name: `rr-maps-${VERSION}`,
  whitelist: [
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/common.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/util.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/map.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/marker.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/onion.js',
    'https://maps.gstatic.com/mapfiles/transparent.png',
    'https://maps.gstatic.com/mapfiles/',
  ]
};

// Trims the given cache down to maxItems
const trimCache = (cacheName, maxItems) => {
  caches.open(cacheName)
    .then(cache => {
      return cache.keys()
        .then(keys => {
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems));
          }
        });
    })
};

// Checks the cache first or returns the network
// response if not found
const cacheThenNetwork = (cacheName, request, { ignoreSearch, trim }) => {
  // Open the cache
  return caches.open(cacheName)
    .then(cache => {
      // Look for the requested resource in the cache
      return cache.match(request.url, { ignoreSearch })
        .then(cachedResponse => {
          // Return the cached response if found
          // otherwise fetch from the network
          return cachedResponse || fetch(request)
            .then(networkResponse => {
              // Check if we need to trim the cache
              // and do so if necessary
              if (trim && trim > 0) {
                trimCache(cacheName, trim);
                cache.put(request, networkResponse.clone());
              }

              // Add the network response to the cache and return it
              return networkResponse;
            })
            .catch(err => {
              // If the network request failed, we are probably
              // offline. TODO: Add a fallback strategy
            })
        })
    })
};

self.addEventListener('install', event => {
  console.log('[SW]: Installing...');
  event.waitUntil(
    caches.open(RR_CACHE.name)
      .then(cache => {
        return cache.addAll(RR_CACHE.static);
      })
      .catch(error => {
        console.error('Install failed', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(k => {
              return (
                k !== RR_CACHE.name && 
                k !== MAP_CACHE.name
              );
            })
            .map(k => caches.delete(k))
        );
      })
  );

  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  let cacheName = RR_CACHE.name;
  const options = { ignoreSearch: false, trim: 0 };

  if (MAP_CACHE.whitelist.includes(event.request.url)) {
    cacheName = MAP_CACHE.name;
    options.trim = 5;
  } else if (event.request.url.includes('/restaurant.html')) {
    options.ignoreSearch = true;
  }

  event.respondWith(
    cacheThenNetwork(cacheName, event.request, options)
  );
});