sap.ui.define(['./googleApiTokenFetcher', './lib/GoogleAPI', ],
(googleApiTokenFetcher, GoogleAPI) => {
	'use strict';

    /* This Class allows managing appointments in Google Calendar
    and provide following 5 public methods: "init", "getAppointments",
    "createAppointment", "updateAppointment", "removeAppointment" */

	class CalendarManager {

        constructor(sEmail) {
            this.calendarId = sEmail;
        }
        
        //////////////////////////////////
        ///////// INITIALIZATION /////////
        //////////////////////////////////

        init() {
            return new Promise((resolve) => {
                gapi.load('client', async () => {
                    await this.#initGoogleApiClient();
                    await this.#setGoogleApiAuthToken();
                    resolve();
                });
            });
        }

        #initGoogleApiClient() {
            const sLink = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
            return gapi.client.init({ discoveryDocs: [sLink] });
        }

        async #setGoogleApiAuthToken() {
            const oCredentials = await this.#getServiceAccountCredentials();
            const oToken = await googleApiTokenFetcher.getToken(oCredentials);
			return gapi.auth.setToken(oToken);
        }

        async #getServiceAccountCredentials() {
            const oResponse = await fetch('resource/data/Calendar/service-acc-creds.json');
            return oResponse.json();
        }

        //////////////////////////////////
        ////////////// CRUD //////////////
        //////////////////////////////////

        async getAppointments(oStartDate, oEndDate) {
            const oParams = {
                calendarId: this.calendarId,
                maxResults: 250, // max available value
                singleEvents: true,
                timeMin: oStartDate.toISOString(),
                timeMax: oEndDate.toISOString()
            };
            const oResponse = await gapi.client.calendar.events.list(oParams);
            const aAppointmentsGC = oResponse.result.items
            return aAppointmentsGC.map(this.#formatAppointmentLocal.bind(this));
        }

        async createAppointment(oAppointment) {
            const oParams = {
                calendarId: this.calendarId,
                resource: this.#formatAppointmentGC(oAppointment),
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            };
            const oCreatedAppointmentGC = (await this.#events.insert(oParams)).result;
            this.#addAppointmentIdToLocalStorage(oCreatedAppointmentGC.id);
            return this.#formatAppointmentLocal(oCreatedAppointmentGC);
        }

        async removeAppointment(eventId) {
            const oParams = {
                calendarId: this.calendarId,
                eventId,
                sendUpdates: 'all'
            };
			await this.#events.delete(oParams);
            this.#removeAppointmentIdFromLocalStorage(eventId);
            return eventId;
        }

        async updateAppointment(oAppointment) {
            const oParams = {
                calendarId: this.calendarId,
                eventId: oAppointment.ID,
                resource: this.#formatAppointmentGC(oAppointment),
                conferenceDataVersion: 1,
                sendUpdates: 'all'
            };
            const oAppointmentGC = (await this.#events.update(oParams)).result;
            return this.#formatAppointmentLocal(oAppointmentGC);
        }

        get #events() {
            return gapi.client.calendar.events;
        }

        //////////////////////////////////
        ////////// LOCAL STORAGE /////////
        //////////////////////////////////

        #getAvailableAppointmentIDs() {
            return JSON.parse(localStorage.getItem('appointments')) ?? [];
        }

        #addAppointmentIdToLocalStorage(sAppointmentID) {
            const aAppointmentIDs = this.#getAvailableAppointmentIDs();
            aAppointmentIDs.push(sAppointmentID);
            localStorage.setItem('appointments', JSON.stringify(aAppointmentIDs));
        }

        #removeAppointmentIdFromLocalStorage(sAppointmentID) {
            const aAppointmentIDs = this.#getAvailableAppointmentIDs();
            aAppointmentIDs.splice(aAppointmentIDs.indexOf(sAppointmentID), 1);
            localStorage.setItem('appointments', JSON.stringify(aAppointmentIDs));
        }

        //////////////////////////////////
        /////////// FORMATTING ///////////
        //////////////////////////////////

        #formatAppointmentGC(oAppointment) {
            const oAppointmentGC = {
                summary: oAppointment.Name,
                description: oAppointment.Description,
                start: { dateTime: oAppointment.StartDate.toISOString() },
                end: { dateTime: oAppointment.EndDate.toISOString() },
                attendees: [
                    { email: oAppointment.Email, responseStatus: 'accepted' },
                    { email: this.calendarId }
                ],
                conferenceData: null,
                location: null,
                guestsCanModify: true
            };
            if (oAppointment.GoogleMeet) {
                oAppointmentGC.conferenceData = {
					createRequest: {
						requestId: oAppointment.ID,
						conferenceSolutionKey: { type: 'hangoutsMeet' }
					}
				};
            } else {
                oAppointmentGC.location = oAppointment.Conference;
            }

            return oAppointmentGC;
        }

        #formatAppointmentLocal(oAppointmentGC) {
            const aDatesGC = [oAppointmentGC.start, oAppointmentGC.end];
            const [StartDate, EndDate] = this.#formatAppointmentDatesLocal(...aDatesGC);
            const oAppointment = {
                ID: oAppointmentGC.id,
                StartDate,
                EndDate,
                Available: this.#isAppointmentAvailable(oAppointmentGC),
            };
            if (!oAppointment.Available) return oAppointment;

            const Email = oAppointmentGC.attendees.find(
                (oAttendee) => oAttendee.email !== this.calendarId
            ).email;
            const oAvailableAppointment = {
                ...oAppointment,
                Name: oAppointmentGC.summary,
                Description: oAppointmentGC.description,
                Email,
                GoogleMeet: oAppointmentGC.hangoutLink,
                Conference: oAppointmentGC.location
            }
            return oAvailableAppointment;
        }

        #formatAppointmentDatesLocal(oStartDateGC, oEndDateGC) {
            const oStartDate = new Date(oStartDateGC.dateTime ?? oStartDateGC.date + 'T00:00');
            const oEndDate = new Date(oEndDateGC.dateTime ?? oEndDateGC.date + 'T00:00');
            if (!oEndDateGC.dateTime) {
                // set up all-day appointments for correct displaying
                oEndDate.setDate(oEndDate.getDate() - 1);
            }
            return [oStartDate, oEndDate];
        }

        #isAppointmentAvailable(oAppointmentGC) {
            const bUserAppointmnet = this.#getAvailableAppointmentIDs().includes(oAppointmentGC.id);
            const bTwoAttendees = oAppointmentGC.attendees?.length === 2;
            return bUserAppointmnet && bTwoAttendees;
        }

    }

	return new CalendarManager('pavel@harelyshau.dev');
});
