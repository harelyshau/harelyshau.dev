sap.ui.define([
    './BaseController',
    'sap/m/MessageToast',
    '../model/models',
    '../model/formatter',
], (BaseController, MessageToast, models, formatter) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.Minesweeper', {
        formatter,

        onInit() {
            this.setModel(models.createMinesweeperModel());
            this.setupGame();
        },

        //////////////////////////////////
        /////////// SETUP GAME ///////////
        //////////////////////////////////

        setupGame() {
            this.getModel().setProperty('/GameFinished', false);
            this.getModel().setProperty('/Field', this.createField());
            this.resetStartupParams();
            this.stopTimer();
        },

        resetStartupParams() {
            const { Mines, Width, Height } = this.getCurrentLevel();
            this.getModel().setProperty('/CellsLeft', Width * Height - Mines);
            this.getModel().setProperty('/Flags', Mines);
            this.getModel().setProperty('/Time', 0);
        },

        createField() {
            const { Width, Height } = this.getCurrentLevel();
            return Array.from(
                { length: Height },
                (_, i) => Array.from(
                    { length: Width },
                    (_, j) => ({ ID: i * Width + j, Coordinates: [i, j] })
                )
            );
        },

        insertMines(iCurrentID) {
            if (this.isAlreadyMined()) return;
            const { Width, Height, Mines } = this.getCurrentLevel();
            const aMineIndecies = [...Array(Width * Height).keys()]
                .filter(i => i !== iCurrentID)
                .sort(() => Math.random() - 0.5)
                .slice(0, Mines);
            const aCells = this.getCells();
            aCells.forEach(oCell => oCell.IsMine = aMineIndecies.includes(oCell.ID));
        },

        isAlreadyMined() {
            const aField = this.getField();
            const oCell = aField[0][0];
            return 'IsMine' in oCell;
        },

        //////////////////////////////////
        ////////// CELL OPENING //////////
        //////////////////////////////////

        onPressCell(oEvent) {
            const oCell = this.getObjectByEvent(oEvent);
            if (this.isGameFinished() || oCell.IsFlagged) return;
            this.insertMines(oCell.ID);
            this.openCells(oCell);
            this.startTimer();
            this.getModel().refresh(true);
            const bGameLost = oCell.IsMine;
            if (bGameLost || this.isGameWon()) this.finishGame(!bGameLost);
        },

        openCells(oCell) {
            oCell = this.openCell(oCell);
            if (!oCell || oCell.MineCount || oCell.IsMine) return;
            const aNeighbours = this.getNeighbourCells(oCell);
            aNeighbours.forEach(oCell => this.openCells(oCell));
        },

        openCell(oCell) {
            if (oCell.IsOpen) return;
            if (!oCell.IsMine) {
                const iCellsLeft = this.getModel().getProperty('/CellsLeft') - 1;
                this.getModel().setProperty('/CellsLeft', iCellsLeft);
                oCell.MineCount = this.getCellMineCount(oCell) || '';
            };
            if (oCell.IsFlagged) this.updateFlagCount();
            oCell.IsFlagged = false;
            oCell.IsOpen = true;
            return oCell;
        },

        updateFlagCount(bDecrease) {
            let iFlags = this.getModel().getProperty('/Flags');
            iFlags -= bDecrease ? 1 : -1;
            this.getModel().setProperty('/Flags', iFlags);
        },

        getCellMineCount(oCell) {
            const aNeighbours = this.getNeighbourCells(oCell);
            return aNeighbours.filter(oCell => oCell.IsMine).length;
        },

        getNeighbourCells(oCell) {
            const aField = this.getField();
            const aDiff = [-1, 0, 1];
            const aNeighbours = [];
            aDiff.forEach(iRowDiff => {
                aDiff.forEach(iColDiff => {
                    const [x, y] = oCell.Coordinates;
                    const oNeighbour = aField[x + iColDiff]?.[y + iRowDiff];
                    if (oNeighbour) aNeighbours.push(oNeighbour);
                });
            });
            return aNeighbours;
        },

        onRightPressCell(oEvent) {
            if (!this.isGameStarted()) return;
            const sPath = this.getPathByEvent(oEvent) + '/IsFlagged';
            const bFlagged = !this.getModel().getProperty(sPath);
            this.getModel().setProperty(sPath, bFlagged);
            this.updateFlagCount(bFlagged);
            this.getModel().refresh(true);
        },

        finishGame(bWon) {
            this.getModel().setProperty('/GameFinished', true);
            MessageToast.show(bWon ? 'You won' : 'Game over');
            this.showMines(bWon);
            this.stopTimer();
            if (bWon) this.getModel().setProperty('/Flags', 0);
        },

        showMines(bForceUpdate) {
            const aCells = this.getCells();
            const aMines = aCells.filter(oCell => oCell.IsMine && !oCell.IsFlagged);
            aMines.forEach(oMine => this.openCell(oMine));
            this.getModel().refresh(bForceUpdate);
        },

        onPressRestartGame() {
            this.setupGame();
        },

        onChangeLevel(oEvent) {
            const oSelectedItem = oEvent.getParameter('selectedItem');
            this.setNewLevel(this.getObjectByControl(oSelectedItem));
        },

        setNewLevel(oLevel) {
            this.getModel().setProperty('/Level', oLevel);
            this.setupGame();
        },

        isGameStarted() {
            const iCellsLeft = this.getModel().getProperty('/CellsLeft');
            const { Width, Height, Mines } = this.getCurrentLevel();
            const bStarted = iCellsLeft !== Width * Height - Mines;
            return bStarted && !this.isGameFinished();
        },

        isGameWon() {
            return !this.getModel().getProperty('/CellsLeft');
        },

        isGameFinished() {
            return this.getModel().getProperty('/GameFinished');
        },

        getField() {
            return this.getModel().getProperty('/Field')
        },

        getCells() {
            return this.getField().flat();
        },

        getCurrentLevel() {
            return this.getModel().getProperty('/Level');
        }


    });
});
