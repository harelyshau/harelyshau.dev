sap.ui.define(
	['./BaseController', '../model/models', '../model/formatter'],
	(BaseController, models, formatter) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Resume', {
			formatter,

			onInit() {
				// set the resume model
				this.setModel(models.createResumeModel());
			},

			// Header
			onPressDownloadResume() {
				const sFileURL = '/resource/file/Resume Pavel Harelyshau.pdf';
				sap.m.URLHelper.redirect(sFileURL, true);
			},

			onPressOpenRelocationPopover(oEvent) {
				const oControl = oEvent.getSource();
				const sPath = '/RelocationPreference';
				this.openPopover('Resume', 'RelocationPopover', oControl, sPath);
			},

			onPressCloseRelocationPopover() {
				this.oRelocationPopover.close();
			},

			// Page Content
			onPressOpenCompanyPopover(oEvent) {
				const oControl = oEvent.getSource();
				const sPath = this.getPathByEvent(oEvent) + '/Company';
				this.openPopover('Resume', 'CompanyPopover', oControl, sPath);
			},

			onPressCloseCompanyPopover(oEvent) {
				this.oCompanyPopover.close();
			}
		});
	}
);
