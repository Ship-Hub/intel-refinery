const fs =
  require("fs");

const {
  PDFParse
} = require("pdf-parse");

const extractFromPdf =
  async (filePath) => {

    try {

      const dataBuffer =
        fs.readFileSync(
          filePath
        );

      const parser =
        new PDFParse({
          data: dataBuffer
        });

      let pdfData;
      try {
        pdfData =
          await parser.getText();
      } finally {
        await parser.destroy();
      }

      return {
        success: true,
        type: "pdf",
        text:
          pdfData.text || ""
      };

    } catch (error) {

      console.error(
        "PDF Extract Error:",
        error.message
      );

      return {
        success: false,
        error: error.message
      };

    }

};

module.exports = {
  extractFromPdf
};
