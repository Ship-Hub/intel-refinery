const safeJsonParse =
  (text = "", defaults = {}) => {

    try {

      const cleaned =
        text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

      let data =
        JSON.parse(cleaned);

      // Unwrap common wrappers: { data, result, output }
      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.data && typeof data.data === "object") {
          data = data.data;
        } else if (data.result && typeof data.result === "object") {
          data = data.result;
        } else if (data.output && typeof data.output === "object") {
          data = data.output;
        }
      }

      return { ...defaults, ...data };

    } catch (error) {

      return defaults;

    }

  };

module.exports = {
  safeJsonParse
};