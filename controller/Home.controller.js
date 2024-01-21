sap.ui.define(['./BaseController'], (BaseController) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Home', {

		onInit() {
			this.registerIllustrationSet('tnt', 'sap/tnt/themes/base/illustrations');
		},

		onPressSendEmail() {
			const { subject, message } = this.getSubjectAndMessage();
			this.triggerEmail(subject, message);
		},

		getSubjectAndMessage() {
			const subject = this.byId('inpSubject').getValue();
			const message = this.byId('inpMessage').getValue();
			return { subject , message };
		},

		onPressMakeAppointment() {
			const { subject, message } = this.getSubjectAndMessage();
			const oParams = subject || message ? {} : null;
			if (subject) oParams.title = subject;
			if (message) oParams.agenda = message;
			this.navigateTo('NewAppointment', { '?query': oParams });
		}
	
	});
});
