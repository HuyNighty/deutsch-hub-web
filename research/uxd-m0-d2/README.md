# DeutschHub — isolated surface and interaction research

Research only. Synthetic content, experimental design, no live API or production
application behavior. D2 remains OPEN. Neither model is approved or selected.

## Reproduce from the frontend repository root (PowerShell)

Use the existing locked installation; do not install new packages. Node 22.19.0,
Vite 8.1.3, React 19.2.7 and Vitest 5.0.3 were available at implementation.
Set the Windows shell only in this process if needed:

```powershell
$cmdPath = Join-Path $env:SystemRoot 'System32\cmd.exe'
if (-not (Test-Path $cmdPath)) { throw 'Windows cmd.exe not found' }
$env:ComSpec = $cmdPath

node .\node_modules\vite\bin\vite.js --config research/uxd-m0-d2/vite.config.mjs
# Open http://127.0.0.1:5179

node .\node_modules\vitest\vitest.mjs run --config research/uxd-m0-d2/vite.config.mjs --reporter=verbose
node .\node_modules\vite\bin\vite.js build --config research/uxd-m0-d2/vite.config.mjs
node .\node_modules\vite\bin\vite.js preview --config research/uxd-m0-d2/vite.config.mjs
# Compiled site: http://127.0.0.1:5180

node .\node_modules\oxlint\bin\oxlint research/uxd-m0-d2
git diff --check
```

No root npm script changes. The independent configuration sets root, disables
environment-file loading and public assets, contains Vite cache/build/coverage
output in ignored `.artifacts/`, and uses its own DOM cleanup. Production test
discovery does not match `*.research-check.*`. No production entrypoint, Sass,
router, provider, query, API client or feature component is imported.

## Eight specimens

| Context | Canvas | A reading fill | B reading fill |
| --- | --- | --- | --- |
| Public Home | #F5EFE3 | #FAFAF7 | #EAE6D5 |
| Explore Germany | #E9ECE8 | #FAFAF7 | #DCE4D7 |
| My Learning | #F5EFE3 | #FAFAF7 | #EAE6D5 |
| Assessment | #FAFAF7 | #FAFAF7 | #FFFFFF |

A: Shared Reading Surface + Contextual Canvas. B: Adaptive Surface Family.
Only reading fill varies within each pair. Foregrounds #20331B / #354C2B,
content, fixture, font stack, dimensions, spacing, borders and controls stay
constant. There are no images, external fonts, gradients, shadows or animations.
Assessment is a near-convergence control, excluded from choosing a winner.

## Synthetic contracts and static behavior

Frontend baseline: 58f3e5528eef51412710e7fb518cf9f43b79c922.
Backend contract baseline: 4b9e623b30ae1f0554bc1aafc3e4ed342db91762.

- Public invitation and article copy are research samples. The supported public
  discovery concept is `/explore-germany`; the article has a synthetic slug and
  contract-shaped summary fields, with no actual publication or cover media.
- The course label “Tiếng Đức A1” is fixture copy. Its IN_PROGRESS snapshot has
  3/8 completed lessons and saved percentage 37.5. Direction CONTINUE_COURSE and
  Next Activity OPEN_LESSON use the same course. Separate fixture metadata
  establishes that the next lesson is eligible, incomplete and not among the
  three completed IDs; it is not an extra backend target property.
- OpenLessonTarget contains only courseId and lessonId. No lesson title,
  estimated duration, resume cursor or recommendation explanation is invented.
- Assessment mirrors AssessmentTaskQuizResumeResponse: IN_PROGRESS,
  MULTIPLE_CHOICE, selectedAnswerIds contains A, B unselected. No correctness,
  Task submission, parent completion or passed result is inferred.
- All specimen actions and checkboxes are disabled because P3-A is static;
  this does not represent backend eligibility or a terminal runtime status.
  Only context/model research controls interact. Nothing navigates or saves.
  No artificial focus outline is applied to B. Actual focus/selection transition
  acceptance belongs to the independent P3-B entrypoint described below.

## Verification procedure and boundaries

Research checks validate exact surface assignments, immutable fixtures, progress,
target/eligibility coherence, native saved-selection semantics, absence of
correctness/unsupported capabilities, runtime import isolation and A/B DOM
equivalence after removing only the reading-fill property. DOM checks alone do
not establish rendered equivalence or WCAG compliance.

For rendered checks, use the compiled site. Record browser/OS, CSS viewport,
device pixel ratio, font and actual zoom. Change model in the same context at
the same viewport. Inspect computed canvas/panel backgrounds, every descendant's
rectangles, typography, wrapping, borders, CTA appearance and scroll position.
The research notice and controls are outside `[data-testid="specimen"]`.
Capture sequential specimens rather than compressing them side by side.
No diagnostic CSS may be injected to make results pass.

Check desktop and 375px/320px widths, Vietnamese/German wrapping, one named main
content panel, checkbox labels/checked marks, focusable research controls and
reduced motion. Hex contrast calculations cover opaque fills only, not complete
accessibility. Capture full failures; do not relabel subtle or imperceptible
surface differences as a preference. No participant pilot or telemetry exists.

P3-B follow-ups: native keyboard traversal/Space transitions, screen-reader
behavior, comprehensive native zoom/reflow/focus-obstruction acceptance and
scripted pending/error/uncertain outcomes. Returning flows are also excluded.

Generated validation logs and browser evidence belong in ignored
`.artifacts/verification/`. They must never enter a delivery commit.

## P3-A executed verification

- Focused research checks: 23 PASS / 0 FAIL / 0 SKIP, 2 files. An initial
  filesystem-guard URL resolution failure was corrected inside the research
  check; the initial 22 PASS / 1 FAIL log is retained.
- Research build: PASS, 23 modules. Research-only Oxlint: PASS, no warnings.
  Documented development and compiled-preview entrypoints both rendered.
- Compiled in-app browser: 12 A/B pair comparisons (24 rendered instances),
  at 1440x1000, 375x1000 and 320x1000 CSS viewports. Content, element bounds,
  typography/wrapping extents, borders, CTA styling and scroll positions matched;
  only reading fill differed. Exact computed canvas/fill values matched the
  manifest. No horizontal overflow or console errors were observed.
- Native saved selection: A checked, B unchecked; both static and disabled.
  Research controls were enabled with native focusable semantics. Computed
  specimen animations were none and transitions 0s; the reduced-motion CSS
  override is present. OS reduced-motion emulation was not performed.
- Observed opaque reading text colors/fills have minimum calculated contrast
  7.26:1. This is not a WCAG compliance claim or a control/focus audit.
- All 464 preexisting tracked-file hashes matched before/after implementation.
  Root manifests/configuration and production test discovery remain unchanged.
  Build, cache and evidence artifacts are contained and gitignored.

The initial exact-label browser selector was unavailable; an observed combobox
role locator completed the same checks. Narrow full-page screenshot capture was
unavailable, so a viewport screenshot and complete geometry data were retained.
Browser-version/media-preference inspection was unavailable in the browser's
read-only scope. These tooling limitations do not establish extra acceptance.

No full production Vitest suite, production build, participant pilot, native
zoom, screen-reader session or P3-B interaction/Returning acceptance was run.
These are the original P3-A results; later P3-B verification is recorded below.

## P3-B independent interaction entrypoint

Approved starting commit: `ea980059447384f5063d3c63b9765851bf9fd3b4`.
Branch: `research/uxd-m0-d2-p3b-interaction-quality`.
Open `/interaction.html` on the research development or compiled-preview server.
`index.html` remains the static P3-A entrypoint, with disabled specimen actions.
Neither entrypoint imports production application components.

Assessment starts with saved A and draft A, with B unchecked. Tab/Shift+Tab move
real browser focus independently. Space changes the local draft. Facilitator
controls outside the specimen start a synthetic operation with a frozen payload.
Pending blocks edits and duplicate operations. Confirmation applies the saved
payload; definite failure preserves saved evidence; uncertainty remains unknown
and prevents automatic retry. Reset restores A and advances the research epoch.
The facilitator can explicitly replay the last invalidated ticket to demonstrate
stale rejection; it is diagnostic memory, not an active operation or tracking.
Scripted Task submission changes only its QuizAttempt to SUBMITTED. The parent
AssessmentAttempt remains IN_PROGRESS and no official Result is inferred.

Returning destinations stay in memory and never load production routes:

- R1 reuses the immutable 3/8, 37.5% course fixture. Course and next-lesson
  destinations are distinct; the eligible incomplete lesson has the same course.
- R2 has one eligible active child. Its Task destination preserves all three
  assessmentAttemptId/taskId/quizAttemptId fields. Assessment direction uses the
  parent identity separately. No prioritization algorithm is introduced.
- R3 has no active learning, DISCOVER_COURSE/null and NONE/null. Guidance is
  neutral discovery, with a null-target catalog destination.

Changing model, mode or scenario resets local state. Returning Study keeps the
My Learning surface context fixed across R1–R3. Compare equivalent A/B blocks
separately from Returning scenarios; only the approved reading fill varies.
There are no API operations, authentication, persistence, automatic timers,
analytics, grading, participant retention or model selection.

## P3-B quality tooling and reproduction

Only `@playwright/test@1.64.0` and `@axe-core/playwright@4.13.0` were added as exact
devDependencies. Playwright requires Node >=20; Node 22.19.0 and npm 11.5.2 were
used. Existing locked versions/integrities and root scripts are unchanged. The
five new lock entries are those two tools, playwright, playwright-core and
axe-core. Chromium 156.0.8078.4 (Playwright revision 1248) was installed locally.

Use the committed lockfile installation. Keep browser downloads and reports in
ignored artifacts; do not redirect them into production or commit them:

```powershell
$env:ComSpec = Join-Path $env:SystemRoot 'System32\cmd.exe'
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location).Path 'research/uxd-m0-d2/.artifacts/playwright-browsers'
node .\node_modules\playwright\cli.js install chromium # only if absent
node .\node_modules\vitest\vitest.mjs run --config research/uxd-m0-d2/vite.config.mjs --reporter=verbose
node .\node_modules\vite\bin\vite.js build --config research/uxd-m0-d2/vite.config.mjs
```

Browser regression requires an immutable P3-A extraction in artifacts, built
with the same installed tools. Prepare it without switching the working tree:

```powershell
@'
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const prefix = 'research/uxd-m0-d2/';
const ref = 'ea980059447384f5063d3c63b9765851bf9fd3b4';
const dest = path.resolve(prefix, '.artifacts/p3b/static-baseline');
const files = cp.execFileSync('git', ['ls-tree','-r','--name-only',ref,'--',prefix], {encoding:'utf8'}).trim().split('\n');
for (const file of files) {
  const target = path.join(dest, file.slice(prefix.length));
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, cp.execFileSync('git', ['show', `${ref}:${file}`]));
}
'@ | node
node .\node_modules\vite\bin\vite.js build --config research/uxd-m0-d2/.artifacts/p3b/static-baseline/vite.config.mjs
node .\node_modules\playwright\cli.js test --config research/uxd-m0-d2/playwright.config.mjs
node .\node_modules\oxlint\bin\oxlint research/uxd-m0-d2 --format json
git diff --check
```

The Playwright configuration starts compiled previews at loopback ports 5180
(combined research build) and 5181 (immutable P3-A). It uses explicit
`*.e2e-check.js` discovery, zero retries, and at most two workers. Vitest's
research pattern excludes browser files; production discovery matches neither
research checks nor browser checks. Builds, caches, browser profiles, downloads,
HTML/JSON reports, screenshots and traces remain under `.artifacts/`.

## P3-B executed evidence

- Research Vitest: 43 PASS / 0 FAIL / 0 SKIP across five files: original P3-A 23
  and new P3-B 20. Research build: PASS, 32 modules and both HTML entrypoints.
- Chromium: 57 distinct checks PASS / 0 FAIL / 0 SKIP. First run: 53 PASS;
  subsequent native-enlargement/preference selection: five PASS, including one
  already-passing reduced-motion check and four new checks. No automatic retries.
  Four native checks were rerun after a lint-only fixture-binding cleanup.
- The 12 static regression checks compare both models against an immutable
  P3-A build at 1440x1000, 375x1000 and 320x1000: 24 paired rendered instances.
  Content, bounds, typography, wrapping, borders, fills, native checked/disabled
  controls and overflow matched. There were no page errors or production requests.
- Both models passed Tab/Shift+Tab/Space, pending/error/confirmed/uncertain,
  duplicate prevention, reset/stale rejection, parent/Result separation and
  R1–R3 destination identity. Initial A/B specimen geometry and semantic styling
  matched. Both models passed 320 CSS-pixel reflow and visible keyboard focus.
- Axe: 24 full-page audits, zero violations for the selected WCAG A/AA tags,
  covering both models, six Assessment states, and R1–R3 before/after navigation.
  This does not establish complete WCAG compliance or screen-reader acceptance.
- Native 200% zoom: PASS in both models, with isolated Chromium preferences.
  The same 1280x900 outer window changed content width 1262→631 CSS pixels and
  devicePixelRatio 1→2; visualViewport.scale remained 1. No CSS transform,
  page-scale/pinch or device-scale override substituted for browser zoom.
- Native text enlargement: PASS in both models, default font 16→32px, computed
  root/harness font 16→32px, unchanged CSS viewport width and devicePixelRatio.
  Assessment and R1–R3 reflow/focused-control activation passed under both native
  enlargement conditions. Profiles are disposable artifacts, not user settings.
- Reduced-motion preference emulation: PASS; media query matched and computed
  animation names were none, transition durations zero. Assistive technology:
  NOT RUN; no screen-reader session or participant pilot was conducted.
- Research Oxlint: PASS, 28 files, zero warnings/errors. Configured repository
  Oxlint: PASS, 389 files, the same five warnings in unchanged production files.
- Relevant unchanged production Assessment Vitest: 834 PASS / 0 FAIL / 0 SKIP,
  34 files, four fork workers, 51.20s. The complete production suite was not run.
  Production build: PASS, 439 modules; existing large-chunk warning and an
  informational CSS-plugin timing notice were recorded.

Production verification used installed Vite/Vitest APIs to contain output/cache
paths in `.artifacts/p3b/`. The existing root configuration was loaded using the
runner loader with process-local `globalThis.__dirname = process.cwd()` (the
repository dirname normally supplied by the bundle loader). Initial attempts
without that binding failed before testing/building; both initial logs remain.
No production configuration, dependency or assertion was edited for this.

Native profile keys follow Chromium's [zoom preferences](https://chromium.googlesource.com/chromium/src/+/lkgr/chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc)
and [font preference definitions](https://chromium.googlesource.com/chromium/src/+/8115afe5c79963325c7ef8eebb733ecc3b4dd0fc/chrome/common/pref_names.h).
The browser evidence verifies their actual effect on this Chromium runtime.

All 15 preserved P3-A files and all 477 original tracked files outside the four
approved modifications remain byte-identical. Dependency and whitespace audits
are required before delivery. Local detailed evidence is in `.artifacts/p3b/`.

## Exact P3-B changed-file manifest

Modified: `package.json`, `package-lock.json`, `research/uxd-m0-d2/README.md`,
`research/uxd-m0-d2/vite.config.mjs`.

Added, relative to `research/uxd-m0-d2/`:

```text
interaction.html
playwright.config.mjs
src/interaction-main.jsx
src/InteractionHarness.jsx
src/InteractionSpecimen.jsx
src/interaction-fixtures.js
src/interaction-state.js
src/interaction.module.css
src/probes/AssessmentProbe.jsx
src/probes/ReturningProbe.jsx
src/interaction-fixtures.research-check.js
src/interaction-state.research-check.js
src/InteractionHarness.research-check.jsx
browser/assessment.e2e-check.js
browser/returning.e2e-check.js
browser/static-regression.e2e-check.js
browser/accessibility.e2e-check.js
```

D2 remains OPEN. This research does not select a model, authorize production
redesign, begin P3-C or authorize user pilot sessions.

## V1.7-C2 single-machine participant presentation

The additional `participant.html` entrypoint uses private setup, ready, task
and pause stages. Setup controls are unmounted before handoff. No model
labels, scenario codes or predetermined outcomes appear during a participant
task. This is presentation isolation, not Windows security isolation: Alt+Tab,
browser controls and screen-reader application switching remain available.
The facilitator must not operate the computer during a task.

Procedure: configure privately; choose **Chuẩn bị bàn giao**; hand over keyboard
and mouse; participant chooses **Bắt đầu tình huống**. The participant can use
**Tạm dừng và bàn giao** at any time. Only after handoff may the moderator choose
**Bàn giao cho người điều phối** and configure the next task. Resetting a task
unmounts its state and cancels scheduled work. Model selection is retained in
private setup; keep it fixed across a Returning block. Changing it starts a new
block. Order counterbalancing remains part of the approved moderator protocol,
not an automatically inferred winner or order-selection algorithm.

- S1 imports the original static specimens and surface manifest unchanged.
  The existing disabled static controls remain disabled. The new notice supplies
  their explanatory note reference. Inherited static limitations remain: the
  question paragraph is not associated with its fieldset, and letter-only saved
  summaries require interpretation. No static screen-reader acceptance is claimed.
- S2 imports the unchanged Assessment reducer. Draft changes do not silently
  save. A research-only cue starts exactly one predetermined synthetic operation.
  It is explicitly not a production Save button. The immutable payload/ticket,
  duplicate/stale rejection, saved/draft, unresolved locking, Task/parent and
  absent official Result semantics remain those of P3-B.
- Preloaded Assessment states are read-only comprehension cases, constructed
  through the same reducer. They schedule no operation and cannot establish
  live-transition or screen-reader announcement acceptance.
- Live cases require the moderator to enter a pending interval in milliseconds
  (100–60000); there is deliberately no default or accepted final duration.
  This range is only a configuration bound. Calibrate the interval through
  manual accessibility validation and use identical values in comparable cases.
  Automation's short intervals are test inputs, not a pilot recommendation.
  Error and uncertain cases do not retry; pause/unmount cancels settlement.
- S3 uses unchanged canonical R1/R2/R3 fixtures and exact destination identities.
  The simulated destination heading receives focus. Back restores focus to the
  specific triggering action and retains the surface. A placeholder destination
  does not establish resumed learning, retention or Belonging.

New participant Assessment markup associates the full German question with
the group, uses authored option text in saved/draft summaries and keeps stable
polite-status and error-alert containers. Confirmation distinguishes selection
from Task submission. No authored content or original specimen is translated.
Native checkbox state is independent of focus. Scoped styles provide real
keyboard focus for controls and deliberate destination/Back focus.

Verification commands use the existing research Vite/Vitest/Playwright
configurations. The participant research check and browser check are discovered
by the existing explicit patterns. Production discovery must continue to exclude
all research checks. Native zoom/text tests use disposable Chromium profiles;
no exploratory CSS or page-scale substitute is used.

Manual screen-reader acceptance: **NOT RUN** until a real session is recorded.
Required manual tasks: keyboard isolation; German question and checked-option
announcements; full saved versus draft selections; live pending, confirmed,
error and uncertain announcements; Task versus parent and absent Result;
Returning destination announcement and Back focus; interruption-free handoff.
Record Windows/browser/AT versions, voice/language configuration, navigation
mode, keystrokes, observed speech and focus. Browser accessibility trees and
axe do not certify speech delivery. Confirmed screenshots or loaded states
cannot replace live-announcement checks. Pilot recruitment remains blocked
pending protocol/ethics approval and manual accessibility/calibration evidence.

The C2 deliverable is limited to two existing research files (this README and
the research Vite build entry) and nine new participant entry/component/style/
scenario/check files. Original P3-A/P3-B fixtures, reducer, surface manifest,
specimens, styles and tests must retain their accepted Git content. A fresh
Windows worktree may use checkout CRLF line endings; those are not source edits.
The original checkout's file bytes must remain unchanged. No new dependencies,
storage, analytics, transport, production UI or Backend behavior is introduced.
