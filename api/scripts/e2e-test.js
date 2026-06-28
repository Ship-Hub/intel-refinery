// Full E2E test script — run from api/ directory
const http = require("http");

const API_KEY = "refinery-test-a6329de321e9698636b64b87db742122";
const BASE = "http://localhost:5000";

const req = (method, path, body) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { "x-api-key": API_KEY, "Content-Type": "application/json" },
    };
    const r = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ error: "parse error", raw: data.substring(0, 200) });
        }
      });
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });

(async () => {
  // 1. Create project
  const proj = await req("POST", "/api/projects", {
    title: "E2E Debug Test",
  });
  const pid = proj.data?.id;
  if (!pid) {
    console.error("Failed to create project:", JSON.stringify(proj));
    process.exit(1);
  }
  console.log("Project:", pid);

  // 2. Add raw source
  const src = await req("POST", "/api/sources/raw", {
    project_id: pid,
    title: "Test Report",
    text: 'Q4 revenue reached $12.3M, up 22% YoY. The CEO announced a new AI division named RefineryAI. The CTO resigned unexpectedly citing personal reasons. Internal audit flagged $450K in unaccounted expenses from Q3. Three new products in pipeline. European expansion on hold due to GDPR regulatory concerns.',
  });
  console.log("Source:", src.data?.id);

  // 3. Run pipeline
  console.log("Processing...");
  const start = Date.now();
  const result = await req("POST", `/api/processing/refine/${pid}`);
  const dur = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Duration: ${dur}s`);
  console.log("Completed:", result.data?.completedNodes?.join(", "));
  console.log("Errors:", result.data?.errors?.join("; "));

  // 4. Query results
  const overview = await req("GET", `/api/refinery/overview/${pid}`);
  console.log("\nOverview:", JSON.stringify(overview.data?.counts));

  const obs = await req("GET", `/api/refinery/observations/${pid}`);
  console.log("Observations:", obs.data?.length);
  if (obs.data?.length > 0) {
    console.log("  First:", JSON.stringify(obs.data[0]).substring(0, 200));
  }

  const ents = await req("GET", `/api/refinery/entities/${pid}`);
  console.log("Entities:", ents.data?.length);
  if (ents.data?.length > 0) {
    console.log("  First:", JSON.stringify(ents.data[0]).substring(0, 200));
  }

  const questions = await req("GET", `/api/refinery/questions/${pid}`);
  console.log("Questions:", questions.data?.length);

  const insights = await req("GET", `/api/refinery/insights/${pid}`);
  console.log("Insights:", insights.data?.length);

  const gaps = await req("GET", `/api/refinery/gaps/${pid}`);
  console.log("Gaps:", gaps.data?.length);

  const t = await req("GET", `/api/refinery/themes/${pid}`);
  console.log("Themes:", t.data?.length);

  console.log("\nDone!");
})();
