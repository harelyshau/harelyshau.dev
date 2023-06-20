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
            gapi.client.init({
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            }).then(async () => {
                gapi.auth.setToken(await getAccessTokenFromServiceAccount.do(oCredentials));
                this.updateDateRange();
                this.getAppointmentsGC();
            }, (oError) => {
                this.getModel("view").setProperty("/busy", false);
                console.error("Error initializing Google Calendar API:", oError.error);
            });
        },

        // Requests

        getAppointmentsGC() { // GC = Google Calendar
            const oViewModel = this.getModel("view");
            const oParams = {
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: oViewModel.getProperty("/timeMin").toISOString(),
                timeMax: oViewModel.getProperty("/timeMax").toISOString(),
                singleEvents: true,
                maxResults: 250 // max value is 250
            }
            oViewModel.setProperty("/busy", true);
            gapi.client.calendar.events.list(oParams)
                .then((oResponse) => {
                    this.setAppoitments(oResponse.result.items);
                    oViewModel.setProperty("/busy", false);
                }, (oError) => {
                    console.error("Error fetching appointments:", oError);
                    oViewModel.setProperty("/busy", false);
                });
        },

        createAppointmentGC(oAppoinment) {
            const oEvent = {
                summary: oAppoinment.Name,
                description: oAppoinment.Description,
                start: {
                    dateTime: oAppoinment.StartDate.toISOString()
                },
                end: {
                    dateTime: oAppoinment.EndDate.toISOString()
                },
                attendees: [
                    // { email: "pavel@harelyshau.dev" },
                    // { email: "example2@example.com" }
                ],
                source: {
                    title: "Meeting from harelyshau.dev",
                    url: window.location.href
                },
                // conferenceData: {
                //     createRequest: {
                //       requestId: oAppoinment.Email,
                //     },
                // },
            };

            gapi.client.calendar.events.insert({
                calendarId: "pavel@harelyshau.dev",
                // guestsCanModify: true,
                conferenceDataVersion: 1,
                sendUpdates: "all",
                resource: oEvent
            }).then((oResponse) => {
                console.log("Appointment created:", oResponse.result);
            }, (oError) => {
                console.error("Error creating appointment:", oError);
            });
        },

        removeAppointmentGC(sAppointmentID) {
            gapi.client.calendar.events.delete({
                calendarId: this.getModel().getProperty("/Email"),
                eventId: sAppointmentID,
                sendUpdates: "all"
            }).then((oResponse) => {
                console.log("Appointment deleted:", oResponse);
            }, (oError) => {
                console.error("Error deleting appointment:", oError);
            });
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
            if (!oControl) {
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
                localStorage.setItem("fullDay", bPressed);
            } else {
                localStorage.removeItem("fullDay");
            }
        },

        //////////////////////////////////
        ///////////// DIALOG /////////////
        //////////////////////////////////

        openAppoinmentDialog(sPath) {
            if (!this.oAppointmentDialog) {
                this.loadFragment({
                    name: "pharelyshau.fragment.Calendar.AppointmentDialog"
                }).then((oDialog) => {
                    this.oAppointmentDialog = oDialog;
                    oDialog.addStyleClass(this.getContentDensityClass());
                    oDialog.bindElement(sPath);
                    oDialog.open();
                });
            } else {
                this.oAppointmentDialog.bindElement(sPath);
                this.oAppointmentDialog.open();
            }
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
                Mode: "create"
            }
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.push(oAppoinment)
            this.getModel().setProperty("/Appointments", aAppointments);
            this.setPickersValue(oStartDate, oEndDate)
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
        },

        removeAppointmentLocal(oAppoinment) {
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.splice(aAppointments.indexOf(oAppoinment), 1); // remove by index
            this.getModel().setProperty("/Appoitments", aAppointments);
        },

        // Pickers

        setPickersValue(oStartDate, oEndDate) {
            const oViewModel = this.getModel("view");
            oViewModel.setProperty("/pickers/startDate", oStartDate);
            oViewModel.setProperty("/pickers/endDate", oEndDate);
        },

        onChangePickerStartDate(oEvent) {
            const oPicker = oEvent.getSource();
            const sPath = oPicker.getBindingContext().getPath();
            this.updatePickerEndDateByDuration(sPath);
            if (!this.isValidPickersDateTime()) {
                return;
            }

            this.updateAppointmentDateTime(sPath);
            this.byId("calendar").setStartDate(oPicker.getDateValue());
        },

        onChangePickerEndDate(oEvent) {
            if (!this.isValidPickersDateTime()) {
                return;
            }

            const sPath = oEvent.getSource().getBindingContext().getPath();
            this.updateAppointmentDateTime(sPath);
        },

        isValidPickersDateTime() {
            const oDates = this.getModel("view").getProperty("/pickers");
            const bValidStartDate = formatter.startDateState(oDates.startDate) !== "Error";
            const bValidEndDate = formatter.endDateState(oDates.startDate, oDates.endDate) !== "Error";
            return bValidStartDate && bValidEndDate;
        },

        updatePickerEndDateByDuration(sPath) {
            const oStartDate = this.getModel().getProperty(sPath + "/StartDate");
            const oEndDate = this.getModel().getProperty(sPath + "/EndDate");
            const nDuration = oEndDate.getTime() - oStartDate.getTime();

            const oPickerStartDate = this.getModel("view").getProperty("/pickers/startDate");
            this.getModel("view").setProperty("/pickers/endDate", new Date(oPickerStartDate.getTime() + nDuration));
        },

        updateAppointmentDateTime(sPath) {
            const oStartDate = this.getModel("view").getProperty("/pickers/startDate");
            this.getModel().setProperty(sPath + "/StartDate", oStartDate);

            const oEndDate = this.getModel("view").getProperty("/pickers/endDate");
            this.getModel().setProperty(sPath + "/EndDate", oEndDate);
        },

        //////////////////////////////////
        ///////////// POPOVER ////////////
        //////////////////////////////////

        openAppoinmentPopover(sPath, oControl) {
            if (!this.oAppointmentPopover) {
                this.loadFragment({
                    name: "pharelyshau.fragment.Calendar.AppointmentPopover"
                }).then((oPopover) => {
                    this.oAppointmentPopover = oPopover;
                    oPopover.bindElement(sPath);
                    oPopover.openBy(oControl);
                });
            } else {
                this.oAppointmentPopover.bindElement(sPath);
                this.oAppointmentPopover.openBy(oControl);
            }
        },

        onPressEditOpenAppointmentDialog(oEvent) {
            this.oAppointmentPopover.close();
            const sPath = oEvent.getSource().getBindingContext().getPath();
            this.getModel().setProperty(sPath + "/Mode", "edit");
            this.openAppoinmentDialog(sPath);
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