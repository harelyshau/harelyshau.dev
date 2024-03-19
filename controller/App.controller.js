sap.ui.define([
	'./BaseController',
	'../model/models',
	'../util/themeHelper',
	'../util/languageHelper'
], (BaseController, models, themeHelper, languageHelper) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.App', {

		onInit() {
			this.addContentDensityClass(this.getView());
			this.getRouter()
				.attachRouteMatched(this.onRouteMatched.bind(this))
				.attachTitleChanged(this.onTitleChanged.bind(this));
			themeHelper.attachChange(
				() => this.setProperty('/theme', themeHelper.getTheme(), 'app')
			);
			this.attachResize(
				() => this.setModel(models.createDeviceModel(), 'device')
			);
		},

		onRouteMatched(oEvent) {
			const { target, targetParent } = oEvent.getParameter('config');
			this.setProperty('/page', target, 'app');
			// TODO: get root (parent) target to show selectedKey for icon tab header
			const sRootPage = ['Minesweeper', 'HanoiTower', 'TicTacToe', 'Games']
				.includes(target) ? 'Games' : target;
			this.setProperty('/rootPage', sRootPage, 'app');
			this.byId('page').setSideExpanded(false);
			
		},

		onTitleChanged(oEvent) {
			document.title = oEvent.getParameter('title');
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
