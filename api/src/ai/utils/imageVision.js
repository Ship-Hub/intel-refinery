const fs = require("fs");
const mime = require("mime-types");

const env = require("../../config/env");
const { logger } = require("../../logging/logger");
const gemini = require("../providers/gemini");
const groq = require("../providers/groq");

const compactText = (value, maxLength = 1200) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const imageToDataUrl = (filePath) => {
  const mimeType = mime.lookup(filePath) || "image/jpeg";
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
};

const buildVisionPrompt = (ocrText = "") => `Analyze this image as source material for Intel Refinery.

Return only JSON with these fields:
{
  "visualSummary": "one concise sentence describing what the image shows",
  "sourceType": "screenshot | chart | document_photo | diagram | product_photo | scene | other",
  "visibleText": ["important visible text not already captured by OCR"],
  "keyObjects": ["important objects, people, UI elements, places, or entities visible"],
  "relationships": ["source-backed visual relationships, such as item A points to item B"],
  "signals": ["facts, findings, risks, actions, statuses, numbers, or events visible in the image"],
  "uncertainties": ["things that are unclear or should not be overclaimed"]
}

Be careful. Do not identify private people by face. Do not infer identity, ownership, intent, or sensitive attributes unless visible text directly supports it.
OCR text if any: ${compactText(ocrText, 2000) || "No OCR text captured."}`;

const parseJsonResponse = (content) => {
  const text = String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalizeList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => compactText(item, 240)).filter(Boolean).slice(0, 12);
  }
  const text = compactText(value, 240);
  return text ? [text] : [];
};

const normalizeVisionAnalysis = (value = {}) => ({
  visualSummary: compactText(value.visualSummary || value.visual_summary || value.summary, 500),
  sourceType: compactText(value.sourceType || value.source_type || "other", 80),
  visibleText: normalizeList(value.visibleText || value.visible_text),
  keyObjects: normalizeList(value.keyObjects || value.key_objects || value.objects),
  relationships: normalizeList(value.relationships),
  signals: normalizeList(value.signals || value.findings),
  uncertainties: normalizeList(value.uncertainties || value.uncertainty),
});

const buildImageSourceText = ({ ocrText = "", vision = null } = {}) => {
  const sections = [];
  const cleanOcr = compactText(ocrText, 12000);

  if (cleanOcr) {
    sections.push(`OCR text:\n${cleanOcr}`);
  }

  if (vision?.visualSummary) {
    sections.push(`Visual summary:\n${vision.visualSummary}`);
  }

  const addList = (heading, items) => {
    if (!items?.length) return;
    sections.push(`${heading}:\n${items.map((item) => `- ${item}`).join("\n")}`);
  };

  addList("Visible text", vision?.visibleText);
  addList("Visible objects and elements", vision?.keyObjects);
  addList("Visual relationships", vision?.relationships);
  addList("Visual signals", vision?.signals);
  addList("Visual uncertainties", vision?.uncertainties);

  return sections.join("\n\n").trim();
};

const runProvider = async ({ provider, prompt, dataUrl }) => {
  if (provider === "gemini") {
    return gemini.generateWithImage({ prompt, dataUrl });
  }
  if (provider === "groq") {
    return groq.generateWithImage({ prompt, dataUrl });
  }
  return { success: false, provider, error: "Unsupported image provider" };
};

const analyzeImage = async (filePath, { ocrText = "" } = {}) => {
  const providers = [
    env.GEMINI_API_KEY ? "gemini" : null,
    env.GROQ_API_KEY ? "groq" : null,
  ].filter(Boolean);

  if (!providers.length) {
    return { success: false, unavailable: true };
  }

  const prompt = buildVisionPrompt(ocrText);
  const dataUrl = imageToDataUrl(filePath);

  for (const provider of providers) {
    const result = await runProvider({ provider, prompt, dataUrl });
    if (!result.success) {
      logger.warn({
        event: "image_vision_provider_failed",
        provider,
        model: result.model,
        error: result.error,
      });
      continue;
    }

    const parsed = parseJsonResponse(result.content);
    if (!parsed) {
      logger.warn({
        event: "image_vision_parse_failed",
        provider,
        model: result.model,
      });
      continue;
    }

    return {
      success: true,
      provider: result.provider,
      model: result.model,
      analysis: normalizeVisionAnalysis(parsed),
    };
  }

  return { success: false, unavailable: true };
};

module.exports = {
  analyzeImage,
  buildImageSourceText,
  buildVisionPrompt,
  normalizeVisionAnalysis,
  parseJsonResponse,
};
