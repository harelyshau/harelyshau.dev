sap.ui.define(
	[
		'sap/ui/core/mvc/Controller',
		'sap/ui/core/UIComponent',
		'sap/ui/Device',
		'sap/m/MessageToast',
		'sap/m/MessageBox',
		'sap/m/IllustrationPool'
	],
	(Controller, UIComponent, Device, MessageToast, MessageBox, IllustrationPool) => {
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

			getProperty(sPath, sModel) {
				return this.getModel(sModel).getProperty(sPath);
			},

			setProperty(sPath, oValue, sModel) {
				return this.getModel(sModel).setProperty(sPath, oValue, null, true);
			},

			i18n(sKey, aParams) {
				const oI18nModel = this.getOwnerComponent().getModel('i18n');
				return oI18nModel.getResourceBundle().getText(sKey, aParams);
			},

			getContentDensityClass() {
				return Device.support.touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact';
			},

			setBusy(bBusy) {
				this.getModel('view').setProperty('/busy', bBusy);
			},

			// Common Buttons

			navigateTo(sPage) {
				this.getRouter().navTo(sPage);
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
				oParent.close ? oParent.close() : oParent.getParent().close();
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

			openConfirmationMessageBox(sMessage, fnCallbackOK, fnCallbackCancel) {
				MessageBox.confirm(sMessage, {
					onClose: (sAction) => sAction === 'OK' ? fnCallbackOK() : fnCallbackCancel()
				});
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

			// Timers

			attachTimer() {
				this.getView().addEventDelegate({
					onBeforeHide: this.stopTimer.bind(this),
					onBeforeShow: this.startTimer.bind(this)
				});
			},

			startTimer() {
				if (this.timerId || !this.isGameStarted()) return;
				let iTime = this.getModel().getProperty('/Time');
				this.timerId = setInterval(() => {
					this.getModel().setProperty('/Time', ++iTime);
				}, 1000);
			},

			stopTimer() {
				clearInterval(this.timerId);
				this.timerId = null;
			},

			// Inputs

			isInputFilledAndValid(oInput) {
				const bValid = oInput.getValueState() !== 'Error';
				const bFilled = oInput.getValue();
				return bValid && bFilled;
			}

		});
	}
);
