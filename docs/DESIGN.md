# Design System

Design read: consumer trust product for Gen Z fans and organizers in Latin America, with a calm, classy, premium-consumer language, built on Tailwind v4 utilities, CSS variable tokens and Motion. Light theme locked (owner decision, ADR-006).

Dials: DESIGN_VARIANCE 6, MOTION_INTENSITY 4, VISUAL_DENSITY 4.

## Typography

| Role | Font | Notes |
|---|---|---|
| Display and headings | Bricolage Grotesque (variable, opsz and wdth axes) | `font-display` class. Letter spacing -0.02em. |
| Body and UI | Geist | Default `font-sans`. |
| Numbers, addresses | Geist Mono | `font-mono`; `.tnum` for tabular figures on amounts. |

Headline scale: hero `text-4xl sm:text-5xl lg:text-[64px]`, section `text-3xl sm:text-4xl`, card `text-[17px]`.

## Color tokens (`app/src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `--bg` | #f6f7f8 | Page background |
| `--surface` | #ffffff | Cards, inputs |
| `--surface-2` / `--surface-3` | #eff1f3 / #e6e9ec | Tints, skeletons |
| `--ink` / `--ink-2` / `--ink-3` | #15171a / #474d55 / #737a84 | Text hierarchy |
| `--line` / `--line-2` | #e3e6ea / #cfd4da | Borders |
| `--accent` / `--accent-2` | #0e7c72 / #0a6359 | The single accent (deep teal, nods to Pix). Buttons, links, open status |
| `--accent-soft` / `--accent-ink` | #e2f2ef / #0a5a51 | Tinted chips and icon wells |
| `--danger` / `--danger-soft` | #b2362f / #fbebe9 | Destructive actions, failed states |
| `--warn` / `--warn-soft` | #946408 / #faf2dc | Ordering status, dispute notice |

Rules: one accent across the whole product. Status chips are the only place other hues appear, and only because status is real semantic state. No pure black or white text on backgrounds; `--ink` and `--bg` are off values.

## Shape and depth

- Buttons: full pill. Cards: 16px. Inputs: 10px. Documented rule, applied everywhere.
- Shadows are tinted to the ink hue and used only on cards that need lift (`--shadow-sm`, `--shadow-md`, `--shadow-lg`).
- Cards only when elevation communicates grouping; sections otherwise separated by hairlines and space.

## Motion

- Landing: CSS reveal (opacity + 12px translate, 0.6s, ease-out) with three delay steps. Disabled under `prefers-reduced-motion`.
- Product UI: 200 to 300ms transitions on transform, color, shadow only. Buttons press down 1px on `:active`.
- No scroll hijacking, no parallax, no marquee.

## Components

`app/src/components/ui`: Button, ButtonLink, Spinner, Field, Input, Textarea, Select, InputAdornment, Card, Skeleton, EmptyState, Stat, StatusChip.
`app/src/components/go`: GoCard, GoProgress, GoTimeline, GoTerms, OrganizerCard, Participants, ShareRow, ActionPanel, CreateForm.

Icons: Phosphor only (`@phosphor-icons/react`, SSR path for server components). No hand-rolled icons; the only custom SVG is the two-ring logo mark.

## Copy voice

Plain, concrete, no hype verbs. Every money movement is stated in one sentence before the button that triggers it. Errors from the chain are translated in `src/lib/pacto/errors.ts` and never shown raw.

## Pre-flight checks performed

Hero has three text elements (headline, subtext, CTAs) and a real component preview as its visual. Two eyebrow-free section headers per three sections. No three-equal-card rows. No em-dashes anywhere in UI copy. Light theme locked across every page. Mobile collapses every grid to one column.
