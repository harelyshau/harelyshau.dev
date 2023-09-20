sap.ui.define(['./BaseController', '../model/models'], (BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Algorithms', {
		onInit() {
			this.setModel(models.createAlgorithmsModel());
			this.setModel(models.createAlgorithmsViewModel(), 'view');
			this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this));
			this.registerIllustrationSet('tnt', 'sap/tnt/themes/base/illustrations');
		},

		onPressToggleSideNavigation() {
			const bPhone = this.getModel('device').getProperty('/system/phone');
			const oPage = bPhone ? this.getView().getParent().getParent() : this.byId('page');
			const bExpanded = this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
			this.getModel('view').setProperty('/sideExpanded', bExpanded);
		},

		onRouteMatched(oEvent) {
			const sArticleId = oEvent.getParameter('arguments').articleId;
			this.setCurrentArticle(sArticleId);
			if (!sArticleId) this.byId('sideNavigation').setSelectedItem(null);
		},

		async setCurrentArticle(sArticleId) {
			this.getModel('view').setProperty('/busy', true);
			this.getModel('view').setProperty('/ArticleID', sArticleId);
			try {
				const oArticle = await this.getArticle(this.getArticlePath(sArticleId));
				this.getModel().setProperty('/Article', oArticle);
				this.getModel('view').setProperty('/busy', false);
			} catch (oError) {
				if (oError.name === 'AbortError') return;
				this.getModel().setProperty('/Article', { NotFound: true });
				this.getModel('view').setProperty('/busy', false);
				console.error(oError);
			}
		},

		async getArticle(sArticlePath) {
			if (this.oAbortContorller) this.oAbortContorller.abort();
			this.oAbortContorller = new AbortController();
			const oResponse = await fetch(sArticlePath, { signal: this.oAbortContorller.signal });
			return oResponse.json();
		},

		getArticlePath(sArticleId) {
			const sRootPath = 'resource/data/Algorithms/';
			const sAdditionalPath = sArticleId ? `articles/${sArticleId}` : 'about';
			return `${sRootPath}${sAdditionalPath}.json`;
		},

		onSelectNavigateToArticle(oEvent) {
			const oItem = oEvent.getParameter('item');
			const sItemId = this.getObjectByControl(oItem).ID;
			const sArticleId = sItemId ?? this.getObjectByControl(oItem.getItems()[0]).ID;
			this.navigateToArticle(sArticleId);
		},

		navigateToArticle(articleId) {
			this.getRouter().navTo('Algorithms', { articleId });
		},

		factoryBlocks(sId, oContext) {
			const sType = oContext.getProperty('Type') || 'Main';
			const oBlock = this.byId(`block${sType}`).clone(sId);
			const bIllustrationRequired = !oContext.getProperty('Illustration');
			if (bIllustrationRequired) oBlock.addStyleClass('phHiddenIllustration');
			return oBlock;
		},

		// TODO: check why it's not coming automatically
		refreshSideNavigationSelectedKey() {
			setTimeout(() => {
				const sKey = this.getModel('view').getProperty('/ArticleID');
				this.byId('sideNavigation').setSelectedKey(sKey);
			});
		},

		// Code Block

		getCodeEditorByButtonClick(oEvent) {
			return oEvent.getSource().getParent().getParent().getItems()[1];
		},

		onPressCopyCode(oEvent) {
			const sCode = this.getCodeEditorByButtonClick(oEvent).getValue();
			this.copyToClipboard(sCode);
		},

		onPressRunCode(oEvent) {
			const sCode = this.getCodeEditorByButtonClick(oEvent).getValue();
			window.eval(`"use strict";${sCode}`);
		},

		onPressEditResetCode(oEvent) {
			const sPath = this.getPathByEvent(oEvent);
			const oBlock = this.getObjectByEvent(oEvent);
			if (oBlock.Editable) this.getCodeEditorByButtonClick(oEvent).setValue(oBlock.Code);
			this.getModel().setProperty(`${sPath}/Editable`, !oBlock.Editable);
		}
	});
});
