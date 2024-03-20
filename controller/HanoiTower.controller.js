sap.ui.define([
	'./Game.controller',
	'sap/m/MessageToast',
	'sap/m/InstanceManager',
	'../model/models'
], (GameController, MessageToast, InstanceManager, models) => {
	'use strict';

	return GameController.extend('pharelyshau.controller.HanotoiTower', {

		onInit() {
			this.attachResize(this.setDiscButtonMaxWidth.bind(this));
			this.attachRouteMatched(this.onHanoiTowerMatched);
			this.attachTimer();
			this.setModel(models.createHanoiTowerModel.call(this));
			this.setModel(models.createHanoiTowerViewModel.call(this), 'view');
			this.setDiscButtonMaxWidth();
		},

		onHanoiTowerMatched(oEvent) {
			const { discs } = oEvent.getParameter('arguments');
            const aDiscCounts = this.getProperty('/discCounts');
            const fnIsCurLevel = (iDiscCount) => iDiscCount == discs;
            const iDiscCount = aDiscCounts.find(fnIsCurLevel);
			const bAnotherLevel = iDiscCount !== this.getProperty('/discCount');
			iDiscCount
                ? this.setProperty('/discCount', iDiscCount)
                : this.navigateTo('HanoiTower');
			(iDiscCount && bAnotherLevel || !this.isGameStarted()) && this.setupGame();
		},

		//////////////////////////////////
		/////////// RESPONSIVE ///////////
		//////////////////////////////////

		setPegBoxHeight() {
			this.setProperty('/pegBoxHeight', null, 'view', true);
			setTimeout(() => {
				const oDomPegBox = this.getDomPegBox();
				if (!oDomPegBox) return setTimeout(this.setPegBoxHeight.bind(this), 500);
				const iPegBoxHeight = oDomPegBox.clientHeight;
				this.setProperty('/pegBoxHeight', iPegBoxHeight, 'view');
			});
		},

		setDiscButtonMaxWidth() {
			setTimeout(() => {
				const oDomPegBox = this.getDomPegBox();
				if (!oDomPegBox) return;
				const iPegBoxWidth = oDomPegBox.clientWidth;
				this.setProperty('/discButtonMaxWidth', iPegBoxWidth, 'view');
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
			this.setStorageItem('moveButtons', oEvent.getParameter('state'));
		},

		onPressMoveDiscByBox(oEvent) {
			const aTargetPeg = this.getObjectByEvent(oEvent);
			const aSelectedPeg = this.getProperty('/selectedPeg', 'view');
			this.setProperty('/selectedPeg', !aSelectedPeg ? aTargetPeg : null, 'view');
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
			const aTargetPeg = this.getObjectByControl(oEvent.getParameter('droppedControl'));
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
			const { discCount } = this.getObjectByEvent(oEvent);
			this.setNewLevel(discCount);
		},

		//////////////////////////////////
		/////////// WIN DIALOG ///////////
		//////////////////////////////////

		onPressLevelUp() {
			const iDiscCount = this.getProperty('/discCount') + 1;
			this.setNewLevel(iDiscCount);
		},

		onAfterCloseWinDialog() {
			this.setupGame();
			this.setProperty('/previousRecord', null, 'view');
		},

		//////////////////////////////////
		/////////// GAME LOGIC ///////////
		//////////////////////////////////

		setupGame() {
			this.setProperty('/selectedPeg', null, 'view');
			this.stopTimer();
			this.resetTimeAndMoves();
			this.setPegs();
			this.setPegBoxHeight();
		},

		resetTimeAndMoves() {
			this.setProperty('/time', 0);
			this.setProperty('/moves', 0);
		},

		setPegs() {
			const aPegs = [this.getDiscs(), [], []];
			this.setProperty('/pegs', aPegs);
			this.refreshModel();
		},

		getDiscs() {
			const length = this.getProperty('/discCount');
			return Array.from({ length }).map((_, i) => i + 1);
		},

		tryMovingDisc(aCurrentPeg, aTargetPeg) {
			if (aCurrentPeg === aTargetPeg) return;
			this.setProperty('/selectedPeg', null, 'view');
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
			this.refreshModel();
		},

		finishGame() {
			this.stopTimer();
			this.openDialog('WinDialog');
			this.setNewRecord();
		},

		setNewRecord() {
			const aRecords = this.getProperty('/records');
			const oResult = this.getCurrentResult();
			const oRecord = aRecords.find(({ discCount }) => discCount === oResult.discCount);
			this.setPreviousRecord({ ...oRecord });
			oRecord ? this.updateExistingRecord(oRecord, oResult) : aRecords.push(oResult);
			this.refreshModel();
			this.setStorageItem('records', aRecords);
		},

		// save to view model to show it in WinDialog
		setPreviousRecord(oRecord) {
			this.setProperty('/previousRecord', null, 'view');
			this.setProperty('/previousRecord', oRecord, 'view');
		},

		updateExistingRecord(oRecord, oResult) {
			oRecord.time = Math.min(oRecord.time, oResult.time);
			oRecord.moves = Math.min(oRecord.moves, oResult.moves);
		},

		getCurrentResult() {
			const { discCount, time, moves } = this.getModel().getData();
			return { discCount, time, moves };
		},

		increaseMoves() {
			const iMoves = this.getProperty('/moves');
			this.setProperty('/moves', iMoves + 1);
		},

		//////////////////////////////////
		///////////// COMMON /////////////
		//////////////////////////////////

		isGameStarted() {
			const iMoves = this.getProperty('/moves');
			return iMoves && !this.isGameFinished();
		},

		isGameFinished() {
			const { pegs, discCount } = this.getModel().getData();
			return pegs[2].length === discCount;
		},

		setNewLevel(discs) {
			const fnCallback = () => {
				this.navigateTo('HanoiTower', { discs });
				this.setupGame();
				InstanceManager.closeAllDialogs();
			};
			this.confirmRestart(fnCallback);
		},

		confirmRestart(fnCallback) {
			if (!this.isGameStarted()) return fnCallback();
			this.stopTimer();
			const fnCallbackCancel = () => {
				if (InstanceManager.hasOpenDialog()) return;
				this.startTimer();
				this.refreshModel();
			};
			const sMessage = this.i18n('msgConfirmRestartGame');
			this.openConfirmationMessageBox(sMessage, fnCallback, fnCallbackCancel);
		}

	});
});
