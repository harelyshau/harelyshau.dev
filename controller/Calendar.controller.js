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
		'../util/googleApiTokenFetcher',
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
		googleApiTokenFetcher,
		models,
		formatter
	) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Calendar', {
			formatter,

			onInit() {
				this.loadGoogleAPI();
				this.setModel(models.createCalendarModel());
				this.setModel(models.createCalendarViewModel(), 'view');
				this.addCalendarViews();
			},

			onAfterRendering() {
				// to see max count of appointments
				this.getModel().setSizeLimit(250);
			},

			//////////////////////////////////
			////// GOOGLE CALENDAR API ///////
			//////////////////////////////////

			loadGoogleAPI() {
				const script = document.createElement('script');
				script.src = 'https://apis.google.com/js/api.js';
				script.onload = () => {
					gapi.load('client', this.onLoadGoogleCalendarClient.bind(this));
				};
				document.head.appendChild(script);
			},

			async onLoadGoogleCalendarClient() {
				await this.initGoogleApiClient();
				await this.setGoogleApiAuthToken();
				this.refreshCalendar();
				this.byId('btnMakeAppointment').setEnabled(true);
			},

			async initGoogleApiClient() {
				try {
					const sLink = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
					await gapi.client.init({ discoveryDocs: [sLink] });
				} catch (oError) {
					console.error('Error initializing Google Calendar Client:', oError.error);
				}
			},

			async setGoogleApiAuthToken() {
				const oCredentials = await this.getServiceAccountCredentials();
				gapi.auth.setToken(await googleApiTokenFetcher.getToken(oCredentials));
			},

			async getServiceAccountCredentials() {
				const oResponse = await fetch('resource/data/Calendar/service-acc-creds.json');
				return oResponse.json();
			},

			// Requests (GC = Google Calendar)
			async getAppointmentsGC() {
				const oViewModel = this.getModel('view');
				oViewModel.setProperty('/busy', true);
				try {
					const oParams = this.getRequestParamsGC();
					const oResponse = await gapi.client.calendar.events.list(oParams);
					return oResponse.result.items;
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
				const oParams = { calendarId: this.getModel().getProperty('/Email') };
				switch (true) {
					case !oAppointmentGC && !sAppointmentID: // read
						this.setReadRequestParamsGC(oParams);
						break;
					case !!sAppointmentID: // update delete
						oParams.eventId = sAppointmentID;
					case !!oAppointmentGC: // create update
						oParams.resource = oAppointmentGC;
						oParams.conferenceDataVersion = 1;
					default: // create update delete
						oParams.sendUpdates = 'all';
				}
				return oParams;
			},

			setReadRequestParamsGC(oParams) {
				const oViewModel = this.getModel('view');
				oParams.timeMin = oViewModel.getProperty('/timeMin').toISOString();
				oParams.timeMax = oViewModel.getProperty('/timeMax').toISOString();
				oParams.singleEvents = true;
				oParams.maxResults = 250; // max value is 250
			},

			// Request Filtering
			updateDateRange() {
				const oViewModel = this.getModel('view');
				const oSelectedDate = this.byId('calendar').getStartDate();
				const oStartDate = new Date(oSelectedDate);
				const oEndDate = new Date(oSelectedDate);

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
			////////// JSON MODEL ////////////
			//////////////////////////////////

			setAppointments(aAppointmentsGC) {
				this.setExistingAppointments(aAppointmentsGC);
				this.refreshAppointments();
			},

			setExistingAppointments(aAppointmentsGC) {
				const aAppointments = aAppointmentsGC.map((oAppointmentGC) => {
					return this.formatter.appointmentLocal.call(this, oAppointmentGC);
				});
				this.getModel().setProperty('/ExistingAppointments', aAppointments);
			},

			getExistingAppointments() {
				return this.getModel().getProperty('/ExistingAppointments');
			},

			refreshAppointments() {
				this.setAppointmentsWithEditable();
			},

			setAppointmentsWithEditable() {
				const aAppointments = [...this.getExistingAppointments()];
				this.addEditableAppointment(aAppointments);
				this.getModel().setProperty('/Appointments', aAppointments);
			},

			addEditableAppointment(aAppointments) {
				const oEditableAppointment = this.getEditableAppointment();
				if (!oEditableAppointment) return;
				const bAlreadyHas = aAppointments.some((oAppointment, i) => {
					if (oAppointment.ID === oEditableAppointment.ID) {
						aAppointments[i] = oEditableAppointment;
						return true;
					}
				});
				if (!bAlreadyHas) aAppointments.push(oEditableAppointment);
			},

			//////////////////////////////////
			//////////// CALENDAR ////////////
			//////////////////////////////////

			// Create by Button
			onPressOpenAppointmentDialog() {
				const aAppointmentDates = this.getDatesForNewAppointment();
				this.setCalendarStartDate(aAppointmentDates[0]);
				this.createAppointment(...aAppointmentDates);
				this.openAppointmentDialog();
			},

			// Create by Drag & Drop
			onAppointmentCreateOpenDialog(oEvent) {
				const oStartDate = oEvent.getParameter('startDate');
				if (!this.isDateInFuture(oStartDate)) {
					MessageToast.show(this.i18n('msgStartDateMustBeInFuture'));
					return;
				}
				this.createAppointment(oStartDate, oEvent.getParameter('endDate'));
				this.openAppointmentDialog();
			},

			// Open Popover
			onAppointmentSelectOpenPopover(oEvent) {
				const oControl = oEvent.getParameter('appointment');
				if (!oControl || oControl.getSelected()) return;
				const oAppointment = this.getObjectByControl(oControl);
				if (!this.isAppointmentAvailable(oAppointment.ID)) {
					MessageToast.show(this.i18n('msgBusyAtThisTime'));
					return;
				}
				const sPath = this.getPathForAppointment(oAppointment);
				this.openAppointmentPopover(sPath, oControl);
			},

			// Resize & Drop
			onAppointmentResizeDrop(oEvent) {
				const oAppointment = this.getObjectByControl(oEvent.getParameter('appointment'));
				const bAvailable = this.isAppointmentAvailable(oAppointment.ID);
				if (!bAvailable || oAppointment.ID === 'new') return;
				oAppointment.StartDate = oEvent.getParameter('startDate');
				oAppointment.EndDate = oEvent.getParameter('endDate');
				this.getModel().refresh();
				this.updateAppointmentGC(oAppointment);
			},

			onStartDateChangeCalendar() {
				this.refreshCalendar();
			},

			onMoreLinkPress() {
				this.setCalendarDayView();
			},

			onHeaderDateSelect() {
				this.setCalendarDayView();
			},

			onPressToggleFullDay(oEvent) {
				const bPressed = oEvent.getSource().getProperty('pressed');
				localStorage.setItem('fullDay', bPressed);
			},

			setCalendarStartDate(oDate) {
				const oCalendar = this.byId('calendar');
				const oCalendarDate = oCalendar.getStartDate();
				if (this.areDatesInSameDay(oCalendarDate, oDate)) return;
				oCalendar.setStartDate(oDate);
				this.refreshCalendar();
			},

			setCalendarDayView() {
				const oCalendar = this.byId('calendar');
				oCalendar.setStartDate(oEvent.getParameter('date'));
				oCalendar.setSelectedView(oCalendar.getViews()[0]); // DayView
			},

			async refreshCalendar() {
				this.updateDateRange();
				const aAppointmentsGC = await this.getAppointmentsGC();
				this.setAppointments(aAppointmentsGC);
			},

			addCalendarViews() {
				const oDeviceModel = this.getOwnerComponent().getModel('device');
				const oCalendar = this.byId('calendar');
				const bDevicePhone = oDeviceModel.getProperty('/system/phone');
				const bDeviceSmallWidth = oDeviceModel.getProperty('/resize/width') <= 800;

				oCalendar.addView(new DayView({ key: '1', title: this.i18n('ttlDay') }));
				// Add views for mobile or small size screens
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

			//////////////////////////////////
			///////////// DIALOG /////////////
			//////////////////////////////////

			openAppointmentDialog() {
				this.openDialog('AppointmentDialog', '/EditableAppointment');
			},

			// Save Button
			async onPressCreateEditAppointment(oEvent) {
				const [bValidEmail, sMessage] = this.validateEmailInput();
				if (!bValidEmail) {
					MessageToast.show(sMessage);
					return;
				}
				this.oAppointmentDialog.close();
				let oAppointment = this.getObjectByEvent(oEvent);
				localStorage.setItem('email', oAppointment.Email);
				let oResponse;
				if (oAppointment.ID === 'new') {
					this.getModel().getProperty('/ExistingAppointments').push(oAppointment);
					oResponse = await this.createAppointmentGC(oAppointment);
					this.addAppointmentIdToLocalStorage(oResponse.result.id);
				} else oResponse = await this.updateAppointmentGC(oAppointment);
				oAppointment = this.formatter.appointmentLocal.call(this, oResponse.result);
				this.refreshAppointment(oAppointment);
			},

			// Cancel Button
			onPressCloseAppointmentDialog() {
				this.oAppointmentDialog.close();
			},

			// Google Meet
			onPressAddGoogleMeet(oEvent) {
				const sPath = this.getPathByEvent(oEvent);
				const sGoogleMeet = this.getInitialAppointment()?.GoogleMeet;
				this.getModel().setProperty(sPath + '/GoogleMeet', sGoogleMeet ?? 'willBeCreated');
			},

			onPressRemoveGoogleMeet(oEvent) {
				const sPath = this.getPathByEvent(oEvent);
				this.getModel().setProperty(sPath + '/GoogleMeet', null);
			},

			// Pickers
			onChangePicker(oEvent, sField) {
				const oPicker = oEvent.getSource();
				const oAppointment = this.getObjectByEvent(oEvent);

				const bValueValid = oEvent.getParameter('valid') && !!oEvent.getParameter('value');
				if (!bValueValid) {
					// if wrong input reset value
					this.resetPickerValue(oPicker, oAppointment[sField]);
					return;
				}

				const oNewDate = oPicker.getDateValue();
				if (sField === 'StartDate') {
					this.updateAppointmentEndDateByDuration(oNewDate, oAppointment);
					this.setCalendarStartDate(oNewDate);
				}
				oAppointment[sField] = oNewDate;
				this.getModel().refresh(true);
			},

			onAfterCloseAppointmentDialog(oEvent) {
				const oAppointment = this.getObjectByEvent(oEvent);
				if (oAppointment.ID !== 'new') this.resetAppointment(oAppointment);
				this.setEditableAppointment(null);
				this.refreshAppointments();
			},

			//////////////////////////////////
			///////////// POPOVER ////////////
			//////////////////////////////////

			async openAppointmentPopover(sPath, oControl) {
				this.openPopover('AppointmentPopover', oControl, sPath);
			},

			// Edit Button
			onPressEditOpenAppointmentDialog(oEvent) {
				this.oAppointmentPopover.close();
				const oAppointment = this.getObjectByEvent(oEvent);
				this.setEditableAppointment(oAppointment);
				this.setInitialAppointment(oAppointment);
				this.openAppointmentDialog();
			},

			// Remove Button
			async onPressRemoveAppointment(oEvent) {
				this.oAppointmentPopover.close();
				const oAppointment = this.getObjectByEvent(oEvent);
				this.removeAppointment(oAppointment);
				await this.removeAppointmentGC(oAppointment.ID);
				this.removeAppointmentIdFromLocalStorage(oAppointment.ID);
			},

			// Close Button
			onPressCloseAppointmentPopover() {
				this.oAppointmentPopover.close();
			},

			// Copy Conference
			onPressCopyConferenceLink(oEvent) {
				const oAppointment = this.getObjectByEvent(oEvent);
				const sConferenceLink = oAppointment.GoogleMeet ?? oAppointment.Conference;
				this.copyToClipboard(sConferenceLink);
			},

			// Join to Conference
			onPressJoinToConference(oEvent) {
				const oAppointment = this.getObjectByEvent(oEvent);
				const sConferenceLink = oAppointment.GoogleMeet ?? oAppointment.Conference;
				sap.m.URLHelper.redirect(sConferenceLink, true);
			},

			//////////////////////////////////
			///////////// INPUTS /////////////
			//////////////////////////////////

			// Inputs
			validateEmailInput() {
				const oEmailInput = this.byId('inpEmail');
				if (this.isInputFilledAndValid(oEmailInput)) return [true];
				if (!oEmailInput.getValue()) {
					this.resetInputValue(oEmailInput);
					return [false, this.i18n('msgFillEmail')];
				}
				return [false, this.i18n('msgInvalidEmail')];
			},

			isInputFilledAndValid(oInput) {
				const bValid = oInput.getValueState() !== 'Error';
				const bFilled = oInput.getValue();
				return bValid && bFilled;
			},

			resetInputValue(oInput) {
				oInput.setValue('s');
				oInput.setValue('');
			},

			// Pickers
			resetPickerValue(oPicker, oDate) {
				oPicker.setValue('');
				oPicker.setDateValue(oDate);
			},

			//////////////////////////////////
			///////////// DATES //////////////
			//////////////////////////////////

			getDatesForNewAppointment() {
				const oStartDate = this.roundUpDateTo15Min(new Date());
				const oCalendarStartDate = this.byId('calendar').getStartDate();
				if (this.isDateInFuture(oCalendarStartDate)) {
					oStartDate.setTime(this.roundUpDateTo15Min(oCalendarStartDate).getTime());
				}

				const nDuration = this.getModel('view').getProperty('/appointmentDuration');
				const oEndDate = new Date(oStartDate.getTime() + nDuration);
				return [oStartDate, oEndDate];
			},

			roundUpDateTo15Min(oDate) {
				const nRemainder = oDate.getMinutes() % 15;
				return new Date(oDate.getTime() + (15 - nRemainder) * 60000);
			},

			isDateInFuture(oDate) {
				return new Date() < oDate;
			},

			areDatesInSameDay(oDate1, oDate2) {
				const nTime1 = new Date(oDate1).setHours(0, 0, 0, 0);
				const nTime2 = new Date(oDate2).setHours(0, 0, 0, 0);
				return nTime1 === nTime2;
			},

			//////////////////////////////////
			////////// APPOINTMENT ///////////
			//////////////////////////////////

			// Refresh
			refreshAppointment(oUpdatedAppointment) {
				const aAppointments = this.getExistingAppointments();
				aAppointments.forEach((oAppointment, i) => {
					const bThis = oAppointment.ID === oUpdatedAppointment.ID;
					if (bThis || oAppointment.ID === 'new') {
						aAppointments[i] = oUpdatedAppointment;
						return;
					}
				});
				this.refreshAppointments();
			},

			// Create
			createAppointment(oStartDate, oEndDate) {
				const oAppointment = {
					ID: 'new',
					Email: localStorage.getItem('email'),
					StartDate: oStartDate,
					EndDate: oEndDate,
					Mode: 'create',
					Type: 'Type01',
					GoogleMeet: 'willBeCreated'
				};
				this.setEditableAppointment(oAppointment);
				this.refreshAppointments();
				return oAppointment;
			},

			// Remove
			removeAppointment(oAppointment) {
				const aAppointments = this.getModel().getProperty('/ExistingAppointments');
				aAppointments.splice(aAppointments.indexOf(oAppointment), 1); // remove by index
				this.refreshAppointments();
			},

			// Reset
			resetAppointment(oAppointment) {
				const oInitialAppointment = this.getInitialAppointment();
				Object.keys(oInitialAppointment).forEach((sKey) => {
					oAppointment[sKey] = oInitialAppointment[sKey];
				});
			},

			// Update End Date
			updateAppointmentEndDateByDuration(oNewStartDate, oAppointment) {
				const nDuration = oAppointment.EndDate - oAppointment.StartDate;
				oAppointment.EndDate.setTime(oNewStartDate.getTime() + nDuration);
			},

			// Get Path
			getPathForAppointment(oAppointment) {
				const aAppointments = this.getModel().getProperty('/Appointments');
				return '/Appointments/' + aAppointments.indexOf(oAppointment);
			},

			// Get Editable
			getEditableAppointment() {
				return this.getModel().getProperty('/EditableAppointment');
			},

			setEditableAppointment(oAppointment) {
				this.getModel().setProperty('/EditableAppointment', oAppointment);
			},

			// Get Initial
			getInitialAppointment() {
				return this.getModel().getProperty('/InitialAppointment');
			},

			setInitialAppointment(oAppointment) {
				this.getModel().setProperty('/InitialAppointment', { ...oAppointment });
			},

			// Available
			isAppointmentAvailable(sAppointmentID) {
				const bNew = sAppointmentID === 'new';
				const bUserAppointmnet = this.getAvailableAppointmentIDs().includes(sAppointmentID);
				return bNew || bUserAppointmnet;
			},

			//////////////////////////////////
			////////// LOCAL STORAGE /////////
			//////////////////////////////////

			getAvailableAppointmentIDs() {
				return JSON.parse(localStorage.getItem('appointments')) ?? [];
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
			}
		});
	}
);
