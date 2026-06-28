const path = require("path");
const fs = require("fs");

const loaded = new Map();
const loadedFiles = new Set();

function discover(dir) {
  const resolved = path.resolve(__dirname, "..", dir);
  if (!fs.existsSync(resolved)) return [];
  const files = [];
  for (const entry of fs.readdirSync(resolved, { withFileTypes: true })) {
    const full = path.join(resolved, entry.name);
    if (entry.isDirectory()) {
      files.push(...discover(path.join(dir, entry.name)));
    } else if (entry.name.endsWith(".js") && !entry.name.startsWith("_")) {
      files.push(full);
    }
  }
  return files;
}

function load(dir) {
  const files = discover(dir);
  for (const file of files) {
    if (loadedFiles.has(file)) continue;
    loadedFiles.add(file);
    try {
      const mod = require(file);
      if (!mod || !mod.id || !mod.stage) {
        console.warn(`Protocol load skipped (missing id/stage): ${file}`);
        continue;
      }
      const key = `${mod.id}@${mod.version || "1.0.0"}`;
      loaded.set(key, mod);
      if (!loaded.has(mod.id) || !loaded.get(mod.id) || loaded.get(mod.id).id !== mod.id) {
        loaded.set(mod.id, mod);
      }
    } catch (err) {
      console.error(`Protocol load error: ${file}: ${err.message}`);
    }
  }
}

function get(protocolId, version) {
  if (version) {
    return loaded.get(`${protocolId}@${version}`) || null;
  }
  return loaded.get(protocolId) || null;
}

function list() {
  return Array.from(loaded.entries())
    .filter(([key]) => !key.includes("@"))
    .map(([, proto]) => ({
      id: proto.id,
      version: proto.version,
      stage: proto.stage,
      purpose: proto.purpose,
      estimatedComplexity: proto.estimatedComplexity
    }));
}

function init() {
  load("./protocols");
  return { get, list };
}

module.exports = { init, get, list, load };
