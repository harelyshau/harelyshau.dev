sap.ui.define(['sap/ui/core/Configuration'], (Configuration) => {
	'use strict';

	function getManifest() {
		const oComponent = sap.ui.getCore().getComponent('container-pharelyshau');
		return oComponent.getManifest();
	}

	function getCurrentLanguage() {
		return Configuration.getLanguage().slice(0, 2);
	}

	return {

		getLanguage() {
			return localStorage.getItem('language');
		},

		setLanguage(sLanguage) {
			if (sLanguage) localStorage.setItem('language', sLanguage);
			sLanguage = this.getSupportedLanguage(sLanguage);
			Configuration.setLanguage(sLanguage);
		},

		getFallBackLanguage() {
			return getManifest()['sap.app'].i18n.fallbackLocale;
		},

		getSupportedLanguages() {
			return getManifest()['sap.app'].i18n.supportedLocales;
		},

		getSupportedLanguage(sLanguage) {
			sLanguage ??= getCurrentLanguage();
			const bSupported = this.getSupportedLanguages().includes(sLanguage);
			return bSupported ? sLanguage : this.getFallBackLanguage();
		},

		initLanguage() {
			const sLanguage = this.getLanguage();
			this.setLanguage(sLanguage);
		}

	};
});
