sap.ui.define([
	'./BaseController',
	'sap/m/MessageToast',
	'sap/m/MessageBox',
	'../model/models',
	'../model/formatter',
	'../util/calendarManager'
], (BaseController, MessageToast, MessageBox, models, formatter, calendarManager) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Calendar', {
		formatter,

		onInit() {
			this.removeCalendarViews();
			this.setModel(models.createCalendarModel());
			this.setModel(models.createCalendarViewModel(), 'view');
			this.pCalendarAPI = this.initCalendarManager();
			this.attachRoutesMatched();
		},

		onAfterRendering() {
			// to see max count of appointments
			this.getModel().setSizeLimit(250);
		},

		//////////////////////////////////
		//////////// ROUTING /////////////
		//////////////////////////////////

		attachRoutesMatched() {
			['Calendar', 'Appointment', 'NewAppointment'].forEach(sRoute => 
				this.attachRouteMatched(sRoute, this[`on${sRoute}Matched`].bind(this))
			);
		},

		async onNewAppointmentMatched(oEvent) {
			this.onCalendarMatched(oEvent);
			await this.pCalendarAPI;
			const oQuery = oEvent.getParameter('arguments')['?query'] ?? {};
			const { title, agenda, start, end } = oQuery;
			const [Name, Description] = [title, agenda];
			const { StartDate, EndDate } = start && end 
				? { StartDate: new Date(start), EndDate: new Date(end) }
				: this.getDatesForNewAppointment();
			this.createAppointment({ Name, Description, StartDate, EndDate });
			this.setCalendarStartDate(StartDate);
			this.openAppointmentDialog();
		},

		async onAppointmentMatched(oEvent) {
			this.onCalendarMatched(oEvent);
			await this.pCalendarAPI;
			const { appointment } = oEvent.getParameter('arguments');
			calendarManager.get(appointment).then(oAppointment => {
				if (!oAppointment?.Available) throw new Error;
				this.setEditableAppointment(oAppointment);
				this.setInitialAppointment(oAppointment);
				this.openAppointmentDialog();
				this.byId('calendar').setStartDate(oAppointment.StartDate);
			}).catch(() => this.navigateTo('Calendar'));
		},

		onCalendarMatched(oEvent) {
			this.oAppointmentDialog?.close();
			const { view } = oEvent.getParameter('arguments');
			const oView = this.byId('calendar').getViewByKey(view);
			if (!oView) return this.navigateTo('Calendar');
			this.byId('calendar').setSelectedView(oView);
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
			this.setProperty('/ExistingAppointments', aAppointments);
			this.refreshAppointments();
		},

		getExistingAppointments() {
			return this.getProperty('/ExistingAppointments');
		},

		refreshAppointments() {
			this.setAppointmentsWithEditable();
		},

		setAppointmentsWithEditable() {
			const aAppointments = [...this.getExistingAppointments()];
			this.addEditableAppointment(aAppointments);
			this.setProperty('/Appointments', aAppointments);
		},

		addEditableAppointment(aAppointments) {
			const oEditableAppointment = this.getEditableAppointment();
			if (!oEditableAppointment) return;
			const bAlreadyHas = aAppointments.some((oAppointment, i) => {
				const bEditable = oAppointment.ID === oEditableAppointment.ID;
				return bEditable && (aAppointments[i] = oEditableAppointment);
			});
			if (!bAlreadyHas) aAppointments.push(oEditableAppointment);
		},

		//////////////////////////////////
		//////////// CALENDAR ////////////
		//////////////////////////////////

		// Create by Button
		onPressOpenAppointmentDialog() {
			this.navigateTo('NewAppointment');
		},

		// Create by Drag & Drop
		onAppointmentCreateOpenDialog(oEvent) {
			const oStartDate = oEvent.getParameter('startDate');
			const sMsg = this.i18n('msgStartDateMustBeInFuture')
			if (!this.isDateInFuture(oStartDate)) return MessageToast.show(sMsg);
			const start = oStartDate.toISOString();
			const end = oEvent.getParameter('endDate').toISOString();
			const oParams = { '?query': { start, end }};
			this.navigateTo('NewAppointment', oParams);
		},

		// Open Popover
		onAppointmentSelectOpenPopover(oEvent) {
			const oControl = oEvent.getParameter('appointment');
			if (!oControl || oControl.getSelected()) return;
			const oAppointment = this.getObjectByControl(oControl);
			const sMsgBusy = this.i18n('msgBusyAtThisTime');
			if (!oAppointment.Available) return MessageToast.show(sMsgBusy);
			const sPath = this.getPathByControl(oControl);
			this.openPopover('AppointmentPopover', oControl, sPath);
		},

		// Resize & Drop
		onAppointmentResizeDrop(oEvent) {
			const { appointment } = oEvent.getParameters();
			const oAppointment = this.getObjectByControl(appointment);
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
			const sViewId = oEvent.getSource().getSelectedView();
			const view = sViewId.replace(this.createId(''), '');
			this.navigateTo('Calendar', { view });
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
				const aAppointments = await calendarManager.list(...aDates);
				this.setAppointments(aAppointments);
			} catch {
				MessageBox.error(this.i18n('msgErrorFetchingAppointments'));
			}	
			this.setBusy(false);
		},

		removeCalendarViews() {
			const oDevice = this.getOwnerComponent().getModel('device').getData();
			const bSmallScreen = oDevice.system.phone || oDevice.resize.width <= 800;
			const oCalendar = this.byId('calendar');
			(bSmallScreen ? ['week'] : ['two-days', 'three-days'])
				.forEach(sKey => oCalendar.removeView(oCalendar.getViewByKey(sKey)));
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
			const oAppointment = this.getObjectByEvent(oEvent);
			localStorage.setItem('email', oAppointment.Email);
			if (oAppointment.ID === 'new') this.createAppointmentGC(oAppointment);
			else this.updateAppointmentGC(oAppointment);
		},

		async createAppointmentGC(oAppointment) {
			this.getProperty('/ExistingAppointments').push(oAppointment);
			try {
				oAppointment = await calendarManager.create(oAppointment);
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
				oAppointment = await calendarManager.update(oAppointment);
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
			const sPath = `${this.getPathByEvent(oEvent)}/GoogleMeet`;
			const sGoogleMeet = this.getInitialAppointment()?.GoogleMeet;
			this.setProperty(sPath, sGoogleMeet ?? 'willBeCreated');
		},

		onPressRemoveGoogleMeet(oEvent) {
			const sPath = `${this.getPathByEvent(oEvent)}/GoogleMeet`;
			this.setProperty(sPath, null);
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
			this.refreshModel();
		},

		onAfterCloseAppointmentDialog(oEvent) {
			const oAppointment = this.getObjectByEvent(oEvent);
			if (oAppointment.ID !== 'new') this.resetEditableAppointment();
			this.setEditableAppointment(null);
			this.refreshAppointments();
			this.navigateTo('Calendar');
		},

		//////////////////////////////////
		///////////// POPOVER ////////////
		//////////////////////////////////

		// Edit Button
		onPressEditOpenAppointmentDialog(oEvent) {
			this.oAppointmentPopover.close();
			const { ID: appointment } = this.getObjectByEvent(oEvent);
			this.navigateTo('Appointment', { appointment });
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
				await calendarManager.remove(oAppointment.ID);
				MessageToast.show(this.i18n('msgAppointmentWasRemoved'));
			} catch {
				MessageBox.error(this.i18n('msgErrorRemovingAppointment'));
				this.getProperty('/ExistingAppointments').push(oAppointment);
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
			const StartDate = this.roundUpDateTo15Min(new Date());
			const oCalendarStartDate = this.byId('calendar').getStartDate();
			if (this.isDateInFuture(oCalendarStartDate)) {
				StartDate.setTime(this.roundUpDateTo15Min(oCalendarStartDate).getTime());
			}

			const iDuration = this.getProperty('/appointmentDuration', 'view');
			const EndDate = new Date(StartDate.getTime() + iDuration);
			return { StartDate, EndDate };
		},

		roundUpDateTo15Min(oDate) {
			const iRemainder = oDate.getMinutes() % 15;
			return new Date(oDate.getTime() + (15 - iRemainder) * 60000);
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
		createAppointment(oParams) {
			const oAppointment = {
				ID: 'new',
				Email: localStorage.getItem('email'),
				Mode: 'create',
				Available: true,
				GoogleMeet: 'willBeCreated',
				...oParams
			};
			this.setEditableAppointment(oAppointment);
			this.refreshAppointments();
			return oAppointment;
		},

		// Remove
		removeAppointment(oAppointment) {
			const aAppointments = this.getProperty('/ExistingAppointments');
			aAppointments.splice(aAppointments.indexOf(oAppointment), 1); // remove by index
			this.refreshAppointments();
		},

		// Reset
		resetEditableAppointment() {
			const sID = this.getEditableAppointment().ID;
			const aAppointments = this.getExistingAppointments();
			const oAppointment = aAppointments.find(oAppointment => oAppointment.ID === sID);
			const oInitialAppointment = this.getInitialAppointment();
			Object.keys(oAppointment ?? {}).forEach((sKey) => {
				oAppointment[sKey] = oInitialAppointment[sKey];
			});
		},

		// Update End Date
		updateAppointmentEndDateByDuration(oNewStartDate, oAppointment) {
			const iDuration = oAppointment.EndDate - oAppointment.StartDate;
			oAppointment.EndDate = new Date(oNewStartDate.getTime() + iDuration);
		},

		// Get Editable
		getEditableAppointment() {
			return this.getProperty('/EditableAppointment');
		},

		setEditableAppointment(oAppointment) {
			this.setProperty('/EditableAppointment', oAppointment);
		},

		// Get Initial
		getInitialAppointment() {
			return this.getProperty('/InitialAppointment');
		},

		setInitialAppointment(oAppointment) {
			this.setProperty('/InitialAppointment', { ...oAppointment });
		}

	});
});
