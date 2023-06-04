sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/Fragment",
	"../util/themeHelper",
	"../util/languageHelper"
], function (Controller, UIComponent, Fragment, themeHelper, languageHelper) {
	"use strict";

	return Controller.extend("pharelyshau.controller.BaseController", {

		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		// HEADER
		onPressSendEmail: function () {
			const sEmail = this.getModel("resume").getProperty("/Email");
			sap.m.URLHelper.triggerEmail(sEmail, "Email from harelyshau.dev website");
		},

		onPressOpenOverflowMenu: function (oEvent) {
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

		onPressTheme: function (sKey) {
			themeHelper.setTheme(sKey);
			this.getModel("appView").setProperty("/theme", sap.ui.core.Configuration.getTheme());
		},

		onPressLanguage: function (sKey) {
			languageHelper.setLanguage(sKey);
			// need to refresh to change controls language
			location.reload();
		},

		onPressShareLink: function () {
			const sLink = window.location.href;
			const oMessageToast = sap.m.MessageToast;
			navigator.clipboard.writeText(sLink).then(() => {
				oMessageToast.show(`Website URL "'${sLink}'" has been copied to clipboard`);
			}, (err) => {
				oMessageToast.show("Could not copy website URL");
			});
		},

		onPressShowCode: function() {
            const sWebsiteURL = "https://github.com/harelyshau/harelyshau.dev";
            sap.m.URLHelper.redirect(sWebsiteURL, true);
        },

		// Dialogs
        isOpenDialog: function (oDialog, sBinndingPath) {
            if (!oDialog) {
                return false;
            }

			const oBindingContext = oDialog.getBindingContext("resume");
            const bSamePath = sBinndingPath && oBindingContext ? oBindingContext.getPath() === sBinndingPath : true;
			const bOpen = oDialog.isOpen();
            return bOpen && bSamePath;
        }

	});

});