const VERSION = 'v1';
const RRCACHE = {
  name: `rr-${VERSION}`,

  // Cached during the activate event
  prefetch: [
    '/', '/index.html', '/restaurant.html',
    'favicon.ico', '/images/icons/favicon-32x32.png', '/images/icons/favicon-16x16.png',
    '/css/style.min.css',
    '/js/app.min.js', '/js/home.min.js', '/js/restaurant.min.js',
    '/data/restaurants.json',
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
    'https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab',
  ],

  // Acceptable to be cached once they are fetched
  whitelist: [
    // Maps
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/common.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/controls.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/infowindow.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/map.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/marker.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/stats.js',
    'https://maps.googleapis.com/maps-api-v3/api/js/33/1/util.js',
    'https://maps.googleapis.com/maps/api/js?key=AIzaSyCdhHwjurnlDda3XtpLrysWGsobzpRdpM8&callback=initMap',
    'https://maps.googleapis.com/maps/vt',
    'https://maps.gstatic.com/mapfiles/api-3/images/google4.png',
    'https://maps.gstatic.com/mapfiles/openhand_8_8.cur',
    'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2.png',
    'https://maps.gstatic.com/mapfiles/transparent.png',
  ]
};

/**
 * ServiceWorker install event
 * Occurs once during the installation of the ServiceWorker
 */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(RRCACHE.name)
      .then(cache => {
        return cache.addAll(RRCACHE.prefetch);
      })
  );
});

/**
 * ServiceWorker install event
 * Occurs once after the install event
 */
self.addEventListener('activate', event => {
  event.waitUntil(() => {
    caches.keys()
    .then(keys => {
      return Promise.all(
        keys
        .filter(k => k !== RRCACHE.name)
        .map(k => caches.delete(k))
      );
    });
    
    self.clients.claim()
  });
});

/**
 * ServiceWorker fetch event
 * Occurs when a resource is being requested by the client
 */
self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.open(RRCACHE.name)
        .then(cache => {
          return cache.match(event.request, {ignoreSearch: true})
            .then(response => {
              return response || fetch(event.request)
                .then(networkResponse => {
                  // Dont cache some resources from Google Maps,
                  // or the cache will quickly fill up!
                  if (RRCACHE.whitelist.includes(event.request.url)) {
                    cache.put(event.request, networkResponse.clone());
                  }

                  return networkResponse;
                })
                .catch(err => {
                  // Fallback
                  // TODO: Send an offline message to the client
                });
            });
        })
    );
  }
});