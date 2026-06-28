const test =
  require("node:test");
const assert =
  require("node:assert/strict");

process.env.GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  "test-key";

const {
  parseCaseReasoning,
  buildUnverifiedLiveAnswerPrompt,
  buildPrompt,
  classifyChatRequest,
  formatCaseReasoningReply,
  isLikelyCaseReasoningQuestion
} = require(
  "../src/controllers/chatQueryController"
);

test(
  "classifier-style JSON parses cleanly",
  () => {
    assert.deepEqual(
      parseCaseReasoning(
        '{"category":"summary","confidence":0.91}'
      ),
      {
        category:
          "summary",
        confidence:
          0.91
      }
    );
  }
);

test(
  "chat schema accepts a separate raw user question for retrieval",
  () => {
    const {
      chatQuerySchema
    } =
      require(
        "../src/validators/chatQuerySchema"
      );

    const result =
      chatQuerySchema.safeParse({
        platform:
          "telegram",
        chatId:
          "chat",
        userId:
          "user",
        username:
          "cap",
        userQuestion:
          "What's the weather in California like?",
        message:
          "x".repeat(
            6000
          )
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "chat schema accepts long raw evidence questions",
  () => {
    const {
      chatQuerySchema
    } =
      require(
        "../src/validators/chatQuerySchema"
      );

    const result =
      chatQuerySchema.safeParse({
        platform:
          "telegram",
        chatId:
          "chat",
        userId:
          "user",
        username:
          "cap",
        userQuestion:
          "x".repeat(
            5000
          ),
        message:
          "x".repeat(
            5000
          )
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "general prompt allows small harmless creative requests",
  () => {
    const prompt =
      buildPrompt({
        platform:
          "telegram",
        chatId:
          "chat",
        userId:
          "user",
        username:
          "cap",
        message:
          "write me a short murder mystery"
      });

    assert.match(
      prompt,
      /small creative\/problem-solving request/i
    );
  }
);

test(
  "general prompt allows benign problem solving outside the core specialty",
  () => {
    const prompt =
      buildPrompt({
        platform:
          "telegram",
        chatId:
          "chat",
        userId:
          "user",
        username:
          "cap",
        message:
          "Can you help me solve chess puzzles?"
      });

    assert.match(
      prompt,
      /Do not refuse benign requests such as chess puzzles/i
    );
  }
);

test(
  "obvious case prompts skip AI classification",
  async () => {
    const result =
      await classifyChatRequest(
        "Who most likely killed Marcus and which statements conflict with the evidence?"
      );

    assert.deepEqual(
      result,
      {
        category:
          "evidence_case_reasoning",
        confidence:
          1
      }
    );
  }
);

test(
  "generic evidence wording alone does not force case reasoning",
  () => {
    assert.equal(
      isLikelyCaseReasoningQuestion(
        "Please ask for evidence before escalating this scam claim."
      ),
      false
    );
  }
);

test(
  "moderation intervention prompts do not route to case reasoning",
  async () => {
    assert.deepEqual(
      await classifyChatRequest(
        "A scam, rug, fraud, or panic claim may be forming in the chat. Give a brief moderator-style intervention."
      ),
      {
        category:
          "moderation_triage",
        confidence:
          1
      }
    );
  }
);

test(
  "case reasoning formatter prefers natural user-facing answers",
  () => {
    const reply =
      formatCaseReasoningReply({
        likely_actor:
          "Richard",
        evidence_for:
          [],
        evidence_against:
          [],
        alternative_hypotheses: [
          {
            hypothesis:
              "Elena may have prepared the poison."
          }
        ],
        known_lies:
          [],
        confidence:
          0.8,
        reasoning_summary:
          "Richard remains strongest.",
        natural_answer:
          "Richard looks most likely, but Elena remains a plausible alternative."
      });

    assert.match(
      reply,
      /Richard looks most likely/
    );
    assert.doesNotMatch(
      reply,
      /<b>Motive<\/b>|<b>Opportunity<\/b>/
    );
  }
);

test(
  "case reasoning formatter falls back to prose without worksheet headings",
  () => {
    const reply =
      formatCaseReasoningReply({
        likely_actor:
          "Richard",
        motive_evidence: [
          "Inheritance dispute"
        ],
        opportunity_evidence: [
          "Present in the room"
        ],
        physical_action_evidence: [
          "No direct proof"
        ],
        misleading_or_ambiguous_evidence: [
          "Fingerprints on the bottle do not prove poisoning the glass"
        ],
        evidence_against:
          [],
        alternative_hypotheses:
          [],
        known_lies:
          [],
        confidence:
          0.6,
        reasoning_summary:
          "Several suspects remain plausible."
      });

    assert.match(
      reply,
      /Several suspects remain plausible/
    );
    assert.doesNotMatch(
      reply,
      /<b>Motive<\/b>|<b>Opportunity<\/b>|<b>Physical action<\/b>/
    );
  }
);

test(
  "case reasoning prompt treats search history as circumstantial",
  () => {
    const {
      buildCaseReasoningPrompt
    } =
      require(
        "../src/controllers/chatQueryController"
      );
    const prompt =
      buildCaseReasoningPrompt(
        "Lisa searched for poisons."
      );

    assert.match(
      prompt,
      /Treat search history, deleted emails, secret recordings, and unexplained preparation as circumstantial/i
    );
    assert.match(
      prompt,
      /Confidence above 0.75 requires especially strong direct linkage/i
    );
  }
);


test(
  "unverified live-fact prompt explicitly avoids case reasoning",
  () => {
    const prompt =
      buildUnverifiedLiveAnswerPrompt(
        "Who is the president of the United States?"
      );

    assert.match(
      prompt,
      /live retrieval is currently unavailable/i
    );
    assert.match(
      prompt,
      /do not use evidence-analysis structure/i
    );
    assert.match(
      prompt,
      /Who is the president of the United States?/i
    );
  }
);
