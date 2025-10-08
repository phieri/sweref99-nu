// Service Worker för SWEREF 99 TM PWA
// Hanterar offline-caching av alla nödvändiga resurser

const CACHE_VERSION = 'v10';
const CACHE_NAME = `sweref99-${CACHE_VERSION}`;

// Alla resurser som behövs för att appen ska fungera offline
const ASSETS_TO_CACHE = [
	'/',
	'/index.html',
	'/om.html',
	'/stil.css',
	'/pico.min.css',
	'/script.js',
	'/proj4.js',
	'/app.webmanifest',
	'/favicon.ico',
	'/icon-192.png',
	'/icon-512.png',
	'/apple-touch-icon.png'
];

// Install event - cacha alla resurser
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				console.log('ServiceWorker: Cachar resurser');
				return cache.addAll(ASSETS_TO_CACHE);
			})
			.then(() => {
				// Aktivera den nya service workern direkt
				return self.skipWaiting();
			})
	);
});

// Activate event - rensa gamla cachar
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log('ServiceWorker: Tar bort gammal cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				// Ta över alla öppna sidor direkt
				return self.clients.claim();
			})
	);
});

// Fetch event - svara från cache först, fallback till nätverk
self.addEventListener('fetch', (event) => {
	event.respondWith(
		caches.match(event.request)
			.then((response) => {
				// Returnera cachad resurs om den finns
				if (response) {
					return response;
				}
				
				// Annars hämta från nätverket
				return fetch(event.request)
					.then((response) => {
						// Kontrollera om vi fick ett giltigt svar
						if (!response || response.status !== 200 || response.type !== 'basic') {
							return response;
						}
						
						// Klona svaret eftersom det kan bara användas en gång
						const responseToCache = response.clone();
						
						// Cacha nya resurser dynamiskt
						caches.open(CACHE_NAME)
							.then((cache) => {
								cache.put(event.request, responseToCache);
							});
						
						return response;
					})
					.catch(() => {
						// Om både cache och nätverk misslyckas, returnera offline-sida
						// För denna app finns ingen dedikerad offline-sida, 
						// så vi returnerar bara ingenting
						console.log('ServiceWorker: Offline och resurs saknas i cache');
					});
			})
	);
});
