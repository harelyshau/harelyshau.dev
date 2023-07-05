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
				const oControl = oEvent.getSource();
				const sPath = '/RelocationPreference';

				if (!this.oRelocationPopover) {
					this.oRelocationPopover = await this.loadFragment({
						name: 'pharelyshau.fragment.Resume.RelocationPopover'
					});
				}

				if (!this.isDialogOpen(this.oRelocationPopover, sPath)) {
					this.oRelocationPopover.bindElement(sPath);
					this.oRelocationPopover.openBy(oControl);
				} else {
					this.oRelocationPopover.close();
				}
			},

			onPressCloseRelocationPopover() {
				this.oRelocationPopover.close();
			},

			// Page Content
			async onPressOpenCompanyPopover(oEvent) {
				const oControl = oEvent.getSource();
				const sPath = oControl.getBindingContext().getPath() + '/Company';

				if (!this.oCompanyPopover) {
					this.oCompanyPopover = await this.loadFragment({
						name: 'pharelyshau.fragment.Resume.CompanyPopover'
					});
				}

				if (!this.isDialogOpen(this.oCompanyPopover, sPath)) {
					this.oCompanyPopover.bindElement(sPath);
					this.oCompanyPopover.openBy(oControl);
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
