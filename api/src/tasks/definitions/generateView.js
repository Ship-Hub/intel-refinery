const { register } = require("../registry");
const research = require("../../research");
const { resolveProtocolId } = require("../../research/protocolResolver");

const execute = async (taskInput) => {
  const { projectId, modelVersion } = taskInput;

  if (!modelVersion) {
    return { success: false, error: "No model version provided", output: null };
  }

  const result = await research.executeProtocol(resolveProtocolId("generate_view", taskInput), {
    projectId,
    modelVersion,
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

register("generate_view", execute);
module.exports = { execute };
