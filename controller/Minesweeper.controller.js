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
            },

            createField() {
                const { Width, Height } = this.getCurrentLevel();
                return Array.from(
                    { length: Height },
                    (_, i) => Array.from(
                        { length: Width },
                        (_, j) => ({ Index: i * Width + j })
                    )
                )
            },

            insertMines(iCurrentIndex) {
                const aField = this.getModel().getProperty('/Field');
                const { Width, Height, Mines } = this.getCurrentLevel();
                const aMineIndecies = [...Array(Width * Height).keys()]
                    .filter(i => i !== iCurrentIndex)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, Mines);
                aField.forEach(aRow => aRow.forEach(
                    oCell => oCell.IsMine = aMineIndecies.includes(oCell.Index)
                ));
                this.getModel().refresh(true);
            },

            // createArray(length, fnMapping) {
            //     return Array.from({ length }, fnMapping);
            // },

            getCurrentLevel() {
                const aLevels = this.getModel().getProperty('/Levels');
                const sLevel = this.getModel().getProperty('/Level');
                return aLevels.find(oLevel => oLevel.Key === sLevel);
            },

            onPressCell(oEvent) {
                const iCellIndex = this.getObjectByEvent(oEvent).Index;
                this.insertMines(iCellIndex);
            }

		});
	}
);
