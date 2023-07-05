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
				// enable routing
				this.getRouter().initialize();
				// set the device model
				this.setModel(models.createDeviceModel(), 'device');
				//init chosen language
				languageHelper.initLanguage();
				//init chosen theme
				themeHelper.initTheme();
			},

			destroy() {
				// call the base component's destroy function
				UIComponent.prototype.destroy.apply(this, arguments);
			}
		});
	}
);
