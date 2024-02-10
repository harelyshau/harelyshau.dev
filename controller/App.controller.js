sap.ui.define([
	'./BaseController',
	'../model/models',
	'../util/themeHelper',
	'../util/languageHelper',
	'sap/ui/core/ResizeHandler',
], (BaseController, models, themeHelper, languageHelper, ResizeHandler) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.App', {

		onInit() {
			this.addContentDensityClass(this.getView());
			this.setModel(models.createAppModel(), 'app');
			this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this))
				.attachTitleChanged(this.onTitleChanged.bind(this));
			themeHelper.attachChange(() => {
				this.setProperty('/theme', themeHelper.getTheme(), 'app');
			});
			this.attachToResize();
		},

		attachToResize() {
			ResizeHandler.register(
				this.getView(),
				() => this.setModel(models.createDeviceModel(), 'device')
			);
		},

		onRouteMatched(oEvent) {
			const sPage = oEvent.getParameter('config').target;
			this.setProperty('/page', sPage, 'app');
			this.byId('page').setSideExpanded(false);
		},

		onTitleChanged(oEvent) {
			document.title = oEvent.getParameter('title');
		},

		onSelectPage(oEvent) {
			this.getRouter().navTo(oEvent.getParameter('item').getKey());
		},

		onPressToggleTheme() {
			const sCurrentTheme = this.getProperty('/theme', 'app');
			const oOppositeThemes = { light: 'dark', dark: 'light' };
			const sTheme = oOppositeThemes[sCurrentTheme];
			themeHelper.setTheme(sTheme);
			this.setProperty('/theme', sTheme, 'app');
		},

		onSelectLanguage(oEvent) {
			languageHelper.setLanguage(oEvent.getParameter('item').getKey());
			// window.location.reload(); // need to refresh to change controls language
		},

		onPressToggleSideNavigation() {
			const oPage = this.byId('page');
			this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
		}

	});
});
