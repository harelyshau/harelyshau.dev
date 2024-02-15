sap.ui.define([
	'./BaseController',
	'sap/m/MessageToast',
	'sap/m/InstanceManager',
	'../model/models'
], (BaseController, MessageToast, InstanceManager, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.HanotoiTower', {

		onInit() {
			this.setModel(models.createHanoiTowerModel());
			this.setModel(models.createHanoiTowerViewModel(), 'view');
			this.attachResize(this.setDiscButtonMaxWidth.bind(this));
			this.attachRouteMatched(this.onHanoiTowerMatched);
			this.setDiscButtonMaxWidth();
			this.attachTimer();
			this.setupGame();
		},

		onHanoiTowerMatched(oEvent) {
			const { discs } = oEvent.getParameter('arguments');
            const aDiscCounts = this.getProperty('/DiscCounts');
            const fnIsCurLevel = (iDiscCount) => iDiscCount == discs;
            const iDiscCount = aDiscCounts.find(fnIsCurLevel);
			iDiscCount
                ? this.setProperty('/DiscCount', iDiscCount)
                : this.navigateTo('HanoiTower');
			InstanceManager.closeAllDialogs();
            this.setupGame();
		},

		//////////////////////////////////
		/////////// RESPONSIVE ///////////
		//////////////////////////////////

		setPegBoxHeight() {
			this.setProperty('/pegBoxHeight', null, 'view', true);
			setTimeout(() => {
				const oDomPegBox = this.getDomPegBox();
				if (!oDomPegBox) {
					setTimeout(this.setPegBoxHeight.bind(this), 500);
					return;
				}
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
			localStorage.setItem('moveButtons', oEvent.getParameter('state'));
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

		//////////////////////////////////
		/////////// WIN DIALOG ///////////
		//////////////////////////////////

		onPressLevelUp() {
			const iDiscCount = this.getProperty('/DiscCount') + 1;
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
			this.setProperty('/Time', 0);
			this.setProperty('/Moves', 0);
		},

		setPegs() {
			const aPegs = [this.getDiscs(), [], []];
			this.setProperty('/Pegs', aPegs);
			this.refreshModel();
		},

		getDiscs() {
			const length = this.getProperty('/DiscCount');
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
			const aRecords = this.getProperty('/Records');
			const oResult = this.getCurrentResult();
			const oRecord = aRecords.find((oRecord) => oRecord.DiscCount === oResult.DiscCount);
			this.setPreviousRecord({ ...oRecord });
			oRecord ? this.updateExistingRecord(oRecord, oResult) : aRecords.push(oResult);
			this.setProperty('/Records', [...aRecords]);
			localStorage.setItem('records', JSON.stringify(aRecords));
		},

		// save to view model to show it in WinDialog
		setPreviousRecord(oRecord) {
			this.setProperty('/previousRecord', null, 'view');
			this.setProperty('/previousRecord', oRecord, 'view');
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
			const iMoves = this.getProperty('/Moves');
			this.setProperty('/Moves', iMoves + 1);
		},

		//////////////////////////////////
		///////////// COMMON /////////////
		//////////////////////////////////

		isGameStarted() {
			const iMoves = this.getProperty('/Moves');
			return iMoves && !this.isGameFinished();
		},

		isGameFinished() {
			const { Pegs, DiscCount } = this.getModel().getData();
			return Pegs[2].length === DiscCount;
		},

		setNewLevel(discs) {
			this.confirmRestart(
				() => this.navigateTo('HanoiTower', { discs })
			);
		},

		confirmRestart(fnCallback) {
			if (!this.isGameStarted()) return fnCallback();
			this.stopTimer();
			const fnCallbackCancel = () => {
				this.startTimer();
				this.refreshModel();
			};
			const sMessage = this.i18n('msgConfirmRestartGame');
			this.openConfirmationMessageBox(sMessage, fnCallback, fnCallbackCancel);
		}

	});
});
