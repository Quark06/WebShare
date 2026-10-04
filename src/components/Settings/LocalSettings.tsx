export function getDefaultSettings(): Settings {
  return {};
}

export function getCurrentSettings(): Settings {
  const setting = window.localStorage.getItem("webshare-setting");
  try {
    let settings = validateSettingsString(setting);
    if (!settings) {
      return {};
    }
    return settings;
  } catch (e) {
    console.warn(e);
    return getDefaultSettings();
  }
}

/**
 * Validate a setting string. Return a parsed setting object if valid, otherwise throw exception
 */
export function validateSettingsString(
  setting: string | null,
): Settings | null {
  if (!setting) {
    return {};
  }
  if (setting[0] !== "{") {
    throw new Error("failed to parse settings, using defaults");
  }
  // Don't have a setting or invalid value
  let settingObject: Settings = JSON.parse(setting);
  return settingObject;
}

export function updateSettings(newSetting: string) {
  window.localStorage.setItem("webshare-setting", newSetting);
}
