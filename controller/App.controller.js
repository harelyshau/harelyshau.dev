sap.ui.define(['./BaseController', '../model/models'], (BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.App', {
		onInit() {
			this.getView().addStyleClass(this.getContentDensityClass());
			this.setModel(models.createAppModel(), 'app');
			this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this));
			this.getRouter().attachTitleChanged(this.onTitleChanged.bind(this));
		},

		onRouteMatched(oEvent) {
			this.getModel('app').setProperty('/page', oEvent.getParameter('name'));
		},

		onTitleChanged(oEvent) {
			document.title = oEvent.getParameter("title");
		}
	});
});
