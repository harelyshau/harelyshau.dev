sap.ui.define([
    "./BaseController",
    "sap/m/SinglePlanningCalendarDayView",
    "sap/m/SinglePlanningCalendarWorkWeekView",
    "sap/m/SinglePlanningCalendarWeekView",
    "sap/m/SinglePlanningCalendarMonthView",
    "../fragment/Calendar/TwoDaysView",
    "../fragment/Calendar/ThreeDaysView",
    "../model/models"
], (BaseController, DayView, WorkWeekView, WeekView, MonthView, TwoDaysView, ThreeDaysView, models) => {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Detail", {

        onInit() {
            // loag google api to see appointments
            this.loadGoogleAPI();
            // set the calendar model
            this.setModel(models.createCalendarModel());
            // create the calendar view model
            this.setModel(models.createCalendarViewModel(), "calendarView");
            // create view for calendar
            this.addCalendarViews();
        },

        onPressTest() {
            const a = 1;
            console.log(a);
            this.createAppointment()
        },

        onStartDateChange() {
            this.updateDateRange();
            this.getAppointments();
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
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';

            script.onload = () => {
                gapi.load('client', () => {
                    this.initGoogleCalendarAPI();
                });
            };

            document.head.appendChild(script);
        },

        initGoogleCalendarAPI() {
            const sGoogleApiKey = "AIzaSyD2O1sxa8AcJxvF0XQko-TwBD4TwdOv0SM";
            gapi.client.init({
                apiKey: sGoogleApiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar.readonly'
            }).then(() => {
                this.updateDateRange();
                this.getAppointments();
            }, (oError) => {
                console.error('Error initializing Google Calendar API:', oError.error);
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
                maxResults: 250 // max value
            }
            oViewModel.setProperty("/busy", true);
            gapi.client.calendar.events.list(oParams)
                .then((oResponse) => {
                    const aAppointments = oResponse.result.items;
                    this.setAppoitments(aAppointments);
                    oViewModel.setProperty("/busy", false);
                }, (oError) => {
                    console.error('Error fetching appointments:', oError);
                    oViewModel.setProperty("/busy", false);
                });
        },

        setAppoitments(aAppointments) {
            const aFormattedAppointments = aAppointments.map(oAppoinment => {
                return {
                    Name: "Busy",
                    StartDate: new Date(oAppoinment.start.dateTime),
                    EndDate: new Date(oAppoinment.end.dateTime)
                }
            });

            this.getModel().setProperty("/Appointments", aFormattedAppointments);
        },

        // Requests
        authGoogleCalendarAPI(oAccountKey) {
            gapi.auth.authorize({
                client_id: oAccountKey.client_id,
                client_email: oAccountKey.client_email,
                private_key: oAccountKey.private_key,
                scope: "https://www.googleapis.com/auth/calendar.events",
                immediate: true
            });
        },

        async createAppointment() {
            try {
                const sFilePath = "resource/data/ServiceAccountKey.json";
                const oResponse = await fetch(sFilePath);
                const oAccountKey = await oResponse?.json();
                await this.authGoogleCalendarAPI(oAccountKey);
                const oParams = {
                    summary: "New Appointment",
                    start: {
                        dateTime: "2023-06-15T10:00:00", // Укажите дату и время начала встречи
                        timeZone: "America/New_York" // Укажите временную зону
                    },
                    end: {
                        dateTime: "2023-06-15T11:00:00", // Укажите дату и время окончания встречи
                        timeZone: "America/New_York" // Укажите временную зону
                    },
                    attendees: [
                        { email: "pavel@harelyshau.dev" },
                        { email: "example2@example.com" }
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

                // console.log(gapi.auth2.getAuthInstance().isSignedIn.get());
            } catch (oError) {
                console.error('Error loading key:', oError);
            }
        },


        // Calendar settings

        addCalendarViews() {
            const oResourceBundle = this.getResourceBundle();
            const oDeviceModel = this.getOwnerComponent().getModel("device");
            const oCalendar = this.byId("calendar");
            const bDevicePhone = oDeviceModel.getProperty("/system/phone");
            const bDeviceSmallWidth = oDeviceModel.getProperty("/resize/width") <= 800;

            oCalendar.addView(new DayView({ key: "day", title: oResourceBundle.getText("ttlDay") }));
            // Add views for mobile and small size screens
            if (bDevicePhone || bDeviceSmallWidth) {
                oCalendar.addView(new TwoDaysView({ key: "2days", title: oResourceBundle.getText("ttl2Days") }));
                oCalendar.addView(new ThreeDaysView({ key: "3days", title: oResourceBundle.getText("ttl3Days") }));
            }
            oCalendar.addView(new WorkWeekView({ key: "workWeek", title: oResourceBundle.getText("ttlWorkWeek") }));
            // Add week view for desktop device
            if (!bDevicePhone && !bDeviceSmallWidth) {
                oCalendar.addView(new WeekView({ key: "week", title: oResourceBundle.getText("ttlWeek") }));
            }
            oCalendar.addView(new MonthView({ key: "month", title: oResourceBundle.getText("ttlMonth") }));
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