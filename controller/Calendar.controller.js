sap.ui.define(
	[
		'./BaseController',
		'sap/m/MessageToast',
		'sap/m/MessageBox',
		'sap/m/SinglePlanningCalendarDayView',
		'sap/m/SinglePlanningCalendarWorkWeekView',
		'sap/m/SinglePlanningCalendarWeekView',
		'sap/m/SinglePlanningCalendarMonthView',
		'../fragment/Calendar/TwoDaysView',
		'../fragment/Calendar/ThreeDaysView',
		'../model/models',
		'../model/formatter',
		'../util/calendarManager'
	],
	(
		BaseController,
		MessageToast,
		MessageBox,
		DayView,
		WorkWeekView,
		WeekView,
		MonthView,
		TwoDaysView,
		ThreeDaysView,
		models,
		formatter,
		calendarManager
	) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Calendar', {
			formatter,

			onInit() {
				this.addCalendarViews();
				this.setModel(models.createCalendarModel());
				this.setModel(models.createCalendarViewModel(), 'view');
				this.initCalendarManager();
				this.getRouter().getRoute('Calendar').attachMatched(this.onCalendarMatched.bind(this));
			},

			onAfterRendering() {
				// to see max count of appointments
				this.getModel().setSizeLimit(250);
			},

			onCalendarMatched(oEvent) {
				const sView = oEvent.getParameter('arguments').view;
				const oView = this.byId('calendar').getViewByKey(sView);
				if (!oView) return this.getRouter().navTo('Calendar');
				this.byId('calendar').setSelectedView(sView);
			},

			//////////////////////////////////
			////// GOOGLE CALENDAR API ///////
			//////////////////////////////////

			async initCalendarManager() {
				await calendarManager.init();
				this.refreshCalendar();
				this.byId('btnMakeAppointment').setEnabled(true);
			},

			// Read Request Filtering
			getDateRange() {
				const oSelectedDate = this.byId('calendar').getStartDate();
				const oStartDate = new Date(oSelectedDate);
				const oEndDate = new Date(oSelectedDate);

				oStartDate.setDate(1);
				oStartDate.setHours(0, 0, 0);
				oStartDate.setMonth(oStartDate.getMonth() - 1);

				oEndDate.setHours(23, 59, 59);
				oEndDate.setMonth(oEndDate.getMonth() + 2);
				oEndDate.setDate(0);

				return [oStartDate, oEndDate];
			},

			//////////////////////////////////
			////////// JSON MODEL ////////////
			//////////////////////////////////

			setAppointments(aAppointments) {
				this.getModel().setProperty('/ExistingAppointments', aAppointments);
				this.refreshAppointments();
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
					const bEditable = oAppointment.ID === oEditableAppointment.ID;
					return bEditable && !!(aAppointments[i] = oEditableAppointment);
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
				if (!oAppointment.Available) {
					MessageToast.show(this.i18n('msgBusyAtThisTime'));
					return;
				}
				const sPath = this.getPathByControl(oControl);
				this.openPopover('AppointmentPopover', oControl, sPath);
			},

			// Resize & Drop
			onAppointmentResizeDrop(oEvent) {
				const oAppointment = this.getObjectByControl(oEvent.getParameter('appointment'));
				if (!oAppointment.Available || oAppointment.ID === 'new') return;
				this.setInitialAppointment(oAppointment);
				oAppointment.StartDate = oEvent.getParameter('startDate');
				oAppointment.EndDate = oEvent.getParameter('endDate');
				this.updateAppointmentGC(oAppointment);
			},

			onStartDateChangeCalendar() {
				this.refreshCalendar();
			},

			onMoreLinkPress(oEvent) {
				this.setCalendarDayView(oEvent);
			},

			onHeaderDateSelect(oEvent) {
				this.setCalendarDayView(oEvent);
			},

			onViewChange(oEvent) {
				const view = oEvent.getSource().getSelectedView();
				this.getRouter().navTo('Calendar', { view });
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

			setCalendarDayView(oEvent) {
				const oCalendar = this.byId('calendar');
				oCalendar.setStartDate(oEvent.getParameter('date'));
				oCalendar.setSelectedView(oCalendar.getViews()[0]); // DayView
			},

			async refreshCalendar() {
				this.setBusy(true);
				const aDates = this.getDateRange();
				try {
					const aAppointments = await calendarManager.getAppointments(...aDates);
					this.setAppointments(aAppointments);
				} catch {
					MessageBox.error(this.i18n('msgErrorFetchingAppointments'));
				}	
				this.setBusy(false);
			},

			addCalendarViews() {
				const oDeviceData = this.getOwnerComponent().getModel('device').getData();
				const bDevicePhone = oDeviceData.system.phone;
				const bSmallWidth = oDeviceData.resize.width <= 800;
				const bSmallScreen = bDevicePhone || bSmallWidth;
				const aDiffViewKeys = bSmallScreen
					? ['two-days', 'three-days', 'work-week']
					: ['work-week', 'week'];
				const aViewKeys = ['day', ...aDiffViewKeys, 'month'];
				aViewKeys.forEach((sViewKey) => this.addCalendarView(sViewKey));
			},

			addCalendarView(key) {
				const oViews = {
					DayView,
					WorkWeekView,
					WeekView,
					MonthView,
					TwoDaysView,
					ThreeDaysView
				};
				const sPascalCaseKey = key
					.split('-')
					.map((s) => s[0].toUpperCase() + s.slice(1))
					.join('');
				const title = this.i18n(`ttl${sPascalCaseKey}`);
				const oViewParams = { id: key, key, title };
				const oView = new oViews[`${sPascalCaseKey}View`](oViewParams);
				this.byId('calendar').addView(oView);
			},

			//////////////////////////////////
			///////////// DIALOG /////////////
			//////////////////////////////////

			openAppointmentDialog() {
				this.openDialog('AppointmentDialog', '/EditableAppointment');
			},

			// Save Button
			async onPressCreateEditAppointment(oEvent) {
				if (!this.validateEmailInput()) return;
				this.oAppointmentDialog.close();
				let oAppointment = this.getObjectByEvent(oEvent);
				localStorage.setItem('email', oAppointment.Email);
				if (oAppointment.ID === 'new') this.createAppointmentGC(oAppointment);
				else this.updateAppointmentGC(oAppointment);
			},

			async createAppointmentGC(oAppointment) {
				this.getModel().getProperty('/ExistingAppointments').push(oAppointment);
				try {
					oAppointment = await calendarManager.createAppointment(oAppointment);
					MessageToast.show(this.i18n('msgAppointmentWasCreated'));
					this.refreshAppointment(oAppointment);
				} catch {
					MessageBox.error(this.i18n('msgErrorCreatingAppointment'));
					this.removeAppointment(oAppointment);
				}
			},

			async updateAppointmentGC(oAppointment) {
				const oInitialAppointment = this.getInitialAppointment();
				const bNoChanges = JSON.stringify(oInitialAppointment) === JSON.stringify(oAppointment);
				if (bNoChanges) return MessageToast.show(this.i18n('msgNoChanges'));
				this.setInitialAppointment(oAppointment);
				try {
					oAppointment = await calendarManager.updateAppointment(oAppointment);
					MessageToast.show(this.i18n('msgAppointmentWasUpdated'));
				} catch {
					MessageBox.error(this.i18n('msgErrorUpdatingAppointment'));
					this.setInitialAppointment(oInitialAppointment);
					oAppointment = oInitialAppointment;
				}
				this.refreshAppointment(oAppointment);
			},

			// Google Meet
			onPressAddGoogleMeet(oEvent) {
				const sPath = this.getPathByEvent(oEvent) + '/GoogleMeet';
				const sGoogleMeet = this.getInitialAppointment()?.GoogleMeet;
				this.getModel().setProperty(sPath, sGoogleMeet ?? 'willBeCreated');
			},

			onPressRemoveGoogleMeet(oEvent) {
				const sPath = this.getPathByEvent(oEvent) + '/GoogleMeet';
				this.getModel().setProperty(sPath, null);
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
				if (oAppointment.ID !== 'new') this.resetEditableAppointment();
				this.setEditableAppointment(null);
				this.refreshAppointments();
			},

			//////////////////////////////////
			///////////// POPOVER ////////////
			//////////////////////////////////

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
				this.removeAppointmentGC(oAppointment);
			},

			async removeAppointmentGC(oAppointment) {
				this.removeAppointment(oAppointment);
				try {
					await calendarManager.removeAppointment(oAppointment.ID);
					MessageToast.show(this.i18n('msgAppointmentWasRemoved'));
				} catch {
					MessageBox.error(this.i18n('msgErrorRemovingAppointment'));
					this.getModel().getProperty('/ExistingAppointments').push(oAppointment);
					this.refreshAppointment(oAppointment);
				}
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
				if (this.isInputFilledAndValid(oEmailInput)) return true;
				const bEmpty = !oEmailInput.getValue();
				if (bEmpty) this.resetInputValue(oEmailInput);
				MessageToast.show(this.i18n(bEmpty ? 'msgFillEmail' : 'msgInvalidEmail'));
				return false;
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
				for (let i = aAppointments.length - 1; i >= 0; i--) {
					const bThis = aAppointments[i].ID === oUpdatedAppointment.ID;
					if (bThis || aAppointments[i].ID === 'new') {
						aAppointments[i] = oUpdatedAppointment;
						break;
					}
				}
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
					Available: true,
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
			resetEditableAppointment() {
				const sID = this.getEditableAppointment().ID;
				const aAppointments = this.getExistingAppointments();
				const oAppointment = aAppointments.find(oAppointment => oAppointment.ID === sID);
				const oInitialAppointment = this.getInitialAppointment();
				Object.keys(oInitialAppointment).forEach((sKey) => {
					oAppointment[sKey] = oInitialAppointment[sKey];
				});
			},

			// Update End Date
			updateAppointmentEndDateByDuration(oNewStartDate, oAppointment) {
				const nDuration = oAppointment.EndDate - oAppointment.StartDate;
				oAppointment.EndDate = new Date(oNewStartDate.getTime() + nDuration);
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
			}

		});
	}
);
