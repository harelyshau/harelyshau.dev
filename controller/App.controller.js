sap.ui.define(['./BaseController', '../model/models', '../util/themeHelper'],
(BaseController, models, themeHelper) => {
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
			document.title = oEvent.getParameter('title');
		},

		onSelectPage(oEvent) {
			this.getRouter().navTo(oEvent.getParameter('key'));
		},

		onPressToggleTheme() {
			const sCurrentTheme = this.getModel('app').getProperty('/theme');
			const oOppositeThemes = {light: 'dark', dark: 'light'};
			const sTheme = oOppositeThemes[sCurrentTheme];
			themeHelper.setTheme(sTheme);
			this.getModel('app').setProperty('/theme', sTheme);
		},

		onPressShowCode() {
			const sWebsiteURL = 'https://github.com/harelyshau/harelyshau.dev';
			sap.m.URLHelper.redirect(sWebsiteURL, true);
		},

		onPressGoHome() {
			this.getRouter().navTo('Home');
		},

		onPressOpenMobileMenu(oEvent) {
			this.openPopover('MobileMenu', oEvent.getSource(), null, true);
		}
	});
});
