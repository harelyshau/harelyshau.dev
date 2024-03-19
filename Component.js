sap.ui.define([
	'sap/ui/core/UIComponent',
	'sap/ui/core/IconPool',
	'./model/models',
	'./util/themeHelper',
	'./util/languageHelper'
], function (UIComponent, IconPool, models, themeHelper, languageHelper) {
	'use strict';

	return UIComponent.extend('pharelyshau.Component', {
		metadata: {
			interfaces: ['sap.ui.core.IAsyncContentCreation'],
			manifest: 'json'
		},

		init() {
			UIComponent.prototype.init.call(this);
			languageHelper.initLanguage();
			themeHelper.initTheme();
			this.getRouter().initialize();
			this.loadFioriIcons();
			this.setModel(models.createDeviceModel(), 'device');
			this.setModel(models.createAppModel(), 'app');
		},

		loadFioriIcons() {
			const oFioriIconsFont = {
				fontFamily: 'SAP-icons-TNT',
				fontURI: sap.ui.require.toUrl('sap/tnt/themes/base/fonts/')
			};
			IconPool.registerFont(oFioriIconsFont);
		}

	});
});
