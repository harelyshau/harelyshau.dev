sap.ui.define([
    './Game.controller',
    'sap/m/MessageToast',
    '../model/models'
], (GameController, MessageToast, models) => {
    'use strict';

    return GameController.extend('pharelyshau.controller.Minesweeper', {

        onInit() {
            this.setModel(models.createMinesweeperModel.call(this));
            this.setModel(models.createMinesweeperViewModel(), 'view');
            this.attachRouteMatched(this.onMinewsweeperMatched);
            this.attachLanguageChange(this.setLevelTexts);
            this.attachTimer();
            this.setLevelTexts();
        },

        onMinewsweeperMatched(oEvent) {
            const { level } = oEvent.getParameter('arguments');
            const aLevels = this.getProperty('/levels');
            const fnIsCurLevel = ({ key }) => key === level;
            const oLevel = aLevels.find(fnIsCurLevel);
			oLevel
                ? this.setProperty('/level', oLevel)
                : this.navigateTo('Minesweeper');
            (oLevel ?? !this.isGameStarted()) && this.setupGame();
        },

        //////////////////////////////////
        /////////// SETUP GAME ///////////
        //////////////////////////////////

        setupGame() {
            this.setProperty('/gameFinished', false);
            this.createField();
            this.resetStartupParams();
            this.stopTimer();
            this.setGameWidth(300);
        },

        setGameWidth(iDelay) {
            setTimeout(() => {
                const oCellButton = this.byId('gameBox').getItems()[0].getItems()[0];
                const oHtmlButton = oCellButton.getDomRef();
                if (!oHtmlButton) return this.setGameWidth();
                const { width } = this.getCurrentLevel();
                const iWidth = oHtmlButton.offsetWidth * width;
                this.setProperty('/fullWidth', iWidth > 700, 'view');
            }, iDelay);
        },

        resetStartupParams() {
            const { mines, width, height } = this.getCurrentLevel();
            this.setProperty('/cellsLeft', width * height - mines);
            this.setProperty('/flags', mines);
            this.setProperty('/time', 0);
        },

        createField() {
            const { width, height } = this.getCurrentLevel();
            const aField = Array.from(
                { length: height },
                (_, x) => Array.from(
                    { length: width },
                    (_, y) => ({ id: x * width + y, coordinates: [x, y] })
                )
            );
            this.setProperty('/field', aField);
        },

        insertMines(iCurrentID) {
            if (this.isAlreadyMined()) return;
            const { width, height, mines } = this.getCurrentLevel();
            const aMineIndecies = [...Array(width * height).keys()]
                .filter(i => i !== iCurrentID)
                .sort(this.random)
                .slice(0, mines);
            const aCells = this.getCells();
            aCells.forEach(oCell => oCell.isMine = aMineIndecies.includes(oCell.id));
        },

        isAlreadyMined() {
            const aField = this.getField();
            const oCell = aField[0][0];
            return 'isMine' in oCell;
        },

        //////////////////////////////////
        ////////// CELL OPENING //////////
        //////////////////////////////////

        onPressCell(oEvent) {
            const oCell = this.getObjectByEvent(oEvent);
            if (this.isGameFinished() || oCell.isFlagged) return;
            this.insertMines(oCell.id);
            this.handleOpeningCell(oCell);
            this.startTimer();
        },

        onRightPressCell(oEvent) {
            const { isOpen } = this.getObjectByEvent(oEvent);
            if (!this.isGameStarted() || isOpen) return;
            const sPath = `${this.getPathByEvent(oEvent)}/isFlagged`;
            const bFlagged = !this.getProperty(sPath);
            this.setProperty(sPath, bFlagged);
            this.updateFlagCount(bFlagged);
        },

        onDoublePressCell(oEvent) {
            const oCell = this.getObjectByEvent(oEvent);
            const aNeighbours = this.getNeighbourCells(oCell);
            const aFlaggedNeighbours = aNeighbours.filter(({ isFlagged }) => isFlagged);
            const bReadyToOpen = oCell.mineCount === aFlaggedNeighbours.length;
            if (!bReadyToOpen) return;
            aNeighbours.filter(({ isFlagged, isOpen }) => !isFlagged && !isOpen)
                .forEach(oCell => this.handleOpeningCell(oCell));
        },

        handleOpeningCell(oCell) {
            this.openCells(oCell);
            const bGameLost = oCell.isMine;
            if (bGameLost) this.setProperty('/selectedMine', oCell.id)
            if (bGameLost || this.isGameWon()) this.finishGame(!bGameLost);
        },

        // TODO:
        openCells(oCell) {
            oCell = this.openCell(oCell);
            if (!oCell || oCell.mineCount || oCell.isMine) return;
            const aNeighbours = this.getNeighbourCells(oCell);
            aNeighbours.forEach(oCell => this.openCells(oCell));
        },

        openCell(oCell) {
            if (oCell.isOpen) return;
            if (!oCell.isMine) {
                const iCellsLeft = this.getProperty('/cellsLeft') - 1;
                this.setProperty('/cellsLeft', iCellsLeft);
                oCell.mineCount = this.getCellMineCount(oCell) || '';
            };
            if (oCell.isFlagged) this.updateFlagCount();
            oCell.isFlagged = false;
            oCell.isOpen = true;
            return oCell;
        },

        updateFlagCount(bDecrease) {
            const iFlags = this.getProperty('/flags');
            this.setProperty('/flags', bDecrease ? iFlags - 1 : iFlags + 1);
        },

        getCellMineCount(oCell) {
            const aNeighbours = this.getNeighbourCells(oCell);
            return aNeighbours.filter(({ isMine }) => isMine).length;
        },

        getNeighbourCells(oCell) {
            const aField = this.getField();
            const aDiff = [-1, 0, 1];
            const aNeighbours = [];
            aDiff.forEach(iRowDiff => {
                aDiff.forEach(iColDiff => {
                    const [x, y] = oCell.coordinates;
                    const oNeighbour = aField[x + iColDiff]?.[y + iRowDiff];
                    if (oNeighbour && oCell !== oNeighbour) aNeighbours.push(oNeighbour);
                });
            });
            return aNeighbours;
        },

        finishGame(bWon) {
            this.setProperty('/gameFinished', true);
            MessageToast.show(bWon ? 'You won' : 'Game over');
            this.showMines();
            this.stopTimer();
            if (!bWon) return;
            this.setProperty('/flags', 0);
            this.setNewRecord();
        },

        showMines() {
            const aCells = this.getCells();
            const aMines = aCells.filter(({ isMine, isFlagged }) => isMine && !isFlagged);
            aMines.forEach(oMine => this.openCell(oMine));
        },

        onPressRestartGame() {
            this.setupGame();
        },

        onChangeLevel(oEvent) {
            const sLevel = oEvent.getParameter('selectedItem').getKey();
            this.setNewLevel(sLevel);
        },

        setNewLevel(level) {
            this.navigateTo('Minesweeper', { level });
        },

        isGameStarted() {
            const iCellsLeft = this.getProperty('/cellsLeft');
            const { width, height, mines } = this.getCurrentLevel();
            const bStarted = iCellsLeft !== undefined && iCellsLeft !== width * height - mines;
            return bStarted && !this.isGameFinished();
        },

        isGameWon() {
            return !this.getProperty('/cellsLeft');
        },

        isGameFinished() {
            return this.getProperty('/gameFinished');
        },

        getField() {
            return this.getProperty('/field')
        },

        getCells() {
            return this.getField().flat();
        },

        getCurrentLevel() {
            return this.getProperty('/level');
        },

        // Settings for custom field

        onPressApplySettings() {
            if (!this.isSettingsValid()) return MessageToast.show('Enter correct values');
            const oLevel = this.getProperty('/customLevel', 'view');
            this.setProperty('/level', oLevel);
            this.setProperty('/levels/3', oLevel);
            this.saveSettingsToLocalStorage();
            this.setupGame();
            this.oSettingsDialog.close();
        },

        saveSettingsToLocalStorage() {
            const oLevel = this.getProperty('/customLevel', 'view');
            Object.keys(oLevel)
                .filter(sKey => !['key', 'text'].includes(sKey))
                .forEach(sKey => this.setStorageItem(
                    `custom${this.toPascalCase(sKey)}`, oLevel[sKey]
                ));
        },

        isSettingsValid() {
            const aInputs = this.byId('settingsBox').getItems()
                .map(oBox => oBox.getItems()[1]);
            return aInputs.every(this.isInputFilledAndValid);
        },

        onPressOpenSettingsDialog() {
            this.stopTimer();
            const oLevel = { ...this.getCurrentLevel() };
            this.setProperty('/customLevel', oLevel, 'view');
            this.openDialog('SettingsDialog');
        },

        onPressOpenRecordsDialog() {
            this.stopTimer();
            this.openDialog('RecordsDialog');
        },

        setNewRecord() {
            const { key } = this.getCurrentLevel();
            if (key === 'custom') return;
            const aRecords = this.getProperty('/records');
            const time = this.getProperty('/time');
            const oRecord = aRecords.find((oRecord) => oRecord.key === key);
            if (oRecord) oRecord.time = Math.min(oRecord.time, time);
            else aRecords.push({ key, time });
            this.refreshModel();
            this.setStorageItem('records', aRecords);
        },

        onPressImrpoveResult(oEvent) {
            const sLevelKey = this.getObjectByEvent(oEvent).key;
			this.setNewLevel(sLevelKey);
            this.oRecordsDialog.close();
        }

    });
});
