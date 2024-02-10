sap.ui.define(['sap/m/SinglePlanningCalendarView'], (SinglePlanningCalendarView) => {
	'use strict';

	return SinglePlanningCalendarView.extend('pharelyshau.control.TwoDaysView', {

		getEntityCount: () => 2,

		getScrollEntityCount: () => 2,

		calculateStartDate: (oStartDate) => oStartDate

	});
});
