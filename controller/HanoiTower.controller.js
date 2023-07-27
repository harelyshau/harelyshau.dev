sap.ui.define(['./BaseController', '../model/models',], (BaseController, models) => {
    'use strict';

    return BaseController.extend('pharelyshau.controller.HanotoiTower', {
        onInit() {
            this.setModel(models.createHanoiTowerModel());
        }


    });
});
