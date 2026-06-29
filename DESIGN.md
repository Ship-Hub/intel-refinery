# Intel Refinery Design Context

## Design Register

Product UI. The app should feel like a focused analyst console: dense enough for real work, readable under pressure, and restrained enough that evidence remains the main object.

## Scene

A researcher is working through messy source material on a laptop or large monitor, often late in the day, comparing evidence, checking source lineage, and deciding what is safe to believe. Dark UI is appropriate because the refinement workspace is immersive and graph-heavy, but contrast must stay high enough for long reading sessions.

## Visual System

- Base surface: near-black tinted neutral, currently `bg #0A0D12`, `rail #0C0F16`, `surface #121720`, `elevated #181F2A`.
- Text ramp: `ink-text #F2F4F7`, `ink-2 #D4D8E0`, `ink-3 #B4BDCB`, `ink-4 #8792A3`, `ink-5 #677386`.
- Primary accent: cyan, currently `#57D8FF` and `#78DEFF`.
- Supporting states: green for successful/evidence-positive states, red for errors, gold/amber for caution or unresolved questions.
- Borders: subtle, usually `rgba(255,255,255,0.055)`. Use full borders or background tint for emphasis, not side-stripe accents.

Future palette work should move tokens toward OKLCH while preserving the current physical feeling: cool, precise, low-glare, and evidence-led.

## Typography

- Product UI uses system-friendly sans fonts through Geist and DM Sans.
- Body copy should remain compact and legible, usually 12 to 15px in dense panels.
- Hero-scale type belongs only on landing or major creation screens. Dashboards, explorers, panels, and sidebars need tighter hierarchy.
- Avoid negative letter spacing in compact UI. Use uppercase micro-labels sparingly for section labels.

## Layout Principles

- App shell navigation must remain available during refinement and completion states, or provide an obvious route back to the project/home surface.
- Source collection should support a persistent draft with files, URLs, and text together.
- Explorers should use filter bars, dense lists/tables, and detail panels with source lineage.
- Cards are acceptable for repeated artifacts, modals, and framed tools. Do not nest cards or make every section a floating card.
- Keep fixed-format elements stable: graph canvas, side panels, toolbars, counters, source rows, and action buttons should not jump when content changes.

## Refinement Workspace

- The live log must show real run data: source names, discovered people/accounts/projects, claims, findings, relationships, conflicts, gaps, and actions.
- Knowledge graph bucket nodes should expose the latest useful items under each bucket, such as saved sources, observations, entities, connections, and gaps.
- The right panel should summarize active focus, evidence counts, latest useful discoveries, and trust warnings.
- Internal provider or infrastructure messages should be translated into user-facing language.
- Timestamps, disabled labels, and secondary details must stay readable on the dark background.

## Components

- Buttons: 8px radius or less unless matching existing app rhythm. Icon buttons should use lucide icons when available.
- Inputs: dark filled surface, visible focus border, readable placeholder text.
- Filters: compact segmented controls, selects, and search fields. Avoid marketing-style pills unless they act as filters or statuses.
- Error states: explain what failed, whether data was saved, and what the user can do next.
- Empty states: state what is missing and offer the next useful action, without tutorial copy that restates the page.

## Motion

- Use motion to communicate live processing and transitions, not decoration.
- Avoid animating layout properties.
- Refinement animation should feel alive but should never obscure evidence or make text hard to read.

## Quality Bar

- No hardcoded logged-in users or stale placeholder data in production surfaces.
- No old branding or duplicate logos.
- No generic "AI thinking" output when real run data exists.
- No low-contrast text in logs, panels, filters, or timestamps.
- No final refinement state without a clear way to inspect the model.

