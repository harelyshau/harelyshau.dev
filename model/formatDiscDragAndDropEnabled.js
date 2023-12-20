sap.ui.define(() => {
	'use strict';

	return function (iDisc) {
		const aDiscs = this.getParent().getParent().getBindingContext().getObject();
		return !aDiscs.indexOf(iDisc);
	};
});
