const taskDefinitions = {};

function register(taskType, handler) {
  taskDefinitions[taskType] = handler;
}

function get(taskType) {
  return taskDefinitions[taskType] || null;
}

function list() {
  return Object.keys(taskDefinitions);
}

module.exports = { register, get, list, taskDefinitions };

require("./definitions/observe");
require("./definitions/connect");
require("./definitions/understand");
require("./definitions/reflect");
require("./definitions/generateView");
