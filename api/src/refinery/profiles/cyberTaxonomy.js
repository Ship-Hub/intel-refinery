const CYBER_ARTIFACT_TYPES = Object.freeze([
  "finding",
  "asset",
  "threat",
  "vulnerability",
  "control",
  "incident",
  "action",
  "evidence",
  "conflict",
  "context",
]);

const CYBER_CONNECTION_TYPES = Object.freeze([
  "affects",
  "exploits",
  "mitigated_by",
  "observed_in",
  "targets",
  "depends_on",
  "duplicates",
  "contradicts",
  "supports",
  "requires_action",
  "related_to",
]);

const CYBER_PROTOCOL_IDS = Object.freeze({
  observe: "cyber/observation/source",
  connect: "cyber/connection/artifact",
  understand: "cyber/understanding/model",
  reflect: "cyber/reflection/model",
  generate_view: "cyber/presentation/view",
});

module.exports = {
  CYBER_ARTIFACT_TYPES,
  CYBER_CONNECTION_TYPES,
  CYBER_PROTOCOL_IDS,
};
