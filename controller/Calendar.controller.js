sap.ui.define([
    "./BaseController",
    "../model/models",
], (BaseController, models) => {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Detail", {

        onInit() {
            this.loadGoogleAPI();
            // set the calendar model
            this.setModel(models.createCalendarModel());
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
            const oStartDate = this.getModel().getProperty("/StartDate");
            const oEndDate = new Date(oStartDate);
            oEndDate.setHours(23, 59, 59);
            this.getModel().setProperty("/EndDate", oEndDate);
            this.getAppointments();
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

        getAppointments() {
            gapi.client.calendar.events.list({
                calendarId: this.getModel().getProperty("/Email"),
                timeMin: this.getModel().getProperty("/StartDate").toISOString(),
                timeMax: this.getModel().getProperty("/EndDate").toISOString(),
                singleEvents: true,
                maxResults: 30
            }).then((oResponse) => {
                const aAppointments = oResponse.result.items;
                this.setAppoitments(aAppointments);
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
        }

    });
});