const REFINERY_PROFILE_KEYS = Object.freeze({
  GENERAL: "general",
  CYBER: "cyber",
});

const PROJECT_INTENTS = Object.freeze({
  GENERAL_RESEARCH: "general_research",
  CYBER_ASSESSMENT: "cyber_assessment",
  INCIDENT_REVIEW: "incident_review",
  VULNERABILITY_REVIEW: "vulnerability_review",
  CONTROL_REVIEW: "control_review",
  THREAT_RESEARCH: "threat_research",
});

const PROJECT_LIFECYCLE_STATUSES = Object.freeze({
  DRAFT: "draft",
  COLLECTING_SOURCES: "collecting_sources",
  READY_FOR_REFINEMENT: "ready_for_refinement",
  PROCESSING: "processing",
  COMPLETED: "completed",
  UPDATES_AVAILABLE: "updates_available",
  FAILED: "failed",
  ARCHIVED: "archived",
});

const SOURCE_INCLUSION_STATES = Object.freeze({
  INCLUDED: "included",
  EXCLUDED: "excluded",
  NEEDS_REVIEW: "needs_review",
  DUPLICATE: "duplicate",
  SUPERSEDED: "superseded",
});

const CYBER_SOURCE_CATEGORIES = Object.freeze({
  ASSET_INVENTORY: "asset_inventory",
  VULNERABILITY_SCAN: "vulnerability_scan",
  SECURITY_ADVISORY: "security_advisory",
  INCIDENT_REPORT: "incident_report",
  LOG_EXPORT: "log_export",
  POLICY_CONTROL: "policy_control",
  ANALYST_NOTES: "analyst_notes",
  SCREENSHOT: "screenshot",
  PLATFORM_EXPORT: "platform_export",
  OTHER: "other",
});

module.exports = {
  REFINERY_PROFILE_KEYS,
  PROJECT_INTENTS,
  PROJECT_LIFECYCLE_STATUSES,
  SOURCE_INCLUSION_STATES,
  CYBER_SOURCE_CATEGORIES,
};
