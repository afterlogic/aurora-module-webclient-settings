<?php
/**
 * This code is licensed under AGPLv3 license or Afterlogic Software License
 * if commercial version of the product was purchased.
 * For full statements of the licenses see LICENSE-AFTERLOGIC and LICENSE-AGPL3 files.
 */

namespace Aurora\Modules\SettingsWebclient;

use Aurora\System\SettingsProperty;

/**
 * @property bool $Disabled
 * @property array $TabsOrder
 */

class Settings extends \Aurora\System\Module\Settings
{
    protected function initDefaults()
    {
        $this->aContainer = [
            "Disabled" => new SettingsProperty(
                false,
                "bool",
                null,
                "Setting to true disables the module",
            ),
            "TabsOrder" => new SettingsProperty(
                [
                    "common",
                    "mail",
                    "mail-accounts",
                    "contacts",
                    "manage-addressbooks",
                    "calendar",
                    "files",
                    "mobilesync",
                    "outlooksync",
                    "helpdesk",
                    "openpgp"
                ],
                "array",
                null,
                "Defines list of tabs and the order they're displayed in",
            ),
        ];
    }
}
