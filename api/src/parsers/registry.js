// Cyber Parser Registry — manages structured Cyber parsers
// Extends the ingestion adapter pattern for structured data parsing

const parsers = {};

/**
 * Register a Cyber parser
 * @param {import('./contract').CyberSourceParser} parser - Parser to register
 */
function registerParser(parser) {
  if (!parser.key || !parser.version) {
    throw new Error("Parser must have key and version");
  }
  if (typeof parser.canHandle !== "function") {
    throw new Error("Parser must implement canHandle()");
  }
  if (typeof parser.parse !== "function") {
    throw new Error("Parser must implement parse()");
  }
  parsers[parser.key] = parser;
}

/**
 * Get a parser by key
 * @param {string} key - Parser key
 * @returns {import('./contract').CyberSourceParser|null}
 */
function getParser(key) {
  return parsers[key] || null;
}

/**
 * Find a parser that can handle the given input
 * @param {import('./contract').ParserInput} input - Parser input
 * @returns {Promise<import('./contract').CyberSourceParser|null>}
 */
async function findParser(input) {
  for (const parser of Object.values(parsers)) {
    try {
      if (await parser.canHandle(input)) {
        return parser;
      }
    } catch {
      // Skip parsers that fail canHandle
    }
  }
  return null;
}

/**
 * List all registered parsers
 * @returns {Object[]}
 */
function listParsers() {
  return Object.values(parsers).map((p) => ({
    key: p.key,
    version: p.version,
    supportedMimeTypes: p.supportedMimeTypes || [],
    supportedExtensions: p.supportedExtensions || [],
  }));
}

module.exports = {
  registerParser,
  getParser,
  findParser,
  listParsers,
};
