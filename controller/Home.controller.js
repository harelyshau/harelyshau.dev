sap.ui.define([
    "./BaseController",
    "sap/m/IllustrationPool",
    "../model/models"
 ], function (BaseController, IllustrationPool, models) {

    "use strict";

    return BaseController.extend("pharelyshau.controller.Home", {

        onInit() {
            // set the home view model
            this.setModel(models.createHomeViewModel(), "view");

            // register tnt illustration set
            this.registerIllustrationSet("tnt", "sap/tnt/themes/base/illustrations");
        },

        registerIllustrationSet(sSetFamily, sSetPath) {
            const oTntSet = {
				setFamily: sSetFamily,
				setURI: sap.ui.require.toUrl(sSetPath)
			};

            IllustrationPool.registerIllustrationSet(oTntSet, false);
        }
        
    });
});