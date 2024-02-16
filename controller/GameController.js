sap.ui.define([
    './BaseController', 'sap/m/MessageBox', '../util/languageHelper'
], (BaseController, MessageBox, languageHelper) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.GameController', {

		openConfirmationMessageBox(sMessage, fnCallbackOK, fnCallbackCancel) {
			MessageBox.confirm(sMessage, {
				onClose: (sAction) => sAction === 'OK'
					? fnCallbackOK()
                    : fnCallbackCancel()
			});
		},

		random() {
			return Math.random() - 0.5;
		},

		// Timers

		attachTimer() {
			this.getView().addEventDelegate({
				onBeforeHide: this.stopTimer,
				onBeforeShow: this.startTimer
			}, this);
		},

		startTimer() {
			if (this.timerId || !this.isGameStarted()) return;
			let iTime = this.getProperty('/time');
			this.timerId = setInterval(() => {
				this.setProperty('/time', ++iTime);
			}, 1000);
		},

		stopTimer() {
			clearInterval(this.timerId);
			this.timerId = null;
		},

        // Language dependent texts

		setLevelTexts() {
			const oTexts = {
				en: {
					easy: 'Easy',
					medium: 'Medium',
					hard: 'Hard',
					custom: 'Custom',
					friend: 'Against a friend'
				},
				ru: {
					easy: 'Легкий',
					medium: 'Средний',
					hard: 'Тяжелый',
					custom: 'Пользовательский',
					friend: 'Против друга'
				},
				de: {
					easy: 'Einfach',
					medium: 'Mittel',
					hard: 'Schwer',
					custom: 'Individuell',
					friend: 'Gegen einen Freund'
				}
			}[languageHelper.getLanguage()];
			this.getProperty('/levels').forEach(({ key }, i) => 
				this.setProperty(`/levels/${i}/text`, oTexts[key])
			);
		},

		toPascalCase(sString) {
			return `${sString[0].toUpperCase()}${sString.slice(1)}`;
		}

	});
});
