sap.ui.define(
	['./BaseController', '../model/models', '../util/articleList'],
	(BaseController, models, articleList) => {
		'use strict';

		return BaseController.extend('pharelyshau.controller.Algorithms', {

			onInit() {
				this.setModel(models.createAlgorithmsModel(articleList));
				this.setModel(models.createAlgorithmsViewModel(), 'view');
				this.attachRouteMatched(this.onAlgorithmsMatched);
				this.registerIllustrationSet('tnt', 'sap/tnt/themes/base/illustrations');
			},

			onAlgorithmsMatched(oEvent) {
				const { article } = oEvent.getParameter('arguments');
				this.setCurrentArticle(article);
				if (!article) this.byId('sideNavigation').setSelectedItem(null);
			},

			async setCurrentArticle(sArticleId) {
				this.setBusy(true);
				this.setProperty('/ArticleID', sArticleId, 'view');
				try {
					const oArticle = await this.getArticle(this.getArticlePath(sArticleId));
					this.setProperty('/Article', oArticle);
				} catch (oError) {
					if (oError.name === 'AbortError') return;
					this.setProperty('/Article', { NotFound: true });
				}
				this.setBusy(false);
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

			navigateToArticle(article) {
				this.getRouter().navTo('Algorithms', { article });
			},

			factoryBlocks(sId, oContext) {
				const sType = oContext.getProperty('Type') || 'Main';
				const oBlock = this.byId(`block${sType}`).clone(sId);
				const bIllustrationRequired = oContext.getProperty('Illustration');
				if (!bIllustrationRequired) oBlock.addStyleClass('phHiddenIllustration');
				const bFirstBlock = oContext.getPath() === '/Article/Contents/0';
				const bMarginTopRequierd = !bIllustrationRequired && bFirstBlock;
				if (bMarginTopRequierd) oBlock.addStyleClass('sapUiMediumMarginTop')
				return oBlock;
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
				window.eval(`'use strict';${sCode}`);
			},

			onPressEditResetCode(oEvent) {
				const sPath = this.getPathByEvent(oEvent);
				const oBlock = this.getObjectByEvent(oEvent);
				if (oBlock.Editable) this.getCodeEditorByButtonClick(oEvent).setValue(oBlock.Code);
				this.setProperty(`${sPath}/Editable`, !oBlock.Editable);
			}

		});
	}
);
