# PhotoAI visual reference: Shadcn Landing Page

## Source

- Live reference: https://shadcn-landing-page-livid.vercel.app/
- Source repository: https://github.com/nobruf/shadcn-landing-page
- License: MIT; attribution is recorded in `THIRD_PARTY_NOTICES.md`.
- Supporting workflow research: `docs/research/codex-ui-redesign-best-practices.md`.

## Visual language to preserve

- Orange primary actions and highlights on restrained neutral surfaces.
- White light-mode background and near-black dark-mode background.
- Compact floating navigation with a thin border, subtle inner shadow, and an orange brand tile.
- Large, centered landing-page headline with one warm highlighted phrase.
- Muted supporting copy, paired primary/secondary calls to action, and generous section spacing.
- Fine borders, mostly flat surfaces, restrained shadows, and an 8px base radius.
- Soft orange glow behind the product preview rather than decorative gradients throughout the UI.
- Small orange labels, icons, and numbered markers for hierarchy.

## Reference-aligned semantic tokens

The reference uses HSL tokens. PhotoAI should map these through existing semantic CSS variables instead of scattering raw colors through components.

| Token | Light | Dark |
|---|---|---|
| Background | `0 0% 100%` | `20 14.3% 4.1%` |
| Foreground | `20 14.3% 4.1%` | `60 9.1% 97.8%` |
| Primary | `24.6 95% 53.1%` | `20.5 90.2% 48.2%` |
| Muted | `60 4.8% 95.9%` | `12 6.5% 15.1%` |
| Muted foreground | `25 5.3% 44.7%` | `24 5.4% 63.9%` |
| Border | `20 5.9% 90%` | `12 6.5% 15.1%` |
| Radius | `0.5rem` | `0.5rem` |

## Mapping to PhotoAI

- Reference hero → PhotoAI value proposition and direct link to the editor.
- Reference dashboard preview → product-specific editor preview with upload, prompt, and before/after context.
- Reference benefits and feature grids → image editing, prompt control, gallery, privacy, and account features.
- Reference navigation → Home, Features, How it works, and authenticated entry points.
- Reference flat cards → editor panels, gallery projects, account sections, and empty states.

## Explicit exclusions

- Do not reproduce the reference's music-dashboard product content.
- Do not add pricing, team, sponsor, testimonial, or contact sections without a product requirement.
- Do not change authentication providers, editor behavior, storage, API calls, or database schemas as part of the visual redesign.
- Do not introduce a second UI component library.

## Acceptance viewports and states

- Viewports: 320px, 390px, 768px, 1024px, and 1440px.
- Public: anonymous home, navigation open/closed, login normal/error/provider-unavailable, onboarding.
- Product: editor empty/uploading/active/processing/error, gallery loading/empty/populated, account normal/disabled/destructive.
- Cross-cutting: keyboard focus, dark mode, reduced motion, clean console, no unexpected network failures, and no horizontal overflow.

## Rollback checkpoints

The redesign was deliberately split into reversible commits. The production baseline remains tagged as
`checkpoint/pre-shadcn-redesign-20260828` (`64725f3`).

| Commit | Surface |
|---|---|
| `29a09f1` | Orange and neutral semantic tokens |
| `9f53fbc` | Shared UI primitives |
| `e9351bf` | Public navigation shell |
| `c8413e7` | Landing page composition |
| `b792802` | Login and onboarding |
| `ac2afd4` | Authenticated workspace shell |
| `5405db2` | Gallery and project cards |
| `ccc65dd` | Account settings |
| `d075b3b` | Editor workspace |
| `8427b09` | Project and image modals |
| `22d09d7` | Mobile editor overlays and upload-limit alignment |

Use `git revert <commit>` to remove one redesign slice while retaining later history. Use the baseline tag only
for a complete rollback or comparison; do not reset a shared production branch destructively.

## Verification record

- Automated tests: 33 passing.
- TypeScript: passing with `tsc`.
- Frontend production build: passing with Vite.
- Public pages were visually checked at the acceptance viewports, including dark mode and mobile navigation.
- Authenticated product surfaces still require a final live-session smoke test before production deployment because the local frontend-only environment has no production authentication or database configuration.
- The existing PostCSS `from` warning and bundle-size warning remain non-blocking follow-up items; neither was introduced by the redesign.
