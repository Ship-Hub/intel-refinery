const { SOURCE_INCLUSION_STATES } = require("../profiles/profileConstants");

const SOURCE_STATUSES_READY_FOR_REFINEMENT = new Set([
  "normalized",
  "chunked",
  "ready",
  "processed",
]);

const hasUsableContent = (source) => {
  return Boolean(
    (source.extractedText && String(source.extractedText).trim()) ||
    (source.extracted_text && String(source.extracted_text).trim()) ||
    (source.rawText && String(source.rawText).trim()) ||
    (source.raw_text && String(source.raw_text).trim()) ||
    (source.title && String(source.title).trim()) ||
    (source.uri && String(source.uri).trim())
  );
};

const normalizeInclusionState = (source) => {
  return source.inclusionState || source.inclusion_state || SOURCE_INCLUSION_STATES.INCLUDED;
};

const normalizeStatus = (source) => {
  return source.status || "pending";
};

const calculateCyberReadiness = ({ project, sources }) => {
  const allSources = Array.isArray(sources) ? sources : [];
  const includedSources = allSources.filter((source) => normalizeInclusionState(source) === SOURCE_INCLUSION_STATES.INCLUDED);
  const reviewSources = allSources.filter((source) => normalizeInclusionState(source) === SOURCE_INCLUSION_STATES.NEEDS_REVIEW);
  const failedSources = includedSources.filter((source) => normalizeStatus(source) === "failed");
  const readySources = includedSources.filter((source) => {
    return SOURCE_STATUSES_READY_FOR_REFINEMENT.has(normalizeStatus(source)) && hasUsableContent(source);
  });
  const pendingSources = includedSources.filter((source) => {
    const status = normalizeStatus(source);
    return status === "pending" || status === "processing";
  });

  const categories = new Set(
    readySources
      .map((source) => source.sourceCategory || source.source_category)
      .filter(Boolean)
  );

  const blockingIssues = [];
  const suggestions = [];

  if (includedSources.length === 0) {
    blockingIssues.push("Add at least one included source before refinement.");
  }

  if (readySources.length === 0 && includedSources.length > 0) {
    blockingIssues.push("No included source has normalized or chunked content yet.");
  }

  if (pendingSources.length > 0) {
    suggestions.push("Wait for pending sources to finish processing or review failed extractions.");
  }

  if (failedSources.length > 0) {
    suggestions.push("Review failed sources before starting Cyber refinement.");
  }

  if (categories.size < 2 && readySources.length > 1) {
    suggestions.push("Add another source category, such as asset inventory, advisory, log export, or analyst notes, to improve Cyber context.");
  }

  if (!project?.intent) {
    suggestions.push("Set a project intent so Cyber protocols can prioritize the right artifact types.");
  }

  const sourceScore = includedSources.length === 0 ? 0 : Math.min(50, readySources.length * 25);
  const categoryScore = Math.min(25, categories.size * 10);
  const issuePenalty = Math.min(25, failedSources.length * 10 + pendingSources.length * 5 + reviewSources.length * 5);
  const score = Math.max(0, Math.min(100, sourceScore + categoryScore + 25 - issuePenalty));
  const isReady = blockingIssues.length === 0 && score >= 50;

  return {
    projectId: project?.id || null,
    profileKey: project?.profileKey || project?.profile_key || null,
    intent: project?.intent || null,
    isReady,
    score,
    counts: {
      totalSources: allSources.length,
      includedSources: includedSources.length,
      readySources: readySources.length,
      pendingSources: pendingSources.length,
      failedSources: failedSources.length,
      reviewSources: reviewSources.length,
      categories: categories.size,
    },
    blockingIssues,
    suggestions,
  };
};

module.exports = {
  SOURCE_STATUSES_READY_FOR_REFINEMENT,
  calculateCyberReadiness,
};
