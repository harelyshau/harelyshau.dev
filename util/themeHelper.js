sap.ui.define([], () => {
	'use strict';

	function setThemeColor(sThemeKey) {
		const oColors = {
			light: '#eaecee',
			dark: '#0a0d10',
			hcw: '#fff',
			hcb: '#000'
		};
		document.querySelector('meta[name="theme-color"]').content = oColors[sThemeKey];
	}

	return {

		getTheme() {
			return localStorage.getItem('theme');
		},

		setTheme(sThemeKey) {
			if (sThemeKey) localStorage.setItem('theme', sThemeKey);
			else {
				localStorage.removeItem('theme');
				const bLight = window.matchMedia('(prefers-color-scheme: light)').matches;
				sThemeKey = bLight ? 'light' : 'dark';
			}

			sap.ui.getCore().applyTheme(this.mapTheme(sThemeKey));
			setThemeColor(sThemeKey);
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
			this.setTheme(this.getTheme());
		}
	};
});
