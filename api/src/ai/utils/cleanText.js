const cleanText =
  (text = "") => {

    return text

      // Normalize spaces
      .replace(/\s+/g, " ")

      // Remove repeated newlines
      .replace(/\n+/g, "\n")

      // Remove weird OCR chars
      .replace(/[^\x20-\x7E\n]/g, "")

      .trim();

};

module.exports = {
  cleanText
};