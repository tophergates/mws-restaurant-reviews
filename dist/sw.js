const CACHE_NAME="restaurant-reviews-sw-v2",PREFETCH_CACHE=["/","/restaurant.html","/data/restaurants.json","/css/style.min.css","/js/app.min.js","/js/home.min.js","/js/restaurant.min.js","/images/1.jpg","/images/2.jpg","/images/3.jpg","/images/4.jpg","/images/5.jpg","/images/6.jpg","/images/7.jpg","/images/8.jpg","/images/9.jpg","/images/10.jpg","https://fonts.googleapis.com/css?family=Roboto:300,400,500,700","https://fonts.googleapis.com/css?family=Montserrat|Noto+Sans|Roboto+Slab","https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2","https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2","https://maps.gstatic.com/mapfiles/openhand_8_8.cur","https://maps.gstatic.com/mapfiles/transparent.png","https://maps.gstatic.com/mapfiles/api-3/images/google4.png","https://maps.gstatic.com/mapfiles/api-3/images/mapcnt6.png","https://maps.gstatic.com/mapfiles/api-3/images/sv9.png","https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl.png","https://maps.gstatic.com/mapfiles/api-3/images/cb_scout5.png","https://maps.gstatic.com/mapfiles/api-3/images/tmapctrl4.png","https://maps.gstatic.com/mapfiles/mv/imgs8.png"];self.addEventListener("install",t=>{t.waitUntil(caches.open(CACHE_NAME).then(t=>t.addAll(PREFETCH_CACHE)))}),self.addEventListener("activate",t=>{t.waitUntil(caches.keys().then(t=>Promise.all(t.filter(t=>t!==CACHE_NAME).map(t=>caches.delete(t)))))}),self.addEventListener("fetch",t=>{"GET"===t.request.method&&t.respondWith(caches.open(CACHE_NAME).then(s=>s.match(t.request).then(e=>e||fetch(t.request).then(e=>(t.request.url.includes("maps/vt")||t.request.url.includes("AuthenticationService.Authenticate")||t.request.url.includes("QuotaService.RecordEvent")||t.request.url.includes("ViewportInfoService.GetViewportInfo")||s.put(t.request,e.clone()),e)))))});