const db =
  require("../config/db");

const env =
  require("../config/env");

const healthCheck =
  async (
    req,
    res
  ) => {

    const checks = {

      api: "healthy",

      database:
        "unknown",

      aiProvider:
        "configured"

    };

    try {

      await db.promise()
        .query(
          "SELECT 1"
        );

      checks.database =
        "healthy";

    } catch (error) {

      checks.database =
        "unhealthy";

    }

    return res.json({

      success: true,

      version:
        "1.0.0",

      timestamp:
        new Date(),

      environment:
        env.isProduction
          ? "production"
          : "development",

      checks

    });

};

module.exports = {
  healthCheck
};