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

		init(...aArguments) {
			UIComponent.prototype.init.apply(this, aArguments);
			this.getRouter().initialize();
			this.setModel(models.createDeviceModel(), 'device');
			languageHelper.initLanguage();
			themeHelper.initTheme();
			this.loadFioriIcons();
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
