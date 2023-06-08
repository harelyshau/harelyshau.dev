sap.ui.define([
    "./BaseController",
], (BaseController) => {

    "use strict"

    return BaseController.extend("pharelyshau.controller.Detail", {

        onInit() {
            this.loadGoogleAPI();
        },


        onPressTest() {
            this.loadGoogleAPI();


            // $.ajax({
            //     url: "https://reqres.in/api/products/3",
            //     success: function (sResult) {
            //         console.log(sResult);
            //     }
            // });
        },

        loadGoogleAPI() {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';

            script.onload = () => {
                gapi.load('client', () => {
                    this.initGoogleAPI();
                });
            };

            document.head.appendChild(script);
        },

        initGoogleAPI() {
            const sApiKey = "AIzaSyD2O1sxa8AcJxvF0XQko-TwBD4TwdOv0SM";
            gapi.client.init({
                apiKey: sApiKey,
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                scope: 'https://www.googleapis.com/auth/calendar.readonly'
            }).then(() => {
                this.getAppointments();
            }, (error) => {
                console.error('Error initializing Google Calendar API:', error);
            });
        },

        getAppointments() {
            gapi.client.calendar.events.list({
                calendarId: 'pavel@harelyshau.dev',
                timeMin: (new Date()).toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 10,
                orderBy: 'startTime'
            }).then(function (response) {
                const aAppointments = response.result.items;
                console.log(aAppointments);
            }, function (error) {
                console.error('Error fetching events:', error);
            });
        }
    });
});