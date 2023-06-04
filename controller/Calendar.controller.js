sap.ui.define([
    "./BaseController",
], function (BaseController) {
    "use strict"
    return BaseController.extend("pharelyshau.controller.Detail", {

        onInit: function () {
            let oRouter = this.getOwnerComponent().getRouter()
            this.getRouter().getRoute("calendar").attachPatternMatched(this._onObjectMatched, this)
        },

        _onObjectMatched: function (oEvent) {
            let oPath = window.decodeURIComponent(oEvent.getParameter("arguments").videoItemPath)

            this.getView().bindElement({
                path: "/" + oPath,
                model: "youTubeModel"
            })
        }
    })
})