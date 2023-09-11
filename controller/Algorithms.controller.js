sap.ui.define(['./BaseController', '../model/models'],
(BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Algorithms', {
		onInit() {
            this.setModel(models.createAlgorithmsViewModel(), 'view');
		},

        onAfterRendering() {
            // this.insertSideNavigation();
        },

        onSelectToggleSideNavifation() {
            const oToolPage = this.byId("page");
			const bSideExpanded = oToolPage.getSideExpanded();
            oToolPage.setSideExpanded(!bSideExpanded);
            this.getModel('view').setProperty('/sideExpanded', !bSideExpanded);
        },

        // async onPressToggleSideNavigation(oEvent) {
        //     const oPopover = new sap.m.Popover({
        //         placement: 'Bottom',
        //         showHeader: false,
        //         showArrow: false,
        //         contentHeight: '100%',
        //         content: [await this.loadAndAssignFragment('SideNavigation')]
        //     });
        //     oPopover.openBy(oEvent.getSource());
        // }
	});
});
