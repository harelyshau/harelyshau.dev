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
		},

		mapTheme(sKey, sValue) {
			const oThemes = {
				light: 'sap_horizon',
				dark: 'sap_horizon_dark',
				contrastWhite: 'sap_horizon_hcw',
				contrastBlack: 'sap_horizon_hcb'
			};
			if (sKey) {
				// return value by key
				return oThemes[sKey];
			} else if (sValue) {
				// return key by value
				return Object.keys(oThemes).find((sThemeKey) => oThemes[sThemeKey] === sValue);
			}
		},

		initTheme() {
			const sTheme = this.getTheme();
			this.setTheme(this.getTheme());
		}
	};
});
