const Tesseract = require("tesseract.js");

const extractTextFromImage = async (imagePath) => {

  try {

    const result = await Tesseract.recognize(
      imagePath,
      "eng"
    );

    return result.data.text;

  } catch (error) {

    console.error(error);

    return "";

  }

};

module.exports = {
  extractTextFromImage
};