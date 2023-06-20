sap.ui.define([
    "./BaseController",
    "../model/models",
    "../model/formatter"
], function (BaseController, models, formatter) {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Resume", {

        formatter,

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

            if (!this.oRelocationPopover) {
                this.loadFragment({
                    name: "pharelyshau.fragment.Resume.RelocationPopover"
                }).then((oPopover) => {
                    this.oRelocationPopover = oPopover;
                    oPopover.bindElement(sBindingPath);
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this.oRelocationPopover, sBindingPath)) {
                this.oRelocationPopover.bindElement(sBindingPath);
                this.oRelocationPopover.openBy(oControl);
            } else {
                this.oRelocationPopover.close();
            }
        },

        onPressCloseRelocationPopover() {
            this.oRelocationPopover.close();
        },

        // Page Content
        onPressOpenCompanyPopover(oEvent) {
            const oControl = oEvent.getSource();
            const sBindingPath = oControl.getBindingContext().getPath() + "/Company";

            if (!this.oCompanyPopover) {
                this.loadFragment({
                    name: "pharelyshau.fragment.Resume.CompanyPopover"
                }).then((oPopover) => {
                    this.oCompanyPopover = oPopover;
                    oPopover.bindElement(sBindingPath);
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this.oCompanyPopover, sBindingPath)) {
                this.oCompanyPopover.bindElement(sBindingPath);
                this.oCompanyPopover.openBy(oControl);
            } else {
                this.oCompanyPopover.close();
            }
        },

        onPressCloseCompanyPopover(oEvent) {
            this.oCompanyPopover.close();
        }

    });
});