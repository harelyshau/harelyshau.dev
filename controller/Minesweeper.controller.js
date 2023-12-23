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

			onInit() {
				this.setModel(models.createMinesweeperModel());
				// this.setModel(models.createMinesweeperViewModel(), 'view');
				this.setupGame();
			},

            setupGame() {
                // const aField = this.createArray(Height, () => this.createArray(Width));
                this.getModel().setProperty('/Field', this.createField());
                const { Mines } = this.getCurrentLevel();
                this.getModel().setProperty('/Mines', Mines);
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

            // createArray(length, fnMapping) {
            //     return Array.from({ length }, fnMapping);
            // },

            getCurrentLevel() {
                return this.getModel().getProperty('/Level');
            },

            onPressCell(oEvent) {
                this.insertMines(this.getObjectByEvent(oEvent).ID);
                this.openCells(oEvent.getSource());
                const bGameOver = this.getObjectByEvent(oEvent).IsMine;
                if (bGameOver) return MessageToast.show('Game over');
            },

            // setCellStyleClass(oCellButton) {
            //     const oCell = this.getObjectByControl(oCellButton);
            //     const { MineCount } = oCell;
            //     if (!MineCount) return;
            //     const oColors = {
            //         1: 'Blue',
            //         2: 'Green',
            //         3: 'Red',
            //         4: 'DarkBlue',
            //         5: 'Brown',
            //         6: 'Turquoise',
            //         7: 'Black',
            //         8: 'White'
            //     };
            //     const sColor = oCell.IsMine ? 'Mine' : oColors[MineCount];
            //     oCellButton.addStyleClass(`ph${ sColor }Cell`);
            // },

            openCells(oButton) {
                const oCell = this.openCell(oButton);
                if (oCell && !oCell.MineCount) {
                    const aNeighbours = this.getNeighbourCells(oButton);
                    aNeighbours.forEach(oButton => this.openCells(oButton));
                }
                this.getModel().refresh(true);
            },

            openCell(oButton) {
                const oCell = this.getObjectByControl(oButton);
                if (oCell.IsOpen) return;
                oCell.IsOpen = true;
                oCell.MineCount = this.getCellMineCount(oCell) || '';
                return oCell;
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
            }


		});
	}
);
