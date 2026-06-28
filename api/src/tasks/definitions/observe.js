const { register } = require("../registry");
const research = require("../../research");
const { resolveProtocolId } = require("../../research/protocolResolver");

const execute = async (taskInput) => {
  const { projectId, sourceChunks } = taskInput;

  if (!sourceChunks || sourceChunks.length === 0) {
    return { success: false, error: "No source chunks provided", output: null };
  }

  const result = await research.executeProtocol(resolveProtocolId("observe", taskInput), {
    projectId,
    sourceChunks,
    profileKey: taskInput.profileKey,
    intent: taskInput.intent
  });

  if (!result.success) {
    return { success: false, error: result.error, output: null, model: result.model, provider: result.provider };
  }

  return {
    success: true,
    output: result.output,
    usage: result.usage,
    model: result.model,
    provider: result.provider,
    protocol: result.protocol
  };
};

register("observe", execute);
module.exports = { execute };
