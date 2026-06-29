const { register } = require("../registry");
const research = require("../../research");
const { resolveProtocolId } = require("../../research/protocolResolver");

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const OBSERVE_BATCH_MAX_CHARS = toPositiveInteger(
  process.env.OBSERVE_BATCH_MAX_CHARS,
  10000
);
const OBSERVE_BATCH_MAX_CHUNKS = toPositiveInteger(
  process.env.OBSERVE_BATCH_MAX_CHUNKS,
  4
);

const estimateChunkLength = (chunk) =>
  String(chunk?.content || chunk?.text || "").length;

const batchSourceChunks = (sourceChunks) => {
  const batches = [];
  let current = [];
  let currentLength = 0;

  for (const chunk of sourceChunks) {
    const chunkLength = Math.max(estimateChunkLength(chunk), 1);
    const shouldStartNext =
      current.length > 0 &&
      (
        current.length >= OBSERVE_BATCH_MAX_CHUNKS ||
        currentLength + chunkLength > OBSERVE_BATCH_MAX_CHARS
      );

    if (shouldStartNext) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }

    current.push(chunk);
    currentLength += chunkLength;
  }

  if (current.length > 0) batches.push(current);

  return batches;
};

const mergeUsage = (left = null, right = null) => {
  if (!left) return right || null;
  if (!right) return left;

  return {
    promptTokens: (left.promptTokens || 0) + (right.promptTokens || 0),
    completionTokens: (left.completionTokens || 0) + (right.completionTokens || 0),
    totalTokens: (left.totalTokens || 0) + (right.totalTokens || 0)
  };
};

const execute = async (taskInput) => {
  const { projectId, sourceChunks } = taskInput;

  if (!sourceChunks || sourceChunks.length === 0) {
    return { success: false, error: "No source chunks provided", output: null };
  }

  const batches = batchSourceChunks(sourceChunks);
  const merged = { artifacts: [], evidence: [] };
  let usage = null;
  let model = null;
  let provider = null;
  let protocol = null;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const artifactOffset = merged.artifacts.length;
    const result = await research.executeProtocol(resolveProtocolId("observe", taskInput), {
      projectId,
      sourceChunks: batches[batchIndex],
      profileKey: taskInput.profileKey,
      intent: taskInput.intent,
      batchIndex,
      batchCount: batches.length
    });

    if (!result.success) {
      return {
        success: false,
        error: `batch ${batchIndex + 1}/${batches.length}: ${result.error}`,
        output: result.output,
        model: result.model,
        provider: result.provider
      };
    }

    const artifacts = result.output?.artifacts || [];
    const evidence = (result.output?.evidence || []).map((item) => ({
      ...item,
      artifactIndex:
        item.artifactIndex !== undefined
          ? item.artifactIndex + artifactOffset
          : item.artifact_index !== undefined
            ? item.artifact_index + artifactOffset
            : undefined
    }));

    merged.artifacts.push(...artifacts);
    merged.evidence.push(...evidence);
    usage = mergeUsage(usage, result.usage);
    model = result.model || model;
    provider = result.provider || provider;
    protocol = result.protocol || protocol;
  }

  return {
    success: true,
    output: merged,
    usage,
    model,
    provider,
    protocol
  };
};

register("observe", execute);
module.exports = { execute };
