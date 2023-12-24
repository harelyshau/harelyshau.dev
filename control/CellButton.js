sap.ui.define(
['sap/m/Button'],
(Button) => {
    'use strict';

    return Button.extend('pharelyshau.control.CellButton', {
        metadata: {
            events: {
                rightPress: {}
            }
        },

        oncontextmenu(oEvent) {
            oEvent.preventDefault();
            this.getEnabled() && this.fireRightPress();
        },

        renderer: {}

    });
});
