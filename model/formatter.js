sap.ui.define([
	"sap/ui/core/format/DateFormat",
], function (DateFormat) {

	"use strict";

	// private scope
	const getPluralForm = (nQuantity, sTextSingular, sTextPlural, sTextPlural2) => {
		if (!nQuantity || nQuantity <= 0) {
			return "";
		}

		if (nQuantity === 1) {
			return nQuantity + "\u00A0" + sTextSingular;
		}

		// for Russian plural forms
		if (localStorage.language === "ru") {
			const sLastDigits = String(nQuantity).slice(-2);
			const nLastDigits = sLastDigits > 20 ? +(sLastDigits.slice(-1)) : +sLastDigits;
			if (nLastDigits === 1) {
				return nQuantity + "\u00A0" + sTextSingular;
			}
			if (nLastDigits > 4) {
				return nQuantity + "\u00A0" + sTextPlural2;
			}
		}

		return nQuantity + "\u00A0" + sTextPlural;
	}

	return {

		// RESUME

		textList(aValues) {
			if (!aValues) {
				return "";
			}
			let sResult = "";
			aValues.forEach(sValue => {
				sResult += `• \u00A0${sValue}\n`;
			});
			return sResult;
		},

		stringDate(sDate) {
			if (!sDate || sDate === "Present") {
				return this.i18n("lPresent");
			}
			return DateFormat.getDateInstance({
				format: "yMMM"
			}).format(new Date(sDate));
		},

		datesPeriod(sStartDate, sEndDate) {
			if (!sStartDate) {
				return "";
			}

			const oStartDate = new Date(sStartDate);
			const oEndDate = !sEndDate || sEndDate == "Present" ? new Date() : new Date(sEndDate);
			// round up
			oEndDate.setMonth(oEndDate.getMonth() + 1);
			let nYears = oEndDate.getFullYear() - oStartDate.getFullYear();
			let nMonths = oEndDate.getMonth() - oStartDate.getMonth();

			if (nMonths < 0) {
				nYears--;
				nMonths += 12;
			}
			let sResult = getPluralForm(nYears, this.i18n("lYear"), this.i18n("lYears"), this.i18n("lYearPlural"));
			sResult += nMonths && nYears ? "\u00A0" : "";
			sResult += getPluralForm(nMonths, this.i18n("lMonth"), this.i18n("lMonths"), this.i18n("lMonthPlural"));
			return sResult;
		},

		textLink(sLink, sText) {
			if (!sLink) {
				return "";
			}

			if (!sText) {
				return `<a href="${sLink}">${sLink}</a>`;
			}

			return `<a href="${sLink}">${sText}</a>`;
		},

		// CALENDAR

		formattedAppointments(aAppointments, sAvailableAppointmentsIDs) {
			return aAppointments.map((oAppoinment, i) => {
				let oStartDateTime = oAppoinment.start;
				let oEndDateTime = oAppoinment.end;
				const oStartDate = new Date(oStartDateTime.dateTime ?? oStartDateTime.date + "T00:00");
				const oEndDate = new Date(oEndDateTime.dateTime ?? oEndDateTime.date + "T00:00");
				if (!oEndDateTime.dateTime) { // set up all-day appointments for correct displaying
					oEndDate.setDate(oEndDate.getDate() - 1);
				}
				const sEmail = oAppoinment.attendees ? oAppoinment.attendees[0].email : "";
                return {
                    ID: oAppoinment.id,
					// TODO: change to busy
					Email: sEmail,
                    Name: oAppoinment.summary,
					Description: oAppoinment.description,
                    StartDate: oStartDate,
                    EndDate: oEndDate,
					Mode: "view"
                }
            });
		},

		gcEvent(oAppoinment) {
			return {
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
                // conferenceData: {
                //     createRequest: {
                //       requestId: oAppoinment.Email,
                //     },
                // },
            };
		},

		startDateState(oStartDate) {
			if (!oStartDate || oStartDate.getTime() > new Date().getTime()) {
				return "None";
			}
			return "Error";
		},

		endDateState(oStartDate, oEndDate) {
			if (!oStartDate || !oEndDate || oEndDate.getTime() >= oStartDate.getTime()) {
				return "None";
			}
			return "Error";
		},

		startDateErrorText(oStartDate) {
			if (!oStartDate || oStartDate.getTime() > new Date().getTime()) {
				return "";
			}
			return "Start date must be in the future";
		},

		endDateErrorText(oStartDate, oEndDate) {
			if (!oStartDate || !oEndDate || oEndDate.getTime() >= oStartDate.getTime()) {
				return "";
			}
			return "End date must be after start date";
		}

	};

});