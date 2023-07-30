sap.ui.define([],
    () => {
        'use strict';

        return function (aDiscs) {
            const aParentDiscs = this.getParent().getBindingContext().getObject();
            return aParentDiscs !== aDiscs;
        };
    }
);
