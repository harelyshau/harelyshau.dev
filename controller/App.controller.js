sap.ui.define([
	'./BaseController',
	'../model/models',
	'../util/themeHelper',
	'../util/languageHelper',
	'../util/notificationHelper'
], (BaseController, models, themeHelper, languageHelper, notificationHelper) => {
	'use strict';

	const { installEvent } = window.ph ?? {};

	return BaseController.extend('pharelyshau.controller.App', {

		onInit() {
			this.addContentDensityClass(this.getView());
			this.getRouter()
				.attachRouteMatched(this.onRouteMatched, this)
				.attachTitleChanged(this.onTitleChanged, this);
			themeHelper.attachChange(
				() => this.setProperty('/theme', themeHelper.getTheme(), 'app')
			);
			this.attachResize(
				() => this.setModel(models.createDeviceModel(), 'device')
			);
			this.setInstallButtonVisibility();
			window.addEventListener('appinstalled', () => this.onInstall());
			notificationHelper.subscribe()
				.then(() => sap.m.MessageBox.confirm('subscribed'))
				.catch((e) => sap.m.MessageBox.error(JSON.stringify(e)));
		},

		onRouteMatched(oEvent) {
			const { target } = oEvent.getParameter('config');
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
		},

		onPressToggleSideNavigation() {
			const oPage = this.byId('page');
			this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
		},

		async onPressInstallApp() {
			if (!installEvent) return;
			installEvent.prompt();
			const oRes = await installEvent.userChoice;
			if (oRes.outcome === 'accepted') this.onInstall();
		},

		async setInstallButtonVisibility() {
			const aApps = await navigator.getInstalledRelatedApps?.();
			(!aApps || aApps.length || !installEvent) && this.onInstall();
		},

		onInstall() {
			this.byId('btnInstall').setVisible(false);
			notificationHelper.subscribe();
		}

	});
});
