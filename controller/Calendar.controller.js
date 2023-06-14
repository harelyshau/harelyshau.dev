sap.ui.define([
    "./BaseController",
    "sap/ui/core/Fragment",
    "sap/m/SinglePlanningCalendarDayView",
    "sap/m/SinglePlanningCalendarWorkWeekView",
    "sap/m/SinglePlanningCalendarWeekView",
    "sap/m/SinglePlanningCalendarMonthView",
    "../fragment/Calendar/TwoDaysView",
    "../fragment/Calendar/ThreeDaysView",
    "../model/models"
], (BaseController, Fragment, DayView, WorkWeekView, WeekView, MonthView, TwoDaysView, ThreeDaysView, models) => {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Detail", {

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
            this.setModel(models.createCalendarViewModel(), "calendarView");
            // create and add views for calendar
            this.addCalendarViews();
        },

        onPressOpenAppointmentDialog() {
            const oAppointment = this.createAppointmentLocal();
            const sBindingPath = this.getBindindPathForAppoinment(oAppointment);

            if (!this._oAppointmentDialog) {
                Fragment.load({
                    name: "pharelyshau.fragment.Calendar.AppointmentDialog",
                    controller: this
                }).then((oDialog) => {
                    this.getView().addDependent(oDialog);
                    this._oAppointmentDialog = oDialog;
                    oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    oDialog.bindElement(sBindingPath);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this._oAppointmentDialog.bindElement(sBindingPath);
                this._oAppointmentDialog.open();
            }

            // this.createAppointment();
        },

        onBeforeCloseAppointmentDialog(oEvent) {
            const oBindingContext = oEvent.getSource().getBindingContext();
            if (oBindingContext.getProperty("NotCreated")) {
                this.removeAppointmentLocal(oBindingContext.getObject());
            }
        },

        onPressCloseAppointmentDialog() {
            this._oAppointmentDialog.close();
        },

        onPressCreateAppointment(oEvent) {
            const sBindingPath = oEvent.getSource().getBindingContext().getPath();
            this.getModel().setProperty(sBindingPath + "/NotCreated", false);
            this._oAppointmentDialog.close();
        },

        createAppointmentLocal() {
            const oAppoinment = {
                ID: "newAppointment",
                Email: "",
                StartDate: new Date(),
                EndDate: new Date(new Date().getTime() + 3600000), // plus one hour
                NotCreated: true
            }
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.push(oAppoinment)
            this.getModel().setProperty("/Appointments", aAppointments);
            return oAppoinment;
        },

        removeAppointmentLocal(oAppoinment) {
            const aAppointments = this.getModel().getProperty("/Appointments");
            aAppointments.splice(aAppointments.indexOf(oAppoinment, 1)); // remove by index
            this.getModel().setProperty("/Appoitments", aAppointments);
        },

        getBindindPathForAppoinment(oAppoinment) {
            const aAppointments = this.getModel().getProperty("/Appointments");
            return "/Appointments/" + aAppointments.indexOf(oAppoinment);
        },

        updateDateRange() {
            const oViewModel = this.getModel("calendarView");
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

        // Google Calendar API

        loadGoogleAPI() {
            const script = document.createElement("script");
            script.src = "https://apis.google.com/js/api.js";
            script.onload = () => {
                gapi.load("client", this.initGoogleApiClient.bind(this));
            };
            document.head.appendChild(script);
        },

        async initGoogleApiClient() {
            const oCredentials = {
            };
            gapi.client.init({
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            }).then(async () => {
                gapi.auth.setToken(await getAccessTokenFromServiceAccount.do(oCredentials));
                this.updateDateRange();
                this.getAppointments();
            }, (oError) => {
                this.getModel("calendarView").setProperty("/busy", false);
                console.error("Error initializing Google Calendar API:", oError.error);
            });
        },

        // Requests

        getAppointments() {
            const oViewModel = this.getModel("calendarView");
            const oParams = {
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: oViewModel.getProperty("/timeMin").toISOString(),
                timeMax: oViewModel.getProperty("/timeMax").toISOString(),
                singleEvents: true,
                maxResults: 10 // max value is 250
            }
            oViewModel.setProperty("/busy", true);
            gapi.client.calendar.events.list(oParams)
                .then((oResponse) => {
                    const aAppointments = oResponse.result.items;
                    this.setAppoitments(aAppointments);
                    oViewModel.setProperty("/busy", false);
                }, (oError) => {
                    console.error("Error fetching appointments:", oError);
                    oViewModel.setProperty("/busy", false);
                });
        },

        setAppoitments(aAppointments) {
            const aFormattedAppointments = aAppointments.map(oAppoinment => {
                return {
                    ID: oAppoinment.id,
                    Name: "Busy",
                    StartDate: new Date(oAppoinment.start.dateTime),
                    EndDate: new Date(oAppoinment.end.dateTime)
                }
            });

            this.getModel().setProperty("/Appointments", aFormattedAppointments);
        },

        createAppointment() {
            try {
                const oParams = {
                    summary: "New Appointment2",
                    start: {
                        dateTime: "2023-06-17T10:00:00",
                        timeZone: "America/New_York"
                    },
                    end: {
                        dateTime: "2023-06-17T11:00:00",
                        timeZone: "America/New_York"
                    },
                    attendees: [
                        // { email: "pavel@harelyshau.dev" },
                        // { email: "example2@example.com" }
                    ]
                };

                gapi.client.calendar.events.insert({
                    calendarId: "pavel@harelyshau.dev",
                    resource: oParams
                }).then((response) => {
                    console.log("Appointment created:", response.result);
                }, (error) => {
                    console.error("Error creating appointment:", error);
                });
            } catch (oError) {
                console.error("Error loading key:", oError);
            }
        },

        // Calendar settings

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

        onStartDateChange() {
            this.updateDateRange();
            this.getAppointments();
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
        }

    });
});