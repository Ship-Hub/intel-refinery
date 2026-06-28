const http = require("http");

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, { headers }, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

(async () => {
  // Test health
  const health = await request("/health");
  console.log("HEALTH:", health.status, health.body.substring(0, 60));

  // Test GET projects with API key
  const projects = await request("/api/projects", { "x-api-key": "refinery-test-a6329de321e9698636b64b87db742122" });
  console.log("PROJECTS:", projects.status, projects.body);

  // Test without auth
  const noAuth = await request("/api/projects");
  console.log("NO AUTH:", noAuth.status, noAuth.body);

  // Test with fake key
  const fakeKey = await request("/api/projects", { "x-api-key": "fake-key-123456" });
  console.log("FAKE:", fakeKey.status, fakeKey.body);
})();