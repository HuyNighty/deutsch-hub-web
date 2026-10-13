# DeutschHub — P3-A static surface research

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
  acceptance belongs to P3-B, which is not implemented.

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
Those results must not be inferred from this isolated static harness.
