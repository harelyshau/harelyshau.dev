sap.ui.define([
    "./BaseController",
    "sap/m/SinglePlanningCalendarDayView",
    "sap/m/SinglePlanningCalendarWorkWeekView",
    "sap/m/SinglePlanningCalendarWeekView",
    "sap/m/SinglePlanningCalendarMonthView",
    "../fragment/Calendar/TwoDaysView",
    "../fragment/Calendar/ThreeDaysView",
    "../model/models",
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
                console.error('Error initializing Google Calendar API:', oError);
            });
        },

        // Requests

        getAppointments() {
            const oViewModel = this.getModel("calendarView");
            oViewModel.setProperty("/busy", true);
            gapi.client.calendar.events.list({
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: oViewModel.getProperty("/timeMin").toISOString(),
                timeMax: oViewModel.getProperty("/timeMax").toISOString(),
                singleEvents: true,
                maxResults: 250 // max value
            }).then((oResponse) => {
                const aAppointments = oResponse.result.items;
                this.setAppoitments(aAppointments);
                oViewModel.setProperty("/busy", false);
            }, (oError) => {
                oViewModel.setProperty("/busy", false);
                console.error('Error fetching events:', oError);
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

        // Calendar settings

        addCalendarViews() {
            const oCalendar = this.byId("calendar");
            const oDeviceModel = this.getOwnerComponent().getModel("device");
            const bDevicePhone = oDeviceModel.getProperty("/system/phone");
            const bDeviceSmallWidth = oDeviceModel.getProperty("/resize/width") <= 620;

            const oDayView = new DayView({key: "day", title: "Day"});
            oCalendar.addView(oDayView);

            // Add sprecific views for mobile and small size screens
            if (bDevicePhone || bDeviceSmallWidth) {
                const oTwoDaysView = new TwoDaysView({
					title: "2 Days",
					key: "2days"
				});
                const oThreeDaysView = new ThreeDaysView({
					title: "3 Days",
					key: "3days"
				});
                oCalendar.addView(oTwoDaysView);
                oCalendar.addView(oThreeDaysView);
            }

            const oWorkWeekView = new WorkWeekView({key: "workWeek", title: "Work Week"});
            oCalendar.addView(oWorkWeekView);
            // add week view for desktop device
            if (!bDevicePhone && !bDeviceSmallWidth) {
                const oWeekView = new WeekView({key: "week", title: "Week"});
                oCalendar.addView(oWeekView);
            }

            const oMonthView = new MonthView({key: "month", title: "Month"});
            oCalendar.addView(oMonthView);
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