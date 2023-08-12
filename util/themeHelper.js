sap.ui.define([], () => {
	'use strict';

	return {
		getTheme() {
			return localStorage.getItem('theme');
		},

		setTheme(sThemeKey) {
			if (sThemeKey) {
				localStorage.setItem('theme', sThemeKey);
			} else {
				localStorage.removeItem('theme');
				const bLight = window.matchMedia('(prefers-color-scheme: light)').matches;
				sThemeKey = bLight ? 'light' : 'dark';
			}

			sap.ui.getCore().applyTheme(this.mapTheme(sThemeKey));
			this.setAppleStatusBarStyle(sThemeKey);
		},

		mapTheme(sKey, sValue) {
			const oThemes = {
				light: 'sap_horizon',
				dark: 'sap_horizon_dark',
				hcw: 'sap_horizon_hcw',
				hcb: 'sap_horizon_hcb'
			};
			// return value by key
			if (sKey) return oThemes[sKey];
			// return key by value
			const aThemeKeys = Object.keys(oThemes);
			if (sValue) return aThemeKeys.find((sThemeKey) => oThemes[sThemeKey] === sValue);
		},

		initTheme() {
			const sTheme = this.getTheme();
			this.setTheme(this.getTheme());
		},

		setAppleStatusBarStyle(sThemeKey) {
			const bDark = sThemeKey === 'dark' || sThemeKey === 'hcb'
			const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
			meta.content = bDark ? 'black-translucent' : 'default';
		}
	};
});
