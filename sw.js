const staticCacheKey = 'static-ph-v0.0.0';
const dynamicCacheKey = 'dynamic-ph-v0.0.0';

const preloadResources = [
	// core
	'index.html',
	'Component-preload.js',
	'/css/style.css',
	// images
	'/resource/image/EPAMLogo.jpg',
	'/resource/image/JETBILogo.jpg',
	'/resource/image/WLNCLogo.jpg',
	'/resource/image/MRCLogo.jpg',
	'/resource/image/School33Logo.jpg',
	// data
	'/resource/data/Resume_en.json',
	'/resource/data/Resume_de.json',
	'/resource/data/Resume_ru.json'
];

self.addEventListener('install', async () => {
	const cache = await caches.open(staticCacheKey);
	await cache.addAll(preloadResources);
});

self.addEventListener('activate', async () => {
	const cacheKeys = await caches.keys();
	await Promise.all(
		cacheKeys
			.filter((key) => ![staticCacheKey, dynamicCacheKey].includes(key))
			.map((key) => caches.delete(key))
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	if (url.origin === location.origin) {
		event.respondWith(cacheFirst(request));
	} else {
		event.respondWith(networkFirst(request));
	}
});

async function cacheFirst(request) {
	const cached = await caches.match(request);
	return cached ?? await fetch(request);
}

async function networkFirst(request) {
	const cache = await caches.open(dynamicCacheKey);
	try {
		const response = await fetch(request);
		if (request.method !== 'POST') await cache.put(request, response.clone());
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		return cached ?? console.error('You are offline', error);
	}
}
