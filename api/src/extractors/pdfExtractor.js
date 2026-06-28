const fs =
  require("fs");

const pdfParse =
  require("pdf-parse");

const extractFromPdf =
  async (filePath) => {

    try {

      const dataBuffer =
        fs.readFileSync(
          filePath
        );

      const pdfData =
        await pdfParse(
          dataBuffer
        );

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