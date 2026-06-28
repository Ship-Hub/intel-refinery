const test =
  require("node:test");
const assert =
  require("node:assert/strict");

process.env.GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  "test-key";

const {
  buildVisualPrompt
} = require(
  "../src/controllers/mediaController"
);

test(
  "visual prompt asks for JSON image analysis fields",
  () => {
    const prompt =
      buildVisualPrompt(
        "hello"
      );

    assert.match(
      prompt,
      /is_chat_screenshot/
    );
    assert.match(
      prompt,
      /visual_summary/
    );
    assert.match(
      prompt,
      /user_facing_key_details/
    );
    assert.match(
      prompt,
      /OCR text if any: hello/
    );
  }
);

test(
  "gemini provider exposes image generation support",
  () => {
    const gemini =
      require(
        "../src/ai/providers/gemini"
      );

    assert.equal(
      typeof gemini.generateWithImage,
      "function"
    );
    assert.equal(
      typeof gemini.generateWithAudio,
      "function"
    );
  }
);

test(
  "visual JSON parsing tolerates fenced responses",
  () => {
    const source =
      require("node:fs").readFileSync(
        require.resolve(
          "../src/controllers/mediaController"
        ),
        "utf8"
      );

    assert.match(
      source,
      /replace\([\s\S]*\^```/
    );
  }
);
