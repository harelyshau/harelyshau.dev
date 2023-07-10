sap.ui.define(
	[
		'sap/ui/model/json/JSONModel',
		'sap/ui/Device',
		'sap/ui/core/Configuration',
		'../util/themeHelper',
		'../util/languageHelper'
	],
	(JSONModel, Device, Configuration, themeHelper, languageHelper) => {
		'use strict';

		return {
			// Device Model

			createDeviceModel() {
				const oModel = new JSONModel(Device);
				oModel.setDefaultBindingMode('OneWay');
				return oModel;
			},

			// Data Models
			createResumeModel() {
				let sLanguage = languageHelper.getCurrentLanguage();
				if (!languageHelper.getSupportedLanguages().includes(sLanguage)) {
					sLanguage = languageHelper.getFallBackLanguage();
				}

				const sFilePath = `pharelyshau/resource/data/Resume_${sLanguage}.json`;
				const oModel = new JSONModel(sap.ui.require.toUrl(sFilePath));
				oModel.setDefaultBindingMode('OneWay');
				return oModel;
			},

			createCalendarModel() {
				const oData = {
					Email: 'pavel@harelyshau.dev',
					Appointments: []
				};
				return new JSONModel(oData);
			},

			// View Models

			createAppViewModel() {
				const oData = {
					theme: themeHelper.mapTheme(null, sap.ui.core.Configuration.getTheme())
				};
				return new JSONModel(oData);
			},

			createCalendarViewModel() {
				const oData = {
					busy: true,
					fullDay: !!JSON.parse(localStorage.getItem('fullDay')),
					startHour: 8,
					endHour: 21,
					currentDate: new Date(),
					appointmentDuration: 1800000
				};
				return new JSONModel(oData);
			}
		};
	}
);
