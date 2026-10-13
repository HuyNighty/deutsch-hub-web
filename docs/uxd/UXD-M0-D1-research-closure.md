# UXD-M0-D1 — Research Closure Record

**Project:** DeutschHub  
**Workstream:** UXD — Product Experience & Visual Identity  
**Milestone:** UXD-M0-D1 — Moodboard & Visual References  
**Status:** **CLOSED — RESEARCH COMPLETE**  
**Approval authority:** Product Owner  
**PO confirmation:** 2026-10-13 (explicit approval in the Architect discussion)  
**Implementation authorization:** **NONE**  
**Predecessor:** UXD-M0-D0 — CLOSED, PO-approved v0.9 (per UXD handoff)

## 1. Decision and scope of closure

The Product Owner approved closure of D1 **as a visual research/discovery milestone only**. D1 has sufficient creative direction, reference exploration, candidate motifs, experience hypotheses, and boundary analysis to move into structured design research and validation.

Closure does **not** approve a final visual identity, art assets, design tokens, screen designs, a production design system, any new product capability, or implementation. Creative preferences documented here are **preferred research directions**, not binding UI specifications.

**Gate:** PASS for research closure; NOT READY for production implementation.

## 2. Preserved D0 foundation (not reopened)

The approved D0 foundation, as reported in the UXD discovery handoff, remains authoritative:

- **Core emotion:** Belonging.
- **Experience philosophy:** Personal Home, Connected World.
- **Experience model:** Dual Home Experience.
- **Personal experience philosophy:** Person-first.
- **Delivery strategy:** Progressive Personal Home.

The five Product Visual Principles remain:

1. A Place to Return.
2. Recognizable Everywhere.
3. Progress Without Pressure.
4. Curiosity Beyond Lessons.
5. Calm When Needed, Expressive When Appropriate.

**Scope guard:** Public Home remains a world/discovery entry point for guests and members. The existing **My Learning** page remains the MVP Learning Dashboard. A generalized Personal Home is a future possibility, **not** an automatically approved feature.

No D0 decision is revised by this closure record. The complete D0 canonical decision document was not located in the checked GitHub trees; this section faithfully records the PO-approved baseline reported in the D1 handoff, not a newly audited D0 document.

## 3. D1 research outcomes — preferred, not final

### 3.1 Creative direction

**Living Storybook / Living Atlas** is the preferred exploratory direction, grounded in the metaphor of **The Living Tree — a tree that grows over time**. The tree expresses belonging, continuity, meaningful growth, branching possibilities, and connections; it must not become repetitive literal decoration across every screen.

The research compared three complementary expressions:

- **A — Realistic Tree:** real-world grounding, authenticity, and humanity.
- **B — Storybook Tree:** **primary preferred artistic direction**, narrative depth, imagination, and worldbuilding.
- **C — Abstract Symbolic Tree:** structural patterns, reusable motifs, and interaction grammar.

Within B, the research favored selective synthesis rather than choosing one exclusive style:

- **B1 — Illustrated Atlas:** organized knowledge and connected exploration.
- **B2 — Cinematic Storyworld:** spatial depth, atmosphere, and wonder.
- **B3 — Tactile Storybook:** materiality, memory, and intimacy.

This synthesis is a working art-direction hypothesis, **not** an approved visual style or asset specification.

### 3.2 Signature motifs

The Product Owner selected three motifs as the D1 research shortlist:

- **Branching Paths:** paths, choices, and connections.
- **Growth Rings:** time, continuity, and meaningful personal history.
- **Atlas Marks:** meaningful destinations, topics, stories, and traces.

Journal artifacts, layered paper, and story portals remain optional candidates. No production iconography or component system was approved.

### 3.3 World-first experience hypothesis

**World First, Stories Within** describes the favored discovery progression:

1. Encounter a coherent world.
2. Find meaningful regions or entry points.
3. Enter individual stories.
4. Discover connections across stories.
5. Optionally recognize personal traces where supported by **real existing data**.

Research distinguishes:

- **World Marks:** editorial topics, locations, subjects, or stories that exist in product content.
- **Personal Marks:** actual individual saved/learning states **only when the application supports them**.
- **Shared Marks:** hypothetical future, voluntary community contributions.

This metaphor does **not** authorize bookmarking, knowledge graphs, recommendations, social/community capabilities, or new persistence/API behavior.

### 3.4 Emotional direction

The intentional emotional blend is:

- **Wonder** invites people into the world.
- **Warmth** fosters comfort and belonging.
- **Adventure** opens paths to discovery.

Working formulation: **“Wonder invites. Warmth holds. Adventure unfolds.”**

### 3.5 Cinematic direction

The most recent preferred opening perspective is **human-scale, beneath the canopy of an ancient tree, looking outward toward open paths and a larger world**. This is preferred over an exclusively distant hilltop panorama.

Research principles include foreground/midground/background layering, natural leading lines, environmental storytelling, atmospheric depth, a warm focal area and expansive horizon, and discoverable entry points without visual overload.

Specific camera motion, lighting treatment, animation, asset production, or rendering technology remain **unapproved**.

## 4. Contextual application boundaries

| Context | D1 exploration | Non-negotiable boundary |
| --- | --- | --- |
| **Public Home** | World-first cinematic/editorial identity and legible content entry points | Must serve visitors and members; retain clear navigation and CTAs. |
| **Explore Germany** | Curated regions, topics, links among editorial stories | Actual geography, history, and culture must remain factually accurate; illustrations must not impersonate real places or events. |
| **My Learning** | Quiet continuity, meaningful next action, real progress, restrained personal/journal motifs | Preserve backend-driven learning state and guidance; no invented progress or new Personal Home feature. |
| **Assessment** | Calm, focused, readable, accessible presentation | No cinematic flourish that compromises timing, task status, input, focus, reliability, or accessibility. |

## 5. Visual candidates — not approved tokens

**Olive / forest research palette:**  
#C3CA92 · #A4B17B · #859864 · #697E50 · #4E653D · #354C2B · #20331B

Warm neutrals and contextual atmosphere palettes remain candidates.

**Typography candidates:**

- Newsreader + Be Vietnam Pro
- Fraunces + Manrope
- Source Serif 4 + Inter

There is **no approved final color palette, semantic color mapping, type pairing, iconography, spacing system, motion system, or asset library** from D1.

Future selections require Vietnamese and German text rendering checks, licensing review, accessible contrast, focus states, responsive validation, and mobile/low-power evaluation.

## 6. Interaction and technology boundary

Research considered 2.5D/parallax, Atlas Marks, branching navigation, story portals, tactile microinteractions, optional 3D/WebGL, and growth/history visuals. **None is an implementation requirement.**

Any later design/technology proposal must demonstrate:

- Progressive enhancement and functional non-3D fallback.
- Reduced-motion behavior.
- Accessible keyboard, screen-reader, and touch interaction.
- Usable mobile layouts and acceptable performance.
- Discoverable, conventional navigation and clear actions.
- Correct interpretation of real domain data.
- Asset licensing, maintainability, and scope control.

Do not add technical dependencies purely because an effect is visually attractive.

## 7. References and source boundaries

D1 considered editorial, learning-product and interaction references including Kinfolk, Aesop, visitBerlin, Busuu, Goethe-Institut, Headspace, Codrops, React Bits, Motion Primitives, Spline, React Three Fiber, and Runeterra / League of Legends Universe.

These references inform analysis of tone, worldbuilding, narrative depth, regional identity, and interaction. **Do not copy protected visuals, proprietary design systems, fictional lore, or brand identities.** ChatGPT exploratory moodboards/mockups are neither approved Figma screens nor production assets.

Checked repository foundations:

- [Frontend Design System](../frontend/version-01/08-design-system.md) — semantic tokens, WCAG 2.2 AA intent, responsive and reduced-motion requirements.
- [Frontend Planning](../frontend/version-01/README.md) — frontend contracts and change-control guidance.
- [Wireframes](../frontend/version-01/07-wireframes.md) — preexisting information hierarchy and accessibility constraints.

Earlier V1 planning is a historical scope baseline; it does not silently authorize new functionality or reverse later approved implementations. Cross-repository AI governance remains applicable; UXD decisions require explicit Product Owner authority.

## 8. Research gate evidence

**Completed for the D1 discovery scope:**

- Broad visual reference and art-direction comparison.
- Creative direction shortlist and primary preference.
- Signature metaphor and motif shortlist.
- World-first experience and emotional hypotheses.
- Cinematic perspective, composition, and lighting exploration.
- Contextual applicability and technical/product guardrails.

**Intentionally deferred, not failed D1 exit criteria:**

- Final art direction and visual identity approval.
- Production-ready palette and semantic tokens.
- Typography, layout, icon and motif grammar.
- Desktop/mobile wireframes or Figma screens.
- Functional prototypes, usability evidence, and accessibility validation.
- Asset acquisition, rendering stack, and implementation decisions.

Research completion is **not** usability, accessibility, performance, or production-readiness approval.

## 9. Next-stage proposal (not automatic authorization)

Suggested progression, subject to future PO decisions and validated milestone definitions:

1. **UXD-M0-D2 — Contextual Color System & Accessible Semantic Palettes.** Explore and test color relationships across Public Home, My Learning, and Assessment; avoid premature token replacement.
2. **UXD-M0-D3 — Typography, Layout Foundations & Motif Grammar.** Validate Vietnamese/German typography, responsive hierarchy, motif restraint, and readability.
3. **UXD-M0-D4 — Contextual Visual Concepts & Prototype Validation.** Explore Public Home, My Learning, and Assessment with explicit accessibility and usability evidence.
4. **UXD-M0-D5 — Consolidated Design Decision & Handoff Proposal.** Present validated decisions, unresolved tradeoffs, and a **separately approved** implementation contract.

The numbering and sequencing are proposals, not claims that canonical UXD milestone definitions already exist in the repositories.

## 10. Authorization and change control

**Owner-approved decision:** Close **UXD-M0-D1 — RESEARCH COMPLETE** and carry forward its preferred discovery direction without locking production design.

**Not authorized:** production source changes; CSS/design token replacement; new routes/components; backend, database, or API changes; visual effects/3D dependencies; new product capabilities; implementation or merge of unrelated work.

Any D2–D5 design decision requires separate review. Any future implementation requires a scoped, explicit Owner-approved task contract and appropriate validation. Reopen D0/D1 only on a material contradiction, new evidence, or explicit PO direction.
