// Image Source Adapter — extracts text via OCR and provides visual metadata
const { register } = require("../registry");
const ocr = require("../../ai/utils/ocr");
const imageVision = require("../../ai/utils/imageVision");

const adapter = {
  label: "Image / Screenshot",
  mimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
  sourceCategory: "image",

  processFile: async (filePath, fileName) => {
    let ocrText = "";
    let visionResult = null;
    try {
      ocrText = await ocr.extractTextFromImage(filePath);
    } catch (err) {
      // OCR failed — return empty text, source still stored
    }

    try {
      visionResult = await imageVision.analyzeImage(filePath, { ocrText });
    } catch {
      visionResult = { success: false, unavailable: true };
    }

    const visionAnalysis =
      visionResult?.success
        ? visionResult.analysis
        : null;
    const combinedText =
      imageVision.buildImageSourceText({
        ocrText,
        vision: visionAnalysis
      });

    return {
      text: combinedText || ocrText || "",
      metadata: {
        fileName,
        fileType: "image",
        extractionMethod: visionAnalysis ? "tesseract-ocr+vision" : "tesseract-ocr",
        hasOcrText: !!ocrText,
        hasVisionAnalysis: !!visionAnalysis,
        visionProvider: visionResult?.success ? visionResult.provider : null,
        visionModel: visionResult?.success ? visionResult.model : null,
        visualAnalysis: visionAnalysis,
        visionUnavailable: !visionAnalysis,
        extractedAt: new Date().toISOString()
      }
    };
  }
};

register("image", adapter);
module.exports = adapter;
