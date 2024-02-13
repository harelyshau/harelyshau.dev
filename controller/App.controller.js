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
			this.getRouter()
				.attachRouteMatched(this.onRouteMatched.bind(this))
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
			const { target } = oEvent.getParameter('config');
			this.setProperty('/page', target, 'app');
			this.byId('page').setSideExpanded(false);
		},

		onTitleChanged(oEvent) {
			document.title = oEvent.getParameter('title');
		},

		onSelectPage(oEvent) {
			const sPage = oEvent.getParameter('item').getKey();
			this.getRouter().navTo(sPage);
		},

		onPressToggleTheme() {
			const sCurrentTheme = themeHelper.getTheme()
			const oOppositeThemes = { light: 'dark', dark: 'light' };
			themeHelper.setTheme(oOppositeThemes[sCurrentTheme]);
		},

		onSelectLanguage(oEvent) {
			const sLanguage = oEvent.getParameter('item').getKey();
			languageHelper.setLanguage(sLanguage);
			// need to refresh to change controls language
			// window.location.reload(); 
		},

		onPressToggleSideNavigation() {
			const oPage = this.byId('page');
			this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
		}

	});
});
