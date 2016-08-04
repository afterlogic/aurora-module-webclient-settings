'use strict';

module.exports = function (oAppData, iUserRole, bPublic) {
	var
		bAdminUser = iUserRole === Enums.UserRole.SuperAdmin,
		bPowerUser = iUserRole === Enums.UserRole.PowerUser,
		bRegisteredUser = iUserRole === Enums.UserRole.RegisteredUser
	;
	
	if (bAdminUser || bPowerUser || bRegisteredUser)
	{
		require('modules/%ModuleName%/js/enums.js');
		
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
		else if (bPowerUser || bRegisteredUser)
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
						TextUtils = require('modules/CoreClient/js/utils/Text.js'),
						CHeaderItemView = require('modules/CoreClient/js/views/CHeaderItemView.js')
					;
					return {
						item: new CHeaderItemView(TextUtils.i18n('CORECLIENT/HEADING_SETTINGS_TABNAME')),
						name: Settings.HashModuleName
					};
				},
				/**
				 * Registers settings tab.
				 * 
				 * @param {function} fGetTabView Function that returns settings tab view object.
				 * @param {string} sTabName Tab name is used in hash string to rout to this tab.
				 * @param {string} sTabTitle Tab title is used in the list of tabs in navigation menu.
				 * @param {array} aCapabilities List of capabilities. Avaliable capabilities are listed in Enums.SettingsTabCapability.
				 */
				registerSettingsTab: function (fGetTabView, sTabName, sTabTitle, aCapabilities) {
					var SettingsView = require('modules/%ModuleName%/js/views/SettingsView.js');
					SettingsView.registerTab(fGetTabView, sTabName, sTabTitle, aCapabilities);
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
