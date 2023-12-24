sap.ui.define([
	'sap/ui/core/format/DateFormat',
	"sap/ui/core/format/NumberFormat",
	'sap/ui/core/Configuration',
	'sap/base/strings/formatMessage'
], (DateFormat, NumberFormat, Configuration, formatMessage) => {
	'use strict';

	function getPluralForm(nQuantity, ...aTexts) {
		if (!nQuantity || nQuantity <= 0) return '';
		return nQuantity + '\u00A0' + getRightForm(nQuantity, ...aTexts);
	}

	function getRightForm(nQuantity, sTextSingular, sTextPlural, sTextPlural2) {
		if (nQuantity === 1) return sTextSingular;
		// for Russian plural forms
		if (Configuration.getLanguage() === 'ru') {
			const sLastDigits = String(nQuantity).slice(-2);
			const iLastDigits = sLastDigits > 20 ? +sLastDigits.slice(-1) : +sLastDigits;
			if (iLastDigits === 1) return sTextSingular;
			if (iLastDigits > 4) return sTextPlural2 || sTextPlural;
		}
		return sTextPlural;
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
			let iYears = oEndDate.getFullYear() - oStartDate.getFullYear();
			let iMonths = oEndDate.getMonth() - oStartDate.getMonth();

			if (iMonths < 0) {
				iYears--;
				iMonths += 12;
			}
			const aYearTexts = ['lYear', 'lYears', 'lYearPlural'].map((sKey) => this.i18n(sKey));
			let sResult = getPluralForm(iYears, ...aYearTexts);
			sResult += iMonths && iYears ? '\u00A0' : '';
			const aMonthTexts = ['lMonth', 'lMonths', 'lMonthPlural'].map((sKey) => this.i18n(sKey));
			sResult += getPluralForm(iMonths, ...aMonthTexts);
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

		timeMinSec(iSeconds, sHour, sMinute, sSecond, sSec) {
			const iHours = Math.floor(iSeconds / 3600);
			iSeconds = iSeconds % 3600;
			const iMinutes = Math.floor(iSeconds / 60);
			iSeconds = iSeconds % 60;
			const sHours = iHours ? `${iHours}${sHour} ` : '';
			const sMinutes = iMinutes ? `${iMinutes}${sMinute} ` : '';
			const sSeconds = iMinutes || iHours ? `${iSeconds}${sSec}` : `${iSeconds} ${sSecond}`;
			return sHours + sMinutes + sSeconds;
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
		},

		fasterByTime(sText, iPreviousTime, iCurrentTime, ...aTexts) {
			if (!iPreviousTime) return;
			const sDiff = this.timeMinSec(iPreviousTime - iCurrentTime, ...aTexts);
			return formatMessage(sText, sDiff);
		},

		fasterByMoves(iPreviousMoves, iCurrentMoves, ...aTexts) {
			const iDiff = iPreviousMoves - iCurrentMoves;
			const sText = getRightForm(iDiff, ...aTexts);
			return formatMessage(sText, iDiff);
		},

		//////////////////////////////////
		/////////// MINESWEEPER //////////
		//////////////////////////////////

		cellState({ IsOpen, IsMine, IsFlagged, MineCount }, iCellsLeft, bGameFinished) {
			if (IsFlagged) return bGameFinished && !IsMine ? 'WrongFlag' : 'Flag';
			if (IsMine && IsOpen) return iCellsLeft ? 'Mine' : 'Flag';
			const aColors = [
				'Blue',
				'Green',
				'Red',
				'DarkBlue',
				'Brown',
				'Turquoise',
				'Black',
				'White'
			];
			return aColors[MineCount - 1];
		},

		mineCountNearby(aField, oCell) {
			let iMineCount = 0;
			const aDx = [-1, 0, 1];
			aDx.forEach(iRowDx => {
				aDx.forEach(iColDx => {
					const [iCell, jCell] = oCell.Coordinates;
					const oNeighbour = aField[iCell + iRowDx]?.[jCell + iColDx];
					if (oNeighbour?.IsMine) iMineCount++;
				});
			});
			return iMineCount;
		}

	};
});
