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
      $("title").first().text().trim() ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";

    const description =
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "";

    return {
      title,
      description,
      url: $('link[rel="canonical"]').attr("href") || ""
    };
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

      const combinedText = [
        metadata.title,
        metadata.description,
        bodyText
      ]
        .filter(Boolean)
        .join("\n\n")
        .replace(/\s+/g, " ")
        .trim();

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