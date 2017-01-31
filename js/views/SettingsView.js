'use strict';

var
	_ = require('underscore'),
	$ = require('jquery'),
	ko = require('knockout'),
	
	App = require('%PathToCoreWebclientModule%/js/App.js'),
	Routing = require('%PathToCoreWebclientModule%/js/Routing.js'),
	CAbstractScreenView = require('%PathToCoreWebclientModule%/js/views/CAbstractScreenView.js'),
	
	Settings = require('modules/%ModuleName%/js/Settings.js'),
	
	$html = $('html')
;

/**
 * @constructor
 */
function CSettingsView()
{
	CAbstractScreenView.call(this, '%ModuleName%');
	
	this.tabs = ko.observableArray([]);
	
	this.currentTab  = ko.observable(null);
	
	App.subscribeEvent('OpenSettingTab', _.bind(function (oParams) {
		this.changeTab(oParams.Name);
	}, this));
	App.broadcastEvent('%ModuleName%::ConstructView::after', {'Name': this.ViewConstructorName, 'View': this});
}

_.extendOwn(CSettingsView.prototype, CAbstractScreenView.prototype);

CSettingsView.prototype.ViewTemplate = '%ModuleName%_SettingsView';
CSettingsView.prototype.ViewConstructorName = 'CSettingsView';

/**
 * Registers settings tab.
 * 
 * @param {function} fGetTabView Function that returns settings tab view object.
 * @param {string} sTabName Tab name is used in hash string to rout to this tab.
 * @param {string} sTabTitle Tab title is used in the list of tabs in navigation menu.
 */
CSettingsView.prototype.registerTab = function (fGetTabView, sTabName, sTabTitle) {
	var
		iLastIndex = Settings.TabsOrder.length,
		oView = fGetTabView()
	;
	
	oView.SettingsTabName = sTabName;
	this.tabs.push({
		view: oView,
		name: sTabName,
		title: sTabTitle
	});
	
	this.tabs(_.sortBy(this.tabs(), function (oTab) {
		var iIndex = _.indexOf(Settings.TabsOrder, oTab.name);
		return iIndex !== -1 ? iIndex : iLastIndex;
	}));
};

CSettingsView.prototype.onShow = function ()
{
	$html.addClass('non-adjustable');
};

CSettingsView.prototype.onHide = function ()
{
	$html.removeClass('non-adjustable');
};

/**
 * @param {Array} aParams
 */
CSettingsView.prototype.onRoute = function (aParams)
{
	var
		sNewTabName = aParams.shift(),
		oCurrentTab = this.currentTab(),
		oNewTab = _.find(this.tabs(), function (oTab) {
			return oTab.name === sNewTabName;
		}),
		fShowNewTab = function () {
			if (oNewTab)
			{
				if ($.isFunction(oNewTab.view.onRoute))
				{
					oNewTab.view.onRoute(aParams);
				}
				this.currentTab(oNewTab);
				if (oNewTab.name !== sNewTabName)
				{
					Routing.replaceHashDirectly([Settings.HashModuleName, oNewTab.name]);
				}
			}
		}.bind(this),
		fRevertRouting = _.bind(function () {
			if (oCurrentTab)
			{
				Routing.replaceHashDirectly([Settings.HashModuleName, oCurrentTab.name]);
			}
		}, this),
		bShow = true
	;
	
	if (oCurrentTab && sNewTabName === oCurrentTab.name)
	{
		oCurrentTab.view.onRoute(aParams);
		return;
	}
	
	if (oNewTab && oNewTab.view.visible && !oNewTab.view.visible())
	{
		oNewTab = _.find(this.tabs(), function (oTab) {
			return !oTab.view.visible || oTab.view.visible();
		});
	}
	
	if (oNewTab)
	{
		if (oCurrentTab && $.isFunction(oCurrentTab.view.hide))
		{
			oCurrentTab.view.hide(fShowNewTab, fRevertRouting);
			bShow = false;
		}
	}
	else if (!oCurrentTab)
	{
		oNewTab = _.find(this.tabs(), function (oTab) {
			return !oTab.view.visible || oTab.view.visible();
		});
	}
	
	if (bShow)
	{
		fShowNewTab();
	}
};

/**
 * @param {string} sTabName
 */
CSettingsView.prototype.changeTab = function (sTabName)
{
	Routing.setHash([Settings.HashModuleName, sTabName]);
};

/**
 * @param {Array} aAddHash
 */
CSettingsView.prototype.setAddHash = function (aAddHash)
{
	Routing.setHash(_.union([Settings.HashModuleName, this.currentTab() ? this.currentTab().name : ''], aAddHash));
};

module.exports = new CSettingsView();
