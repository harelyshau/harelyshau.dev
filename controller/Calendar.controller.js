sap.ui.define(
	[
		'./BaseController',
		'sap/m/MessageToast',
		'sap/m/SinglePlanningCalendarDayView',
		'sap/m/SinglePlanningCalendarWorkWeekView',
		'sap/m/SinglePlanningCalendarWeekView',
		'sap/m/SinglePlanningCalendarMonthView',
		'../fragment/Calendar/TwoDaysView',
		'../fragment/Calendar/ThreeDaysView',
		'../model/models',
		'../model/formatter'
	],
	(
		BaseController,
		MessageToast,
		DayView,
		WorkWeekView,
		WeekView,
		MonthView,
		TwoDaysView,
		ThreeDaysView,
		models,
		formatter
	) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Calendar', {
			formatter,

			onInit() {
				// load google api
				this.loadGoogleAPI();
				// load node.js authorization function
				this.loadFunctionForAccessToken();
				// set the calendar model
				this.setModel(models.createCalendarModel());
				// create the calendar view model
				this.setModel(models.createCalendarViewModel(), 'view');
				// create and add views for calendar
				this.addCalendarViews();
			},

			onAfterRendering() {
				// to see max count of appointments
				this.getModel().setSizeLimit(250);
			},

			loadFunctionForAccessToken() {
				const script = document.createElement('script');
				script.src = 'util/getAccessTokenFromServiceAccount.js';
				document.head.appendChild(script);
			},

			//////////////////////////////////
			////// GOOGLE CALENDAR API ///////
			//////////////////////////////////

			loadGoogleAPI() {
				const script = document.createElement('script');
				script.src = 'https://apis.google.com/js/api.js';
				script.onload = () => {
					gapi.load('client', this.initGoogleApiClient.bind(this));
				};
				document.head.appendChild(script);
			},

			async initGoogleApiClient() {
				const oResponse = await fetch('resource/data/ServiceAccountCreds.json');
				const oCredentials = await oResponse.json();
				try {
					const sLink = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
					await gapi.client.init({ discoveryDocs: [sLink] });
					gapi.auth.setToken(await getAccessTokenFromServiceAccount.do(oCredentials));
					this.refreshCalendar();
					this.byId('btnMakeAppointment').setEnabled(true);
				} catch (oError) {
					this.getModel('view').setProperty('/busy', false);
					console.error('Error initializing Google Calendar API:', oError.error);
				}
			},

			// Requests

			async getAppointmentsGC() {
				// GC = Google Calendar
				const oViewModel = this.getModel('view');
				const oParams = {
					calendarId: this.getModel().getProperty('/Email'),
					timeMin: oViewModel.getProperty('/timeMin').toISOString(),
					timeMax: oViewModel.getProperty('/timeMax').toISOString(),
					singleEvents: true,
					maxResults: 250 // max value is 250
				};
				oViewModel.setProperty('/busy', true);
				try {
					const oResponse = await gapi.client.calendar.events.list(oParams);
					this.setAppointmentsLocal(oResponse.result.items);
				} catch (oError) {
					console.error('Error fetching appointments:', oError);
				} finally {
					oViewModel.setProperty('/busy', false);
				}
			},

			createAppointmentGC(oAppointment) {
				try {
					const oAppointmentGC = this.formatter.appointmentGC.call(this, oAppointment);
					const oRequestParams = this.getRequestParamsGC(oAppointmentGC);
					return gapi.client.calendar.events.insert(oRequestParams);
				} catch (oError) {
					console.error('Error creating appointment:', oError);
				}
			},

			removeAppointmentGC(sAppointmentID) {
				try {
					const oRequestParams = this.getRequestParamsGC(null, sAppointmentID);
					return gapi.client.calendar.events.delete(oRequestParams);
				} catch (oError) {
					console.error('Error deleting appointment:', oError);
				}
			},

			updateAppointmentGC(oAppointment) {
				try {
					const oAppointmentGC = this.formatter.appointmentGC.call(this, oAppointment);
					const oRequestParams = this.getRequestParamsGC(oAppointmentGC, oAppointment.ID);
					return gapi.client.calendar.events.update(oRequestParams);
				} catch (oError) {
					console.error('Error updating appointment:', oError);
				}
			},

			getRequestParamsGC(oAppointmentGC, sAppointmentID) {
				const oParams = {
					calendarId: this.getModel().getProperty('/Email'),
					sendUpdates: 'all'
				};
				if (sAppointmentID) oParams.eventId = sAppointmentID;
				if (oAppointmentGC) {
					oParams.resource = oAppointmentGC;
					oParams.conferenceDataVersion = 1;
				}
				return oParams;
			},

			setAppointmentsLocal(aAppointmentsGC) {
				// Local = JSON Model
				const aAppointments = aAppointmentsGC.map((oAppointmentGC) => {
					return this.formatter.appointmentLocal.call(this, oAppointmentGC);
				});
				this.getModel().setProperty('/Appointments', aAppointments);
			},

			// Request Filtering

			updateDateRange() {
				const oViewModel = this.getModel('view');
				const oSelectedDate = this.byId('calendar').getStartDate();
				const oStartDate = new Date(oSelectedDate.getTime());
				const oEndDate = new Date(oSelectedDate.getTime());

				oStartDate.setDate(1);
				oStartDate.setHours(0, 0, 0);
				oStartDate.setMonth(oStartDate.getMonth() - 1);

				oEndDate.setHours(23, 59, 59);
				oEndDate.setMonth(oEndDate.getMonth() + 2);
				oEndDate.setDate(0);

				oViewModel.setProperty('/timeMin', oStartDate);
				oViewModel.setProperty('/timeMax', oEndDate);
			},

			//////////////////////////////////
			//////////// CALENDAR ////////////
			//////////////////////////////////

			async onPressOpenAppointmentDialog(oEvent) {
				// create by button
				const oButton = oEvent.getSource();
				const aAppointmentDates = this.getDatesForNewAppointment();
				const oCalendar = this.byId('calendar');
				const oCalendarDate = oCalendar.getStartDate();
				if (!this.areDatesInSameDay(oCalendarDate, aAppointmentDates[0])) {
					oCalendar.setStartDate(aAppointmentDates[0]);
					await this.refreshCalendar();
				}
				const oAppointment = this.createAppointmentLocal(...aAppointmentDates);
				oButton.setEnabled(false);
				const sPath = this.getPathForAppointment(oAppointment);
				await this.openAppointmentDialog(sPath);
				oButton.setEnabled(true);
			},

			areDatesInSameDay(oDate1, oDate2) {
				const nTime1 = new Date(oDate1.getTime()).setHours(0, 0, 0, 0);
				const nTime2 = new Date(oDate2.getTime()).setHours(0, 0, 0, 0);
				return nTime1 === nTime2;
			},

			onAppointmentCreateOpenDialog(oEvent) {
				// create by drag and drop
				const oStartDate = oEvent.getParameter('startDate');
				const bStartDateInFutute = new Date().getTime() < oStartDate.getTime();
				if (!bStartDateInFutute) {
					MessageToast.show(this.i18n('msgStartDateMustBeInFuture'));
					return;
				}
				const oEndDate = oEvent.getParameter('endDate');
				const oAppointment = this.createAppointmentLocal(oStartDate, oEndDate);
				const sPath = this.getPathForAppointment(oAppointment);
				this.openAppointmentDialog(sPath);
			},

			onAppointmentSelectOpenPopover(oEvent) {
				const oControl = oEvent.getParameter('appointment');
				if (!oControl || oControl.getSelected()) {
					return;
				}
				const oAppointment = oControl.getBindingContext().getObject();
				const bAvailable = this.getAvailableAppointmentIDs().includes(oAppointment.ID);
				if (!bAvailable && oAppointment.ID !== 'newAppointment') {
					// show popover only when this is user's appointment
					MessageToast.show(this.i18n('msgBusyAtThisTime'));
					return;
				}

				const sPath = this.getPathForAppointment(oAppointment);
				this.openAppointmentPopover(sPath, oControl);
			},

			async onAppointmentResizeDropPatchDates(oEvent) {
				const oBindingContext = oEvent.getParameter('appointment').getBindingContext();
				const oAppointment = oBindingContext.getObject();
				const bAvailable = this.getAvailableAppointmentIDs().includes(oAppointment.ID);
				if (!bAvailable) return;
				oAppointment.StartDate = oEvent.getParameter('startDate');
				oAppointment.EndDate = oEvent.getParameter('endDate');
				this.getModel().refresh();
				await this.updateAppointmentGC(oAppointment);
			},

			addCalendarViews() {
				const oDeviceModel = this.getOwnerComponent().getModel('device');
				const oCalendar = this.byId('calendar');
				const bDevicePhone = oDeviceModel.getProperty('/system/phone');
				const bDeviceSmallWidth = oDeviceModel.getProperty('/resize/width') <= 800;

				oCalendar.addView(new DayView({ key: '1', title: this.i18n('ttlDay') }));
				// Add views for mobile and small size screens
				if (bDevicePhone || bDeviceSmallWidth) {
					oCalendar.addView(new TwoDaysView({ key: '2', title: this.i18n('ttl2Days') }));
					oCalendar.addView(new ThreeDaysView({ key: '3', title: this.i18n('ttl3Days') }));
				}
				oCalendar.addView(new WorkWeekView({ key: '5', title: this.i18n('ttlWorkWeek') }));
				// Add week view for desktop device
				if (!bDevicePhone && !bDeviceSmallWidth) {
					oCalendar.addView(new WeekView({ key: '7', title: this.i18n('ttlWeek') }));
				}
				oCalendar.addView(new MonthView({ key: 'month', title: this.i18n('ttlMonth') }));
			},

			onStartDateChangeCalendar() {
				this.refreshCalendar();
			},

			async refreshCalendar() {
				this.updateDateRange();
				await this.getAppointmentsGC();
			},

			onMoreLinkPress(oEvent) {
				const oDate = oEvent.getParameter('date');
				const oCalendar = oEvent.getSource();
				oCalendar.setStartDate(oDate);
				oCalendar.setSelectedView(oCalendar.getViews()[0]); // DayView
			},

			onPressToggleFullDay(oEvent) {
				const bPressed = oEvent.getSource().getProperty('pressed');
				if (bPressed) {
					localStorage.setItem('fullDay', true);
				} else {
					localStorage.removeItem('fullDay');
				}
			},

			//////////////////////////////////
			///////////// DIALOG /////////////
			//////////////////////////////////

			async openAppointmentDialog(sPath) {
				await this.loadAndAssignFragment('Calendar', 'AppointmentDialog');
				this.oAppointmentDialog.bindElement(sPath);
				this.oAppointmentDialog.open();
			},

			getPathForAppointment(oAppointment) {
				const aAppointments = this.getModel().getProperty('/Appointments');
				return '/Appointments/' + aAppointments.indexOf(oAppointment);
			},

			// Appointment create

			createAppointmentLocal(oStartDate, oEndDate) {
				const oAppointment = {
					ID: 'newAppointment',
					Email: localStorage.getItem('email'),
					StartDate: oStartDate,
					EndDate: oEndDate,
					Mode: 'create',
					Type: 'Type01',
					GoogleMeet: 'willBeCreated'
				};
				const aAppointments = this.getModel().getProperty('/Appointments');
				aAppointments.push(oAppointment);
				this.getModel().refresh();
				return oAppointment;
			},

			getDatesForNewAppointment() {
				const oStartDate = this.roundUpDateTo15Min();
				const oCalendar = this.byId('calendar');
				const oCalendarStartDate = oCalendar.getStartDate();
				if (oCalendarStartDate.getTime() > new Date().getTime()) {
					oStartDate.setTime(this.roundUpDateTo15Min(oCalendarStartDate));
				}

				const nDuration = this.getModel('view').getProperty('/appointmentDuration');
				const oEndDate = new Date(oStartDate.getTime() + nDuration);
				return [oStartDate, oEndDate];
			},

			roundUpDateTo15Min(oDate) {
				oDate = oDate ?? new Date(new Date().getTime() + 3600000);
				const nRemainder = oDate.getMinutes() % 15;
				return new Date(oDate.getTime() + (15 - nRemainder) * 60000);
			},

			async onPressCreateEditAppointment(oEvent) {
				const [bValidEmail, sMessage] = this.validateEmailInput();
				if (!bValidEmail) {
					MessageToast.show(sMessage);
					return;
				}

				this.oAppointmentDialog.close();
				const oBindingContext = oEvent.getSource().getBindingContext();
				let oAppointment = oBindingContext.getObject();
				const sMode = oAppointment.Mode;

				localStorage.setItem('email', oAppointment.Email);
				this.getModel().setProperty(oBindingContext.getPath() + '/Mode', 'view');

				let oResponse;
				if (sMode === 'create') {
					oResponse = await this.createAppointmentGC(oAppointment);
					this.addAppointmentIdToLocalStorage(oResponse.result.id);
				} else if (sMode === 'edit') {
					oResponse = await this.updateAppointmentGC(oAppointment);
				}
				// refresh appointment local
				oAppointment = this.formatter.appointmentLocal.call(this, oResponse.result);
				this.getModel().setProperty(oBindingContext.getPath(), oAppointment);
			},

			validateEmailInput() {
				const oEmailInput = this.byId('inpEmail');
				const bEmailEmpty = !oEmailInput.getValue();
				const bEmailWrong = oEmailInput.getValueState() !== 'None';
				if (bEmailEmpty || bEmailWrong) {
					let sMessage = this.i18n('msgInvalidEmail');
					if (bEmailEmpty) {
						// set and reset value to show error state
						oEmailInput.setValue('s');
						oEmailInput.setValue('');
						sMessage = this.i18n('msgFillEmail');
					}
					return [false, sMessage];
				}
				return [true];
			},

			addAppointmentIdToLocalStorage(sAppointmentID) {
				const aAppointmentIDs = this.getAvailableAppointmentIDs();
				aAppointmentIDs.push(sAppointmentID);
				localStorage.setItem('appointments', JSON.stringify(aAppointmentIDs));
			},

			removeAppointmentIdFromLocalStorage(sAppointmentID) {
				const aAppointmentIDs = this.getAvailableAppointmentIDs();
				aAppointmentIDs.splice(aAppointmentIDs.indexOf(sAppointmentID), 1);
				localStorage.setItem('appointments', JSON.stringify(aAppointmentIDs));
			},

			getAvailableAppointmentIDs() {
				return JSON.parse(localStorage.getItem('appointments')) ?? [];
			},

			// Appointment cancel

			onPressCloseAppointmentDialog() {
				this.oAppointmentDialog.close();
			},

			onAfterCloseAppointmentDialog(oEvent) {
				const oBindingContext = oEvent.getSource().getBindingContext();
				const sMode = oBindingContext.getProperty('Mode');
				if (sMode === 'create') {
					this.removeAppointmentLocal(oBindingContext.getObject());
				} else if (sMode === 'edit') {
					this.resetAppointmentLocal(oBindingContext.getObject());
				}
			},

			resetAppointmentLocal(oAppointment) {
				const sPath = this.getPathForAppointment(oAppointment);
				const oInitialAppointment = this.getModel('view').getProperty('/initialAppointment');
				this.getModel().setProperty(sPath, oInitialAppointment);
				this.byId('calendar').setStartDate(oInitialAppointment.StartDate);
				this.getModel('view').setProperty('/initialAppointment', null);
			},

			removeAppointmentLocal(oAppointment) {
				const aAppointments = this.getModel().getProperty('/Appointments');
				aAppointments.splice(aAppointments.indexOf(oAppointment), 1); // remove by index
				this.getModel().refresh();
			},

			// Google Meet

			onPressAddGoogleMeet(oEvent) {
				const sPath = oEvent.getSource().getBindingContext().getPath();
				const sGoogleMeet = this.getModel('view').getProperty('/initialAppointment/GoogleMeet');
				this.getModel().setProperty(sPath + '/GoogleMeet', sGoogleMeet ?? 'willBeCreated');
			},

			onPressRemoveGoogleMeet(oEvent) {
				const sPath = oEvent.getSource().getBindingContext().getPath();
				this.getModel().setProperty(sPath + '/GoogleMeet', null);
			},

			// Pickers

			onChangePicker(oEvent, sField) {
				const oPicker = oEvent.getSource();
				const oAppointment = oPicker.getBindingContext().getObject();

				const bValueValid = oEvent.getParameter('valid') && !!oEvent.getParameter('value');
				if (!bValueValid) {
					// if wrong input reset value
					this.resetPickerValue(oPicker, oAppointment[sField]);
					return;
				}

				const sPath = oPicker.getBindingContext().getPath();
				const nDuration = oAppointment.EndDate.getTime() - oAppointment.StartDate.getTime();
				const oNewDate = oPicker.getDateValue();

				this.getModel().setProperty(sPath + '/' + sField, oNewDate);
				if (sField === 'StartDate') {
					this.updateAppointmentEndDateByDuration(sPath, nDuration);
					this.byId('calendar').setStartDate(oNewDate);
				}
			},

			resetPickerValue(oPicker, oDate) {
				oPicker.setValue('');
				oPicker.setDateValue(oDate);
			},

			updateAppointmentEndDateByDuration(sPath, nDuration) {
				const oStartDate = this.getModel().getProperty(sPath + '/StartDate');
				const oEndDate = this.getModel().getProperty(sPath + '/EndDate');
				oEndDate.setTime(oStartDate.getTime() + nDuration);
				this.getModel().refresh(true);
			},

			//////////////////////////////////
			///////////// POPOVER ////////////
			//////////////////////////////////

			async openAppointmentPopover(sPath, oControl) {
				await this.loadAndAssignFragment('Calendar', 'AppointmentPopover');
				this.oAppointmentPopover.bindElement(sPath);
				this.oAppointmentPopover.openBy(oControl);
			},

			onPressCopyConferenceLink(oEvent) {
				const oAppointment = oEvent.getSource().getBindingContext().getObject();
				const sConferenceLink = oAppointment.GoogleMeet ?? oAppointment.Conference;
				this.copyToClipboard(sConferenceLink);
			},

			onPressJoinToConference(oEvent) {
				const oAppointment = oEvent.getSource().getBindingContext().getObject();
				const sConferenceLink = oAppointment.GoogleMeet ?? oAppointment.Conference;
				sap.m.URLHelper.redirect(sConferenceLink, true);
			},

			onPressEditOpenAppointmentDialog(oEvent) {
				this.oAppointmentPopover.close();

				const oBindingContext = oEvent.getSource().getBindingContext();
				const sPath = oBindingContext.getPath();
				this.getModel().setProperty(sPath + '/Mode', 'edit');
				this.openAppointmentDialog(sPath);

				// write to view model initial appointment to reset it if necessary
				const oInitialAppointment = { ...oBindingContext.getObject() };
				this.getModel('view').setProperty('/initialAppointment', oInitialAppointment);
			},

			async onPressRemoveAppointment(oEvent) {
				this.oAppointmentPopover.close();
				const oAppointment = oEvent.getSource().getBindingContext().getObject();
				this.removeAppointmentLocal(oAppointment);
				await this.removeAppointmentGC(oAppointment.ID);
				this.removeAppointmentIdFromLocalStorage(oAppointment.ID);
			},

			onPressCloseAppointmentPopover() {
				this.oAppointmentPopover.close();
			}
		});
	}
);
