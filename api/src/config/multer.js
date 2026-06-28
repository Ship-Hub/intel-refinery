const multer =
  require("multer");

const path =
  require("path");

const {
  buildEvidencePath
} = require(
  "../storage/buildEvidencePath"
);

const storage =
  multer.diskStorage({

    destination:
      (req, file, cb) => {

        try {

          const disputeId =
            req.params.id ||
            "unknown";

          const {
            uploadDirectory
          } =
            buildEvidencePath({

              disputeId,

              originalName:
                file.originalname

            });

          cb(
            null,
            uploadDirectory
          );

        } catch (error) {

          cb(error);

        }

      },

    filename:
      (req, file, cb) => {

        try {

          const disputeId =
            req.params.id ||
            "unknown";

          const {
            fileName
          } =
            buildEvidencePath({

              disputeId,

              originalName:
                file.originalname

            });

          cb(
            null,
            fileName
          );

        } catch (error) {

          cb(error);

        }

      }

  });

const upload =
  multer({

    storage,

    limits: {

      fileSize:
        5 * 1024 * 1024

    }

  });

module.exports =
  upload;