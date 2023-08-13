sap.ui.define(
	['sap/ui/core/UIComponent', './model/models', './util/themeHelper', './util/languageHelper'],
	function (UIComponent, models, themeHelper, languageHelper) {
		'use strict';

		return UIComponent.extend('pharelyshau.Component', {
			metadata: {
				interfaces: ['sap.ui.core.IAsyncContentCreation'],
				manifest: 'json'
			},

			init() {
				// call the base component's init function and create the App view
				UIComponent.prototype.init.apply(this, arguments);
				this.getRouter().initialize();
				this.setModel(models.createDeviceModel(), 'device');
				languageHelper.initLanguage();
				themeHelper.initTheme();
				this.registerServiceWorker();
			},

			destroy() {
				// call the base component's destroy function
				UIComponent.prototype.destroy.apply(this, arguments);
			},

			async registerServiceWorker() {
				if (navigator.serviceWorker) {
					navigator.serviceWorker.register('/util/serviceWorker.js');
				}
			}
		});
	}
);
