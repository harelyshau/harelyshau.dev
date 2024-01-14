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
            this.generateIFrame();
        },

        getFiles() {
            return this.getProperty('/files')
                .reduce((file, files) => files[file.name.toLowerCase()] = file.value, {});
        },

        generateIFrame() {
            console.clear();
            const aFiles = this.getProperty('/files').map(oFile => oFile.value);
            const sHTML = `<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<style>${aFiles[2]}</style>\n\t\t<script>${aFiles[1]}</script>\n\t</head>\n\t<body>${aFiles[0]}</body>\n</html>`;
            this.setProperty('/result', sHTML);
            // var iframe = document.createElement('iframe');
            // iframe.srcdoc = sHTML;
            // this.byId('resultPage').getDomRef().append(iframe);
            // debugger
            // $("body").append(iframe);
            // var doc = null;
            // iframe=iframe[0];
            // if (iframe.contentDocument) {
            //     doc = iframe.contentDocument;
            // }
            // else if (iframe.contentWindow) {
            //     doc = iframe.contentWindow.document;
            // }
            // doc.all[0].innerHTML=(sIndex);
        }

    });
});
