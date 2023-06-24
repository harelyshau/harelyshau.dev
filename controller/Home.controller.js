sap.ui.define([
    "./BaseController"
 ], function (BaseController) {

    "use strict";

    return BaseController.extend("pharelyshau.controller.Home", {

        onPressNavigateToHome() {
            this.getRouter().navTo("home");
        }
    });
});