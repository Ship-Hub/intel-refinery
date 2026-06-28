const {
  buildApiDocumentation
} = require(
  "./apiDocumentation"
);

const apiDocs =
  (
    req,
    res
  ) => {

    return res.json(
      buildApiDocumentation()
    );

};

module.exports = {
  apiDocs
};
