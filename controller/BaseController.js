sap.ui.define(
	[
		'sap/ui/core/mvc/Controller',
		'sap/ui/core/UIComponent',
		'sap/ui/Device',
		'sap/m/MessageToast',
		'../util/themeHelper',
		'../util/languageHelper'
	],
	(Controller, UIComponent, Device, MessageToast, themeHelper, languageHelper) => {
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

			// Common Buttons

			onPressNavigateToPage(sPage) {
				this.getRouter().navTo(sPage);
			},

			onPressSendEmail() {
				const sEmail = this.getModel()?.getProperty('/Email') ?? 'pavel@harelyshau.dev';
				sap.m.URLHelper.triggerEmail(sEmail, 'Email from harelyshau.dev website');
			},

			async onPressShareLink() {
				const sWebsiteURL = window.location.href;
				const sSuccessMessage = this.i18n('msgSiteUrlCopied', [sWebsiteURL]);
				const sErrorMessage = this.i18n('msgSiteUrlNotCopied');
				this.copyToClipboard(sWebsiteURL, sSuccessMessage, sErrorMessage);
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
			async openDialog(sFragmentName, sBinndingPath, bCommon) {
				const oDialog = await this.loadAndAssignFragment(sFragmentName, bCommon);
				if (sBinndingPath) oDialog.bindElement(sBinndingPath);
				oDialog.open();
			},

			async openPopover(sFragmentName, oControl, sBinndingPath, bCommon) {
				const oPopover = await this.loadAndAssignFragment(sFragmentName, bCommon);
				if (this.isPopoverOpen(oPopover, sBinndingPath)) {
					oPopover.close();
					return;
				}
				if (sBinndingPath) oPopover.bindElement(sBinndingPath);
				oPopover.openBy(oControl);
			},

			async loadAndAssignFragment(sFragment, bCommon) {
				let sPath = 'pharelyshau.fragment.';
				const sCurrentPage = this.getModel('app').getProperty('/page');
				sPath += !bCommon ? `${sCurrentPage}.${sFragment}` : sFragment;
				this['o' + sFragment] ??= this.loadFragment({ name: sPath });
				this['o' + sFragment] = await this['o' + sFragment];
				this['o' + sFragment].addStyleClass(this.getContentDensityClass());
				return this['o' + sFragment];
			},

			isPopoverOpen(oPopover, sBinndingPath) {
				const bSamePath = oPopover.getBindingContext()?.getPath() === sBinndingPath;
				const bOpen = oPopover.isOpen ? oPopover.isOpen() : false;
				return bOpen && bSamePath;
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
			}
		});
	}
);
