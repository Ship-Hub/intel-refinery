const axios =
  require("axios");

const cheerio =
  require("cheerio");

const {
  extractWithPlaywright
} = require(
  "./playwrightExtractor"
);

const buildMetadata =
  ($) => {
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").first().text().trim() ||
      $("h1").first().text().trim() ||
      "";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    return {
      title,
      description,
      url: $('link[rel="canonical"]').attr("href") || ""
    };
  };

const INSTAGRAM_HANDLE_RE =
  /@([a-z0-9._]{3,30})/gi;

const extractInstagramHandles =
  (text) =>
    [...new Set(
      [...String(text || "").matchAll(INSTAGRAM_HANDLE_RE)]
        .map((match) => match[1].toLowerCase())
        .filter((handle) => !["instagram"].includes(handle))
    )].slice(0, 6);

const fetchInstagramProfileSummary =
  async (handle) => {
    try {
      const response =
        await axios.get(`https://www.instagram.com/${handle}/`, {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        });

      const $ =
        cheerio.load(response.data);

      const metadata =
        buildMetadata($);

      const line = [
        `Referenced Instagram profile @${handle}`,
        metadata.title,
        metadata.description
      ]
        .filter(Boolean)
        .join(": ")
        .replace(/\s+/g, " ")
        .trim();

      const lowerLine =
        line.toLowerCase();

      if (!lowerLine.includes(`@${handle}`) && !lowerLine.includes(handle)) {
        return null;
      }

      return line.length > `Referenced Instagram profile @${handle}`.length ? line : null;
    } catch {
      return null;
    }
  };

const enrichInstagramReferences =
  async (url, text) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return text;
    }

    if (!parsed.hostname.includes("instagram.com")) {
      return text;
    }

    const handles =
      extractInstagramHandles(text);

    if (handles.length === 0) {
      return text;
    }

    const profileLines =
      (await Promise.all(handles.map(fetchInstagramProfileSummary)))
        .filter(Boolean);

    if (profileLines.length === 0) {
      return text;
    }

    return [
      text,
      "Referenced Instagram profiles:",
      ...profileLines
    ].join("\n\n");
  };

const extractFromUrl =
  async (url) => {

    try {

      const response =
        await axios.get(url, {

          timeout: 10000,

          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }

        });

      const html =
        response.data;

      const $ =
        cheerio.load(html);

      $(
        "script, style, noscript, nav, footer, header"
      ).remove();

      const bodyText =
        $("body")
          .text()
          .replace(/\s+/g, " ")
          .trim();

      const metadata =
        buildMetadata($);

      let combinedText = [
        metadata.title,
        metadata.description,
        bodyText
      ]
        .filter(Boolean)
        .join("\n\n")
        .replace(/\s+/g, " ")
        .trim();

      combinedText =
        await enrichInstagramReferences(url, combinedText);

      const MIN_CONTENT_LENGTH =
        300;

      const poorExtraction =

        !combinedText ||

        combinedText.length <
          MIN_CONTENT_LENGTH ||

        combinedText.includes(
          "enable javascript"
        ) ||

        combinedText.includes(
          "loading..."
        );

      if (poorExtraction) {

        return await
          extractWithPlaywright(
            url
          );

      }

      const MAX_LENGTH =
        15000;

      const trimmedText =
        combinedText.slice(
          0,
          MAX_LENGTH
        );

      return {

        content: trimmedText,

        title: metadata.title,
        description: metadata.description,

        usedPlaywright: false,
        contentType: response.headers["content-type"] || "text/html"

      };

    } catch (error) {

      return await
        extractWithPlaywright(
          url
        );

    }

};

module.exports = {
  extractFromUrl
};
