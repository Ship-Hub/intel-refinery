const { z } = require("zod");

function validate(protocol, rawOutput) {
  const errors = [];
  const warnings = [];

  if (!rawOutput || typeof rawOutput !== "object") {
    return { success: false, data: null, errors: ["Output must be a JSON object"], warnings: [] };
  }

  // Schema validation
  if (protocol.outputSchema) {
    const result = protocol.outputSchema.safeParse(rawOutput);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }
  }

  // Custom validation rules
  if (protocol.validationRules && Array.isArray(protocol.validationRules)) {
    for (const rule of protocol.validationRules) {
      try {
        const passed = rule.validate(rawOutput);
        if (!passed) {
          errors.push(rule.message || "Validation rule failed");
        }
      } catch (err) {
        errors.push(`Validation rule error: ${err.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? rawOutput : null,
    errors,
    warnings
  };
}

function buildValidationSummary(protocol, result, durationMs) {
  return {
    protocolId: protocol.id,
    protocolVersion: protocol.version,
    success: result.success,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errors: result.errors.slice(0, 10),
    warnings: result.warnings.slice(0, 10),
    durationMs
  };
}

module.exports = { validate, buildValidationSummary };
