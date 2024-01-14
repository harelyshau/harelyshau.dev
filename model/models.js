sap.ui.define([
	'sap/ui/model/json/JSONModel',
	'sap/ui/Device',
	'../util/themeHelper',
	'../util/languageHelper'
], (JSONModel, Device, themeHelper, languageHelper) => {
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
				const sLanguage = languageHelper.getSupportedLanguage();
				const sFilePath = `resource/data/Resume/resume-${sLanguage}.json`;
				const oModel = new JSONModel();
				oModel.setDefaultBindingMode('OneWay').loadData(sFilePath);
				return oModel;
			},

			createCalendarModel() {
				const oData = {
					Email: 'pavel@harelyshau.dev',
					Appointments: [],
					ExistingAppointments: []
				};
				return new JSONModel(oData);
			},

			createHanoiTowerModel() {
				const oData = {
					DiscCounts: Array.from({ length: 18 }, (_, i) => i + 3),
					DiscCount: +localStorage.getItem('discs') || 3,
					Records: JSON.parse(localStorage.getItem('records')) ?? [],
					Moves: 0,
					Time: 0
				};
				return new JSONModel(oData);
			},

			createMinesweeperModel() {
				const [iCustomW, iCustomH, iCustomMines] = ['Width', 'Height', 'Mines']
					.map(sProperty => +localStorage.getItem('custom' + sProperty));
				const oCustomLevel = {
					Key: 'Custom',
					Width: iCustomW || 30,
					Height: iCustomH || 60,
					Mines: iCustomMines || 150
				};
				const Levels = [
					{ Key: 'Easy', Width: 9, Height: 9, Mines: 10 },
					{ Key: 'Medium', Width: 16, Height: 16, Mines: 40},
					{ Key: 'Hard', Width: 30, Height: 16, Mines: 99},
					oCustomLevel
				];
				const sLevelKey = localStorage.getItem('level') || 'Easy';
				const Level = Levels.find(oLevel => oLevel.Key === sLevelKey);
				const Records = JSON.parse(localStorage.getItem('minesweeperRecords')) ?? [];
				const oData = { Levels, Level, Time: 0, Records };
				return new JSONModel(oData);
			},

			createAlgorithmsModel(oArticleList) {
				const oModel = new JSONModel(oArticleList);
				oModel.setDefaultBindingMode('OneWay');
				return oModel;
			},

			createSandboxModel() {
				const files = [
					{
						name: 'index.html',
						value: `<!DOCTYPE html>\n<html>\n\t<head>\n\t\t\x3Cscript\n\t\t\tid="sap-ui-bootstrap"\n\t\t\tsrc="https://openui5.hana.ondemand.com/resources/sap-ui-core.js"\n\t\t\tdata-sap-ui-theme="sap_horizon"\n\t\t\tdata-sap-ui-compatVersion="edge"\n\t\t\tdata-sap-ui-async="true"\n\t\t\tdata-sap-ui-oninit="module:sap/ui/core/ComponentSupport"\n\t\t\tdata-sap-ui-resourceroots='{"pharelyshau": "./"}'\n\t\t>\x3C/script>\n\t</head>\n\t<body class="sapUiBody" id="content">\n\t\t<div\n\t\t\tdata-sap-ui-component\n\t\t\tdata-name="pharelyshau"\n\t\t\tdata-id="container"\n\t\t\tdata-settings='{"id" : "pharelyshau"}'\n\t\t></div>\n\t\t<H1>Some title</H1>\n\t</body>\n</html>`,
						path: '/index.html'
					},
					{
						name: 'index.js',
						value: 'console.log(3333)',
						path: '/index.js'
					}
				];
				const oData = {
					files,
					selectedFile: files[0]
				};
				return new JSONModel(oData);
			},

			// View Models

			createAppModel() {
				const oData = { theme: themeHelper.mapTheme() };
				return new JSONModel(oData);
			},

			createCalendarViewModel() {
				const oData = {
					busy: true,
					fullDay: !!JSON.parse(localStorage.getItem('fullDay')),
					startHour: 8,
					endHour: 21,
					currentDate: new Date(),
					appointmentDuration: 3600000
				};
				return new JSONModel(oData);
			},

			createHanoiTowerViewModel() {
				const oData = {
					showMoveButtons: !!JSON.parse(localStorage.getItem('moveButtons'))
				};
				return new JSONModel(oData);
			},

			createMinesweeperViewModel() {
				return new JSONModel();
			},

			createAlgorithmsViewModel() {
				const oData = {
					sideExpanded: true
				};
				return new JSONModel(oData);
			}
		};
	}
);
