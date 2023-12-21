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

			onChangeDiscsCount() {
				this.setDiscCountToLocalStorage();
				this.setupGame();
			},

			setDiscCountToLocalStorage() {
				const iDiscCount = this.getModel().getProperty('/DiscCount');
				localStorage.setItem('discs', iDiscCount);
			},

			onPressRestartGame() {
				this.setupGame();
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
				this.getModel().setProperty('/DiscCount', iDiscCount);
				this.setupGame();
				InstanceManager.closeAllDialogs();
			},

			onAfterCloseRecordsDialog() {
				if (!this.isGameFinished()) this.startTimer();
			},

			//////////////////////////////////
			/////////// WIN DIALOG ///////////
			//////////////////////////////////

			onPressLevelUp() {
				const iDiscCount = this.getModel().getProperty('/DiscCount');
				this.getModel().setProperty('/DiscCount', iDiscCount + 1);
				this.setDiscCountToLocalStorage();
				this.oWinDialog.close();
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
				if (aCurrentPeg[0] > aTargetPeg[0] || !aCurrentPeg.length) {
					MessageToast.show(this.i18n('msgImpossibleMove'));
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
				const bLastPeg = aTargetPeg === aPegs.at(-1);
				if (!bEnoughDisks || !bLastPeg) return;
				this.finishGame();
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
				return {
					DiscCount: this.getModel().getProperty('/DiscCount'),
					Time: this.getModel().getProperty('/Time'),
					Moves: this.getModel().getProperty('/Moves')
				};
			},

			increaseMoves() {
				const iMoves = this.getModel().getProperty('/Moves');
				this.getModel().setProperty('/Moves', iMoves + 1);
			},

			//////////////////////////////////
			///////////// COMMON /////////////
			//////////////////////////////////

			startTimer() {
				if (this.timerId) return;
				let iTime = this.getModel().getProperty('/Time');
				this.timerId = setInterval(() => {
					this.getModel().setProperty('/Time', ++iTime);
				}, 1000);
			},

			stopTimer() {
				clearInterval(this.timerId);
				this.timerId = null;
			},

			isGameFinished() {
				const bFinished = !!this.oWinDialog?.isOpen();
				const bStarted = this.getModel().getProperty('/Moves') > 0;
				return bFinished || !bStarted;
			}

		});
	}
);
