sap.ui.define([
	'./BaseController',
	'../model/models',
	'sap/m/MessageToast',
	'sap/m/MessageBox',
	'../util/notificationHelper'
], (BaseController, models, MessageToast, MessageBox, notificationHelper) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.PWA', {

		onInit() {
			this.setModel(models.createPWAModel());
		},

		async onPressShowNotification(oEvent) {
			const oButton = oEvent.getSource().setBusy(true);
			try {
				await notificationHelper.trigger(this.getProperty('/').notification);
				MessageToast.show('Notification will be showed after delay');
			} catch (sError) {
				MessageBox.error(sError);
			} finally {
				oButton.setBusy(false);
			}
		}

	});
});
