const path =
  require("path");

const {
  extractTextFromImage
} = require(
  path.join(
    __dirname,
    "..",
    "ai",
    "utils",
    "ocr.js"
  )
);

const extractImageText =
  async (filePath) => {

    try {

      const text =
        await extractTextFromImage(
          filePath
        );

      return {

        success: true,

        type: "image",

        text

      };

    } catch (error) {

      console.error(
        "Image Extractor Error:",
        error.message
      );

      return {

        success: false,

        error:
          error.message

      };

    }

};

module.exports = {
  extractImageText
};