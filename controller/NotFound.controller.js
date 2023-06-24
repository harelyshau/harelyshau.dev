sap.ui.define([
    "./BaseController"
 ], function (BaseController) {

    "use strict";

    return BaseController.extend("pharelyshau.controller.NotFound", {

        onPressNavigateToHome() {
            this.getRouter().navTo("home");
        }
    });
});