sap.ui.define([
	'./BaseController',
	'../model/models'
], (BaseController, models) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.HanotoiTower', {

        onInit() {
            this.setModel(models.createSandboxModel());
        },

        onSelectFile(oEvent) {
            const sFile = oEvent.getSource().getSelectedKey();
            const oNavContainer = this.byId('filesNavContainer');
            const oPage = oNavContainer.getPages()
                .find(oPage => this.getObjectByControl(oPage).name === sFile);
            oNavContainer.to(oPage, 'show');
        },

        onChangeCode(oEvent) {
            const sPath = this.getPathByEvent(oEvent);
            const { unsaved } = this.getProperty(sPath);
            const bUnsaved = unsaved === undefined ? false : true;
            this.setProperty(sPath + '/unsaved', bUnsaved);
        },

        onPressSave() {
            const oEditor = this.byId('filesNavContainer').getCurrentPage();
            const sPath = this.getPathByControl(oEditor);
            this.setProperty(sPath + '/value', oEditor.getValue());
            this.setProperty(sPath + '/unsaved', false);
        },

        getFiles() {
            return this.getProperty('/files')
                .reduce((file, files) => files[file.name.toLowerCase()] = file.value, {});
        }

    });
});
