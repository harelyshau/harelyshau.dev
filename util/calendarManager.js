sap.ui.define([
	'sap/ui/util/Storage',
	'./getGoogleApiToken',
	'./lib/GoogleAPI'
], (Storage, getGoogleApiToken, GoogleAPI) => {
	'use strict';

	const calendarId = 'pavel@harelyshau.dev';
	const storage = new Storage(Storage.Type.local, 'calendar');

	/* This Class allows managing appointments in Google Calendar
    and provide following 5 public methods: "init", "list", "get",
    "create", "update", "remove" */

	class CalendarManager {
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
			const discoveryDocs = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
			return gapi.client.init({ discoveryDocs });
		}

		async #setGoogleApiAuthToken() {
			const oCredentials = await this.#getServiceAccountCredentials();
			const oToken = await getGoogleApiToken(oCredentials);
			gapi.auth.setToken(oToken);
		}

		async #getServiceAccountCredentials() {
			const oResponse = await fetch('resource/data/Calendar/service-acc-creds.json');
			return oResponse.json();
		}

		//////////////////////////////////
		////////////// CRUD //////////////
		//////////////////////////////////

		async list(oStartDate, oEndDate) {
			const oParams = {
				calendarId,
				maxResults: 250, // max available value
				singleEvents: true,
				timeMin: oStartDate.toISOString(),
				timeMax: oEndDate.toISOString()
			};
			const oResponse = await this.#events.list(oParams);
			const aAppointmentsGC = oResponse.result.items;
			return aAppointmentsGC.map(this.#formatAppointmentLocal.bind(this));
		}

		async get(eventId) {
			const oParams = { calendarId, eventId };
			const oAppointmentGC = (await this.#events.get(oParams)).result;
			return this.#formatAppointmentLocal(oAppointmentGC);
		}

		async create(oAppointment) {
			const resource = this.#formatAppointmentGC(oAppointment);
			const oParams = { calendarId, resource, conferenceDataVersion: 1, sendUpdates: 'all' };
			const oCreatedAppointmentGC = (await this.#events.insert(oParams)).result;
			this.#addAppointmentIdToLocalStorage(oCreatedAppointmentGC.id);
			return this.#formatAppointmentLocal(oCreatedAppointmentGC);
		}

		async remove(eventId) {
			const oParams = { calendarId, eventId, sendUpdates: 'all' };
			await this.#events.delete(oParams);
			this.#removeAppointmentIdFromLocalStorage(eventId);
			return eventId;
		}

		async update(oAppointment) {
			const oParams = {
				calendarId,
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
			return storage.get('appointments') ?? [];
		}

		#addAppointmentIdToLocalStorage(sAppointmentID) {
			const aAppointmentIDs = this.#getAvailableAppointmentIDs();
			aAppointmentIDs.push(sAppointmentID);
			storage.put('appointments', aAppointmentIDs);
		}

		#removeAppointmentIdFromLocalStorage(sAppointmentID) {
			const aAppointmentIDs = this.#getAvailableAppointmentIDs();
			aAppointmentIDs.splice(aAppointmentIDs.indexOf(sAppointmentID), 1);
			storage.put('appointments', aAppointmentIDs);
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
					{ email: calendarId }
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
				Available: this.#isAppointmentAvailable(oAppointmentGC)
			};
			if (!oAppointment.Available) return oAppointment;

			const { email } = oAppointmentGC.attendees
				.find(({ email }) => email !== calendarId);
			const oAvailableAppointment = {
				...oAppointment,
				Name: oAppointmentGC.summary,
				Description: oAppointmentGC.description,
				Email: email,
				GoogleMeet: oAppointmentGC.hangoutLink,
				Conference: oAppointmentGC.location
			};
			return oAvailableAppointment;
		}

		#formatAppointmentDatesLocal(oStartDateGC, oEndDateGC) {
			const oStartDate = new Date(oStartDateGC.dateTime ?? oStartDateGC.date + 'T00:00');
			const oEndDate = new Date(oEndDateGC.dateTime ?? oEndDateGC.date + 'T00:00');
			// set up all-day appointments for correct displaying
			if (!oEndDateGC.dateTime) oEndDate.setDate(oEndDate.getDate() - 1);
			return [oStartDate, oEndDate];
		}

		#isAppointmentAvailable(oAppointmentGC) {
			const bUserAppointmnet = this.#getAvailableAppointmentIDs().includes(oAppointmentGC.id);
			const bTwoAttendees = oAppointmentGC.attendees?.length === 2;
			return bUserAppointmnet && bTwoAttendees;
		}
	}

	return new CalendarManager;
});
