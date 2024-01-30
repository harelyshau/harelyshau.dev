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
            if (!bTurn) this.makeBotMove();
        },

        onPress(oEvent) {
            const bFinished = this.makeMove(this.getObjectByEvent(oEvent));
            if (!bFinished) this.makeBotMove();
        },

        isGameFinished(bTurn) {
            const aCells = this.getProperty('/field').flat();
            const bDraw = aCells.every(({ value }) => value !== undefined);
            const bSomeoneWon = this.getWinCombinations().some((aCells) => {
                const bWinLine = aCells.every((cell) => cell.value === bTurn);
                if (bWinLine) aCells.forEach(cell => cell.win = true);
                return bWinLine;
            });
            return [bSomeoneWon || bDraw, !bSomeoneWon && bDraw];
        },

        getWinCombinations() {
            const aRows = this.getProperty('/field');
            const aColumns = Object.values(Object.groupBy(
                aRows.flat(), ({ coordinates }) => coordinates[1]
            ));
            const aDiagonals = [
                [aRows[0][0], aRows[1][1], aRows[2][2]],
                [aRows[0][2], aRows[1][1], aRows[2][0]]
            ];
            return aRows.concat(aColumns, aDiagonals);
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
        },

        makeMove(oCell) {
            const bTurn = this.getProperty('/turn');
            const [bFinished, bDraw] = this.isGameFinished(oCell.value = bTurn);
            bFinished ? this.finishGame(bTurn, bDraw) : this.setProperty('/turn', !bTurn);
            return bFinished;
        },

        onChangeLevel() {
            this.setProperty('/scoreX', 0);
            this.setProperty('/score0', 0);
            this.setProperty('/gameFinished', null);
            this.setProperty('/first', null);
            this.setupGame();
        },

        makeBotMove() {
            const sLevel = this.getProperty('/level');
            if (sLevel === 'Friend') return;
            const sFunctionName = `make${sLevel}Move`;
            this[sFunctionName]();
        },

        makeMediumMove() {
            const isUnopened = ({ value }) => value === undefined;
            const aCombinations = this.getWinCombinations().filter(cells => cells.some(isUnopened));
            const isFilled = (cells, bVal) => cells.filter(({ value }) => value === bVal).length === 2;
            const bTurn = this.getProperty('/turn');
            const aWinCells = aCombinations.find(cells => isFilled(cells, bTurn));
            const aDangerousCells = aCombinations.find(cells => isFilled(cells, !bTurn));
            const oCellToOpen = (aWinCells ?? aDangerousCells)?.find(isUnopened);
            oCellToOpen ? this.makeMove(oCellToOpen) : this.makeEasyMove();
        },

        makeEasyMove() {
            const oCellToOpen = this.getProperty('/field').flat()
                .filter(oCell => oCell.value === undefined)
                .sort(() => Math.random() - 0.5)[0];
            this.makeMove(oCellToOpen);
        },

    });
});
