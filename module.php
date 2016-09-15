<?php

class SettingsWebclientModule extends AApiModule
{
	/***** public functions might be called with web API *****/
	/**
	 * Obtaines list of module settings for authenticated user.
	 * 
	 * @return array
	 */
	public function GetAppData()
	{
		\CApi::checkUserRoleIsAtLeast(\EUserRole::Anonymous);
		
		return array(
			'TabsOrder' => array('common', 'mail', 'mail-accounts', 'contacts', 'calendar', 'files', 'mobilesync', 'outlooksync', 'helpdesk', 'openpgp')
		);
	}
	/***** public functions might be called with web API *****/
}
