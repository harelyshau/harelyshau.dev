sap.ui.define(['sap/m/SinglePlanningCalendarView'], (SinglePlanningCalendarView) => {
	'use strict';

	return SinglePlanningCalendarView.extend('pharelyshau.control.ThreesDaysView', {

		getEntityCount: () => 3,

		getScrollEntityCount: () => 3,

		calculateStartDate: (oStartDate) => oStartDate

	});
});
