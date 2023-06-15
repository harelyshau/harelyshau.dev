sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "./model/models",
    "./util/themeHelper",
    "./util/languageHelper"
], function (UIComponent, Device, models, themeHelper, languageHelper) {

    "use strict"

    return UIComponent.extend("pharelyshau.Component", {

        metadata: {
            "interfaces": ["sap.ui.core.IAsyncContentCreation"],
            manifest: "json"
        },

        init() {
            // call the base component's init function and create the App view
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            //init chosen language
            languageHelper.initLanguage();

            //init chosen theme
            themeHelper.initTheme();
        },

        destroy() {
            // call the base component's destroy function
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        getContentDensityClass() {
            if (this.sContentDensityClass === undefined) {
                if (!Device.support.touch) { // apply "compact" mode if touch is not supported
                    this.sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this.sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this.sContentDensityClass;
        }
    })
})