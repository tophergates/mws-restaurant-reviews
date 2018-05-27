const CACHE_NAME = 'restaurant-reviews-sw-v1';
const PREFETCH_CACHE = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/favicon.ico',
  '/css/style.min.css',
  '/js/app.min.js',
  '/js/home.min.js',
  '/js/restaurant.min.js',
  '/data/restaurants.json',
  'https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab',
];

/**
 * ServiceWorker install event
 * Occurs once during the installation of the ServiceWorker
 */
self.addEventListener('install', event => {
  /**
   * Open (or create) the cache with CACHE_NAME
   *  - then add the PREFETCH_CACHE files to it
   */
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(PREFETCH_CACHE);
      })
  );
});

/**
 * ServiceWorker install event
 * Occurs once after the install event
 */
self.addEventListener('activate', event => {
  /**
   * Locate all the caches by key
   *  - then filter the caches and delete any that do not match CACHE_NAME
   */
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
        );
      })
  );
});

/**
 * ServiceWorker fetch event
 * Occurs when a resource is being requested by the client
 */
self.addEventListener('fetch', event => {
  /**
   * Open the cache with CACHE_NAME
   *  - then look for the requested resource in the cache
   *    - then return the cached resource if found
   *      otherwise fetch the resource from the network
   *        - then put the fetched resource into the cache and return it
   */
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then(cache => {
          return cache.match(event.request)
            .then(response => {
              return response || fetch(event.request).then(networkResponse => {
                // Dont cache some resources from Google Maps,
                // or the cache will quickly fill up!
                if (!event.request.url.includes('maps/vt') &&
                    !event.request.url.includes('AuthenticationService.Authenticate') &&
                    !event.request.url.includes('QuotaService.RecordEvent') &&
                    !event.request.url.includes('ViewportInfoService.GetViewportInfo')) {
                  cache.put(event.request, networkResponse.clone());
                }

                return networkResponse;
              });
            });
        })
    );
  }
});