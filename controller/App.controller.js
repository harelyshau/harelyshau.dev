sap.ui.define([
   "./BaseController",
   "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
   "use strict";
   return BaseController.extend("pharelyshau.controller.App", {

      onInit: function () {
         // apply content density mode to root view
         this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
         // set view model
         const oViewModel = new JSONModel({
            theme: sap.ui.core.Configuration.getTheme()
         });
         this.setModel(oViewModel, "appView");
      }

   });
});