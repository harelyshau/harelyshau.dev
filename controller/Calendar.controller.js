sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast",
    "sap/m/SinglePlanningCalendarDayView",
    "sap/m/SinglePlanningCalendarWorkWeekView",
    "sap/m/SinglePlanningCalendarWeekView",
    "sap/m/SinglePlanningCalendarMonthView",
    "../fragment/Calendar/TwoDaysView",
    "../fragment/Calendar/ThreeDaysView",
    "../model/models",
    "../model/formatter"
], (BaseController, MessageToast, DayView, WorkWeekView, WeekView, MonthView, TwoDaysView, ThreeDaysView, models, formatter) => {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Calendar", {

        formatter,

        onInit() {
            // load google api
            this.loadGoogleAPI();
            // load node.js authorization function
            const script = document.createElement("script");
            script.src = "util/getAccessTokenFromServiceAccount.js";
            document.head.appendChild(script);
            // set the calendar model
            this.setModel(models.createCalendarModel());
            // create the calendar view model
            this.setModel(models.createCalendarViewModel(), "view");
            // create and add views for calendar
            this.addCalendarViews();
        }, 

        //////////////////////////////////
        ////// GOOGLE CALENDAR API ///////
        //////////////////////////////////

        loadGoogleAPI() {
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.onload = () => {
                gapi.load("client", this.initGoogleApiClient.bind(this));
            };
            document.head.appendChild(script);
        },

        async initGoogleApiClient() {
            const oResponse = await fetch("resource/data/GapiServiceAccountCreds.json");
            const oCredentials = await oResponse.json();
            try {
                await gapi.client.init({
                    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                });
                gapi.auth.setToken(await getAccessTokenFromServiceAccount.do(oCredentials));
                this.updateDateRange();
                this.getAppointmentsGC();
            } catch (oError) {
                console.error("Error initializing Google Calendar API:", oError.error);
            } finally {
                this.getModel("view").setProperty("/busy", false);
            }
        },

        // Requests

        async getAppointmentsGC() { // GC = Google Calendar
            const oViewModel = this.getModel("view");
            const oParams = {
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: oViewModel.getProperty("/timeMin").toISOString(),
                timeMax: oViewModel.getProperty("/timeMax").toISOString(),
                singleEvents: true,
                maxResults: 250 // max value is 250
            }
            oViewModel.setProperty("/busy", true);

            try {
                const oResponse = await gapi.client.calendar.events.list(oParams);
                this.setAppoitments(oResponse.result.items);
            } catch (oError) {
                console.error("Error fetching appointments:", oError);
            } finally {
                oViewModel.setProperty("/busy", false);
            }
        },

        async createAppointmentGC(oAppoinment) {
            const oEvent = formatter.gcEvent(oAppoinment);
            
            try {
                await gapi.client.calendar.events.insert({
                    calendarId: "pavel@harelyshau.dev",
                    // guestsCanModify: true,
                    conferenceDataVersion: 1,
                    sendUpdates: "all",
                    resource: oEvent
                });
            } catch (oError) {
                console.error("Error creating appointment:", oError);
            }
        },

        async removeAppointmentGC(sAppointmentID) {
            try {
                await gapi.client.calendar.events.delete({
                    calendarId: this.getModel().getProperty("/Email"),
                    eventId: sAppointmentID,
                    sendUpdates: "all"
                });
            } catch (oError) {
                console.error("Error deleting appointment:", oError);
            }
        },

        async updateAppointmentGC(oAppoinment) {

        },

        setAppoitments(aAppointments) {
            const aFormattedAppointments = formatter.formattedAppointments(aAppointments);
            this.getModel().setProperty("/Appointments", aFormattedAppointments);
        },

        updateDateRange() {
            const oViewModel = this.getModel("view");
            const oSelectedDate = this.byId("calendar").getStartDate();
            const oStartDate = new Date(oSelectedDate.getTime());
            const oEndDate = new Date(oSelectedDate.getTime());

            oStartDate.setDate(1);
            oStartDate.setHours(0, 0, 0);
            oStartDate.setMonth(oStartDate.getMonth() - 1);

            oEndDate.setHours(23, 59, 59);
            oEndDate.setMonth(oEndDate.getMonth() + 2);
            oEndDate.setDate(0);

            oViewModel.setProperty("/timeMin", oStartDate);
            oViewModel.setProperty("/timeMax", oEndDate);
        },

        //////////////////////////////////
        //////////// CALENDAR ////////////
        //////////////////////////////////

        onPressOpenAppointmentDialog() { // create by button
            const oAppointment = this.createAppointmentLocal();
            const sPath = this.getPathForAppoinment(oAppointment);
            this.openAppoinmentDialog(sPath);
        },

        onAppointmentCreateOpenDialog(oEvent) { // create by drag and drop
            const oStartDate = oEvent.getParameter("startDate");
            const sStartDateErrorText = formatter.startDateErrorText(oStartDate);
            if (sStartDateErrorText !== "") {
                new MessageToast.show(sStartDateErrorText);
                return;
            }
            const oEndDate = oEvent.getParameter("endDate");
            const oAppointment = this.createAppointmentLocal(oStartDate, oEndDate);
            const sPath = this.getPathForAppoinment(oAppointment);
            this.openAppoinmentDialog(sPath);
        },

        onAppointmentSelectOpenPopover(oEvent) {
            const oControl = oEvent.getParameter("appointment");
            if (!oControl || oControl.getSelected()) {
                return;
            }
            const sPath = this.getPathForAppoinment(oControl.getBindingContext().getObject());
            this.openAppoinmentPopover(sPath, oControl);
        },

        addCalendarViews() {
            const oDeviceModel = this.getOwnerComponent().getModel("device");
            const oCalendar = this.byId("calendar");
            const bDevicePhone = oDeviceModel.getProperty("/system/phone");
            const bDeviceSmallWidth = oDeviceModel.getProperty("/resize/width") <= 800;

            oCalendar.addView(new DayView({ key: "day", title: this.i18n("ttlDay") }));
            // Add views for mobile and small size screens
            if (bDevicePhone || bDeviceSmallWidth) {
                oCalendar.addView(new TwoDaysView({ key: "2days", title: this.i18n("ttl2Days") }));
                oCalendar.addView(new ThreeDaysView({ key: "3days", title: this.i18n("ttl3Days") }));
            }
            oCalendar.addView(new WorkWeekView({ key: "workWeek", title: this.i18n("ttlWorkWeek") }));
            // Add week view for desktop device
            if (!bDevicePhone && !bDeviceSmallWidth) {
                oCalendar.addView(new WeekView({ key: "week", title: this.i18n("ttlWeek") }));
            }
            oCalendar.addView(new MonthView({ key: "month", title: this.i18n("ttlMonth") }));
        },

        onStartDateChangeCalendar() {
            this.updateDateRange();
            this.getAppointmentsGC();
        },

        onMoreLinkPress(oEvent) {
            const oDate = oEvent.getParameter("date");
            const oCalendar = oEvent.getSource();
            oCalendar.setSelectedView(oCalendar.getViews()[0]); // DayView
        },

        onPressToggleFullDay(oEvent) {
            const bPressed = oEvent.getSource().getProperty("pressed");
            if (bPressed) {
                localStorage.setItem("fullDay", true);
            } else {
                localStorage.removeItem("fullDay");
            }
        },

        //////////////////////////////////
        ///////////// DIALOG /////////////
        //////////////////////////////////

        async openAppoinmentDialog(sPath) {
            if (!this.oAppointmentDialog) {
                this.oAppointmentDialog = await this.loadFragment({
                    name: "pharelyshau.fragment.Calendar.AppointmentDialog"
                });
                this.oAppointmentDialog.addStyleClass(this.getContentDensityClass());
            } 

            this.oAppointmentDialog.bindElement(sPath);
            this.oAppointmentDialog.open();
        },

        getPathForAppoinment(oAppoinment) {
            const aAppointments = this.getModel().getProperty("/Appointments");
            return "/Appointments/" + aAppointments.indexOf(oAppoinment);
        },

        // Appointment create

        createAppointmentLocal(oStartDate, oEndDate) {
            oStartDate = oStartDate ?? new Date(new Date().getTime() + 3600000); // plus one hour
            oEndDate = oEndDate ?? new Date(new Date().getTime() + 7200000); // plus two hours
            const oAppoinment = {
                ID: "newAppointment",
                Email: "some@email.com",
                StartDate: oStartDate,
                EndDate: oEndDate,
                Duration: oEndDate.getTime() - oStartDate.getTime(),
                Mode: "create"
            }
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.push(oAppoinment)
            this.getModel().setProperty("/Appointments", aAppointments);
            return oAppoinment;
        },

        onPressCreateAppointment(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            this.getModel().setProperty(oBindingContext.getPath() + "/Mode", "view");
            this.createAppointmentGC(oBindingContext.getObject());
            this.oAppointmentDialog.close();
        },

        // Appoinment cancel
        
        onPressCloseAppointmentDialog() {
            this.oAppointmentDialog.close();
        }, 

        onBeforeCloseAppointmentDialog(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext.getProperty("Mode") === "create") {
                this.removeAppointmentLocal(oBindingContext.getObject());
            }
            if (oBindingContext.getProperty("Mode") === "edit") {
                this.getModel().setProperty(oBindingContext.getPath() + "/Mode", "view");
            }
        },

        removeAppointmentLocal(oAppoinment) {
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.splice(aAppointments.indexOf(oAppoinment), 1); // remove by index
            this.getModel().setProperty("/Appoitments", aAppointments);
        },

        // Pickers

        onChangePickerStartDate(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            const oAppoinment = oBindingContext.getObject();
            const oStartDate = oAppoinment.StartDate;
            const bControlValid = oEvent.getParameter("valid") && !!oEvent.getParameter("value");
            const bFieldNotValid = oAppoinment.Mode === "create" && !this.isAppointmentDatesValid(oStartDate);
            if (!bControlValid || bFieldNotValid) {
                return;
            }

            this.updateAppointmentEndDateByDuration(oBindingContext.getPath());
            this.byId("calendar").setStartDate(oStartDate);
        },

        onChangePickerEndDate(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            const oAppoinment = oBindingContext.getObject();
            const bControlValid = oEvent.getParameter("valid") && !!oEvent.getParameter("value");
            const bFieldNotValid = !this.isAppointmentDatesValid(oAppoinment.StartDate, oAppoinment.EndDate);
            if (!bControlValid || bFieldNotValid) {
                return;
            }

            const sPath = oBindingContext.getPath();
            this.updateAppointmentDuration(sPath);
        },

        updateAppointmentDuration(sPath) {
            const oAppoinment = this.getModel().getProperty(sPath);
            const nStartTime = oAppoinment.StartDate.getTime();
            const nEndTime = oAppoinment.EndDate.getTime();
            this.getModel().setProperty(sPath + "/Duration", nEndTime - nStartTime);
        },

        updateAppointmentEndDateByDuration(sPath) {
            const oStartDate = this.getModel().getProperty(sPath + "/StartDate");
            const nDuration = this.getModel().getProperty(sPath + "/Duration");
            this.getModel().setProperty(sPath + "/EndDate", new Date(oStartDate.getTime() + nDuration));
        },

        isAppointmentDatesValid(oStartDate, oEndDate) {
            const bValidStartDate = !oStartDate || formatter.startDateState(oStartDate) !== "Error";
            const bValidEndDate = !oStartDate || !oEndDate || formatter.endDateState(oStartDate, oEndDate) !== "Error";
            return bValidStartDate && bValidEndDate;
        },

        //////////////////////////////////
        ///////////// POPOVER ////////////
        //////////////////////////////////

        async openAppoinmentPopover(sPath, oControl) {
            if (!this.oAppointmentPopover) {
                this.oAppointmentPopover = await this.loadFragment({
                    name: "pharelyshau.fragment.Calendar.AppointmentPopover"
                });
            }

            this.oAppointmentPopover.bindElement(sPath);
            this.oAppointmentPopover.openBy(oControl);
        },

        async onPressEditOpenAppointmentDialog(oEvent) {
            const sPath = oEvent.getSource().getBindingContext().getPath();
            this.getModel().setProperty(sPath + "/Mode", "edit");
            await this.openAppoinmentDialog(sPath);
            this.oAppointmentPopover.close();
        },

        onPressDeleteAppointment(oEvent) {
            this.oAppointmentPopover.close();
            const oAppoinment = oEvent.getSource().getBindingContext().getObject()
            this.removeAppointmentGC(oAppoinment.ID);
            this.removeAppointmentLocal(oAppoinment);
        },

        onPressCloseAppointmentPopover() {
            this.oAppointmentPopover.close();
        }

    });
});