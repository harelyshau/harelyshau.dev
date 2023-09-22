sap.ui.define(
	['./BaseController', '../model/models', '../util/themeHelper', '../util/languageHelper'],
	(BaseController, models, themeHelper, languageHelper) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.App', {
			onInit() {
				this.getView().addStyleClass(this.getContentDensityClass());
				this.setModel(models.createAppModel(), 'app');
				this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this));
				this.getRouter().attachTitleChanged(this.onTitleChanged.bind(this));
			},

			onRouteMatched(oEvent) {
				const sPage = oEvent.getParameter('name');
				this.getModel('app').setProperty('/page', sPage);
				this.byId('page').setSideExpanded(false);
			},

			onTitleChanged(oEvent) {
				document.title = oEvent.getParameter('title');
			},

			onSelectPage(oEvent) {
				this.getRouter().navTo(oEvent.getParameter('item').getKey());
			},

			onPressToggleTheme() {
				const sCurrentTheme = this.getModel('app').getProperty('/theme');
				const oOppositeThemes = { light: 'dark', dark: 'light' };
				const sTheme = oOppositeThemes[sCurrentTheme];
				themeHelper.setTheme(sTheme);
				this.getModel('app').setProperty('/theme', sTheme);
			},

			onSelectLanguage(oEvent) {
				languageHelper.setLanguage(oEvent.getParameter('item').getKey());
				window.location.reload(); // need to refresh to change controls language
			},

			onPressToggleSideNavigation() {
				const oPage = this.byId('page');
				this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
			}
		});
	}
);
