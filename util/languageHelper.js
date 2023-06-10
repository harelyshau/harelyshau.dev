sap.ui.define([
    "sap/ui/core/Configuration"
], function (Configuration) {
    
    "use strict";

    return {

        getLanguage() {
            return localStorage.getItem("language");
        },

        setLanguage(sLanguage) {
            // set up received language
            let sLanguageSAP = sLanguage ?? "auto";
            if (sLanguageSAP === "auto") {
                sLanguageSAP = Configuration.getLanguage().slice(0, 2);
            }

            // check for supported languages
            const oManifest = sap.ui.getCore().getComponent("container-pharelyshau").getManifest();
            const aSupportedLanguages = oManifest["sap.app"].i18n.supportedLocales;
            if (!aSupportedLanguages.includes(sLanguageSAP)) {
                sLanguageSAP = 'en';
            }

            // write and apply language
            if (sLanguage) {
                localStorage.setItem("language", sLanguage);
            }
            Configuration.setLanguage(sLanguageSAP);
        },

        initLanguage() {
            const sLanguage = this.getLanguage();
            this.setLanguage(sLanguage);
        }
        
    };
});