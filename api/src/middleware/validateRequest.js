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

      if (!result.success) {
        const details = result.error.errors.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code
        }));
        const error = details
          .map((issue) => issue.path ? `${issue.path}: ${issue.message}` : issue.message)
          .join("; ");

        return res.status(400)
          .json({
            success: false,
            data: null,
            error,
            details
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
