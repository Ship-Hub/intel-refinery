require("dotenv").config();

const {
  validateStartup
} = require(
  "./src/config/validateStartup"
);

const {
  logger
} = require(
  "./src/logging/logger"
);

// TODO: Refinery workers — reimplement background processing for refinery pipeline
// Old Intel Engine workers (evidence, cleanup, conversation analysis) are archived.
// New refinery workers will handle:
//   - Source ingestion (normalize pending sources)
//   - Refinement processing (run AI pipeline stages)
//   - Report generation
//
// For now, processing runs synchronously in the request. This worker is a placeholder.

let shuttingDown =
  false;

const shutdownWorkers =
  (
    signal
  ) => {

    if (
      shuttingDown
    ) {

      return;

    }

    shuttingDown =
      true;

    logger.info({

      event:
        "worker_shutdown_signal",

      signal

    });

    process.exit(
      0
    );

  };

const boot =
  async () => {

    await validateStartup();

    logger.info({

      event:
        "refinery_worker_boot",

      message:
        "Refinery worker started (sync mode — background processing pending)"

    });

    process.on(
      "SIGTERM",
      () =>
        shutdownWorkers(
          "SIGTERM"
        )
    );

    process.on(
      "SIGINT",
      () =>
        shutdownWorkers(
          "SIGINT"
        )
    );

  };

boot()
  .catch(
    (error) => {

      logger.fatal({

        event:
          "worker_boot_failed",

        error:
          error.message

      });

      process.exit(
        1
      );

    }
  );