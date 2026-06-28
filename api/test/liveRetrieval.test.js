const test =
  require("node:test");
const assert =
  require("node:assert/strict");
const {
  classifyLiveQuery,
  normalizeLiveQuery
} = require(
  "../src/retrieval/classifyLiveQuery"
);
const {
  normalizeQuery
} = require(
  "../src/retrieval/cache"
);
const fs =
  require("node:fs");
const path =
  require("node:path");
const {
  rankResults
} = require(
  "../src/retrieval/rankResults"
);

test(
  "live retrieval classifies weather as volatile and office holders as cacheable",
  () => {
    assert.deepEqual(
      classifyLiveQuery(
        "what is the weather in Lagos today?"
      ),
      {
        needsRetrieval:
          true,
        cacheTtlDays:
          0,
        volatile:
          true
      }
    );
    assert.equal(
      classifyLiveQuery(
        "who is the current president of the united states?"
      ).cacheTtlDays,
      7
    );
    assert.equal(
      classifyLiveQuery(
        "who's the president of america?"
      ).needsRetrieval,
      true
    );
    assert.equal(
      normalizeQuery(
        "  Who   is   President? "
      ),
      "who is president?"
    );
    assert.equal(
      normalizeLiveQuery(
        "Who's the president of America?"
      ),
      "current president of the United States official"
    );
  }
);

test(
  "retrieval prefers Tavily before Google fallback",
  () => {
    const source =
      fs.readFileSync(
        path.join(
          __dirname,
          "../src/retrieval/retrieve.js"
        ),
        "utf8"
      );
    const tavilyIndex =
      source.indexOf(
        '"tavily"'
      );
    const googleIndex =
      source.indexOf(
        '"google_custom_search"'
      );

    assert.ok(
      tavilyIndex >=
        0
    );
    assert.ok(
      googleIndex >
        tavilyIndex
    );
  }
);

test(
  "retrieval ranks official government sources above weaker sources",
  () => {
    const ranked =
      rankResults([
        {
          title:
            "Facebook",
          url:
            "https://facebook.com/potus",
          snippet:
            "social"
        },
        {
          title:
            "White House",
          url:
            "https://www.whitehouse.gov/administration/",
          snippet:
            "official"
        },
        {
          title:
            "Wikipedia",
          url:
            "https://en.wikipedia.org/wiki/President_of_the_United_States",
          snippet:
            "encyclopedia"
        }
      ]);

    assert.equal(
      ranked[0].url,
      "https://www.whitehouse.gov/administration/"
    );
    assert.ok(
      ranked[0].authorityScore >
        ranked[1].authorityScore
    );
  }
);
