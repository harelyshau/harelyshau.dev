sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/core/Configuration"
], function (JSONModel, Device, Configuration) {

    "use strict";

    return {

        // Device Model

        createDeviceModel() {
            const oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        // Data Models

        createResumeModel() {
            let sLanguage = Configuration.getLanguage();
            const oManifest = sap.ui.getCore().getComponent("container-pharelyshau").getManifest();
            const aSupportedLanguages = oManifest["sap.app"].i18n.supportedLocales;
            if (!aSupportedLanguages.includes(sLanguage)) {
                sLanguage = "en";
            }

            const sFilePath = `pharelyshau/resource/data/Resume_${sLanguage}.json`;
            const oModel = new JSONModel(sap.ui.require.toUrl(sFilePath));
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createCalendarModel() {
            const oData = {
                Email: "pavel@harelyshau.dev",
                Appointments: []
            };
            return new JSONModel(oData);
        },

        // View Models

        createAppViewModel() {
            const oData = {
                theme: sap.ui.core.Configuration.getTheme(),
                page: ""
            };
            return new JSONModel(oData);
        },

        createCalendarViewModel() {
            const oData = {
                busy: true,
                fullDay: localStorage.getItem("fullDay") === "true",
                startHour: 8,
                endHour: 21,
                timeMin: new Date(), // will change to 1st day of previous month
                timeMax: new Date() // will change to last day of next month
            };
            return new JSONModel(oData);
        }

    }
});