const CACHE_NAME = 'restaurant-reviews-sw-v3';
const PREFETCH_CACHE = [
  '/mws-restaurant-reviews/',
  '/mws-restaurant-reviews/restaurant.html',
  '/mws-restaurant-reviews/data/restaurants.json',
  '/mws-restaurant-reviews/css/style.min.css',
  '/mws-restaurant-reviews/js/app.min.js',
  '/mws-restaurant-reviews/js/home.min.js',
  '/mws-restaurant-reviews/js/restaurant.min.js',
  '/mws-restaurant-reviews/images/1.jpg',
  '/mws-restaurant-reviews/images/2.jpg',
  '/mws-restaurant-reviews/images/3.jpg',
  '/mws-restaurant-reviews/images/4.jpg',
  '/mws-restaurant-reviews/images/5.jpg',
  '/mws-restaurant-reviews/images/6.jpg',
  '/mws-restaurant-reviews/images/7.jpg',
  '/mws-restaurant-reviews/images/8.jpg',
  '/mws-restaurant-reviews/images/9.jpg',
  '/mws-restaurant-reviews/images/10.jpg',

  // Fonts
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  'https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab',
  'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
  'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2',

  // Google Maps
  'https://maps.gstatic.com/mapfiles/openhand_8_8.cur',
  'https://maps.gstatic.com/mapfiles/transparent.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/google4.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/sv9.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/cb_scout5.png',
  'https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl4.png',
  'https://maps.gstatic.com/mapfiles/mv/imgs8.png'
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
  if (event.request.method === 'GET' && location.protocol === 'https:') {
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