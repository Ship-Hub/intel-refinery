const cleanOcrText = (
    text = ""
  ) => {
  
    return text
  
      // normalize line endings
      .replace(/\r/g, "\n")
  
      // remove weird unicode artifacts
      .replace(/[^\x20-\x7E\n]/g, " ")
  
      // collapse repeated punctuation
      .replace(/[_~`|]+/g, " ")
  
      // remove repeated spaces
      .replace(/\s+/g, " ")
  
      // remove isolated junk chars
      .replace(/\b[a-zA-Z]{1}\b/g, "")
  
      // trim final result
      .trim();
  
  };
  
  module.exports = {
    cleanOcrText
  };