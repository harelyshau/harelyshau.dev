sap.ui.define([
	'./BaseController',
	'sap/m/MessageToast',
	'sap/m/InstanceManager',
	'sap/ui/core/ResizeHandler',
	'../model/models'
], (BaseController, MessageToast, InstanceManager, ResizeHandler, models) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.HanotoiTower', {

        onInit() {
            this.setModel(models.createSandboxModel());
        },

        onSelectFile(oEvent) {
            const sFile = oEvent.getSource().getSelectedKey();
            const oFile = this.getProperty('/files').find(oFile => oFile.name === sFile);
            this.setProperty('/selectedFile', oFile);
        },

        onPressSave() {
            
        }

    });
});
