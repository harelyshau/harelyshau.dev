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

			async onPressOpenRelocationPopover(oEvent) {
				await this.loadAndAssignFragment('Resume', 'RelocationPopover');
				if (!this.isDialogOpen(this.oRelocationPopover, sPath)) {
					const sPath = '/RelocationPreference';
					this.oRelocationPopover.bindElement(sPath);
					this.oRelocationPopover.openBy(oEvent.getSource());
				} else {
					this.oRelocationPopover.close();
				}
			},

			onPressCloseRelocationPopover() {
				this.oRelocationPopover.close();
			},

			// Page Content
			async onPressOpenCompanyPopover(oEvent) {
				await this.loadAndAssignFragment('Resume', 'CompanyPopover');
				if (!this.isDialogOpen(this.oCompanyPopover, sPath)) {
					const sPath = this.getPathByEvent(oEvent) + '/Company';
					this.oCompanyPopover.bindElement(sPath);
					this.oCompanyPopover.openBy(oEvent.getSource());
				} else {
					this.oCompanyPopover.close();
				}
			},

			onPressCloseCompanyPopover(oEvent) {
				this.oCompanyPopover.close();
			}
		});
	}
);
