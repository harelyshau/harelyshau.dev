sap.ui.define(['./BaseController', '../model/models', '../model/formatter'], (BaseController, models, formatter) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.HanotoiTower', {
        formatter,

        onInit() {
            this.setModel(models.createHanoiTowerModel());
            this.setInitialPyramid();
        },

        onChangeDiscs() {
            this.setInitialPyramid();
        },

        setInitialPyramid() {
            const iDiscs = this.getModel().getProperty('/SelectedDiscs');
            const aDiscs = [];
            for (let i = 0; i < iDiscs; i++) {
                aDiscs.push(i);
            }
            this.getModel().setProperty('/Rods', [aDiscs, [], []]);
        }


    });
});
