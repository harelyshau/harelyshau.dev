sap.ui.define([
    './BaseController',
    'sap/m/MessageToast',
    '../model/models',
    '../model/formatter'
], (BaseController, MessageToast, models, formatter) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.HanotoiTower', {
        formatter,

        onInit() {
            this.setModel(models.createHanoiTowerModel());
            this.setModel(models.createHanoiTowerViewModel(), 'view');
        },

        onAfterRendering() {
            this.setupGame();
        },

        setPegBoxesSize() {
            const aPegBoxes = [...document.querySelectorAll('.phPegBox')];
            const iMaxHeight = Math.max(...aPegBoxes.map(oBox => oBox.clientHeight));
            const iMaxWidth = Math.max(...aPegBoxes.map(oBox => oBox.clientWidth));
            aPegBoxes.forEach(oBox => {
                oBox.style.height = `${iMaxHeight}px`;
                oBox.style.width = `${iMaxWidth}px`;
            });
        },

        onChangeDiscs() {
            this.setupGame();
        },

        onPressRestartGame() {
            this.setupGame();
        },

        onPressMoveDisc(oEvent) {
            const aCurrentPeg = this.getObjectByEvent(oEvent);
            const aTargetPeg = this.getObjectByEvent(oEvent, 'view');
            this.moveDisc(aCurrentPeg, aTargetPeg);
        },

        setPegsInViewModel() {
            const aPegs = this.getModel().getProperty('/Pegs');
            const aViewPegs = this.getModel('view').getProperty('/pegs');
            aViewPegs.length = 0;
            aPegs.forEach(aDiscs => aViewPegs.push(aDiscs));
            this.getModel('view').refresh(true);
            // console.log(this.getModel('view').getProperty('/pegs'))
            // console.log(this.getModel().getProperty('/Pegs'))
            // console.log(this.getModel().getProperty('/Pegs')[1] === this.getModel('view').getProperty('/pegs')[1])
        },

        setupGame() {
            // this.setModel(models.createHanoiTowerModel());
            this.stopTimer();
            const iDiscCount = this.getModel().getProperty('/SelectedDiscCount');
            const iPegCount = this.getModel().getProperty('/SelectedPegCount');
            const aPegs = [[]];
            for (let i = 1; i <= iDiscCount; i++) {
                aPegs[0].push(i);
            }
            for (let i = 1; i < iPegCount; i++) {
                aPegs[i] = [];
            }
            this.getModel().setProperty('/Pegs', aPegs);
            this.setPegsInViewModel();

            // setTimeout(() => { this.setPegBoxesSize(); });
        },

        moveDisc(aCurrentPeg, aTargetPeg) {
            const oDisc = aCurrentPeg[0];
            if (oDisc > aTargetPeg[0] || !aCurrentPeg.length) {
                MessageToast.show('test');
                return;
            }
            this.startTimer();
            aCurrentPeg.shift();
            aTargetPeg.unshift(oDisc);
            this.increaseMoves();
            this.getModel().refresh();
            this.checkGameWin(aTargetPeg);
        },

        checkGameWin(aTargetPeg) {
            const iDiscCount = this.getModel().getProperty('/SelectedDiscCount');
            const aPegs = this.getModel().getProperty('/Pegs');
            const bEnoughDisks = iDiscCount === aTargetPeg.length;
            const bFirstPeg = aPegs.indexOf(aTargetPeg) === 0;
            if (!bEnoughDisks || bFirstPeg) return;
            this.finishGame();
        },

        finishGame() {
            this.stopTimer();
            MessageToast.show('You are winner');
            console.log('win')
        },

        startTimer() {
            let iTime = this.getModel().getProperty('/Time');
            if (iTime) return;

            this.fnTimerInterval = setInterval(() => {
                this.getModel().setProperty('/Time', ++iTime);
            }, 1000);
        },

        stopTimer() {
            clearInterval(this.fnTimerInterval);
        },

        increaseMoves() {
            let iMoves = this.getModel().getProperty('/Moves');
            this.getModel().setProperty('/Moves', ++iMoves);
        },

        onDropDisc(oEvent) {
            console.log(1111)
        }


    });
});
