sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/UIComponent',
	'sap/m/MessageToast',
	'sap/m/IllustrationPool',
	'sap/ui/core/ResizeHandler',
	'sap/ui/util/Storage',
	'../util/languageHelper'
], (
	Controller,
	UIComponent,
	MessageToast,
	IllustrationPool,
	ResizeHandler,
	Storage,
	languageHelper
) => {
	'use strict';

	return Controller.extend('pharelyshau.controller.BaseController', {

		// Attaching to events

		attachRouteMatched(fnCallback, sRoute) {
			const oRouter = this.getRouter();
			const oRoute = sRoute
				? oRouter.getRoute(sRoute)
				: oRouter.getRouteByHash(oRouter.getHashChanger().getHash());
			oRoute.attachPatternMatched(fnCallback, this);
		},

		attachResize(fnFunction) {
			ResizeHandler.register(this.getView(), fnFunction);
		},

		attachLanguageChange(fnFunction) {
			languageHelper.attachChange(fnFunction.bind(this));
		},

		// localStorage

		getStorage(sPrefix) {
			const { page } = this.getProperty('/', 'app');
			sPrefix ??= `${page[0].toLowerCase()}${page.slice(1)}`;
			return new Storage(Storage.Type.local, sPrefix)
		},

		getStorageItem(sKey, sPrefix) {
			return this.getStorage(sPrefix).get(sKey);
		},

		setStorageItem(sKey, vValue) {
			this.getStorage().put(sKey, vValue);
		},

		// Model and properties

		getModel(sName) {
			return this.getView().getModel(sName) ??
				this.getOwnerComponent().getModel(sName);
		},

		setModel(oModel, sName, bGlobal) {
			return this[bGlobal ? 'getOwnerComponent' : 'getView']()
				.setModel(oModel, sName);
		},

		getProperty(sPath, sModel) {
			return this.getModel(sModel).getProperty(sPath);
		},

		setProperty(sPath, oValue, sModel, bSync) {
			return this.getModel(sModel).setProperty(sPath, oValue, null, !bSync);
		},

		refreshModel() {
			this.getModel().refresh(true);
		},

		i18n(sKey, aParams) {
			const oI18nModel = this.getOwnerComponent().getModel('i18n');
			return oI18nModel.getResourceBundle().getText(sKey, aParams);
		},

		addContentDensityClass(oControl) {
			const { touch } = this.getProperty('/support', 'device');
			oControl.addStyleClass(touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact');
		},

		setBusy(bBusy) {
			this.setProperty('/busy', bBusy, 'view');
		},

		// Routing and navigation

		getRouter() {
			return UIComponent.getRouterFor(this);
		},

		navigateTo(sPage, oParams) {
			this.getRouter().navTo(sPage, oParams);
		},

		openLink(sLink) {
			sap.m.URLHelper.redirect(sLink, true);
		},

		onPressShowCode() {
			this.openLink('https://github.com/harelyshau/harelyshau.dev');
		},

		triggerEmail(sSubject, sBody) {
			const sEmail = 'pavel@harelyshau.dev';
			sSubject ||= 'Email from harelyshau.dev website';
			sap.m.URLHelper.triggerEmail(sEmail, sSubject, sBody);
		},

		onPressCloseModalWindow(oEvent) {
			const oParent = oEvent.getSource().getParent();
			oParent.close?.() ?? oParent.getParent().close();
		},

		onSelectNavigateToPage(oEvent) {
			const sPage = oEvent.getParameter('item').getKey();
			this.navigateTo(sPage);
		},

		async copyToClipboard(sValueToCopy) {
			try {
				await navigator.clipboard.writeText(sValueToCopy);
				MessageToast.show(this.i18n('msgCopied'));
			} catch {
				MessageToast.show(this.i18n('msgNotCopied'));
			}
		},

		// MODAL WINDOWS

		async openDialog(sFragmentName, sBinndingPath) {
			const oDialog = await this.loadAndAssignFragment(sFragmentName);
			if (sBinndingPath) oDialog.bindElement(sBinndingPath);
			return oDialog.open();
		},

		async openPopover(sFragmentName, oControl, sBinndingPath) {
			const oPopover = await this.loadAndAssignFragment(sFragmentName);
			if (this.isPopoverOpen(oPopover, sBinndingPath)) return oPopover.close();
			if (sBinndingPath) oPopover.bindElement(sBinndingPath);
			return oPopover.openBy(oControl);
		},

		async loadAndAssignFragment(sFragment) {
			const sPrefixFragment = `o${sFragment}`;
			const { page } = this.getProperty('/', 'app');
			const name = `pharelyshau.fragment.${page}.${sFragment}`;
			this[sPrefixFragment] ??= this.loadFragment({ name });
			this[sPrefixFragment] = await this[sPrefixFragment];
			this.addContentDensityClass(this[sPrefixFragment]);
			return this[sPrefixFragment];
		},

		isPopoverOpen(oPopover, sBinndingPath) {
			const bSamePath = oPopover.getBindingContext()?.getPath() === sBinndingPath;
			const bOpen = oPopover.isOpen ? oPopover.isOpen() : false;
			return bOpen && bSamePath;
		},

		onPressToggleSideNavigation(sModel) {
			const { phone } = this.getProperty('/system', 'device');
			const { rootPage } = this.getProperty('/', 'app');
			const sPage = rootPage === 'Games' ? rootPage.slice(0, -1) : rootPage;
			const oPage = this.getElementById(`${phone ? 'app' : sPage}--page`);
			const oSideNavigation = this.getElementById(`${sPage}--sideNavigation`);
			const bExpanded = this.toggleSideNavigation(oPage, oSideNavigation);
			this.setProperty('/sideExpanded', bExpanded, sModel);
		},

		toggleSideNavigation(oPage, oSideNavigation) {
			let bExpanded = oPage.getSideExpanded();
			const bSame = oPage.getSideContent() === oSideNavigation;
			if (oSideNavigation && !bSame) {
				oPage.setSideContent(oSideNavigation);
				bExpanded = false;
			}

			setTimeout(() => oPage.setSideExpanded(!bExpanded));
			return !bExpanded;
		},

		preventSelection(oEvent, sKey) {
			queueMicrotask(() => oEvent.getSource().setSelectedKey(sKey));
		},

		// Get Object

		getObjectByEvent(oEvent, sModel) {
			return this.getObjectByControl(oEvent.getSource(), sModel);
		},

		getObjectByControl(oControl, sModel) {
			return oControl.getBindingContext(sModel).getObject();
		},

		// Get Path

		getPathByEvent(oEvent, sModel) {
			return this.getPathByControl(oEvent.getSource(), sModel);
		},

		getPathByControl(oControl, sModel) {
			return oControl.getBindingContext(sModel).getPath();
		},

		// Illustrations

		registerIllustrationSet(setFamily, sSetPath) {
			const setURI = sap.ui.require.toUrl(sSetPath);
			const oIllustrationSet = { setFamily, setURI };
			IllustrationPool.registerIllustrationSet(oIllustrationSet, false);
		},

		// Inputs

		isInputFilledAndValid(oInput) {
			const bValid = oInput.getValueState() !== 'Error';
			const bFilled = !!oInput.getValue();
			return bValid && bFilled;
		},

		getElementById(sId) {
			const sFullId = this.getOwnerComponent().createId(sId);
			return sap.ui.core.Element.getElementById(sFullId);
		}

	});
});
