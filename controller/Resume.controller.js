sap.ui.define([
    "./BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/format/DateFormat",
    "../model/models",
    "../model/formatter"
], function (BaseController, Fragment, JSONModel, DateFormat, models, formatter) {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Resume", {

        formatter: formatter,

        onInit() {
            // set the resume model
            this.setModel(models.createResumeModel());
        },

        // Header
        onPressNavigateToCalendar() {
            this.getRouter().navTo("calendar");
        },

        onPressDownloadResume() {
            const sFileURL = "/resource/file/Resume Pavel Harelyshau.pdf";
            sap.m.URLHelper.redirect(sFileURL, true);
        },

        onPressOpenRelocationPopover(oEvent) {
            const oControl = oEvent.getSource();
            const sBindingPath = "/RelocationPreference";

            if (!this._oRelocationPopover) {
                Fragment.load({
                    name: "pharelyshau.fragment.Resume.RelocationPopover",
                    controller: this
                }).then((oPopover) => {
                    this.getView().addDependent(oPopover);
                    this._oRelocationPopover = oPopover;
                    oPopover.bindElement(sBindingPath);
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this._oRelocationPopover, sBindingPath)) {
                this._oRelocationPopover.bindElement(sBindingPath);
                this._oRelocationPopover.openBy(oControl);
            } else {
                this._oRelocationPopover.close();
            }
        },

        onPressCloseRelocationPopover() {
            this._oRelocationPopover.close();
        },

        // Page Content
        onPressOpenCompanyPopover(oEvent) {
            const oControl = oEvent.getSource();
            const sBindingPath = oControl.getBindingContext().getPath() + "/Company";

            if (!this._oCompanyPopover) {
                Fragment.load({
                    name: "pharelyshau.fragment.Resume.CompanyPopover",
                    controller: this
                }).then((oPopover) => {
                    this.getView().addDependent(oPopover);
                    this._oCompanyPopover = oPopover;
                    oPopover.bindElement(sBindingPath);
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this._oCompanyPopover, sBindingPath)) {
                this._oCompanyPopover.bindElement(sBindingPath);
                this._oCompanyPopover.openBy(oControl);
            } else {
                this._oCompanyPopover.close();
            }
        },

        onPressCloseCompanyPopover(oEvent) {
            this._oCompanyPopover.close();
        }

    });
});