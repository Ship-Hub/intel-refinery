const withTimeout =
  (
    promise,
    ms = 120000
  ) => {

    return Promise.race([

      promise,

      new Promise(
        (_, reject) => {

          setTimeout(
            () => {

              reject(
                new Error(
                  "Operation timed out"
                )
              );

            },
            ms
          );

        }
      )

    ]);

};

module.exports = {
  withTimeout
};