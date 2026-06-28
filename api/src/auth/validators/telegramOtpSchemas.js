const {
  z
} = require(
  "zod"
);

const requestTelegramOtpSchema =
  z.object({
    telegramUserId:
      z.string()
        .min(1)
        .max(255),
    displayName:
      z.string()
        .min(1)
        .max(255)
        .nullable()
        .optional(),
    username:
      z.string()
        .min(1)
        .max(255)
        .nullable()
        .optional()
  });

const verifyTelegramOtpSchema =
  z.object({
    code:
      z.string()
        .regex(
          /^\d{6}$/
        )
  });

module.exports = {
  requestTelegramOtpSchema,
  verifyTelegramOtpSchema
};
