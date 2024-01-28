sap.ui.define([
    './BaseController',
    'sap/m/MessageToast',
    '../model/models'
], (BaseController, MessageToast, models) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.Minesweeper', {

        onInit() {
            this.setModel(models.createTicTacToeModel());
            this.setupGame();
        },

        setupGame() {
            this.createField();
            this.setProperty('/turn', true);
        },

        onPress(oEvent) {
            const iTurn = this.getProperty('/turn');
            this.getObjectByEvent(oEvent).value = iTurn;
            this.checkGameOver();
            this.setProperty('/turn', !iTurn);
        },

        checkGameOver() {
            // this.getProperty('/field').some(aCells => aCells.every(({ value }))
        },

        createField() {
            const aField = Array.from(
                { length: 3 },
                (_, x) => Array.from(
                    { length: 3 },
                    (_, y) => ({ coordinates: [x, y] })
                )
            );
            this.setProperty('/field', aField);
        },

        onPressRestart() {
            this.setupGame();
        }

    });
});
