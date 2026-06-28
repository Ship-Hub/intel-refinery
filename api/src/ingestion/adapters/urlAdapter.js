// URL Source Adapter — fetches and extracts content from web pages
const { register } = require("../registry");
const urlExtractor = require("../../extractors/urlExtractor");

const adapter = {
  label: "Web Page / Link",
  mimeTypes: [],
  sourceCategory: "web",

  processUrl: async (url) => {
    let text = "";
    let metadata = {
      url,
      extractionMethod: "cheerio",
      extractedAt: new Date().toISOString()
    };

    try {
      const result = await urlExtractor.extractFromUrl(url);
      text = result.text || result.content || "";
      metadata = {
        ...metadata,
        title: result.title || "",
        description: result.description || "",
        extractionMethod: result.usedPlaywright ? "playwright" : "cheerio",
        contentType: result.contentType || "text/html"
      };
    } catch (err) {
      metadata.error = err.message;
    }

    return { text, metadata };
  }
};

register("url", adapter);
module.exports = adapter;