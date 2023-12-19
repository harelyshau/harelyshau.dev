sap.ui.define(
	[
		'sap/ui/core/mvc/Controller',
		'sap/ui/core/UIComponent',
		'sap/ui/Device',
		'sap/m/MessageToast',
		'sap/m/IllustrationPool'
	],
	(Controller, UIComponent, Device, MessageToast, IllustrationPool) => {
		'use strict';

		return Controller.extend('pharelyshau.controller.BaseController', {
			// DEFAULT

			getRouter() {
				return UIComponent.getRouterFor(this);
			},

			getModel(sName) {
				return this.getView().getModel(sName);
			},

			setModel(oModel, sName) {
				return this.getView().setModel(oModel, sName);
			},

			i18n(sKey, aParams) {
				const oResourceBundle = this.getOwnerComponent().getModel('i18n').getResourceBundle();
				return oResourceBundle.getText(sKey, aParams);
			},

			getContentDensityClass() {
				return Device.support.touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact';
			},

			setBusy(bBusy) {
				this.getModel('view').setProperty('/busy', bBusy);
			},

			// Common Buttons

			onPressNavigateToPage(sPage) {
				this.getRouter().navTo(sPage);
			},

			onPressShowCode() {
				const sWebsiteURL = 'https://github.com/harelyshau/harelyshau.dev';
				sap.m.URLHelper.redirect(sWebsiteURL, true);
			},

			onPressSendEmail() {
				const sEmail = this.getModel()?.getProperty('/Email') ?? 'pavel@harelyshau.dev';
				sap.m.URLHelper.triggerEmail(sEmail, 'Email from harelyshau.dev website');
			},

			async copyToClipboard(sValueToCopy, sSuccessMessage, sErrorMessage) {
				try {
					await navigator.clipboard.writeText(sValueToCopy);
					MessageToast.show(sSuccessMessage ?? this.i18n('msgCopied'));
				} catch {
					MessageToast.show(sErrorMessage ?? this.i18n('msgNotCopied'));
				}
			},

			// MODAL WINDOWS
			async openDialog(sFragmentName, sBinndingPath) {
				const oDialog = await this.loadAndAssignFragment(sFragmentName);
				if (sBinndingPath) oDialog.bindElement(sBinndingPath);
				oDialog.open();
			},

			async openPopover(sFragmentName, oControl, sBinndingPath) {
				const oPopover = await this.loadAndAssignFragment(sFragmentName);
				if (this.isPopoverOpen(oPopover, sBinndingPath)) {
					oPopover.close();
					return;
				}
				if (sBinndingPath) oPopover.bindElement(sBinndingPath);
				oPopover.openBy(oControl);
			},

			async loadAndAssignFragment(sFragment) {
				const sPrefixFragment = `o${sFragment}`;
				const sCurrentPage = this.getModel('app').getProperty('/page');
				const sPath = `pharelyshau.fragment.${sCurrentPage}.${sFragment}`;
				this[sPrefixFragment] ??= this.loadFragment({ name: sPath });
				this[sPrefixFragment] = await this[sPrefixFragment];
				this[sPrefixFragment].addStyleClass(this.getContentDensityClass());
				return this[sPrefixFragment];
			},

			isPopoverOpen(oPopover, sBinndingPath) {
				const bSamePath = oPopover.getBindingContext()?.getPath() === sBinndingPath;
				const bOpen = oPopover.isOpen ? oPopover.isOpen() : false;
				return bOpen && bSamePath;
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
			}
		});
	}
);
