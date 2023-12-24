sap.ui.define(
	[
		'./BaseController',
		'sap/m/MessageToast',
		'sap/m/InstanceManager',
		'sap/ui/core/ResizeHandler',
		'../model/models'
	],
	(BaseController, MessageToast, InstanceManager, ResizeHandler, models) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.HanotoiTower', {

			onInit() {
				this.setModel(models.createHanoiTowerModel());
				this.setModel(models.createHanoiTowerViewModel(), 'view');
				this.setupGame();
				this.setDiscButtonMaxWidth();
				ResizeHandler.register(this.getView(), this.setDiscButtonMaxWidth.bind(this));
				this.getView().addEventDelegate({ onBeforeHide: this.stopTimer.bind(this) });
			},

			//////////////////////////////////
			/////////// RESPONSIVE ///////////
			//////////////////////////////////

			setPegBoxHeight() {
				this.getModel('view').setProperty('/pegBoxHeight', null);
				setTimeout(() => {
					const oDomPegBox = this.getDomPegBox();
					if (!oDomPegBox) {
						setTimeout(this.setPegBoxHeight.bind(this), 500);
						return;
					}
					const iPegBoxHeight = oDomPegBox.clientHeight;
					this.getModel('view').setProperty('/pegBoxHeight', iPegBoxHeight);
				});
			},

			setDiscButtonMaxWidth() {
				setTimeout(() => {
					const oDomPegBox = this.getDomPegBox();
					if (!oDomPegBox) return;
					const iPegBoxWidth = oDomPegBox.clientWidth;
					this.getModel('view').setProperty('/discButtonMaxWidth', iPegBoxWidth);
				});
			},

			getDomPegBox() {
				const aPegControls = this.getView().getControlsByFieldGroupId('pegs');
				const aPegBoxes = aPegControls.filter((oControl) => oControl.hasStyleClass('phPegBox'));
				return aPegBoxes[0]?.getDomRef();
			},

			//////////////////////////////////
			/////////// PLAYGROUND ///////////
			//////////////////////////////////

			onChangeDiscsCount(oEvent) {
				const iDiscCount = +oEvent.getParameter('selectedItem').getKey();
				this.setNewLevel(iDiscCount);
			},

			onPressRestartGame() {
				this.confirmRestart(this.setupGame.bind(this));
			},

			onPressOpenRecordsDialog() {
				this.stopTimer();
				this.openDialog('RecordsDialog');
			},

			onChangeMoveButtonsSwith(oEvent) {
				localStorage.setItem('moveButtons', oEvent.getParameter('state'));
			},

			onPressMoveDiscByBox(oEvent) {
				const aTargetPeg = this.getObjectByEvent(oEvent);
				const aSelectedPeg = this.getModel('view').getProperty('/selectedPeg');
				this.getModel('view').setProperty('/selectedPeg', !aSelectedPeg ? aTargetPeg : null);
				if (aSelectedPeg) this.tryMovingDisc(aSelectedPeg, aTargetPeg);
			},

			onPressMoveDiscByButton(oEvent) {
				const oPegControl = oEvent.getSource().getParent();
				const aCurrentPeg = this.getObjectByControl(oPegControl);
				const aTargetPeg = this.getObjectByEvent(oEvent);
				this.tryMovingDisc(aCurrentPeg, aTargetPeg);
			},

			onDropMoveDisc(oEvent) {
				const oPegControl = oEvent.getSource().getParent().getParent();
				const aCurrentPeg = this.getObjectByControl(oPegControl);
				const aTargetPeg = this.getObjectByControl(oEvent.getParameter("droppedControl"));
				this.tryMovingDisc(aCurrentPeg, aTargetPeg);
			},

			onPressFirePegPress(oEvent) {
				const oDiscButton = oEvent.getSource();
				const oPegListItem = oDiscButton.getParent().getParent();
				oPegListItem.firePress();
			},

			//////////////////////////////////
			///////// RECORDS DIALOG /////////
			//////////////////////////////////

			onPressImrpoveResult(oEvent) {
				const iDiscCount = this.getObjectByEvent(oEvent).DiscCount;
				this.setNewLevel(iDiscCount);
			},

			onAfterCloseRecordsDialog() {
				this.startTimer();
			},

			//////////////////////////////////
			/////////// WIN DIALOG ///////////
			//////////////////////////////////

			onPressLevelUp() {
				const iDiscCount = this.getModel().getProperty('/DiscCount') + 1;
				this.setNewLevel(iDiscCount);
			},

			onAfterCloseWinDialog() {
				this.setupGame();
				this.getModel('view').setProperty('/previousRecord', null);
			},

			//////////////////////////////////
			/////////// GAME LOGIC ///////////
			//////////////////////////////////

			setupGame() {
				this.getModel('view').setProperty('/selectedPeg', null);
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
				const length = this.getModel().getProperty('/DiscCount');
				return Array.from({ length }).map((_, i) => i + 1);
			},

			tryMovingDisc(aCurrentPeg, aTargetPeg) {
				if (aCurrentPeg === aTargetPeg) return;
				this.getModel('view').setProperty('/selectedPeg', null);
				const bImpossible = aCurrentPeg[0] > aTargetPeg[0] || !aCurrentPeg.length;
				if (bImpossible) return MessageToast.show(this.i18n('msgImpossibleMove'));
				this.moveDisc(aCurrentPeg, aTargetPeg);
				this.increaseMoves();
				this.startTimer();
				if (this.isGameFinished()) this.finishGame();
			},

			moveDisc(aCurrentPeg, aTargetPeg) {
				aTargetPeg.unshift(aCurrentPeg[0]);
				aCurrentPeg.shift();
				this.getModel().refresh(true);
			},

			finishGame() {
				this.stopTimer();
				this.openDialog('WinDialog');
				this.setNewRecord();
			},

			setNewRecord() {
				const aRecords = this.getModel().getProperty('/Records');
				const oResult = this.getCurrentResult();
				const oRecord = aRecords.find((oRecord) => oRecord.DiscCount === oResult.DiscCount);
				this.setPreviousRecord({ ...oRecord });
				oRecord ? this.updateExistingRecord(oRecord, oResult) : aRecords.push(oResult);
				this.getModel().refresh(true);
				localStorage.setItem('records', JSON.stringify(aRecords));
			},

			// save to view model to show it in WinDialog
			setPreviousRecord(oRecord) {
				this.getModel('view').setProperty('/previousRecord', null);
				this.getModel('view').setProperty('/previousRecord', oRecord);
			},

			updateExistingRecord(oRecord, oResult) {
				oRecord.Time = Math.min(oRecord.Time, oResult.Time);
				oRecord.Moves = Math.min(oRecord.Moves, oResult.Moves);
			},

			getCurrentResult() {
				const { DiscCount, Time, Moves } = this.getModel().getData();
				return { DiscCount, Time, Moves };
			},

			increaseMoves() {
				const iMoves = this.getModel().getProperty('/Moves');
				this.getModel().setProperty('/Moves', iMoves + 1);
			},

			//////////////////////////////////
			///////////// COMMON /////////////
			//////////////////////////////////

			// startTimer() {
			// 	if (this.timerId || !this.isGameStarted()) return;
			// 	let iTime = this.getModel().getProperty('/Time');
			// 	this.timerId = setInterval(() => {
			// 		this.getModel().setProperty('/Time', ++iTime);
			// 	}, 1000);
			// },

			// stopTimer() {
			// 	clearInterval(this.timerId);
			// 	this.timerId = null;
			// },

			isGameStarted() {
				const iMoves = this.getModel().getProperty('/Moves');
				return iMoves && !this.isGameFinished();
			},

			isGameFinished() {
				const { Pegs, DiscCount } = this.getModel().getData();
				return Pegs[2].length === DiscCount;
			},

			setNewLevel(iDiscCount) {
				this.confirmRestart(() => {
					this.getModel().setProperty('/DiscCount', iDiscCount);
					localStorage.setItem('discs', iDiscCount);
					this.setupGame();
					InstanceManager.closeAllDialogs();
				});
			},

			confirmRestart(fnCallback) {
				if (!this.isGameStarted()) return fnCallback();
				this.stopTimer();
				const fnCallbackCancel = () => {
					this.startTimer();
					this.getModel().refresh(true);
				};
				const sMessage = this.i18n('msgConfirmRestartGame');
				this.openConfirmationMessageBox(sMessage, fnCallback, fnCallbackCancel);
			}

		});
	}
);
