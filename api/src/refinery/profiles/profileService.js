const db = require("../../config/db");
const { REFINERY_PROFILE_KEYS } = require("./profileConstants");

const DEFAULT_PROFILE_KEY = REFINERY_PROFILE_KEYS.GENERAL;

const getProfileByKey = async (profileKey = DEFAULT_PROFILE_KEY) => {
  const key = profileKey || DEFAULT_PROFILE_KEY;
  const [rows] = await db.promise().query(
    `SELECT id, profile_key AS profileKey, name, description, status,
            protocol_bundle_key AS protocolBundleKey,
            parser_bundle_key AS parserBundleKey,
            view_bundle_key AS viewBundleKey,
            validation_bundle_key AS validationBundleKey,
            configuration_json AS configuration
     FROM refinery_profiles
     WHERE profile_key = ? AND status = 'active'
     LIMIT 1`,
    [key]
  );

  return rows[0] || null;
};

const requireProfileByKey = async (profileKey = DEFAULT_PROFILE_KEY) => {
  const profile = await getProfileByKey(profileKey);
  if (!profile) {
    const err = new Error(`Refinery profile not found: ${profileKey || DEFAULT_PROFILE_KEY}`);
    err.statusCode = 400;
    throw err;
  }
  return profile;
};

module.exports = {
  DEFAULT_PROFILE_KEY,
  getProfileByKey,
  requireProfileByKey,
};
