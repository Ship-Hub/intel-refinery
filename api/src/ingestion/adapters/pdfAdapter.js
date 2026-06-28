// PDF Source Adapter — extracts text from PDF files
const { register } = require("../registry");
const pdfExtractor = require("../../extractors/pdfExtractor");

const adapter = {
  label: "PDF Document",
  mimeTypes: ["application/pdf"],
  sourceCategory: "document",

  processFile: async (filePath, fileName) => {
    const result = await pdfExtractor.extractFromPdf(filePath);
    const text = result.text || "";
    return {
      text: text || "",
      metadata: {
        fileName,
        fileType: "pdf",
        extractionMethod: "pdf-parse",
        extractedAt: new Date().toISOString()
      }
    };
  }
};

register("pdf", adapter);
module.exports = adapter;