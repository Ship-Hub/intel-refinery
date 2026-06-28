const successResponse =
  (
    res,
    data = {},
    meta = {}
  ) => {

    return res.json({

      success: true,

      data,

      error: null,

      meta

    });

};

const errorResponse =
  (
    res,
    statusCode = 500,
    error = "Internal server error",
    meta = {}
  ) => {

    return res.status(statusCode)
      .json({

        success: false,

        data: null,

        error,

        meta

      });

};

module.exports = {

  successResponse,

  errorResponse

};