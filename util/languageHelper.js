sap.ui.define([
	'sap/base/i18n/Localization',
	'sap/ui/core/Component'
], (Localization, Component) => {
	'use strict';

	return {

		getLanguage() {
			const oI18n = Component.get('container-pharelyshau')
				.getManifest()['sap.app'].i18n;
			const sCurLanguage = Localization.getLanguage().slice(0, 2);
			const sLanguage = oI18n.supportedLocales.includes(sCurLanguage)
				? sCurLanguage : oI18n.fallbackLocale;
			return localStorage.getItem('language') ?? sLanguage;
		},

		setLanguage(sLanguage) {
			if (sLanguage) localStorage.setItem('language', sLanguage);
			Localization.setLanguage(this.getLanguage());
		},

		initLanguage() {
			this.setLanguage();
		},

		attachChange(fnFunction) {
			Localization.attachChange(fnFunction);
		}

	};
});
