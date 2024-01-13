sap.ui.define([
	'sap/base/i18n/Localization',
	'sap/ui/core/Component'
], (Localization, Component) => {
	'use strict';

	function getManifest() {
		const oComponent = Component.get('container-pharelyshau');
		return oComponent.getManifest();
	}

	function getCurrentLanguage() {
		return Localization.getLanguage().slice(0, 2);
	}

	return {
		getLanguage() {
			return localStorage.getItem('language');
		},

		setLanguage(sLanguage) {
			if (sLanguage) localStorage.setItem('language', sLanguage);
			sLanguage = this.getSupportedLanguage(sLanguage);
			Localization.setLanguage(sLanguage);
		},

		getFallBackLanguage() {
			return getManifest()['sap.app'].i18n.fallbackLocale;
		},

		getSupportedLanguages() {
			return getManifest()['sap.app'].i18n.supportedLocales;
		},

		getSupportedLanguage(sLanguage = getCurrentLanguage()) {
			const bSupported = this.getSupportedLanguages().includes(sLanguage);
			return bSupported ? sLanguage : this.getFallBackLanguage();
		},

		initLanguage() {
			const sLanguage = this.getLanguage();
			this.setLanguage(sLanguage);
		}
	};
});
