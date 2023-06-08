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
            theme: sap.ui.core.Configuration.getTheme(),
            page: ""
         });
         this.setModel(oViewModel, "appView");
         // attach routing matching
         this.getRouter().attachRouteMatched(this.onRouteMatched, this);
      },

      onRouteMatched(oEvent) {
         // set current page
         this.getModel("appView").setProperty("/page", oEvent.getParameter("name"));
      }

   });
});