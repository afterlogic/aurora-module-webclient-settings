'use strict';

module.exports = function (oAppData) {
	var
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		bAdminUser = App.getUserRole() === Enums.UserRole.SuperAdmin,
		bNormalUser = App.getUserRole() === Enums.UserRole.NormalUser,
		bCustomerUser = App.getUserRole() === Enums.UserRole.Customer
	;
	
	if (bAdminUser || bNormalUser || bCustomerUser)
	{
		var
			Settings = require('modules/%ModuleName%/js/Settings.js'),
			oSettings = oAppData['%ModuleName%'] || {}
		;

		Settings.init(oSettings);
		
		if (bAdminUser)
		{
			return {
				getAbstractSettingsFormViewClass: function () {
					return require('modules/%ModuleName%/js/views/CAbstractSettingsFormView.js');
				}
			};
		}
		else if (bNormalUser || bRegisteredUser)
		{
			return {
				getScreens: function () {
					var oScreens = {};
					oScreens[Settings.HashModuleName] = function () {
						return require('modules/%ModuleName%/js/views/SettingsView.js');
					};
					return oScreens;
				},
				getHeaderItem: function () {
					var
						TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
						CHeaderItemView = require('%PathToCoreWebclientModule%/js/views/CHeaderItemView.js')
					;
					return {
						item: new CHeaderItemView(TextUtils.i18n('COREWEBCLIENT/HEADING_SETTINGS_TABNAME')),
						name: Settings.HashModuleName
					};
				},
				/**
				 * Registers settings tab.
				 * 
				 * @param {function} fGetTabView Function that returns settings tab view object.
				 * @param {string} sTabName Tab name is used in hash string to rout to this tab.
				 * @param {string} sTabTitle Tab title is used in the list of tabs in navigation menu.
				 */
				registerSettingsTab: function (fGetTabView, sTabName, sTabTitle) {
					var SettingsView = require('modules/%ModuleName%/js/views/SettingsView.js');
					SettingsView.registerTab(fGetTabView, sTabName, sTabTitle);
				},
				getAbstractSettingsFormViewClass: function () {
					return require('modules/%ModuleName%/js/views/CAbstractSettingsFormView.js');
				},
				setAddHash: function (aAddHash) {
					var SettingsView = require('modules/%ModuleName%/js/views/SettingsView.js');
					SettingsView.setAddHash(aAddHash);
				}
			};
		}
	}
	
	return null;
};
