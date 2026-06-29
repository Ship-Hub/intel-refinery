# Intel Refinery Product Context

## Register

Product. The interface is a working research and analysis tool first. Marketing pages can be expressive, but the signed-in app should be quiet, inspectable, and built for repeated use.

## Product Purpose

Intel Refinery turns scattered material into structured understanding. Users bring in PDFs, URLs, pasted text, images, audio, CSV, JSON, and other raw sources. The product extracts facts, entities, claims, events, relationships, conflicts, evidence, gaps, and actions, then presents the result as an explorable refinery model with lineage back to source material.

The core promise is not "summarize my documents." The promise is: collect messy inputs, preserve traceability, connect the dots, expose uncertainty, and make the output easier to understand than the input pile.

## Primary Users

- Researchers investigating people, organizations, markets, disputes, incidents, or opportunities.
- Cyber/security teams refining findings, assets, vulnerabilities, conflicts, actions, and source evidence.
- Operators who need concise, defensible intelligence from mixed source types.
- Builders and analysts who want an auditable model, not a one-off chat answer.

## Product Principles

- Evidence before confidence: every meaningful claim should have source traceability or be marked as a lead, gap, or inference.
- Show the work while refinement runs: live progress should name real sources, entities, findings, and connections discovered during the run.
- Reduce chaos, do not reproduce it: outputs should become concise findings, relationships, timelines, gaps, and recommended next steps.
- Avoid false certainty: weak associations must be labelled as possible or needing verification unless source text directly supports them.
- Let users add many inputs before refinement: files, URLs, and pasted text belong in the same draft.
- The final model must have somewhere to go: completed runs should lead naturally to an overview, explorers, history, and source lineage.

## Core Workflows

1. Sign in or create an account with Telegram OTP, Google, GitHub, or GitLab.
2. Create a refinery project and choose a profile, such as General or Cyber.
3. Add multiple sources to one draft: uploaded files, URLs, and pasted text.
4. Start refinement only after the source set is saved.
5. Watch live refinement with real, source-specific progress.
6. Inspect the final model through overview, findings/assets/actions explorers, graph, and model history.
7. Re-run or refine with new sources while preserving version history.

## Tone

Clear, precise, and calm. The product should sound like an expert analyst who shows reasoning without theatrics. Avoid vague AI language such as "unlock insights" unless the interface immediately shows what changed. Prefer concrete nouns: sources, evidence, finding, asset, account, relationship, conflict, gap, action, model version.

## Anti-References

- Do not make the app feel like a generic SaaS landing page.
- Do not show decorative intelligence without useful evidence.
- Do not use canned refinement logs that repeat every run.
- Do not imply ownership or association when the evidence only supports a possible lead.
- Do not bury errors behind vague "request failed" messages.
- Do not let old project names, placeholder users, or stale branding survive in production UI.

