sap.ui.define([
	'./BaseController',
	'../model/models',
	'../model/formatter',
	'../util/languageHelper'
], (BaseController, models, formatter, languageHelper) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Resume', {
			formatter,

			onInit() {
				const setModel = () => this.setModel(models.createResumeModel());
				languageHelper.attachChange(setModel);
				setModel();
			},

			// Header
			onPressDownloadResume() {
				const sFileURL = '/resource/file/Resume Pavel Harelyshau.pdf';
				sap.m.URLHelper.redirect(sFileURL, true);
			},

			onPressOpenRelocationPopover(oEvent) {
				const oControl = oEvent.getSource();
				const sPath = '/RelocationPreference';
				this.openPopover('RelocationPopover', oControl, sPath);
			},

			// Page Content
			onPressOpenCompanyPopover(oEvent) {
				const oControl = oEvent.getSource();
				const sPath = this.getPathByEvent(oEvent) + '/Company';
				this.openPopover('CompanyPopover', oControl, sPath);
			}

		});
	}
);
