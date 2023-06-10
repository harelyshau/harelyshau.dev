sap.ui.define([

], function () {

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
			return sap.ui.core.format.DateFormat.getDateInstance({
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

		// UNUSED
		numberUnit(sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		}

	};

});