sap.ui.define([
	'./BaseController',
	'../model/models',
	'sap/m/MessageToast',
	'sap/m/MessageBox'
], (BaseController, models, MessageToast, MessageBox) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.PWA', {

		onInit() {
			this.setModel(models.createPWAModel());
		},

		async onPressShowNotification(oEvent) {
			const perm = await Notification.requestPermission();
			const sErrorMessage = 'Please enable notifications for this site in settings';
			if (perm !== 'granted') return MessageBox.error(sErrorMessage);
			const oButton = oEvent.getSource().setBusy(true);
			const { notification } = this.getProperty('/');
			try {
				await fetch(`${this.getApiHost()}/notifications`, {
					method: 'POST',
					body: JSON.stringify(notification),
					headers: { 'Content-Type': 'application/json' }
				});
				MessageToast.show('Notification will be showed after delay');
			} catch {
				MessageBox.error('Something went wrong. Please try againg');
			} finally {
				oButton.setBusy(false);
			}
		},

		getApiHost: () => location.origin.startsWith('https://harelyshau.dev')
			? 'https://harelyshau-api.onrender.com'
			: 'http://localhost:3000'

	});
});
