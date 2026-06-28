const test = require("node:test");
const assert = require("node:assert/strict");

const { buildDisputeVerdictPrompt } = require("../src/disputes/disputeVerdictPrompt");
const { formatRulingText } = require("../src/disputes/formatRulingText");
const {
  buildNewEvidenceReviewPrompt,
  parseReview
} = require("../src/disputes/reviewNewEvidence");

process.env.GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  "test-key";

test("verdict prompt favors provisional rulings over endless clarification", () => {
  const prompt = buildDisputeVerdictPrompt(
    "Buyer paid. Seller delivered draft work. Buyer dislikes it.",
    null,
    null,
    "dexcourt"
  );

  assert.match(
    prompt,
    /give that ruling instead of turning the case into endless Q&A/
  );
  assert.match(
    prompt,
    /Prefer 0-3 high-impact clarification questions/
  );
  assert.match(
    prompt,
    /New evidence does not automatically change a verdict/
  );
});

test("ruling text states review policy without promising verdict changes", () => {
  const text = formatRulingText({
    verdict: "claimant_prevails",
    confidence: 0.75,
    summary: "The claimant wins on current evidence.",
    keyFindings: ["Payment was confirmed."],
    recommendation: "Refund the claimant unless material contrary proof appears.",
    clarificationQuestions: [
      {
        target: "defendant",
        question: "Can you provide delivery proof?",
        blocksVerdict: false
      }
    ]
  });

  assert.match(text, /Ruling: Claimant prevails/);
  assert.match(text, /This ruling can stand on current evidence/);
  assert.match(text, /credible, relevant, and materially changes/);
});

test("new evidence review prompt preserves original verdict unless evidence is material", () => {
  const prompt = buildNewEvidenceReviewPrompt({
    originalContext: "A paid B for work.",
    originalRuling: {
      verdict: "claimant_prevails"
    },
    newEvidence: "A new screenshot was submitted."
  });

  assert.match(prompt, /not to restart the case from zero/);
  assert.match(prompt, /original ruling should stand unless/);
});

test("new evidence review parser normalizes stands decision", () => {
  const review = parseReview(
    JSON.stringify({
      decision: "initial_verdict_stands",
      materiality: "low",
      credibility: "moderate",
      summary: "The new evidence does not change the result.",
      impactOnOriginalRuling: "Initial ruling stands.",
      updatedVerdict: "claimant_prevails",
      updatedConfidence: 0.74,
      reasons: ["New evidence is duplicative."],
      followUpQuestions: ["Can the submitting party provide metadata?"]
    }),
    {
      verdict: "claimant_prevails",
      confidence: 0.7
    }
  );

  assert.equal(review.decision, "initial_verdict_stands");
  assert.equal(review.materiality, "low");
  assert.equal(review.updatedVerdict, "claimant_prevails");
  assert.equal(review.followUpQuestions.length, 1);
});