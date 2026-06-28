const { register } = require("../registry");
const research = require("../../research");

const execute = async (taskInput) => {
  const { projectId, artifacts, connections } = taskInput;

  if (!artifacts || artifacts.length === 0) {
    return { success: false, error: "No artifacts to understand", output: null };
  }

  const result = await research.executeProtocol("understanding/model", {
    projectId,
    artifacts,
    connections: connections || []
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

register("understand", execute);
module.exports = { execute };
