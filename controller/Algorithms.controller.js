sap.ui.define(['./BaseController', '../model/models'],
(BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Algorithms', {
		onInit() {
            this.setModel(models.createAlgorithmsViewModel(), 'view');
		},

        onSelectToggleSideNavigation() {
            const bExpanded = this.toggleSideNavigation(this.byId("page"));
            this.getModel('view').setProperty('/sideExpanded', bExpanded);
        },

        async onPressToggleSideNavigation() {
            if (!this.getModel('device').getProperty('/system/phone')) {
                this.onSelectToggleSideNavigation();
                return;
            }

            const oPage = this.getView().getParent().getParent();
            const oSideNavigation = await this.loadAndAssignFragment('SideNavigation');
            this.toggleSideNavigation(oPage, oSideNavigation)
        }

	});
});
