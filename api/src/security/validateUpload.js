const fs =
  require("fs");

const mime =
  require("mime-types");

const {
  allowedMimeTypes,
  acceptedFileTypes
} = require(
  "./allowedMimeTypes"
);

const MAX_FILE_SIZE =
  5_000_000;

const validateUpload =
  (file) => {

    if (!file) {

      return {

        success: false,

        error:
          "No uploaded file",

        acceptedFileTypes

      };

    }

    // Size validation
    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      return {

        success: false,

        error:
          "File exceeds 5MB limit",

        maxFileSize:
          "5MB",

        acceptedFileTypes

      };

    }

    // MIME validation
    const detectedMime =
      mime.lookup(
        file.originalname
      );

    if (
      !allowedMimeTypes.includes(
        detectedMime
      )
    ) {

      // Delete invalid upload
      if (
        fs.existsSync(
          file.path
        )
      ) {

        fs.unlinkSync(
          file.path
        );

      }

      return {

        success: false,

        error:
          "Unsupported file type",

        acceptedFileTypes

      };

    }

    return {

      success: true,

      mimeType:
        detectedMime,

      acceptedFileTypes,

      maxFileSize:
        "5MB"

    };

};

module.exports = {
  validateUpload
};
