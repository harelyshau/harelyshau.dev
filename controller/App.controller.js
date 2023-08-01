sap.ui.define(['./BaseController', '../model/models'], (BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.App', {
		onInit() {
			// apply content density mode to root view
			this.getView().addStyleClass(this.getContentDensityClass());
			// set view model
			this.setModel(models.createAppModel(), 'app');
			// attach routing matching
			this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this));
		},

		onRouteMatched(oEvent) {
			// set current page
			this.getModel('app').setProperty('/page', oEvent.getParameter('name'));
		}
	});
});
