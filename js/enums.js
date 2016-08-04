'use strict';

var
	_ = require('underscore'),
	Enums = {}
;

/**
 * @enum {string}
 */
Enums.SettingsTabCapability = {
	'ManageAuthAccounts': 'auth-accounts'
};

if (typeof window.Enums === 'undefined')
{
	window.Enums = {};
}

_.extendOwn(window.Enums, Enums);
