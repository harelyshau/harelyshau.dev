sap.ui.define([
    "./BaseController",
    "../fragment/Calendar/TwoDaysView",
    "../fragment/Calendar/ThreeDaysView",
    "../model/models",
], (BaseController, TwoDaysView, ThreeDaysView, models) => {

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
            console.log("2")
            // $.ajax({
            //     url: "https://reqres.in/api/products/3",
            //     success: function (sResult) {
            //         console.log(sResult);
            //     }
            // });
        },

        onStartDateChange() {
            this.updateEndDate();
            this.getAppointments();
        },

        updateEndDate() {
            const oViewModel = this.getModel("calendarView");
            const oStartDate = oViewModel.getProperty("/StartDate");
            const oEndDate = new Date(oStartDate);
            oEndDate.setHours(23, 59, 59);
            oViewModel.setProperty("/EndDate", oEndDate);
        },

        onMoreLinkPress(oEvent) {
            const oDate = oEvent.getParameter("date");
            const oCalendar = oEvent.getSource();
			oCalendar.setSelectedView(oCalendar.getViews()[0]); // DayView
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
                this.getAppointments();
            }, (oError) => {
                console.error('Error initializing Google Calendar API:', oError);
            });
        },

        // Requests

        getAppointments() {
            const oViewModel = this.getModel("calendarView");
            gapi.client.calendar.events.list({
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: oViewModel.getProperty("/StartDate").toISOString(),
                timeMax: oViewModel.getProperty("/EndDate").toISOString(),
                singleEvents: true,
                maxResults: 250 // max value
            }).then((oResponse) => {
                const aAppointments = oResponse.result.items;
                this.setAppoitments(aAppointments);
                console.log(aAppointments)
                oViewModel.setProperty("/Busy", false);
            }, (oError) => {
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
            const bDeviceSmallWidth = oDeviceModel.getProperty("/resize/width") <= 550;

            const oDayView = new sap.m.SinglePlanningCalendarDayView({
                title: "Day",
                key: "Day"
            });
            oCalendar.addView(oDayView);

            // Add sprecific views for mobile and small size screens
            if (bDevicePhone || bDeviceSmallWidth) {
                const oTwoDaysView = new TwoDaysView({
					title: "2 Days",
					key: "2Days"
				});
                const oThreeDaysView = new ThreeDaysView({
					title: "3 Days",
					key: "3Days"
				});
                oCalendar.addView(oTwoDaysView);
                oCalendar.addView(oThreeDaysView);
            }

            const oWorkWeekView = new sap.m.SinglePlanningCalendarWorkWeekView({
                key: "WorkWeek",
                title: "Work Week"
            });
            const oMonthView = new sap.m.SinglePlanningCalendarMonthView({
                key: "Month",
                title: "Month"
            });
            oCalendar.addView(oWorkWeekView);
            oCalendar.addView(oMonthView);
        }

    });
});