const validateRequest =
  (schema) => {

    return (
      req,
      res,
      next
    ) => {

      const result =
        schema.safeParse(
          req.body
        );

      if (
        !result.success
      ) {

        return res.status(400)
          .json({

            success: false,

            data: null,

            error:
              result.error.errors

          });

      }

      req.validatedBody =
        result.data;

      next();

    };

};

module.exports = {
  validateRequest
};