// Text Source Adapter — handles plain text files
const { register } = require("../registry");
const fs = require("fs/promises");

const adapter = {
  label: "Plain Text",
  mimeTypes: ["text/plain", "text/markdown", "text/csv"],
  sourceCategory: "text",

  processFile: async (filePath, fileName) => {
    const text = await fs.readFile(filePath, "utf-8");
    return {
      text: text || "",
      metadata: {
        fileName,
        fileType: "text",
        extractionMethod: "direct-read",
        characterCount: (text || "").length,
        extractedAt: new Date().toISOString()
      }
    };
  },

  processRaw: async (rawText) => ({
    text: rawText || "",
    metadata: {
      fileType: "raw_text",
      extractionMethod: "direct",
      characterCount: (rawText || "").length,
      extractedAt: new Date().toISOString()
    }
  })
};

register("text", adapter);
module.exports = adapter;