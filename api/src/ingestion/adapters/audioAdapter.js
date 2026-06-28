// Audio Source Adapter — transcribes audio files
// Placeholder — full transcription requires Groq Whisper or Gemini audio support
const { register } = require("../registry");

const adapter = {
  label: "Audio / Voice",
  mimeTypes: [
    "audio/ogg", "audio/mpeg", "audio/mp4",
    "audio/x-m4a", "audio/wav", "audio/webm"
  ],
  sourceCategory: "audio",

  processFile: async (filePath, fileName) => {
    // TODO: Re-enable AI transcription when orchestrator supports multimodal
    // For now, store the audio source metadata without transcription
    return {
      text: "",
      metadata: {
        fileName,
        fileType: "audio",
        extractionMethod: "pending_transcription",
        extractedAt: new Date().toISOString(),
        note: "Audio transcription is pending. AI providers for transcription are being configured."
      }
    };
  }
};

register("audio", adapter);
module.exports = adapter;