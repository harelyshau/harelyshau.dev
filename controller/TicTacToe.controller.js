sap.ui.define([
    './BaseController',
    '../model/models',
    '../model/formatter',
], (BaseController, models, formatter) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.TicTacToe', {
        formatter,

        onInit() {
            this.setModel(models.createTicTacToeModel());
            this.setupGame();
            this.attachRouteMatched(this.onTicTacToeMatched);
            this.setLevelTexts();
            this.attachLanguageChange(this.setLevelTexts);
        },

        onTicTacToeMatched(oEvent) {
            const { level } = oEvent.getParameter('arguments');
            const aLevels = this.getProperty('/levels');
            aLevels.some(({ key }) => key === level)
                ? this.setProperty('/level', level)
                : this.navigateTo('TicTacToe');
            this.resetScore();
            this.setupGame();
        },

        resetScore() {
            this.setProperty('/scoreX', 0);
            this.setProperty('/score0', 0);
            this.setProperty('/gameFinished', null);
            this.setProperty('/first', null);
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
            const bDraw = !aCells.some(this.isCellUnopened);
            const bSomeoneWon = this.getWinCombinations().some((aCells) => {
                const bWinLine = aCells.every((cell) => cell.value === bTurn);
                if (bWinLine) aCells.forEach(cell => cell.win = true);
                return bWinLine;
            });
            return [bSomeoneWon || bDraw, !bSomeoneWon && bDraw];
        },

        getWinCombinations() {
            const aRows = this.getProperty('/field');
            const aColumns = aRows.map(
                (_, i) => aRows.flat()
                    .filter(({ coordinates }) => coordinates[1] === i)
            );
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
            bFinished
                ? this.finishGame(bTurn, bDraw)
                : this.setProperty('/turn', !bTurn);
            return bFinished;
        },

        onChangeLevel(oEvent) {
            const level = oEvent.getParameter('selectedItem').getKey();
            this.navigateTo('TicTacToe', { level });
        },

        makeBotMove() {
            const sLevel = this.getProperty('/level');
            if (sLevel === 'friend') return;
            this.setProperty('/botIsThinking', true);
            setTimeout(() => {
                this[`make${this.toPascalCase(sLevel)}Move`]();
                this.setProperty('/botIsThinking', false);
            }, 500);
        },

        makeMediumMove() {
            const aCombinations = this.getWinCombinations()
                .filter(cells => cells.some(this.isCellUnopened)).sort(this.random);
            const isFilled = (aCells, bVal) => aCells
                .filter(({ value }) => value === bVal).length === 2;
            const bTurn = this.getProperty('/turn');
            const aWinCells = aCombinations.find(aCells => isFilled(aCells, bTurn));
            const aDangerousCells = aCombinations.find(aCells => isFilled(aCells, !bTurn));
            const oCellToOpen = (aWinCells ?? aDangerousCells)?.find(this.isCellUnopened);
            oCellToOpen ? this.makeMove(oCellToOpen) : this.makeEasyMove();
        },

        makeEasyMove() {
            const oCellToOpen = this.getProperty('/field').flat()
                .sort(this.random).find(this.isCellUnopened);
            this.makeMove(oCellToOpen);
        },

        isCellUnopened({ value }) {
            return value === undefined;
        }

    });
});
