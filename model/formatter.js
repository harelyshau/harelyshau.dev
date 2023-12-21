sap.ui.define(
	['sap/ui/core/format/DateFormat', "sap/ui/core/format/NumberFormat", 'sap/ui/core/Configuration'],
	(DateFormat, NumberFormat, Configuration) => {
		'use strict';

		function getPluralForm(nQuantity, sTextSingular, sTextPlural, sTextPlural2) {
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
		}

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
				let sResult = getPluralForm(nYears, ...aYearTexts);
				sResult += nMonths && nYears ? '\u00A0' : '';
				const aMonthTexts = ['lMonth', 'lMonths', 'lMonthPlural'].map((sKey) => this.i18n(sKey));
				sResult += getPluralForm(nMonths, ...aMonthTexts);
				return sResult;
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

			//////////////////////////////////
			/////////// HANOI TOWER //////////
			//////////////////////////////////

			timeMinSec(iSeconds) {
				const iMinutes = Math.floor(iSeconds / 60);
				iSeconds = iSeconds % 60;
				const sMinutes = iMinutes ? iMinutes + 'm ' : '';
				const sSeconds = iMinutes ? iSeconds + 's' : iSeconds + ' sec';
				return sMinutes + sSeconds;
			},

			discWidth(iDisc, iDiscCount, iMaxWidth) {
				const [iMin, iMax, sUnit] = iMaxWidth ? [28, iMaxWidth, 'px'] : [30, 100, '%'];
				return ((iMax - iMin) / (iDiscCount - 1)) * (iDisc - 1) + iMin + sUnit;
			},

			discType(iDisc) {
				const aTypes = ['Negative', 'Critical', 'Success'];
				return aTypes[iDisc % aTypes.length];
			},

			discCountIcon(iDiscCount, aRecords) {
				const bCompleted = aRecords.some((oRecord) => oRecord.DiscCount === iDiscCount);
				return bCompleted ? 'sap-icon://accept' : '';
			},

			minMovesToWin(iDiscCount) {
				return 2 ** iDiscCount - 1;
			},

			formattedMinMovesToWin(iDiscCount) {
				const oLocale = sap.ui.getCore().getConfiguration().getLocale();
				const oFloatNumberFormat = NumberFormat.getFloatInstance(oLocale);
				return oFloatNumberFormat.format(this.minMovesToWin(iDiscCount));
			}

		};
	}
);
