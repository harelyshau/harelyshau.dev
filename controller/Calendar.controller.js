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

        onAfterRendering() {
            // to see max count of appointments
            this.getModel().setSizeLimit(250);
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
            const oAppointmentGC = formatter.gcEvent(oAppoinment);
            
            try {
                return await gapi.client.calendar.events.insert({
                    calendarId: "pavel@harelyshau.dev",
                    // guestsCanModify: true,
                    conferenceDataVersion: 1,
                    sendUpdates: "all",
                    resource: oAppointmentGC
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
            const oAppointmentGC = formatter.gcEvent(oAppoinment);

            try {
                await gapi.client.calendar.events.update({
                    calendarId: "pavel@harelyshau.dev",
                    eventId: oAppoinment.ID,
                    resource: oAppointmentGC
                });
            } catch (oError) {
                console.error("Error updating appointment:", oError);
            }
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
            const oAppoinment = oControl.getBindingContext().getObject();

            if (this.getAvailableAppointmentIDs().includes(oAppoinment.ID)) {
                // show popover only when this is user's appointment
                const sPath = this.getPathForAppoinment(oAppoinment);
                this.openAppoinmentPopover(sPath, oControl);
            } else {
                new MessageToast.show(this.i18n("msgBusyAtThisTime"));
            }
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
            oCalendar.setStartDate(oDate);
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
                Email: localStorage.getItem("email"),
                StartDate: oStartDate,
                EndDate: oEndDate,
                Duration: oEndDate.getTime() - oStartDate.getTime(),
                Mode: "create",
                Type: "Type01"
            }
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.push(oAppoinment)
            this.getModel().setProperty("/Appointments", aAppointments);
            return oAppoinment;
        },

        async onPressCreateEditAppointment(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            const oAppoinment = oBindingContext.getObject();
            const sMode = oAppoinment.Mode;

            localStorage.setItem("email", oAppoinment.Email);
            this.getModel().setProperty(oBindingContext.getPath() + "/Mode", "view");

            this.oAppointmentDialog.close();

            if (sMode === "create") {
                const oResponse = await this.createAppointmentGC(oAppoinment);
                const sAppointmentID = oResponse.result.id;
                this.addAppointmentIdToLocalStorage(sAppointmentID);
                this.getModel().setProperty(oBindingContext.getPath() + "/ID", sAppointmentID);
            } else if (sMode === "edit") {
                await this.updateAppointmentGC(oAppoinment);
            }
        },

        addAppointmentIdToLocalStorage(sAppointmentID) {
            const aAppointmentIDs = this.getAvailableAppointmentIDs();
            aAppointmentIDs.push(sAppointmentID);
            localStorage.setItem("appointments", JSON.stringify(aAppointmentIDs));
        },

        removeAppointmentIdFromLocalStorage(sAppointmentID) {
            const aAppointmentIDs = this.getAvailableAppointmentIDs();
            aAppointmentIDs.splice(aAppointmentIDs.indexOf(sAppointmentID), 1);
            localStorage.setItem("appointments", JSON.stringify(aAppointmentIDs));
        },

        getAvailableAppointmentIDs() {
            return JSON.parse(localStorage.getItem("appointments")) ?? [];
        },

        // Appoinment cancel
        
        onPressCloseAppointmentDialog() {
            this.oAppointmentDialog.close();
        }, 

        onAfterCloseAppointmentDialog(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            const sMode = oBindingContext.getProperty("Mode");
            if (sMode === "create") {
                this.removeAppointmentLocal(oBindingContext.getObject());
            } else if (sMode === "edit") {
                this.resetAppointmentLocal(oBindingContext.getObject());
            }
        },

        resetAppointmentLocal(oAppoinment) {
            const sPath = this.getPathForAppoinment(oAppoinment);
            const oInitialAppoinment = this.getModel("view").getProperty("/initialAppointment");
            this.getModel().setProperty(sPath, oInitialAppoinment);
            this.byId("calendar").setStartDate(oInitialAppoinment.StartDate);
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
            const oBindingContext = oEvent.getSource().getBindingContext();
            const sPath = oBindingContext.getPath();
            this.getModel().setProperty(sPath + "/Mode", "edit");
            await this.openAppoinmentDialog(sPath);

            // write to view model initial appointment to reset it if necessary
            const oInitialAppoinment = {...oBindingContext.getObject()};
            this.getModel("view").setProperty("/initialAppointment", oInitialAppoinment);

            this.oAppointmentPopover.close();
        },

        onPressDeleteAppointment(oEvent) {
            this.oAppointmentPopover.close();
            const oAppoinment = oEvent.getSource().getBindingContext().getObject()
            this.removeAppointmentGC(oAppoinment.ID);
            this.removeAppointmentLocal(oAppoinment);
            this.removeAppointmentIdFromLocalStorage(oAppoinment.ID);
        },

        onPressCloseAppointmentPopover() {
            this.oAppointmentPopover.close();
        }

    });
});