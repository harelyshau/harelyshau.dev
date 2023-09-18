sap.ui.define(['./BaseController', 'sap/m/IllustrationPool'], (BaseController, IllustrationPool) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Home', {
		onInit() {
			// register tnt illustration set
			this.registerIllustrationSet('tnt', 'sap/tnt/themes/base/illustrations');
		},

		registerIllustrationSet(sSetFamily, sSetPath) {
			const oTntSet = {
				setFamily: sSetFamily,
				setURI: sap.ui.require.toUrl(sSetPath)
			};

			IllustrationPool.registerIllustrationSet(oTntSet, false);
		}
	});
});
