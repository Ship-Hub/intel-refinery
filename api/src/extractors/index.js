const path =
  require("path");

const {
  extractFromImage
} = require(
  "./imageExtractor"
);

const {
  extractFromPdf
} = require(
  "./pdfExtractor"
);

const {
  extractFromText
} = require(
  "./textExtractor"
);

const extractText =
  async (filePath) => {

    try {

      const extension =
        path.extname(
          filePath
        ).toLowerCase();

      switch (extension) {

        case ".png":
        case ".jpg":
        case ".jpeg":
        case ".webp":

          return await
            extractFromImage(
              filePath
            );

        case ".pdf":

          return await
            extractFromPdf(
              filePath
            );

        case ".txt":

          return await
            extractFromText(
              filePath
            );

        default:

          return {
            success: false,
            error:
              `Unsupported file type: ${extension}`
          };

      }

    } catch (error) {

      console.error(
        "Universal Extract Error:",
        error.message
      );

      return {
        success: false,
        error: error.message
      };

    }

};

module.exports = {
  extractText
};