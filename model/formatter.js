sap.ui.define(
	['sap/ui/core/format/DateFormat', 'sap/ui/core/Configuration'],
	(DateFormat, Configuration) => {
		'use strict';

		return {
			//////////////////////////////////
			///////////// RESUME /////////////
			//////////////////////////////////

			stringDate(sDate) {
				if (!sDate || sDate === 'Present') return this.i18n('lPresent');
				return DateFormat.getDateInstance({ format: 'yMMM' }).format(new Date(sDate));
			},

			datesPeriod(sStartDate, sEndDate) {
				if (!sStartDate || !sEndDate) return '';
				const oStartDate = new Date(sStartDate);
				const oEndDate = sEndDate === 'Present' ? new Date() : new Date(sEndDate);
				// round up
				oEndDate.setMonth(oEndDate.getMonth() + 1);
				let nYears = oEndDate.getFullYear() - oStartDate.getFullYear();
				let nMonths = oEndDate.getMonth() - oStartDate.getMonth();

				if (nMonths < 0) {
					nYears--;
					nMonths += 12;
				}
				const aYearTexts = ['lYear', 'lYears', 'lYearPlural'].map((sKey) => this.i18n(sKey));
				let sResult = this.formatter.getPluralForm(nYears, ...aYearTexts);
				sResult += nMonths && nYears ? '\u00A0' : '';
				const aMonthTexts = ['lMonth', 'lMonths', 'lMonthPlural'].map((sKey) => this.i18n(sKey));
				sResult += this.formatter.getPluralForm(nMonths, ...aMonthTexts);
				return sResult;
			},

			getPluralForm(nQuantity, sTextSingular, sTextPlural, sTextPlural2) {
				if (!nQuantity || nQuantity <= 0) return '';

				if (nQuantity === 1) return nQuantity + '\u00A0' + sTextSingular;

				// for Russian plural forms
				if (Configuration.getLanguage() === 'ru') {
					const sLastDigits = String(nQuantity).slice(-2);
					const nLastDigits = sLastDigits > 20 ? +sLastDigits.slice(-1) : +sLastDigits;
					if (nLastDigits === 1) return nQuantity + '\u00A0' + sTextSingular;
					if (nLastDigits > 4) return nQuantity + '\u00A0' + sTextPlural2;
				}

				return nQuantity + '\u00A0' + sTextPlural;
			},

			//////////////////////////////////
			//////////// CALENDAR ////////////
			//////////////////////////////////

			// Input Validation

			conferenceState(sConference) {
				const rUrlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
				if (!sConference || rUrlPattern.test(sConference)) return 'None';
				return 'Warning';
			},

			conferenceStateText(sConference) {
				const rUrlPattern = /^(ftp|http|https):\/\/[^ "]+$/;
				if (!sConference || rUrlPattern.test(sConference)) return '';
				return 'The «Conference» field expects a URL';
			},

			// Appointment Formatting for JSON Model (calling from controller)

			appointmentLocal(oAppointmentGC) {
				const oAppointment = {
					ID: oAppointmentGC.id,
					Name: this.i18n('tBusy'),
					Type: 'Type16'
				};
				const aDates = [oAppointmentGC.start, oAppointmentGC.end];
				this.formatter.setDatesToAppointmentLocal(oAppointment, ...aDates);
				const bAvailable = this.isAppointmentAvailable(oAppointment.ID);
				const bTwoAttendees = oAppointmentGC.attendees?.length === 2;
				if (bAvailable && bTwoAttendees) {
					this.formatter.setFieldsToAvailableAppointmentLocal.call(
						this,
						oAppointment,
						oAppointmentGC
					);
				}

				return oAppointment;
			},

			setDatesToAppointmentLocal(oAppointment, oStartDateGC, oEndDateGC) {
				oAppointment.StartDate = new Date(oStartDateGC.dateTime ?? oStartDateGC.date + 'T00:00');
				const oEndDate = new Date(oEndDateGC.dateTime ?? oEndDateGC.date + 'T00:00');
				if (!oEndDateGC.dateTime) {
					// set up all-day appointments for correct displaying
					oEndDate.setDate(oEndDate.getDate() - 1);
				}
				oAppointment.EndDate = oEndDate;
			},

			setFieldsToAvailableAppointmentLocal(oAppointment, oAppointmentGC) {
				const sEmail = oAppointmentGC.attendees.find((oAttendee) => {
					return oAttendee.email !== this.getModel().getProperty('/Email');
				}).email;
				oAppointment.Name = oAppointmentGC.summary;
				oAppointment.Description = oAppointmentGC.description;
				oAppointment.Email = sEmail;
				oAppointment.Type = 'Type01';
				oAppointment.GoogleMeet = oAppointmentGC.hangoutLink;
				oAppointment.Conference = oAppointmentGC.location;
			},

			appointmentGC(oAppointment) {
				const oAppointmentGC = {
					summary: oAppointment.Name,
					description: oAppointment.Description,
					start: { dateTime: oAppointment.StartDate.toISOString() },
					end: { dateTime: oAppointment.EndDate.toISOString() },
					attendees: [
						{ email: oAppointment.Email, responseStatus: 'accepted' },
						{ email: this.getModel().getProperty('/Email') }
					],
					conferenceData: null,
					location: null,
					guestsCanModify: true
				};
				if (oAppointment.GoogleMeet) {
					this.formatter.setGoogleMeetToAppointmentGC(oAppointmentGC, oAppointment.ID);
				} else {
					oAppointmentGC.location = oAppointment.Conference;
				}

				return oAppointmentGC;
			},

			setGoogleMeetToAppointmentGC(oAppointmentGC, sAppointmentID) {
				oAppointmentGC.conferenceData = {
					createRequest: {
						requestId: sAppointmentID,
						conferenceSolutionKey: { type: 'hangoutsMeet' }
					}
				};
			}
		};
	}
);
