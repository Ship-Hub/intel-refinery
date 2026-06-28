const { register } = require("../registry");
const research = require("../../research");

const execute = async (taskInput) => {
  const { projectId, artifacts } = taskInput;

  if (!artifacts || artifacts.length === 0) {
    return { success: false, error: "No artifacts to connect", output: null };
  }

  const result = await research.executeProtocol("connection/artifact", {
    projectId,
    artifacts
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

register("connect", execute);
module.exports = { execute };
