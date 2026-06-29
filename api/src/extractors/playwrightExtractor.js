const {
    chromium
  } = require("playwright");

  const cheerio =
    require("cheerio");

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

      return { title, description };
    };

  const extractWithPlaywright =
    async (url) => {

      let browser;

      try {

        browser =
          await chromium.launch({
            headless: true
          });

        const page =
          await browser.newPage();

        await page.goto(url, {

          waitUntil:
            "networkidle",

          timeout: 30000

        });

        await page.waitForTimeout(
          3000
        );

        const html =
          await page.content();

        const $ =
          cheerio.load(html);

        $(
          "script, style, noscript, nav, footer"
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

          usedPlaywright: true,
          contentType: "text/html"

        };

      } catch (error) {

        console.error(
          "Playwright Extract Error:",
          error.message
        );

        return {

          success: false,

          error:
            error.message

        };

      } finally {

        if (browser) {

          await browser.close();

        }

      }

  };

  module.exports = {
    extractWithPlaywright
  };
