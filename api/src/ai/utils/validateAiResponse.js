const {
  z
} = require("zod");

const contradictionSchema =
  z.object({

    statementA:
      z.string(),

    statementB:
      z.string()

  });

const evidenceAnalysisSchema =
  z.object({

    summary:
      z.string(),

    participants:
      z.array(
        z.string()
      ),

    claims:
      z.array(
        z.string()
      ),

    dates:
      z.array(
        z.string()
      ),

    amounts:
      z.array(
        z.string()
      ),

    riskFlags:
      z.array(
        z.string()
      ),

    sentiment:
      z.string(),

    contradictions:
      z.array(
        contradictionSchema
      )

  });

const timelineSchema =
  z.object({

    timeline:
      z.array(
        z.object({

          event:
            z.string(),

          actor:
            z.string(),

          date:
            z.string(),

          confidence:
            z.enum([
              "high",
              "medium",
              "low"
            ])

        })
      )

  });

const disputeSummarySchema =
  z.object({

    summary:
      z.string(),

    keyIssues:
      z.array(
        z.string()
      ),

    riskFlags:
      z.array(
        z.string()
      ),

    overallSentiment:
      z.string(),

    suspiciousActivities:
      z.array(
        z.string()
      )

  });

const contradictionResultSchema =
  z.object({

    contradictions:
      z.array(
        z.object({

          statementA:
            z.string(),

          statementB:
            z.string(),

          reason:
            z.string(),

          severity:
            z.enum([
              "low",
              "medium",
              "high"
            ])

        })
      )

  });

const websiteRiskSchema =
  z.object({

    riskScore:
      z.number()
        .min(0)
        .max(100),

    overallRisk:
      z.enum([
        "low",
        "medium",
        "high"
      ]),

    riskFlags:
      z.array(
        z.string()
      ),

    legitimacyIndicators:
      z.array(
        z.string()
      ),

    suspiciousIndicators:
      z.array(
        z.string()
      ),

    summary:
      z.string()

  });

const validateWithSchema =
  (
    schema,
    data
  ) => {

    return schema.safeParse(
      data
    );

  };

module.exports = {

  evidenceAnalysisSchema,

  timelineSchema,

  disputeSummarySchema,

  contradictionResultSchema,

  websiteRiskSchema,

  validateEvidenceAnalysis:
    (data) =>
      validateWithSchema(
        evidenceAnalysisSchema,
        data
      ),

  validateTimeline:
    (data) =>
      validateWithSchema(
        timelineSchema,
        data
      ),

  validateDisputeSummary:
    (data) =>
      validateWithSchema(
        disputeSummarySchema,
        data
      ),

  validateContradictionResult:
    (data) =>
      validateWithSchema(
        contradictionResultSchema,
        data
      ),

  validateWebsiteRisk:
    (data) =>
      validateWithSchema(
        websiteRiskSchema,
        data
      )

};
