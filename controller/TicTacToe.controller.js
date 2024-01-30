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
            const bFirst = !!this.getProperty('/first');
            const bTurn = this.getProperty('/gameFinished') ?? true ? !bFirst : bFirst;
            this.setProperty('/first', bTurn);
            this.setProperty('/turn', bTurn);
            this.setProperty('/gameFinished', false);
            this.setProperty('/isDraw', false);
        },

        onPress(oEvent) {
            const bTurn = this.getProperty('/turn');
            this.getObjectByEvent(oEvent).value = bTurn;
            const [bFinished, bDraw] = this.isGameFinished(bTurn);
            bFinished
                ? this.finishGame(bTurn, bDraw)
                : this.setProperty('/turn', !bTurn);
        },

        isGameFinished(bTurn) {
            const rows = this.getProperty('/field');
            const cells = rows.flat();
            const columns = Object.values(Object.groupBy(
                cells, ({ coordinates }) => coordinates[1]
            ));
            const diagonals = [
                [rows[0][0], rows[1][1], rows[2][2]],
                [rows[0][2], rows[1][1], rows[2][0]]
            ];
            const bDraw = cells.every(({ value }) => value !== undefined);
            const bSomeoneWon = [rows, columns, diagonals].some(lines => lines.some((cells) => {
                const bWinLine = cells.every((cell) => cell.value === bTurn);
                if (bWinLine) cells.forEach(cell => cell.win = true);
                return bWinLine;
            }));
            return [bSomeoneWon || bDraw, !bSomeoneWon && bDraw];
        },

        finishGame(bTurn, bDraw) {
            this.setProperty('/gameFinished', true);
            this.setProperty('/isDraw', bDraw);
            const sScorePath = bTurn ? '/scoreX' : '/score0';
            const iNewScroe = (this.getProperty(sScorePath) ?? 0) + 1;
            if (!bDraw) this.setProperty(sScorePath, iNewScroe);
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
