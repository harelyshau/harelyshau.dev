sap.ui.define(['sap/m/SinglePlanningCalendarView'], (SinglePlanningCalendarView) => {
	'use strict';

	return SinglePlanningCalendarView.extend('pharelyshau.control.ThreeDaysView', {

		getEntityCount: () => 3,

		getScrollEntityCount: () => 3,

		calculateStartDate: (oStartDate) => oStartDate

	});
});
