sap.ui.define([

], function () {

	"use strict";

	// private scope
	const getPluralForm = function(nQuantity, sTextSingular, sTextPlural, sTextPlural2) {
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

		textList: function (aValues) {
			if (!aValues) {
				return "";
			}
			let sResult = "";
			aValues.forEach(sValue => {
				sResult += `• \u00A0${sValue}\n`;
			});
			return sResult;
		},

		stringDate: function (sDate) {
			if (!sDate || sDate === "Present") {
				return this.getResourceBundle().getText("lPresent");
			}
			return sap.ui.core.format.DateFormat.getDateInstance({
				format: "yMMM"
			}).format(new Date(sDate));
		},

		datesPeriod: function (sStartDate, sEndDate) {
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
			let sResult = getPluralForm(nYears, this.getResourceBundle().getText("lYear"), this.getResourceBundle().getText("lYears"), this.getResourceBundle().getText("lYearPlural"));
			sResult += nMonths && nYears ? "\u00A0" : "";
			sResult += getPluralForm(nMonths, this.getResourceBundle().getText("lMonth"), this.getResourceBundle().getText("lMonths"), this.getResourceBundle().getText("lMonthPlural"));
			return sResult;
		},

		textLink: function (sLink, sText) {
			if (!sLink) {
				return "";
			}

			if (!sText) {
				return `<a href="${sLink}">${sLink}</a>`;
			} 
			
			return `<a href="${sLink}">${sText}</a>`;
		},

		// UNUSED
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		}

	};

});