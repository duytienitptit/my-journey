# Forest Today — implementation, 2026-10-02

## Approved direction

- [Today, day](today-day.webp), [Check-in, day](checkin-day.webp), [Today, night](today-night.webp).
- Continuous cream/sage landscape with no large white cards; soft floating tree labels.
- Today and check-in are horizontal panels in the same route. The actual journal questions, separate free-writing field,
  session thresholds and stat mapping come from existing application data, not the mockup.
- Three labels remain Mind by default. They use the Mind accent; no XP has been remapped.

## Implementation

`HomeDashboard` displays completed-session totals and configurable daily goals.
`TodayPager` keeps both panels mounted, using native horizontal snap scrolling for
trackpad/touch and pointer dragging for mouse. Arrow keys leave editable controls alone.
Inactive panels are inert. The timer hook stays owned by `DailyScreen` across navigation.

`GroveCanvas` lazy-loads Three.js. `garden-model.ts` creates deterministic, instanced
leaf geometry, three independent trees, a shared rounded island and streak flowers.
Only visual state changes rebuild the garden. Rendering is on demand, DPR is capped
at 1.75, and geometry/materials/renderer resources are disposed on unmount.
`ForestGrove` remains the SVG fallback for unavailable/lost WebGL contexts.

Level thresholds and XP calculations are unchanged. The scene scales at each level,
uses the established seven growth stages, and caps visual size at level 30. UI level
and XP labels continue beyond that cap. Neglect changes the affected tree; streak
warning changes the grove. New accounts correctly show seeds rather than mature trees.

Night mode follows the existing Vietnam-time schedule. The dev-only growth widget
adds Day light/Night light preview and collapses without clearing its selected levels.
Stop previewing restores actual data and automatic time-based theme. No preview writes DB.

## Image generation provenance

Tool: built-in `image_gen.imagegen`, October 2, 2026. Generation briefs:

**Day landscape:** Edit the approved day mockup into a clean backdrop. Remove all text,
interface, labels, foreground island and the three progression trees. Retain distant
sunlit mountains, woodland and lake on the right. The left 42% should dissolve into
warm ivory haze (#f8f4e8). Keep the lower 35% a quiet empty warm clearing for the live
3D island. Seamless landscape, soft natural lighting, no lettering or interface.

**Night landscape:** Match the day composition with a moonlit forest and distant
mountains. Left side fades into deep navy/forest haze (#102024); sparse stars, a calm
lake and an empty dark foreground for the live 3D island. No foreground progression
trees, island, text, controls or labels.

Generated source IDs: day `exec-ce2e50b9-f94f-42c4-8fd3-8c3de90e9d9d.png`,
night `exec-c29bb7f0-64a7-4d24-b85f-d2ca7dad2818.png`.
Converted with Sharp to WebP quality 85, shipped as `public/forest/day.webp` (~85 KB)
and `night.webp` (~81 KB). These assets contain scenery only; all interactive text,
progress bars and tree growth are rendered in code.

## Verification

- Production webpack build and TypeScript pass.
- 360 unit/component tests pass; 6 database integration tests pass with an isolated local
  `TEST_DATABASE_URL` (and are skipped by the normal test command).
- ESLint: zero errors; existing `core/engine/levels.ts` magic-number warning remains.
- Added interaction tests: mouse drag, native scroll synchronization, keyboard handling,
  preserved draft/editor identity, completed-only session counts, label selection,
  server-deadline timer display and abandonment.
- Browser inspection: 1280×720 desktop and 390×844 mobile; day/night, both horizontal
  directions, independently scrolling mobile content, seed and grown-tree previews.
- No journal/session/habit data was written during browser QA. Timer writes are mocked
  in component tests. Native touch-device gestures and physical low-end GPU performance
  have not been measured.

Screenshots of the running application: [Today](implemented-day.png),
[Check-in](implemented-checkin.png), [Night](implemented-night.png).
Today/night screenshots use the dev-only level-21 preview, not actual account XP.

## Sunday and journal correction — 2026-10-04

The daily journal now has five independent visible fields: three fixed questions,
one rotating daily prompt, and a clearly labelled free-writing area. The prompt
answer and free text round-trip through the existing single `day_logs.journal_text`
column; older unlabelled text opens in the free area. The 200-word requirement
counts only text the user entered, on both client and server.

On Sunday, Today invites the user to wrap up the week. The same Check-in panel
contains a weekly recap and the existing four-question-plus-free weekly editor.
Its save goes to the same `week_reviews` record as `/week`. The bedtime helper
sentence has been removed; the Vietnam-time cutoff remains enforced.

## Journal save responsiveness — 2026-10-04

Saving an edit to an existing daily journal now updates its confirmed text and word count
in place. It no longer reloads the entire check-in, XP totals, and weekly recap after
every autosave. Those derived views refresh when the journal actually changes between
empty and nonempty. The weekly editor on `/week` likewise keeps the confirmed text
locally instead of refetching the whole report after each autosave.
