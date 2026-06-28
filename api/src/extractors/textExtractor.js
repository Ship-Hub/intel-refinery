const fs =
  require("fs");

const extractFromText =
  async (filePath) => {

    try {

      const text =
        fs.readFileSync(
          filePath,
          "utf8"
        );

      return {
        success: true,
        type: "text",
        text
      };

    } catch (error) {

      console.error(
        "Text Extract Error:",
        error.message
      );

      return {
        success: false,
        error: error.message
      };

    }

};

module.exports = {
  extractFromText
};