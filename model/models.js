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

        createResumeModel: function () {
            const sLanguage = Configuration.getLanguage();
            const oManifest = sap.ui.getCore().getComponent("container-pharelyshau").getManifest();
            const aSupportedLanguages = oManifest["sap.app"].i18n.supportedLocales;
            if (!aSupportedLanguages.includes(sLanguage)) {
                sLanguage = "en";
            }
            const sFilePath = `pharelyshau/resource/data/Resume_${sLanguage}.json`;
            const oModel = new JSONModel(sap.ui.require.toUrl(sFilePath));
            return oModel;
        }
    };
}
);