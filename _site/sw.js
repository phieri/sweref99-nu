// Service Worker för SWEREF 99 TM PWA
// Hanterar offline-caching av alla nödvändiga resurser

const CACHE_VERSION = '27';
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
const PRECACHED_ASSET_PATHS = new Set(ASSETS_TO_CACHE);

function createTextResponse(message, status) {
	return new Response(message, {
		status,
		statusText: status === 503 ? 'Service Unavailable' : 'Internal Server Error',
		headers: new Headers({
			'Content-Type': 'text/plain; charset=utf-8'
		})
	});
}

function shouldHandleRequest(request) {
	if (request.method !== 'GET') {
		return false;
	}

	const url = new URL(request.url);
	return url.protocol === 'http:' || url.protocol === 'https:';
}

function shouldCacheResponse(request) {
	const url = new URL(request.url);
	return url.origin === self.location.origin && PRECACHED_ASSET_PATHS.has(url.pathname);
}

async function getOfflineFallback(request) {
	if (request.headers.get('accept')?.includes('text/html')) {
		const fallbackResponse = await caches.match('/index.html');
		if (fallbackResponse) {
			return fallbackResponse;
		}
	}

	return createTextResponse('Offline och resurs saknas i cache', 503);
}

async function cacheResponse(request, response) {
	if (!response.ok || !shouldCacheResponse(request)) {
		return response;
	}

	try {
		const cache = await caches.open(CACHE_NAME);
		await cache.put(request, response.clone());
	} catch (error) {
		console.warn('ServiceWorker: Kunde inte cacha resurs:', error);
	}

	return response;
}

async function handleRequest(request) {
	const cachedResponse = await caches.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		const response = await fetch(request);
		return cacheResponse(request, response);
	} catch (error) {
		console.error('ServiceWorker: Fetch misslyckades:', error);
		return getOfflineFallback(request);
	}
}

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
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => {
							console.log('ServiceWorker: Tar bort gammal cache:', cacheName);
							return caches.delete(cacheName);
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
	if (!shouldHandleRequest(event.request)) {
		return;
	}

	event.respondWith(
		handleRequest(event.request)
			.catch((error) => {
				console.error('ServiceWorker: Cache match misslyckades:', error);
				return createTextResponse('Cache-fel', 500);
			})
	);
});
