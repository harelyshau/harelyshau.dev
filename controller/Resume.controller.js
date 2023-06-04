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

        onInit: function () {
            // set the resume model
            this.setModel(models.createResumeModel(), "resume");
        },

        // Header
        onPressDownloadResume: function () {
            const sFileURL = "/resource/file/Resume Pavel Harelyshau.pdf";
            sap.m.URLHelper.redirect(sFileURL, true);
        },

        onPressOpenRelocationPopover: function (oEvent) {
            const oControl = oEvent.getSource();
            const sBindingPath = "/RelocationPreference";

            if (!this._oRelocationPopover) {
                Fragment.load({
                    name: "pharelyshau.fragment.Resume.RelocationPopover",
                    controller: this
                }).then((oPopover) => {
                    this.getView().addDependent(oPopover);
                    this._oRelocationPopover = oPopover;
                    oPopover.bindElement({ path: sBindingPath, model: "resume" });
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this._oRelocationPopover, sBindingPath)) {
                this._oRelocationPopover.bindElement({ path: sBindingPath, model: "resume" });
                this._oRelocationPopover.openBy(oControl);
            } else {
                this._oRelocationPopover.close();
            }
        },

        onPressCloseRelocationPopover: function() {
            this._oRelocationPopover.close();
        },

        // Page Content
        onPressOpenCompanyPopover: function (oEvent) {
            const oControl = oEvent.getSource();
            const sBindingPath = oControl.getBindingContext("resume").getPath() + "/Company";

            if (!this._oCompanyPopover) {
                Fragment.load({
                    name: "pharelyshau.fragment.Resume.CompanyPopover",
                    controller: this
                }).then((oPopover) => {
                    this.getView().addDependent(oPopover);
                    this._oCompanyPopover = oPopover;
                    oPopover.bindElement({ path: sBindingPath, model: "resume" });
                    oPopover.openBy(oControl);
                    return oPopover;
                });
            } else if (!this.isOpenDialog(this._oCompanyPopover, sBindingPath)) {
                this._oCompanyPopover.bindElement({ path: sBindingPath, model: "resume" });
                this._oCompanyPopover.openBy(oControl);
            } else {
                this._oCompanyPopover.close();
            }
        },

        onPressCloseCompanyPopover: function (oEvent) {
            this._oCompanyPopover.close();
        }

    });
});