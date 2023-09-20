sap.ui.define(['./BaseController'], (BaseController) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Home', {
		onInit() {
			this.registerIllustrationSet('tnt', 'sap/tnt/themes/base/illustrations');
		}
	});
});
