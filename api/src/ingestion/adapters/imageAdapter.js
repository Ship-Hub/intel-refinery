// Image Source Adapter — extracts text via OCR and provides visual metadata
const { register } = require("../registry");
const ocr = require("../../ai/utils/ocr");

const adapter = {
  label: "Image / Screenshot",
  mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  sourceCategory: "image",

  processFile: async (filePath, fileName) => {
    let ocrText = "";
    try {
      ocrText = await ocr.extractTextFromImage(filePath);
    } catch (err) {
      // OCR failed — return empty text, source still stored
    }

    return {
      text: ocrText || "",
      metadata: {
        fileName,
        fileType: "image",
        extractionMethod: "tesseract-ocr",
        hasOcrText: !!ocrText,
        extractedAt: new Date().toISOString()
      }
    };
  }
};

register("image", adapter);
module.exports = adapter;