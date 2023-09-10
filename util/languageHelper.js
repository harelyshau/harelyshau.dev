sap.ui.define(['sap/ui/core/Configuration'], (Configuration) => {
	'use strict';

	return {
		getLanguage() {
			return localStorage.getItem('language');
		},

		setLanguage(sLanguage) {
			sLanguage
				? localStorage.setItem('language', sLanguage)
				: sLanguage = this.getCurrentLanguage();

			// check for supported languages
			if (!this.getSupportedLanguages().includes(sLanguage)) {
				sLanguage = this.getFallBackLanguage();
			}

			// apply language
			Configuration.setLanguage(sLanguage);
		},

		getCurrentLanguage() {
			return Configuration.getLanguage().slice(0, 2);
		},

		getFallBackLanguage() {
			const oManifest = sap.ui.getCore().getComponent('container-pharelyshau').getManifest();
			return oManifest['sap.app'].i18n.fallbackLocale;
		},

		getSupportedLanguages() {
			const oManifest = sap.ui.getCore().getComponent('container-pharelyshau').getManifest();
			return oManifest['sap.app'].i18n.supportedLocales;
		},

		initLanguage() {
			const sLanguage = this.getLanguage();
			this.setLanguage(sLanguage);
		}
	};
});
