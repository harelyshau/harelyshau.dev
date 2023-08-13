const staticCacheKey = 'static-ph-v0.0.0';
const dynamicCacheKey = 'dynamic-ph-v0.0.0';

const preloadResources = [
	// core
	'../index.html',
	'../Component-preload.js',
	'../css/style.css',
	// images
	'../resource/image/EPAMLogo.jpg',
	'../resource/image/JETBILogo.jpg',
	'../resource/image/WLNCLogo.jpg',
	'../resource/image/MRCLogo.jpg',
	'../resource/image/School33Logo.jpg',
	// data
	'../resource/data/Resume_en.json',
	'../resource/data/Resume_de.json',
	'../resource/data/Resume_ru.json'
];

const openui5Link = 'https://openui5.hana.ondemand.com/resources/';
const openui5Resources = [
	`${openui5Link}sap-ui-core.js`,
	`${openui5Link}sap/ui/core/library-preload.js`,
	`${openui5Link}sap/ui/core/themes/sap_belize_plus/library.css`,
	`${openui5Link}sap/ui/core/themes/sap_horizon/fonts/SAP-icons.woff2`,
	`${openui5Link}sap/m/library-preload.js`,
	// illustrations
	`${openui5Link}sap/m/themes/base/illustrations/sapIllus-Patterns.svg`,
	`${openui5Link}sap/m/themes/base/illustrations/sapIllus-Spot-SimpleCalendar.svg`,
	`${openui5Link}sap/m/themes/base/illustrations/sapIllus-Spot-NoSavedItems.svg`,
	`${openui5Link}sap/tnt/themes/base/illustrations/tnt-Spot-Company.svg`,
	`${openui5Link}sap/tnt/themes/base/illustrations/tnt-Spot-Success.svg`,
	`${openui5Link}sap/tnt/themes/base/illustrations/tnt-Spot-Mission.svg`,
	// themes
	`${openui5Link}sap/m/themes/sap_horizon/library.css`,
	`${openui5Link}sap/m/themes/sap_horizon_dark/library.css`,
	`${openui5Link}sap/m/themes/sap_horizon_hcw/library.css`,
	`${openui5Link}sap/m/themes/sap_horizon_hcb/library.css`
];

preloadResources.push(...openui5Resources);

self.addEventListener('install', async (event) => {
	const cache = await caches.open(staticCacheKey);
	await cache.addAll(preloadResources);
});

self.addEventListener('activate', async (event) => {
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
	return cached ?? (await fetch(request));
}

async function networkFirst(request) {
	const cache = await caches.open(dynamicCacheKey);
	try {
		const response = await fetch(request);
		await cache.put(request, response.clone());
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		return cached ?? console.error('You are offline', error);
	}
}
