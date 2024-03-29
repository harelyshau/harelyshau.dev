sap.ui.define(['sap/ui/core/Theming'], (Theming) => {
	'use strict';

	const oLightMedia = matchMedia('(prefers-color-scheme: light)');

	function setThemeColor(sTheme) {
		const oColors = { light: '#eaecee', dark: '#0a0d10' };
		document.querySelector('meta[name="theme-color"]').content = oColors[sTheme];
	}

	function getThemeSAP(sTheme) {
		const oThemes = { light: 'sap_horizon', dark: 'sap_horizon_dark' };
		return oThemes[sTheme];
	}

	function setThemeClass(sTheme) {
		const oClassList = document.documentElement.classList;
		const sPrevThemeClass = oClassList.value.split(' ')
			.find(sClass => sClass.startsWith('ph_'));
		const sNewThemeClass = `ph_${sTheme}`;
		sPrevThemeClass 
			? oClassList.replace(sPrevThemeClass, sNewThemeClass)
			: oClassList.add(sNewThemeClass);
	}

	return {

		getTheme() {
			const sTheme = oLightMedia.matches ? 'light' : 'dark';
			return localStorage.getItem('theme') ?? sTheme;
		},

		setTheme(sTheme) {
			if (sTheme) localStorage.setItem('theme', sTheme);
			sTheme = this.getTheme();
			Theming.setTheme(getThemeSAP(sTheme));
			setThemeColor(sTheme);
			setThemeClass(sTheme);
		},

		initTheme() {
			this.setTheme();
			oLightMedia.addEventListener('change', () => this.setTheme());
		},

		attachChange(fnFunction) {
			Theming.attachApplied(fnFunction);
		}

	};
});
