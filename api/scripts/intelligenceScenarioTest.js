require("dotenv").config();

const { analyzeDispute } = require("../src/disputes/analyzeDispute");
const { runInteractionAudit } = require("../src/interactionAudit/runInteractionAudit");

const disputeScenarios = [
  {
    id: "marketplace-delivery-with-screenshot-audio-link",
    title: "Marketplace delivery dispute with chat screenshot, voice note, and tracking link",
    expected: [
      "classifies as payment or service dispute",
      "does not treat screenshot alone as final proof",
      "asks for delivery/tracking confirmation if missing"
    ],
    context: `
Plaintiff: Mira, buyer.
Defendant: Jay, seller.
Claim: Mira paid $420 for a used iPhone 14. Jay says he shipped it. Mira says the parcel never arrived.

Chat screenshot OCR:
- Mira: "I sent the full $420. Please ship today."
- Jay: "Got it. Tracking will update in the morning."
- Mira, two days later: "Tracking still says label created only."
- Jay: "Courier delay. Stop threatening me."

Audio message transcript:
Jay says: "I did not scam her. I dropped the package at the agent, but they said the scanner was down. I don't have the receipt anymore."
Tone: defensive, annoyed, but not clearly threatening.

Link intelligence from tracking page:
- Carrier page is reachable.
- Tracking status: "Label created. Package not received by carrier."
- Last update: 3 days ago.

Payment evidence:
- Bank receipt screenshot shows $420 sent from Mira to "Jay Electronics" on May 12.
- Recipient name matches Jay's business name, but the receipt does not prove delivery.

Question: Who should prevail right now, and what evidence is still needed?
`
  },
  {
    id: "crypto-influencer-payment-proof",
    title: "Web3 influencer payment proof with missing chain clarity",
    expected: [
      "asks for chain if not specified",
      "separates on-chain payment proof from service delivery",
      "does not overrule based only on a transaction hash"
    ],
    context: `
Plaintiff: Nova Labs.
Defendant: Kade, influencer.
Claim: Nova Labs says it paid Kade 2 ETH-equivalent to post two promotional threads, but Kade never posted.

Evidence supplied:
- Plaintiff pasted a block explorer link: https://etherscan.io/tx/0xabc123_fake_test_hash
- Plaintiff claims the payment was "on Ethereum or maybe Base, not sure."
- Screenshot from Telegram DM:
  Nova: "We will send the campaign payment after you confirm wallet."
  Kade: "Use 0x1111111111111111111111111111111111111111."
  Nova: "Sent. Please post by Friday."
  Kade: "Received, will post tomorrow."
- No actual tweet/thread links were submitted.
- No confirmed chain-specific explorer result was included in the evidence packet.

Question: Can the AI verify payment and decide the dispute?
`
  },
  {
    id: "team-dumping-token-claim",
    title: "Token holder accuses project team of dumping",
    expected: [
      "requires token contract and chain",
      "requires team wallet attribution",
      "distinguishes suspicion from proven dump"
    ],
    context: `
Plaintiff: Community member.
Defendant: Project team.
Claim: "The team dumped on holders and rugged us."

Chat screenshot OCR:
- User A: "Team wallet sold everything."
- User B: "Show the wallet."
- User A: "It's obvious from the chart."
- Admin: "Treasury wallet has not sold. Liquidity is still locked."

Link evidence:
- DEX chart link was submitted, but no token contract address was provided.
- No chain was specified. Could be Ethereum, BSC, or Base.
- No team wallet address or vesting wallet was provided.

Question: Should the AI call this a rug pull, FUD, or insufficient evidence?
`
  },
  {
    id: "ai-clarification-needed-witness",
    title: "Dispute where the AI should ask witness for clarification",
    expected: [
      "does not force a verdict",
      "asks targeted clarification questions",
      "names which party/witness should answer"
    ],
    context: `
Plaintiff: Aaron.
Defendant: Bella.
Witness: Chris.

Claim:
Aaron says Bella borrowed his camera for an event and returned it damaged.
Bella says the camera already had a cracked lens before she received it.
Chris was present during handoff.

Evidence:
- Chat screenshot:
  Aaron: "Please be careful with the camera."
  Bella: "It looks fine. I'll return it Sunday."
  Aaron: "The lens is cracked now."
  Bella: "It had a tiny crack before. Don't put that on me."
- Photo analysis summary:
  The photo shows a visible crack across the lens glass, but image metadata does not show when the damage happened.
- Audio transcript:
  Chris says: "I remember Aaron showing the camera, but I don't remember checking the lens closely."

Question: Decide the dispute, or ask clarification if needed.
`
  }
];

const auditScenarios = [
  {
    id: "moderator-audit-hostile-admin",
    title: "Moderator audit for staff behavior in Telegram group",
    expected: [
      "identifies hostile/reckless staff behavior",
      "scores helpful staff separately from hostile staff",
      "gives practical team recommendations"
    ],
    input: {
      platformType: "telegram",
      agentRole: "Community moderator / group admin",
      agents: [
        {
          externalUserId: "rex",
          displayName: "Moderator Rex",
          role: "moderator"
        },
        {
          externalUserId: "ada",
          displayName: "Moderator Ada",
          role: "moderator"
        }
      ],
      messages: [
        {
          senderId: "customer-1",
          timestamp: "2026-05-21T08:00:00.000Z",
          text: "My escrow has been stuck for 3 days."
        },
        {
          senderId: "rex",
          timestamp: "2026-05-21T08:01:00.000Z",
          text: "Read the pinned message, stop spamming."
        },
        {
          senderId: "customer-1",
          timestamp: "2026-05-21T08:02:00.000Z",
          text: "I did. It doesn't answer my case."
        },
        {
          senderId: "rex",
          timestamp: "2026-05-21T08:03:00.000Z",
          text: "Then wait like everyone else."
        },
        {
          senderId: "ada",
          timestamp: "2026-05-21T08:04:00.000Z",
          text: "Send your escrow ID privately. I'll check the queue."
        },
        {
          senderId: "customer-1",
          timestamp: "2026-05-21T08:05:00.000Z",
          text: "Thanks Ada."
        },
        {
          senderId: "rex",
          timestamp: "2026-05-21T08:06:00.000Z",
          text: "People like you are why support is slow."
        }
      ]
    }
  }
];

const scoreDisputeScenario = (result) => {
  const text = JSON.stringify(result).toLowerCase();
  const clarificationQuestions = result.clarificationQuestions || [];

  return {
    asksForMissingEvidence:
      /required|missing|need|provide|verify|chain|contract|wallet|tracking|receipt|clarification/.test(text),
    hasTargetedClarification:
      clarificationQuestions.length > 0 &&
      clarificationQuestions.every((q) => q.target && q.question),
    avoidsOverconfidence:
      result.verdict === "insufficient_evidence" ||
      result.verdict === "mediation_required" ||
      (result.evidenceAssessment?.quality === "strong" && Number(result.confidence || 0) <= 0.8) ||
      Number(result.confidence || 0) <= 0.75,
    hasPracticalRecommendation:
      Boolean(result.recommendation && result.recommendation.length > 20),
    evidenceQuality:
      result.evidenceAssessment?.quality || "unknown"
  };
};

const scoreAuditScenario = (result) => {
  const agents = result.agents || [];
  const rex = agents.find((agent) => agent.externalUserId === "rex");
  const ada = agents.find((agent) => agent.externalUserId === "ada");
  const text = JSON.stringify(result).toLowerCase();

  return {
    separatesAgents:
      Boolean(rex && ada),
    flagsHostileModerator:
      /hostile|rude|dismissive|unprofessional|escalat|reckless|improvement/.test(text),
    recognizesHelpfulModerator:
      /helpful|privately|check|queue|strength|de-escalat|deescalat/.test(text),
    givesTeamRecommendations:
      Array.isArray(result.teamRecommendations) &&
      result.teamRecommendations.length > 0,
    rexScore:
      rex?.score ?? null,
    adaScore:
      ada?.score ?? null
  };
};

const runDisputeScenario = async (scenario) => {
  const startedAt = Date.now();
  const result = await analyzeDispute({
    context: scenario.context,
    platform: "simulation"
  });
  const durationMs = Date.now() - startedAt;
  const score = scoreDisputeScenario(result);

  return {
    kind: "dispute",
    id: scenario.id,
    title: scenario.title,
    durationMs,
    expected: scenario.expected,
    result,
    score
  };
};

const runAuditScenario = async (scenario) => {
  const startedAt = Date.now();
  const result = await runInteractionAudit(scenario.input);
  const durationMs = Date.now() - startedAt;
  const score = scoreAuditScenario(result);

  return {
    kind: "audit",
    id: scenario.id,
    title: scenario.title,
    durationMs,
    expected: scenario.expected,
    result,
    score
  };
};

const printBrief = (scenarioResult) => {
  if (scenarioResult.kind === "audit") {
    console.log(
      JSON.stringify(
        {
          id: scenarioResult.id,
          kind: scenarioResult.kind,
          durationMs: scenarioResult.durationMs,
          overallScore: scenarioResult.result.overallScore,
          teamSummary: scenarioResult.result.teamSummary,
          teamRecommendations: scenarioResult.result.teamRecommendations,
          riskAlerts: scenarioResult.result.riskAlerts,
          score: scenarioResult.score
        },
        null,
        2
      )
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        id: scenarioResult.id,
        kind: scenarioResult.kind,
        durationMs: scenarioResult.durationMs,
        verdict: scenarioResult.result.verdict,
        disputeType: scenarioResult.result.disputeType,
        confidence: scenarioResult.result.confidence,
        evidenceQuality: scenarioResult.result.evidenceAssessment?.quality,
        summary: scenarioResult.result.summary,
        recommendation: scenarioResult.result.recommendation,
        requiredEvidence: scenarioResult.result.requiredEvidence,
        clarificationQuestions: scenarioResult.result.clarificationQuestions,
        score: scenarioResult.score
      },
      null,
      2
    )
  );
};

const run = async () => {
  const results = [];
  const allScenarios = [
    ...disputeScenarios.map((scenario) => ({ scenario, run: runDisputeScenario })),
    ...auditScenarios.map((scenario) => ({ scenario, run: runAuditScenario }))
  ];

  for (const item of allScenarios) {
    console.log(`\n=== ${item.scenario.title} ===`);
    const scenarioResult = await item.run(item.scenario);
    results.push(scenarioResult);
    printBrief(scenarioResult);
  }

  console.log("\n=== FULL_RESULTS_JSON ===");
  console.log(JSON.stringify(results, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});