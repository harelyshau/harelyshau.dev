sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"../util/themeHelper",
	"../util/languageHelper"
], function (Controller, UIComponent, Fragment, themeHelper, languageHelper) {
	"use strict";

	return Controller.extend("pharelyshau.controller.BaseController", {

		getRouter() {
			return UIComponent.getRouterFor(this);
		},

		getModel(sName) {
			return this.getView().getModel(sName);
		},

		setModel(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		i18n(sKey) {
			return this.getResourceBundle().getText(sKey);
		},

		// HEADER
		onPressSendEmail() {
			const oModel = this.getModel();
			const sEmail = oModel.getProperty("/Email");
			sap.m.URLHelper.triggerEmail(sEmail, "Email from harelyshau.dev website");
		},

		onPressOpenOverflowMenu(oEvent) {
			const oButton = oEvent.getSource();

            if (!this._oOverflowMenu) {
                Fragment.load({
					name: "pharelyshau.fragment.OverflowMenu",
					controller: this
				}).then((oMenu) => {
					this.getView().addDependent(oMenu);
					this._oOverflowMenu = oMenu;
					oMenu.openBy(oButton);
					return oMenu;
				});
            } else {
                this._oOverflowMenu.openBy(oButton);
            }
        },

		onPressSetTheme(sKey) {
			themeHelper.setTheme(sKey);
			const sThemeKey = themeHelper.mapTheme(null, sap.ui.core.Configuration.getTheme());
			this.getModel("appView").setProperty("/theme", sThemeKey);
		},

		onPressSetLanguage(sKey) {
			languageHelper.setLanguage(sKey);
			// need to refresh to change controls language
			location.reload();
		},

		onPressShareLink() {
			const sLink = window.location.href;
			const oMessageToast = sap.m.MessageToast;
			navigator.clipboard.writeText(sLink).then(() => {
				oMessageToast.show(`Website URL "${sLink}" has been copied to clipboard`);
			}, (err) => {
				oMessageToast.show("Could not copy website URL");
			});
		},

		onPressShowCode() {
            const sWebsiteURL = "https://github.com/harelyshau/harelyshau.dev";
            sap.m.URLHelper.redirect(sWebsiteURL, true);
        },

		// Dialogs
        isOpenDialog(oDialog, sBinndingPath) {
            if (!oDialog) {
                return false;
            }

            const bSamePath = oDialog.getBindingContext()?.getPath() === sBinndingPath;
			const bOpen = oDialog.isOpen();
            return bOpen && bSamePath;
        }

	});

});