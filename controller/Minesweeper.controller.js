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

		return BaseController.extend('pharelyshau.controller.Minesweeper', {

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
                const aField = this.getModel().getProperty('/Field');
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
                const iCellID = this.getObjectByEvent(oEvent).ID;
                this.insertMines(iCellID);
                const sPath = this.getPathByEvent(oEvent) + '/IsOpened';
                this.getModel().setProperty(sPath, true);
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
            }


		});
	}
);
