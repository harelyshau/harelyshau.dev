sap.ui.define([
   "./BaseController",
   "../model/models"
], function (BaseController, models) {
   "use strict";
   return BaseController.extend("pharelyshau.controller.App", {

      onInit() {
         // apply content density mode to root view
         this.getView().addStyleClass(this.getContentDensityClass());
         // set view model
         this.setModel(models.createAppViewModel(), "appView");
         // attach routing matching
         this.getRouter().attachRouteMatched(this.onRouteMatched, this);
      },

      onRouteMatched(oEvent) {
         // set current page
         this.getModel("appView").setProperty("/page", oEvent.getParameter("name"));
      }

   });
});