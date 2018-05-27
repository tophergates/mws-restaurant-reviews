const CACHE_NAME="restaurant-reviews-sw-v1",PREFETCH_CACHE=["/","/index.html","/restaurant.html","/favicon.ico","/css/style.min.css","/js/app.min.js","/js/home.min.js","/js/restaurant.min.js","/data/restaurants.json","https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(PREFETCH_CACHE)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))}),self.addEventListener("fetch",e=>{"GET"===e.request.method&&e.respondWith(caches.open(CACHE_NAME).then(t=>t.match(e.request).then(s=>s||fetch(e.request).then(s=>(e.request.url.includes("maps/vt")||e.request.url.includes("AuthenticationService.Authenticate")||e.request.url.includes("QuotaService.RecordEvent")||e.request.url.includes("ViewportInfoService.GetViewportInfo")||t.put(e.request,s.clone()),s)))))});