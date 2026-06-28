const { URL } = require("url");

const BLOCKED_HOSTS = ["169.254.169.254", "0.0.0.0", "127.0.0.1", "localhost", "::1", "metadata.google.internal"];
const BLOCKED_RANGES = ["10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168."];
const DANGEROUS_PATTERNS = [/['"`;|=(){}[\]<>]/, /\/\*/, /--/, /union.*select/i, /drop.*table/i, /exec\s*\(/i, /xp_cmdshell/i, /pg_sleep/i, /waitfor\s+delay/i];

const ssrfProtection = (req, res, next) => {
  const urlsToCheck = [];
  if (req.body?.url) urlsToCheck.push(req.body.url);
  if (req.body?.uri) urlsToCheck.push(req.body.uri);
  if (req.query?.url) urlsToCheck.push(req.query.url);
  if (req.query?.uri) urlsToCheck.push(req.query.uri);
  for (const urlStr of urlsToCheck) {
    try {
      const parsed = new URL(urlStr);
      const hostname = parsed.hostname.toLowerCase();
      if (BLOCKED_HOSTS.includes(hostname)) {
        return res.status(400).json({ success: false, error: "URL references a blocked resource" });
      }
      if (BLOCKED_RANGES.some(r => hostname.startsWith(r))) {
        return res.status(400).json({ success: false, error: "URL references a private network resource" });
      }
    } catch {
      return res.status(400).json({ success: false, error: "Invalid URL provided" });
    }
  }
  next();
};

const sanitizeInput = (req, res, next) => {
  const checkFields = (obj, path = "") => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof val === "string") {
        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(val)) {
            return res.status(400).json({ success: false, error: `Potentially dangerous input detected in field: ${fullPath}` });
          }
        }
        obj[key] = val
          .replace(/\0/g, "")
          .replace(/\r\n/g, "\n")
          .trim();
      } else if (val !== null && typeof val === "object") {
        checkFields(val, fullPath);
      }
    }
  };
  if (req.body) checkFields(req.body);
  next();
};

module.exports = { ssrfProtection, sanitizeInput };
