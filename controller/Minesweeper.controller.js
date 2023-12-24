sap.ui.define(
	[
		'./BaseController',
		'sap/m/MessageToast',
		'sap/m/InstanceManager',
		'sap/ui/core/ResizeHandler',
		'../model/models',
        '../model/formatter',
	],
	(BaseController, MessageToast, InstanceManager, ResizeHandler, models, formatter) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Minesweeper', {
            formatter,

            onRightPressCell(oEvent) {
                const sPath = this.getPathByEvent(oEvent) + '/IsFlagged';
                const bFlagged = !this.getModel().getProperty(sPath);
                this.getModel().setProperty(sPath, bFlagged);
                this.updateFlagCount(bFlagged);
            },

			onInit() {
				this.setModel(models.createMinesweeperModel());
				// this.setModel(models.createMinesweeperViewModel(), 'view');
				this.setupGame();
			},

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
                const aField = this.getModel().getProperty('/Field');
                const { Width, Height, Mines } = this.getCurrentLevel();
                const aMineIndecies = [...Array(Width * Height).keys()]
                    .filter(i => i !== iCurrentID)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Mines);
                aField.forEach(aRow => aRow.forEach(
                    oCell => oCell.IsMine = aMineIndecies.includes(oCell.ID)
                ));
                this.getModel().refresh();
            },

            isAlreadyMined() {
                const aField = this.getField();
                const oCell = aField[0][0];
                return 'IsMine' in oCell;
            },

            getCurrentLevel() {
                return this.getModel().getProperty('/Level');
            },

            onPressCell(oEvent) {
                const oCell = this.getObjectByEvent(oEvent);
                if (this.isGameFinished() || oCell.IsFlagged) return;
                this.insertMines(this.getObjectByEvent(oEvent).ID);
                this.openCells(oEvent.getSource());
                this.getModel().refresh(true);
                this.startTimer();
                const bGameOver = oCell.IsMine;
                if (bGameOver) this.finishLostGame();
                if (this.isGameWon()) this.finishWonGame();
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

            finishWonGame() {
                this.getModel().setProperty('/GameFinished', true);
                MessageToast.show('You won');
                this.showMines();
                this.stopTimer();
            },

            isGameFinished() {
                return this.getModel().getProperty('/GameFinished');
            },

            finishLostGame() {
                this.getModel().setProperty('/GameFinished', true);
                this.showMines();
                MessageToast.show('Game over');
                this.stopTimer();
            },

            showMines() {
                const aButtons = this.byId('gameBox').getItems()
                    .flatMap(oRow => oRow.getItems());
                aButtons.forEach(oButton => {
                    const bMine = this.getObjectByControl(oButton).IsMine;
                    if (bMine) this.openCell(oButton);
                });
                this.getModel().refresh();
            },

            openCells(oButton) {
                const oCell = this.openCell(oButton);
                if (oCell && !oCell.MineCount) {
                    const aNeighbours = this.getNeighbourCells(oButton);
                    aNeighbours.forEach(oButton => this.openCells(oButton));
                }
            },

            openCell(oButton) {
                const oCell = this.getObjectByControl(oButton);
                if (oCell.IsOpen) return;
                const iCellsLeft = this.getModel().getProperty('/CellsLeft') - 1;
                if (!oCell.IsMine) this.getModel().setProperty('/CellsLeft', iCellsLeft);
                oCell.IsOpen = true;
                if (oCell.IsFlagged) this.updateFlagCount();
                oCell.IsFlagged = false;
                oCell.MineCount = this.getCellMineCount(oCell) || '';
                return oCell;
            },

            updateFlagCount(bDecrease) {
                let iFlags = this.getModel().getProperty('/Flags');
                iFlags -= bDecrease ? 1 : -1;
                this.getModel().setProperty('/Flags', iFlags);
            },

            getCellMineCount(oCell) {
                let iMineCount = 0;
                const aDx = [-1, 0, 1];
                aDx.forEach(iRowDx => {
                    aDx.forEach(iColDx => {
                        const [iCell, jCell] = oCell.Coordinates;
                        const oNeighbour = this.getField()[iCell + iRowDx]?.[jCell + iColDx];
                        if (oNeighbour?.IsMine) iMineCount++;
                    });
                });
                return iMineCount;
            },

            getNeighbourCells(oButton) {
                const aRows = oButton.getParent().getParent().getItems();
                const aDiff = [-1, 0, 1];
                const aNeighbours = [];
                aDiff.forEach(iRowDiff => {
                    aDiff.forEach(iColDiff => {
                        const [x, y] = this.getObjectByControl(oButton).Coordinates;
                        const oNeighbour = aRows[x + iColDiff]?.getItems()[y + iRowDiff];
                        if (oNeighbour) aNeighbours.push(oNeighbour);
                    });
                });
                return aNeighbours;
            },

            onPressRestartGame() {
                this.setupGame();
            },

            onChangeLevel(oEvent) {
				const oLevel = this.getObjectByControl(oEvent.getParameter('selectedItem'));
				this.setNewLevel(oLevel);
			},

            setNewLevel(oLevel) {
                this.getModel().setProperty('/Level', oLevel);
                this.setupGame();
            },

            getField() {
                return this.getModel().getProperty('/Field')
            },

            onPressCloseAndRestart(oEvent) {
                this.oGameOverDialog.close();
                this.setupGame();
            }


		});
	}
);
