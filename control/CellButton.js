sap.ui.define(
['sap/m/Button', 'sap/ui/dom/includeStylesheet'],
(Button, includeStylesheet) => {
    'use strict';

    return Button.extend('pharelyshau.control.CellButton', {
        metadata: {
            events: {
                rightPress: {},
                doublePress: {}
            }
        },

        renderer: {},

        oncontextmenu(oEvent) {
            oEvent.preventDefault();
            this.getEnabled() && this.fireRightPress();
        },

        ondblclick() {
            !this.getEnabled() && this.fireDoublePress();
        },

        init() {
            Button.prototype.init.apply(this, arguments);
            includeStylesheet('../css/cell.css');
            this.setType('Unstyled').addStyleClass('phCell');
        }

    });
});
