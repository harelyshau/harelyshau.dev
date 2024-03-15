sap.ui.define(['sap/m/Button'], (Button) => {
    'use strict';

    return Button.extend('pharelyshau.control.CellButton', {
        metadata: {
            events: {
                rightPress: {},
                doublePress: {}
            }
        },

        renderer: 'sap.m.ButtonRenderer',

        oncontextmenu(oEvent) {
            oEvent.preventDefault();
            this.getEnabled() && this.fireRightPress();
        },

        ondblclick() {
            this.fireDoublePress();
        }

    });
});
