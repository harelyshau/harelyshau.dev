/* This file for formatting visibility of move button is needed to get into "this"
Instance of Control, since the formatting depends on the binding of the parent element. */

sap.ui.define(() => {
	'use strict';

	return function (aDiscs) {
		const aParentDiscs = this.getParent().getBindingContext().getObject();
		return aParentDiscs !== aDiscs;
	};
});
