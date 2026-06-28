const crypto =
  require("crypto");

const safeEqual =
  (
    left,
    right
  ) => {
    const leftBuffer =
      Buffer.from(
        left ||
          ""
      );
    const rightBuffer =
      Buffer.from(
        right ||
          ""
      );

    return leftBuffer.length ===
      rightBuffer.length &&
      crypto.timingSafeEqual(
        leftBuffer,
        rightBuffer
      );
  };

const verifyPaystackSignature =
  ({
    rawBody,
    signature,
    secret
  }) =>
    safeEqual(
      crypto.createHmac(
        "sha512",
        secret
      )
        .update(
          rawBody
        )
        .digest(
          "hex"
        ),
      signature
    );

const verifyCoinbaseSignature =
  ({
    rawBody,
    signature,
    secret
  }) =>
    safeEqual(
      crypto.createHmac(
        "sha256",
        secret
      )
        .update(
          rawBody
        )
        .digest(
          "hex"
        ),
      signature
    );

const verifyStripeSignature =
  ({
    rawBody,
    signatureHeader,
    secret,
    toleranceSeconds =
      300
  }) => {
    const parts =
      Object.fromEntries(
        String(
          signatureHeader ||
            ""
        )
          .split(
            ","
          )
          .map(
            (part) =>
              part.split(
                "="
              )
          )
      );
    const timestamp =
      Number(
        parts.t
      );
    const signature =
      parts.v1;

    if (
      !timestamp ||
      !signature ||
      Math.abs(
        Date.now() /
          1000 -
          timestamp
      ) >
        toleranceSeconds
    ) {
      return false;
    }

    const expected =
      crypto.createHmac(
        "sha256",
        secret
      )
        .update(
          `${timestamp}.${rawBody}`
        )
        .digest(
          "hex"
        );

    return safeEqual(
      expected,
      signature
    );
  };

module.exports = {
  verifyPaystackSignature,
  verifyCoinbaseSignature,
  verifyStripeSignature
};
