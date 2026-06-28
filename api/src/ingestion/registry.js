// Source Adapter Registry — pluggable adapters for different source types
// Avoids circular deps by defining exports before requiring adapters

const adapters = {};

function register(sourceType, adapter) {
  adapters[sourceType] = adapter;
}

function get(sourceType) {
  return adapters[sourceType] || null;
}

function list() {
  return Object.keys(adapters);
}

function listWithMetadata() {
  return Object.entries(adapters).map(([type, adapter]) => ({
    sourceType: type,
    label: adapter.label || type,
    supportedMimeTypes: adapter.mimeTypes || [],
    supportsFiles: !!adapter.processFile,
    supportsUrls: !!adapter.processUrl,
    supportsRaw: !!adapter.processRaw
  }));
}

module.exports = { register, get, list, listWithMetadata };

// Auto-register after exports are ready
require("./adapters/pdfAdapter");
require("./adapters/imageAdapter");
require("./adapters/textAdapter");
require("./adapters/urlAdapter");
require("./adapters/audioAdapter");