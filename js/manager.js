'use strict';

module.exports = function (oAppData, iUserRole, bPublic) {
	var
		bAdminUser = iUserRole === Enums.UserRole.SuperAdmin,
		bPowerUser = iUserRole === Enums.UserRole.PowerUser,
		bRegisteredUser = iUserRole === Enums.UserRole.RegisteredUser
	;
	
	if (bAdminUser || bPowerUser || bRegisteredUser)
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
				registerSettingsTab: function (fGetTabView, oTabName, oTabTitle) {
					var SettingsView = require('modules/%ModuleName%/js/views/SettingsView.js');
					SettingsView.registerTab(fGetTabView, oTabName, oTabTitle);
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
