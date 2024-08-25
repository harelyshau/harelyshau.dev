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
			const sLanguage = languageHelper.getLanguage();
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
			const oModel = new JSONModel(oData);
			oModel.setSizeLimit(250);
			return oModel;
		},

		createHanoiTowerModel() {
			const oData = {
				discCounts: Array.from({ length: 18 }, (_, i) => i + 3),
				discCount: 5,
				records: this.getStorageItem('records', 'hanoiTower') ?? [],
				moves: 0,
				time: 0
			};
			return new JSONModel(oData);
		},

		createMinesweeperModel() {
			const sId = 'minesweeper';
			const [iCustomW, iCustomH, iCustomMines] = ['Width', 'Height', 'Mines']
				.map(sProperty => this.getStorageItem(`custom${sProperty}`, sId));
			const oCustomLevel = {
				key: 'custom',
				width: iCustomW || 30,
				height: iCustomH || 60,
				mines: iCustomMines || 150
			};
			const levels = [
				{ key: 'easy', width: 9, height: 9, mines: 10 },
				{ key: 'medium', width: 16, height: 16, mines: 40},
				{ key: 'hard', width: 30, height: 16, mines: 99},
				oCustomLevel
			];
			const records = this.getStorageItem('records', sId) ?? [];
			const oData = { levels, level: levels[0], time: 0, records };
			return new JSONModel(oData);
		},

		createTicTacToeModel() {
			const levels = ['easy', 'medium', 'friend'].map(key => ({ key }));
			const oData = { levels, level: levels[1].key };
			return new JSONModel(oData);
		},

		createAlgorithmsModel(oArticleList) {
			const oModel = new JSONModel(oArticleList);
			return oModel.setDefaultBindingMode('OneWay');
		},

		createSandboxModel() {
			const files = [
				{
					name: 'HTML',
					value: `<h1>Some title</h1>`
				},
				{
					name: 'JavaScript',
					value: 'console.log(3333)'
				},
				{
					name: 'CSS',
					value: 'body { background: red }'
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
			const oData = { theme: themeHelper.getTheme() };
			return new JSONModel(oData);
		},

		createCalendarViewModel() {
			const oData = {
				busy: true,
				fullDay: !!this.getStorageItem('fullDay', 'calendar'),
				startHour: 8,
				endHour: 21,
				currentDate: new Date(),
				appointmentDuration: 3600000 // 1 hour
			};
			return new JSONModel(oData);
		},

		createHanoiTowerViewModel() {
			const showMoveButtons = !!this.getStorageItem('moveButtons', 'hanoiTower');
			return new JSONModel({ showMoveButtons });
		},

		createMinesweeperViewModel() {
			return new JSONModel();
		},

		createAlgorithmsViewModel() {
			const oData = { sideExpanded: true };
			return new JSONModel(oData);
		},

		createPWAModel() {
			const notification = {
				title: 'Notification from harelyshau.dev',
				body: 'Any description here',
				icon: 'https://harelyshau.dev/resource/image/favicon/favicon.svg',
				delay: 20,
				vibration: true
			}
			return new JSONModel({ notification });
		}
	};
});
