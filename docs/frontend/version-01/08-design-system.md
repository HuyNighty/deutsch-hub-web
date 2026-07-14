# Design System

The first design system is a small, documented set of reusable decisions—not a large component catalogue. Its purpose is visual consistency, accessibility, and safe change as V2/V3 grow.

## Token-first rules

Use semantic CSS variables or an equivalent token system. Components consume semantic tokens, not raw colors or arbitrary spacing values.

| Token group | Examples | Rule |
| --- | --- | --- |
| Color | `--color-surface`, `--color-text`, `--color-action`, `--color-danger` | Meaning is stable even if the palette changes. |
| Typography | `--font-body`, `--font-heading`, `--text-sm`…`--text-2xl` | Use a short, named scale. |
| Spacing | `--space-1`…`--space-8` | No one-off page padding without a documented reason. |
| Radius/shadow | `--radius-sm`, `--radius-md`, `--shadow-card` | Use sparingly; hierarchy comes from layout first. |
| Motion | `--duration-fast`, `--ease-standard` | Respect `prefers-reduced-motion`. |

Choose palette values only after contrast validation. The product should feel calm, clear, and instructional rather than decorative or stereotypically “German”.

## Component inventory

| Component | Responsibility | Must support |
| --- | --- | --- |
| Button | Trigger one clear action | primary/secondary/danger, pending, disabled, icon label |
| Text input | Collect short-form data | label, help text, error, disabled, password reveal |
| Field wrapper | Form semantics | matching label/error IDs and required indicator |
| Alert | Inform without blocking | info, success, warning, error; screen-reader announcement where needed |
| Dialog | Confirm a focused decision | focus trap, Escape behavior, restore focus, destructive copy |
| Course card | Present a course consistently | title, level, duration, price, action; no business fetching inside |
| Progress indicator | Display server-provided progress | text alternative and non-color signal |
| Curriculum row | Represent section/lesson state | keyboard selection, completion indicator, current item |
| Empty/error panel | Recover from missing data | concise explanation and safe retry/navigation action |
| Pagination | Navigate catalog results | accessible current page and disabled boundaries |

Build components only after a second real use confirms reuse. Do not create a generic component merely because a design system might need it later.

## Accessibility baseline

- Target WCAG 2.2 AA contrast, keyboard navigation, semantic headings, visible focus, and form labels.
- Do not use color as the only completion, error, or status signal.
- Use native HTML controls before custom controls.
- Announce asynchronous form and mutation outcomes using an appropriate live region.
- Write Vietnamese UI copy in plain, action-oriented language; support content language independently later.

## Responsive baseline

- Use mobile-first layout rules and a small number of content-driven breakpoints.
- The course player becomes a single column with a dialog/drawer curriculum navigator on small screens.
- Avoid hover-only actions; touch and keyboard users receive the same controls.
- Test 200% browser zoom and long Vietnamese text before accepting a screen.

## Styling boundary

Use Tailwind CSS and shadcn/ui if they reduce delivery time, but keep tokens and domain components inside the repository. shadcn/ui components are source code owned by the project, not a product-specific abstraction layer. No feature imports another feature's private styles.
