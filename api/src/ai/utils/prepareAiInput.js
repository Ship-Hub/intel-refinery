const {
    cleanText
  } = require(
    "./cleanText"
  );
  
  const {
    chunkText
  } = require(
    "./chunkText"
  );
  
  const MAX_TOTAL_INPUT =
    15000;
  
  const prepareAiInput =
    (text = "") => {
  
      // Clean OCR text
      const cleaned =
        cleanText(text);
  
      // Hard cap
      const trimmed =
        cleaned.slice(
          0,
          MAX_TOTAL_INPUT
        );
  
      // Chunk safely
      const chunks =
        chunkText(trimmed);
  
      return {
  
        originalLength:
          text.length,
  
        cleanedLength:
          cleaned.length,
  
        finalLength:
          trimmed.length,
  
        chunkCount:
          chunks.length,
  
        chunks
  
      };
  
  };
  
  module.exports = {
    prepareAiInput
  };