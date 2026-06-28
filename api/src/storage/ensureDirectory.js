const fs =
  require("fs");

const ensureDirectory =
  (directory) => {

    if (
      !fs.existsSync(
        directory
      )
    ) {

      fs.mkdirSync(
        directory,
        {
          recursive: true
        }
      );

    }

};

module.exports = {
  ensureDirectory
};