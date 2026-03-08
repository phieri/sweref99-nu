// Service Worker för SWEREF 99 TM PWA
// Hanterar offline-caching av alla nödvändiga resurser

const CACHE_VERSION = '25';
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
			.catch((error) => {
				console.error('ServiceWorker: Install misslyckades:', error);
				throw error;
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
			.catch((error) => {
				console.error('ServiceWorker: Activate misslyckades:', error);
			})
	);
});

// Fetch event - svara från cache först, fallback till nätverk
self.addEventListener('fetch', (event) => {
	// Hoppa över icke-HTTP(S) requests
	if (!event.request.url.startsWith('http')) {
		return;
	}

	event.respondWith(
		caches.match(event.request)
			.then((cachedResponse) => {
				// Returnera cachad resurs om den finns
				if (cachedResponse) {
					return cachedResponse;
				}
				
				// Annars hämta från nätverket
				return fetch(event.request)
					.then((response) => {
						// Kontrollera om vi fick ett giltigt svar
						// Om svaret är ogiltigt eller ett fel (4xx, 5xx), returnera det utan att cacha
						if (!response || !response.ok) {
							return response;
						}
						
						// Cacha endast GET-requests
						if (event.request.method !== 'GET') {
							return response;
						}
						
						// Cacha endast same-origin (basic) och CORS requests
						if (response.type !== 'basic' && response.type !== 'cors') {
							return response;
						}
						
						// Klona svaret eftersom det kan bara användas en gång
						const responseToCache = response.clone();
						
						// Cacha nya resurser dynamiskt
						caches.open(CACHE_NAME)
							.then((cache) => {
								cache.put(event.request, responseToCache);
							})
							.catch((error) => {
								console.warn('ServiceWorker: Kunde inte cacha resurs:', error);
							});
						
						return response;
					})
					.catch((error) => {
						// Om både cache och nätverk misslyckas
						console.error('ServiceWorker: Fetch misslyckades:', error);
						
						// Returnera fallback för HTML-sidor
						if (event.request.headers.get('accept')?.includes('text/html')) {
							// Försök returnera index.html från cache
							return caches.match('/index.html').then((fallbackResponse) => {
								if (fallbackResponse) {
									return fallbackResponse;
								}
								// Om inte ens index.html finns i cache, returnera ett felmeddelande
								return new Response('Offline och resurs saknas i cache', {
									status: 503,
									statusText: 'Service Unavailable',
									headers: new Headers({
										'Content-Type': 'text/plain'
									})
								});
							});
						}
						
						// För andra resurser, returnera felmeddelande
						return new Response('Offline och resurs saknas i cache', {
							status: 503,
							statusText: 'Service Unavailable',
							headers: new Headers({
								'Content-Type': 'text/plain'
							})
						});
					});
			})
			.catch((error) => {
				console.error('ServiceWorker: Cache match misslyckades:', error);
				return new Response('Cache-fel', {
					status: 500,
					statusText: 'Internal Server Error',
					headers: new Headers({
						'Content-Type': 'text/plain'
					})
				});
			})
	);
});
