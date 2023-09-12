sap.ui.define(['./BaseController', '../model/models'],
(BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Algorithms', {
		onInit() {
            this.setModel(models.createAlgorithmsViewModel(), 'view');
            this.setModel(models.createAlgorithmsModel());
		},
        
        onPressToggleSideNavigation() {
            const bPhone = this.getModel('device').getProperty('/system/phone');
            const oSideNavigation = bPhone ? this.byId('sideNavigation') : null;
            const oPage = bPhone ? this.getView().getParent().getParent() : this.byId("page");
            const bExpanded = this.toggleSideNavigation(oPage, oSideNavigation);
            this.getModel('view').setProperty('/sideExpanded', bExpanded);
        }

	});
});
