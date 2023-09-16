sap.ui.define(['./BaseController', '../model/models'],
(BaseController, models) => {
	'use strict';

	return BaseController.extend('pharelyshau.controller.Algorithms', {
		onInit() {
            this.setModel(models.createAlgorithmsModel());
            this.setModel(models.createAlgorithmsViewModel(), 'view');
            this.getRouter().attachRouteMatched(this.onRouteMatched.bind(this));
		},
        
        onPressToggleSideNavigation() {
            const bPhone = this.getModel('device').getProperty('/system/phone');
            const oPage = bPhone ? this.getView().getParent().getParent() : this.byId("page");
            const bExpanded = this.toggleSideNavigation(oPage, this.byId('sideNavigation'));
            this.getModel('view').setProperty('/sideExpanded', bExpanded);
        },

        onRouteMatched(oEvent) {
            const sArticleId = oEvent.getParameter('arguments').articleId;
            this.setCurrentArticle(sArticleId);
            if (!sArticleId) this.byId('sideNavigation').setSelectedItem(null);
        },

        async setCurrentArticle(sArticleId) {
            const sRootPath = 'resource/data/algorithms/';
            const sAdditionalPath = sArticleId ? `articles/${sArticleId}` : 'about';
            const sPath = `${sRootPath}${sAdditionalPath}.json`;
            try {
                const oResponse = await fetch(sPath);
                const oArticle = await oResponse.json();
                this.getModel().setProperty('/Article', oArticle);
                document.title = oArticle.Title;
            } catch (e) {
                this.getModel().setProperty('/Article', { ID: sArticleId, NotFound: true });
            }
        },

        onSelectNavigateToArticle(oEvent) {
            const oItem = oEvent.getParameter('item');
            let articleId = this.getObjectByControl(oItem).ID;
            articleId ??= this.getObjectByControl(oItem.getItems()[0]).ID;
            this.getRouter().navTo('Algorithm', {articleId});
        },

        factoryBlocks(sId, oContext) {
            const sType = oContext.getProperty('Type');
            const oBlock = this.byId(`block${sType}`).clone(sId);
            return oBlock;
        }

	});
});
