const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildImageSourceText,
  buildVisionPrompt,
  normalizeVisionAnalysis,
  parseJsonResponse,
} = require("../../src/ai/utils/imageVision");

test("vision prompt asks for structured visual source analysis", () => {
  const prompt = buildVisionPrompt("Login failed at 09:14");

  assert.match(prompt, /visualSummary/);
  assert.match(prompt, /keyObjects/);
  assert.match(prompt, /relationships/);
  assert.match(prompt, /OCR text if any: Login failed at 09:14/);
});

test("vision response parser accepts fenced JSON", () => {
  const parsed = parseJsonResponse(`\`\`\`json
{
  "visualSummary": "A dashboard shows an outage.",
  "signals": ["Database failover is red"]
}
\`\`\``);

  assert.equal(parsed.visualSummary, "A dashboard shows an outage.");
  assert.deepEqual(parsed.signals, ["Database failover is red"]);
});

test("image source text combines OCR and visual observations", () => {
  const vision = normalizeVisionAnalysis({
    visualSummary: "A status dashboard shows database and firewall alerts.",
    sourceType: "screenshot",
    visibleText: ["DB failover", "Firewall alert"],
    keyObjects: ["status dashboard", "alert table"],
    relationships: ["The firewall alert appears before the database failover"],
    signals: ["Database failover is marked critical"],
    uncertainties: ["Exact owner is not visible"],
  });

  const text = buildImageSourceText({
    ocrText: "Critical alert visible in the header",
    vision,
  });

  assert.match(text, /OCR text:/);
  assert.match(text, /Visual summary:/);
  assert.match(text, /status dashboard shows database/);
  assert.match(text, /The firewall alert appears before/);
  assert.match(text, /Exact owner is not visible/);
});
