sap.ui.define(['sap/ui/core/Theming'], (Theming) => {
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

	function getLightMedia() {
		return matchMedia('(prefers-color-scheme: light)');
	}

	return {
		getTheme() {
			return localStorage.getItem('theme');
		},

		setTheme(sThemeKey) {
			if (sThemeKey) localStorage.setItem('theme', sThemeKey);
			else {
				localStorage.removeItem('theme');
				sThemeKey = getLightMedia().matches ? 'light' : 'dark';
			}

			Theming.setTheme(this.mapTheme(sThemeKey));
			setThemeColor(sThemeKey);
		},

		mapTheme(sKey) {
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
			return aThemeKeys.find((sKey) => oThemes[sKey] === Theming.getTheme());
		},

		initTheme() {
			const changeTheme = () => this.setTheme(this.getTheme());
			getLightMedia().addEventListener('change', changeTheme);
			changeTheme();
		}
	};
});
