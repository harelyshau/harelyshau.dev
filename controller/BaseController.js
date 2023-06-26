sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"../util/themeHelper",
	"../util/languageHelper"
], function (Controller, UIComponent, Device, themeHelper, languageHelper) {
	"use strict";

	return Controller.extend("pharelyshau.controller.BaseController", {

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

		getResourceBundle() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		i18n(sKey) {
			return this.getResourceBundle().getText(sKey);
		},

		getContentDensityClass() {
            return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
        },

		// MENU

		async onPressOpenOverflowMenu(oEvent) {
			const oButton = oEvent.getSource();

            if (!this.oOverflowMenu) {
                this.oOverflowMenu = await this.loadFragment({
					name: "pharelyshau.fragment.OverflowMenu"
				});
            }
            
			this.oOverflowMenu.openBy(oButton);
        },

		onPressNavigateToPage(sPage) {
			this.getRouter().navTo(sPage);
		},

		onPressSendEmail() {
			const oModel = this.getModel();
			const sEmail = oModel ? oModel.getProperty("/Email") : "pavel@harelyshau.dev";
			sap.m.URLHelper.triggerEmail(sEmail, "Email from harelyshau.dev website");
		},

		onPressSetTheme(sKey) {
			themeHelper.setTheme(sKey);
			const sThemeKey = themeHelper.mapTheme(null, sap.ui.core.Configuration.getTheme());
			this.getModel("appView").setProperty("/theme", sThemeKey);
		},

		onPressSetLanguage(sKey) {
			languageHelper.setLanguage(sKey);
			location.reload(); // need to refresh to change controls language
		},

		async onPressShareLink() {
			const sLink = window.location.href;
			const oMessageToast = sap.m.MessageToast;
			try {
				await navigator.clipboard.writeText(sLink);
				oMessageToast.show(`Website URL "${sLink}" has been copied to clipboard`);
			} catch {
				oMessageToast.show("Could not copy website URL");
			}
		},

		onPressShowCode() {
            const sWebsiteURL = "https://github.com/harelyshau/harelyshau.dev";
            sap.m.URLHelper.redirect(sWebsiteURL, true);
        },

		// DIALOGS

        isDialogOpen(oDialog, sBinndingPath) {
            if (!oDialog) {
                return false;
            }

            const bSamePath = oDialog.getBindingContext()?.getPath() === sBinndingPath;
			const bOpen = oDialog.isOpen();
            return bOpen && bSamePath;
        }

	});

});