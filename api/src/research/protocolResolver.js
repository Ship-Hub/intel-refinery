const { REFINERY_PROFILE_KEYS } = require("../refinery/profiles/profileConstants");
const { CYBER_PROTOCOL_IDS } = require("../refinery/profiles/cyberTaxonomy");

const DEFAULT_PROTOCOL_IDS = Object.freeze({
  observe: "observation/source",
  connect: "connection/artifact",
  understand: "understanding/model",
  reflect: "reflection/model",
  generate_view: "presentation/view",
});

const resolveProtocolId = (taskType, taskInput = {}) => {
  if (taskInput.protocolId) return taskInput.protocolId;
  if (taskInput.profileKey === REFINERY_PROFILE_KEYS.CYBER && CYBER_PROTOCOL_IDS[taskType]) {
    return CYBER_PROTOCOL_IDS[taskType];
  }
  return DEFAULT_PROTOCOL_IDS[taskType];
};

module.exports = {
  DEFAULT_PROTOCOL_IDS,
  resolveProtocolId,
};
