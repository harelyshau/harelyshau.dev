sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/core/Configuration"
], function (JSONModel, Device, Configuration) {

    "use strict";

    return {
        createDeviceModel: function () {
            const oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

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

        createCalendarViewModel() {
            const oStartDate = new Date();
            const oEndDate = new Date();
            oStartDate.setHours(0, 0, 0);
            oEndDate.setHours(23, 59, 59);

            const oData = {
                busy : true,
                fullDay : localStorage.getItem("fullDay") ?? false,
                startHour: 8,
                endHour: 22,
                startDate : oStartDate,
                endDate : oEndDate
            };
            return new JSONModel(oData);
        }

    }
});