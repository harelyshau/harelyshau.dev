sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/core/Configuration",
    "../util/themeHelper"
], function (JSONModel, Device, Configuration, themeHelper) {

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
                theme: themeHelper.mapTheme(null, sap.ui.core.Configuration.getTheme()),
                page: "home"
            };
            return new JSONModel(oData);
        },

        createHomeViewModel() {
            const oData = {
                tileColors: {
                    light: "#5E696E",
                    dark: "#D3D7D9"
                }
            }
            ;
            return new JSONModel(oData);
        },

        createCalendarViewModel() {
            const oCurrentDate = new Date();
            oCurrentDate.setHours(0, 0, 0, 0);
            const oData = {
                busy: true,
                fullDay: localStorage.getItem("fullDay") === "true",
                startHour: 8,
                endHour: 21,
                currentDate: new Date()
            };
            return new JSONModel(oData);
        }

    }
});