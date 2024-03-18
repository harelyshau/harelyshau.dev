sap.ui.define([
	'sap/ui/core/mvc/Controller',
	'sap/ui/core/UIComponent',
	'sap/ui/Device',
	'sap/m/MessageToast',
	'sap/m/IllustrationPool',
	'sap/ui/core/ResizeHandler',
	'../util/languageHelper'
], (
	Controller,
	UIComponent,
	Device,
	MessageToast,
	IllustrationPool,
	ResizeHandler,
	languageHelper
) => {
	'use strict';

	return Controller.extend('pharelyshau.controller.BaseController', {
		// DEFAULT

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

		getRouter() {
			return UIComponent.getRouterFor(this);
		},

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
			const bTouch = Device.support.touch;
			oControl.addStyleClass(bTouch ? 'sapUiSizeCozy' : 'sapUiSizeCompact');
		},

		setBusy(bBusy) {
			this.setProperty('/busy', bBusy, 'view');
		},

		// Common Buttons

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
			const sCurrentPage = this.getProperty('/page', 'app');
			const sPath = `pharelyshau.fragment.${sCurrentPage}.${sFragment}`;
			this[sPrefixFragment] ??= this.loadFragment({ name: sPath });
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
			const bPhone = this.getProperty('/system/phone', 'device');
			const sPage = this.getProperty('/rootPage', 'app');
			const sPrefix = this.getOwnerComponent().createId('');
			const getElementById = sap.ui.core.Element.getElementById;
			const oPage = getElementById(`${sPrefix}${bPhone ? 'app' : sPage}--page`);
			const oSideNavigation = getElementById(`${sPrefix}${sPage}--sideNavigation`);
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
		}

	});
});
