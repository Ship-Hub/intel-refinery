const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { extractFromPdf } = require("../../src/extractors/pdfExtractor");
const urlExtractor = require("../../src/extractors/urlExtractor");

const writePdfFixture = () => {
  const filePath = path.join(os.tmpdir(), `intel-refinery-${Date.now()}.pdf`);
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 68 >>
stream
BT /F1 24 Tf 100 700 Td (Intel Refinery PDF extraction smoke text) Tj ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000360 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
430
%%EOF`;
  fs.writeFileSync(filePath, pdf);
  return filePath;
};

const withServer = async (handler, fn) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

test("PDF extractor returns text from uploaded PDFs", async () => {
  const filePath = writePdfFixture();
  try {
    const result = await extractFromPdf(filePath);
    assert.equal(result.success, true);
    assert.match(result.text, /Intel Refinery PDF extraction smoke text/);
  } finally {
    fs.unlinkSync(filePath);
  }
});

test("URL extractor reads useful body content from web pages", async () => {
  await withServer((req, res) => {
    res.setHeader("content-type", "text/html");
    res.end(`
      <!doctype html>
      <html>
        <head>
          <title>Refinery Source Page</title>
          <meta name="description" content="A test page for URL extraction">
        </head>
        <body>
          <main>
            <h1>Incident timeline</h1>
            <p>The firewall alert started at 09:14 and the database failover followed at 09:22.</p>
            <p>The same service owner appears in both reports, linking the outage to the migration window.</p>
            <p>Operations notes mention a rollback checklist, a DNS propagation delay, and a customer impact window that lasted forty minutes.</p>
            <p>Post incident review material should preserve these timings, actors, and relationships so refinement can build a timeline.</p>
            <p>This extra paragraph ensures static extraction has enough signal without requiring browser rendering.</p>
          </main>
        </body>
      </html>
    `);
  }, async (baseUrl) => {
    const result = await urlExtractor.extractFromUrl(baseUrl);
    assert.equal(result.usedPlaywright, false);
    assert.match(result.content, /Incident timeline/);
    assert.match(result.content, /database failover/);
  });
});
