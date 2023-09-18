sap.ui.define(['sap/ui/core/Configuration'], (Configuration) => {
	'use strict';

	return {
		getLanguage() {
			return localStorage.getItem('language');
		},

		setLanguage(sLanguage) {
			sLanguage = this.getSupportedLanguage(sLanguage);
			localStorage.setItem('language', sLanguage);
			Configuration.setLanguage(sLanguage);
		},

		getCurrentLanguage() {
			return Configuration.getLanguage().slice(0, 2);
		},

		getFallBackLanguage() {
			return this.getManifest()['sap.app'].i18n.fallbackLocale;
		},

		getManifest() {
			const oComponent = sap.ui.getCore().getComponent('container-pharelyshau');
			return oComponent.getManifest()
		},

		getSupportedLanguages() {
			return this.getManifest()['sap.app'].i18n.supportedLocales;
		},

		getSupportedLanguage(sLanguage = this.getCurrentLanguage()) {
			const bSupported = this.getSupportedLanguages().includes(sLanguage);
			return bSupported ? sLanguage : this.getFallBackLanguage();
		},

		initLanguage() {
			const sLanguage = this.getLanguage();
			this.setLanguage(sLanguage);
		}
	};
});
