sap.ui.define(
	['./BaseController', 'sap/m/MessageToast', '../model/models'],
	(BaseController, MessageToast, models) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.HanotoiTower', {
			onInit() {
				this.setModel(models.createHanoiTowerModel());
				this.setModel(models.createHanoiTowerViewModel(), 'view');
				this.setupGame();
				this.setDiscButtonMaxWidth();
			},

			// Responsive Sizes

			setPegBoxHeight() {
				this.getModel('view').setProperty('/pegBoxHeight', null);
				setTimeout(() => {
					const oHtmlPegBox = this.getHtmlPegBox();
					if (!oHtmlPegBox) return;
					const iPegBoxHeight = oHtmlPegBox.clientHeight;
					this.getModel('view').setProperty('/pegBoxHeight', iPegBoxHeight);
				});
			},

			setDiscButtonMaxWidth() {
				setTimeout(() => {
					const oPegBox = this.getHtmlPegBox();
					if (!oPegBox) return;
					const iPegBoxWidth = oPegBox.clientWidth;
					this.getModel('view').setProperty('/discButtonMaxWidth', iPegBoxWidth);
				});
			},

			getHtmlPegBox() {
				const aPegControls = this.getView().getControlsByFieldGroupId('pegs');
				const aPegBoxes = aPegControls.filter((oControl) => oControl.hasStyleClass('phPegBox'));
				return aPegBoxes[0]?.getDomRef();
			},

			// Playground Events

			onChangeDiscsCount() {
				this.setDiscCountToLocalStorage();
				this.setupGame();
			},

			setDiscCountToLocalStorage(iDiscCount) {
				iDiscCount = iDiscCount ?? this.getModel().getProperty('/DiscCount');
				localStorage.setItem('discs', iDiscCount);
			},

			onPressRestartGame() {
				this.setupGame();
			},

			onPressOpenRecordsDialog() { },

			onChangeMoveButtonsSwith(oEvent) {
				localStorage.setItem('moveButtons', oEvent.getParameter('state'));
			},

			onPressMoveDiscByBox(oEvent) {
				let aTargetPeg = this.getObjectByEvent(oEvent);
				const aSelectedPeg = this.getModel('view').getProperty('/selectedPeg');
				if (aSelectedPeg && aSelectedPeg !== aTargetPeg) {
					this.tryMovingDisc(aSelectedPeg, aTargetPeg);
				}
				if (aSelectedPeg) aTargetPeg = null;
				this.getModel('view').setProperty('/selectedPeg', aTargetPeg);
				this.removeFocus(oEvent.getSource());
			},

			removeFocus(oControl) {
				oControl.getDomRef().blur();
			},

			onPressMoveDiscByButton(oEvent) {
				const oParentControl = oEvent.getSource().getParent();
				const aCurrentPeg = this.getObjectByControl(oParentControl);
				const aTargetPeg = this.getObjectByEvent(oEvent);
				this.tryMovingDisc(aCurrentPeg, aTargetPeg);
			},

			onPressFirePegPress(oEvent) {
				const oDiscButton = oEvent.getSource();
				const oPegListItem = oDiscButton.getParent().getParent();
				oPegListItem.firePress();
				this.removeFocus(oDiscButton);
			},

			// Win Dialog

			openWinDialog() {
				this.openDialog('HanoiTower', 'WinDialog');
			},

			onPressLevelUp() {
				let iDiscCount = this.getModel().getProperty('/DiscCount');
				this.getModel().setProperty('/DiscCount', ++iDiscCount);
				this.setDiscCountToLocalStorage(iDiscCount);
				this.oWinDialog.close();
			},

			onPressCloseWinDialog() {
				this.oWinDialog.close();
			},

			onAfterCloseWinDialog() {
				this.setupGame();
			},

			// Game Logic

			setupGame() {
				this.stopTimer();
				this.resetTimeAndMoves();
				this.setPegs();
				this.setPegBoxHeight();
			},

			resetTimeAndMoves() {
				this.getModel().setProperty('/Time', 0);
				this.getModel().setProperty('/Moves', 0);
			},

			setPegs() {
				const aPegs = [this.getDiscs(), [], []];
				this.getModel().setProperty('/Pegs', aPegs);
				this.getModel().refresh(true);
			},

			getDiscs() {
				const iDiscCount = this.getModel().getProperty('/DiscCount');
				const aDiscs = [];
				for (let i = 1; i <= iDiscCount; i++) {
					aDiscs.push(i);
				}
				return aDiscs;
			},

			tryMovingDisc(aCurrentPeg, aTargetPeg) {
				const oDisc = aCurrentPeg[0];
				if (oDisc > aTargetPeg[0] || !aCurrentPeg.length) {
					MessageToast.show('test');
					return;
				}
				this.startTimer();
				this.moveDisc(aCurrentPeg, aTargetPeg);
				this.increaseMoves();
				this.checkGameWin(aTargetPeg);
			},

			moveDisc(aCurrentPeg, aTargetPeg) {
				aTargetPeg.unshift(aCurrentPeg[0]);
				aCurrentPeg.shift();
				this.getModel().refresh(true);
			},

			checkGameWin(aTargetPeg) {
				const iDiscCount = this.getModel().getProperty('/DiscCount');
				const aPegs = this.getModel().getProperty('/Pegs');
				const bEnoughDisks = iDiscCount === aTargetPeg.length;
				const bFirstPeg = aPegs.indexOf(aTargetPeg) === 0;
				if (!bEnoughDisks || bFirstPeg) return;
				this.finishGame();
			},

			finishGame() {
				this.stopTimer();
				this.openWinDialog();
				this.setNewRecord();
			},

			setNewRecord() {
				const aRecords = this.getModel().getProperty('/Records');
				const oResult = {
					DiscCount: this.getModel().getProperty('/DiscCount'),
					Time: this.getModel().getProperty('/Time'),
					Moves: this.getModel().getProperty('/Moves')
				};
				const oRecord = aRecords.find((oRecord) => oRecord.DiscCount === oResult.DiscCount);
				if (!oRecord) aRecords.push(oResult);
				if (oResult.Time < oRecord?.Time) oRecord.Time = oResult.Time;
				if (oResult.Moves < oRecord?.Moves) oRecord.Moves = oResult.Moves;
				this.getModel().refresh();
				localStorage.setItem('records', JSON.stringify(aRecords));
			},

			startTimer() {
				let iTime = this.getModel().getProperty('/Time');
				if (this.timerId) return;
				this.timerId = setInterval(() => {
					this.getModel().setProperty('/Time', ++iTime);
				}, 1000);
			},

			stopTimer() {
				clearInterval(this.timerId);
				this.timerId = null;
			},

			increaseMoves() {
				let iMoves = this.getModel().getProperty('/Moves');
				this.getModel().setProperty('/Moves', ++iMoves);
			},

			onDropDisc(oEvent) {
				console.log(1111);
			}
		});
	}
);
