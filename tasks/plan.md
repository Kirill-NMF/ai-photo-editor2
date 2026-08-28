# Implementation Plan: Shadcn Landing visual redesign

## Overview

Adapt PhotoAI to the visual language of the MIT-licensed Shadcn Landing Page reference while preserving authentication, uploads, image editing, gallery, account data, API contracts, test IDs, and routing. The redesign will be delivered in small verified slices: shared tokens first, then public pages, then the authenticated shell and individual product screens.

## Visual source of truth

- Live reference: https://shadcn-landing-page-livid.vercel.app/
- Source repository: https://github.com/nobruf/shadcn-landing-page
- Research: `docs/research/codex-ui-redesign-best-practices.md`
- Reference characteristics: orange primary, white/near-black neutral surfaces, compact pill-like floating navigation, restrained 8px radii, fine borders, soft orange glow, large centered hero typography, roomy sections, flat feature grids, dark-mode parity, and responsive mobile navigation.

## Architecture decisions

- Preserve all server code, schemas, API calls, authentication handlers, editing state, and route behavior.
- Change shared CSS variables and reusable layout primitives before editing page-specific markup.
- Reuse the existing shadcn primitives and Lucide icons; do not introduce a second component library.
- Recreate the reference composition with PhotoAI content and product imagery instead of copying irrelevant demo text, people, pricing, or stock branding.
- Keep existing `data-testid` attributes and interactive handlers intact.
- Retain the reference repository's MIT notice when adapting substantial component patterns.
- Verify every slice in a real browser at desktop and mobile widths, including dark mode where the route supports it.

## Task list

### Phase 1: Documentation and design foundation

#### Task 1: Preserve research and reference provenance

**Description:** Store the supplied research and record the reference URL, license, and design decisions inside the repository.

**Acceptance criteria:**
- [x] Supplied research is stored under `docs/research/`.
- [x] Reference source and MIT attribution are recorded.
- [x] No application behavior changes.

**Verification:**
- [x] Markdown files and links were reviewed.
- [x] Git diff contains documentation and project-agent rules only.

**Dependencies:** None

**Files likely touched:**
- `docs/research/codex-ui-redesign-best-practices.md`
- `docs/design/shadcn-landing-reference.md`
- `THIRD_PARTY_NOTICES.md`

**Estimated scope:** Small

#### Task 2: Install the shared visual language

**Description:** Replace the blue PhotoAI theme with the reference's orange semantic tokens, neutral surfaces, border/radius/shadow rules, typography scale, container widths, and reusable section utilities.

**Acceptance criteria:**
- [x] Light and dark themes use the reference-aligned orange/neutral palette.
- [x] Existing shadcn primitives inherit the new tokens without API changes.
- [x] Focus states remain visible and primary text contrast exceeds WCAG AA.

**Verification:**
- [x] `npm test`
- [x] `npm run check`
- [x] `npm run build`
- [x] Browser check of responsive light and dark theme surfaces.

**Dependencies:** Task 1

**Files likely touched:**
- `client/src/index.css`
- `tailwind.config.ts`
- `client/src/components/ui/button.tsx`
- `client/src/components/ui/card.tsx`

**Estimated scope:** Medium

### Checkpoint: Foundation

- [x] Tests and production build pass.
- [ ] Token comparison is documented with desktop/mobile screenshots.

### Phase 2: Public experience

#### Task 3: Rebuild the public header and navigation

**Description:** Adapt the floating compact navbar, brand mark, navigation links, theme switcher, authentication state, and mobile sheet from the reference.

**Acceptance criteria:**
- [ ] Header matches the reference composition on desktop.
- [ ] Mobile navigation is keyboard-accessible and does not overflow.
- [ ] Login/logout and authenticated navigation retain existing behavior.

**Verification:**
- [ ] Browser check at 320px, 768px, 1024px, and 1440px.
- [ ] Keyboard focus order and accessible names verified.
- [ ] Console contains no errors or warnings.

**Dependencies:** Task 2

**Files likely touched:**
- `client/src/components/Header.tsx`
- `client/src/App.tsx`
- `client/src/components/ui/sheet.tsx`

**Estimated scope:** Medium

#### Task 4: Recompose the PhotoAI landing page

**Description:** Translate the reference hero, product-preview, benefits, features, and CTA sections into PhotoAI-specific content and product visuals.

**Acceptance criteria:**
- [x] Hero hierarchy, spacing, orange glow, CTA pairing, and product preview closely follow the reference.
- [x] Existing `/onboarding` and `/editor` CTA destinations remain unchanged.
- [x] Sections use real PhotoAI features and avoid irrelevant template content.

**Verification:**
- [x] Visual comparison against the reference at desktop and mobile widths.
- [x] CTA destinations were verified as `/onboarding` and `/editor`.
- [x] No horizontal overflow at 320px, 390px, 768px, 1024px, or 1440px.

**Dependencies:** Task 3

**Files likely touched:**
- `client/src/pages/HomePage.tsx`
- `client/src/components/LandingEditorPreview.tsx`
- `client/src/components/LandingFooter.tsx`
- `client/src/index.css`

**Estimated scope:** Medium

#### Task 5: Align login and onboarding

**Description:** Apply the same brand surface, spacing, typography, orange accents, and responsive framing to authentication and onboarding without changing provider scripts or redirects.

**Acceptance criteria:**
- [x] Google and Telegram authentication behavior is untouched.
- [x] Error, loading, and provider-unavailable states remain visible.
- [x] Login and onboarding visually belong to the new system.

**Verification:**
- [x] Anonymous browser smoke test.
- [x] Provider URLs and Telegram widget callback attributes remain unchanged in source; live provider smoke is deferred to Phase 4.
- [x] Mobile and desktop screenshots reviewed.

**Dependencies:** Task 3

**Files likely touched:**
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/OnboardingPage.tsx`
- `client/src/components/InterviewFlow.tsx`

**Estimated scope:** Medium

### Checkpoint: Public experience

- [ ] Public routes render with a clean console.
- [ ] Authentication entry points still work.
- [ ] Visual comparison is approved before dashboard changes.

### Phase 3: Authenticated product shell

#### Task 6: Redesign the dashboard shell and sidebar

**Description:** Translate the reference's compact floating navigation, neutral cards, and orange active states into a product-oriented sidebar/topbar shell.

**Acceptance criteria:**
- [ ] Editor, Gallery, and Account navigation remains unchanged.
- [ ] User identity, logout, collapse, and mobile drawer continue working.
- [ ] Shell matches the new token system without reducing editor workspace.

**Verification:**
- [ ] Browser check at 320px, 768px, 1024px, and 1440px.
- [ ] Sidebar controls work by keyboard and pointer.
- [ ] No authenticated route gains a second scrollbar unexpectedly.

**Dependencies:** Task 2

**Files likely touched:**
- `client/src/App.tsx`
- `client/src/components/AppSidebar.tsx`
- `client/src/components/ui/sidebar.tsx`
- `client/src/components/MobileSideDrawer.tsx`

**Estimated scope:** Medium

#### Task 7: Redesign the editor empty and active states

**Description:** Restyle the upload zone, image canvas, prompt panel, suggestions, processing state, and history to match the reference's orange/neutral cards and restrained density.

**Acceptance criteria:**
- [ ] Upload, drag-and-drop, prompt submission, generation, comparison, save, reset, and history handlers are unchanged.
- [ ] Empty and active editor states follow one consistent hierarchy.
- [ ] Mobile controls remain reachable and do not cover the image.

**Verification:**
- [ ] Existing automated tests pass.
- [ ] Authenticated upload/edit smoke test with one image.
- [ ] Desktop/mobile screenshots and console/network inspection.

**Dependencies:** Task 6

**Files likely touched:**
- `client/src/pages/EditorPage.tsx`
- `client/src/components/EditHistory.tsx`
- `client/src/components/ImageCanvas.tsx`
- `client/src/components/ProcessingIndicator.tsx`
- `client/src/components/PromptSuggestions.tsx`

**Estimated scope:** Medium

#### Task 8: Redesign gallery and project surfaces

**Description:** Adapt the reference's flat grid cards and section typography to gallery empty/loading/populated states and project details.

**Acceptance criteria:**
- [ ] Project fetching, pagination, open, and editor navigation remain unchanged.
- [ ] Thumbnails keep their correct aspect ratio and orientation.
- [ ] Empty and loading states match the new system.

**Verification:**
- [ ] Gallery checked with empty and populated data.
- [ ] Pagination and project modal interactions tested.
- [ ] Responsive grid verified at target breakpoints.

**Dependencies:** Task 6

**Files likely touched:**
- `client/src/pages/GalleryPage.tsx`
- `client/src/components/ProjectCard.tsx`
- `client/src/components/ProjectModal.tsx`

**Estimated scope:** Medium

#### Task 9: Redesign account settings

**Description:** Apply the reference form, card, badge, progress, and section treatments while preserving current data bindings and controls.

**Acceptance criteria:**
- [ ] Profile, usage, preference, password, and danger-zone content remains intact.
- [ ] Forms use clear grouping and accessible labels.
- [ ] Destructive actions remain visually distinct from the orange primary action.

**Verification:**
- [ ] Form focus and disabled states checked.
- [ ] Usage/admin variants render correctly.
- [ ] Mobile and desktop layouts reviewed.

**Dependencies:** Task 6

**Files likely touched:**
- `client/src/pages/AccountPage.tsx`
- `client/src/components/ui/progress.tsx`
- `client/src/components/ui/badge.tsx`

**Estimated scope:** Medium

### Checkpoint: Product experience

- [ ] Core authenticated flows still work end to end.
- [ ] All major routes match the shared visual language.
- [ ] No server, schema, or API-contract changes were introduced.

### Phase 4: Cross-route QA and launch

#### Task 10: Responsive, dark-mode, accessibility, and regression pass

**Description:** Run the complete product through browser QA, correct visual drift, and prepare a rollback-safe release.

**Acceptance criteria:**
- [ ] Target routes pass desktop/mobile visual inspection and clean-console checks.
- [ ] Keyboard navigation, focus visibility, heading hierarchy, contrast, loading, empty, and error states are verified.
- [ ] Full test suite, typecheck, production build, deployment smoke test, and rollback reference pass.

**Verification:**
- [ ] `npm test`
- [ ] `npm run check`
- [ ] `npm run build`
- [ ] Production `/healthz` and `/readyz` return 200.

**Dependencies:** Tasks 7, 8, and 9

**Files likely touched:**
- Page/component files from earlier tasks only when QA finds a specific defect.
- `tasks/todo.md`

**Estimated scope:** Medium

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Global token changes make dense editor controls unreadable | High | Verify primitives and editor states immediately after the token slice; keep semantic contrast tokens separate. |
| Large one-pass rewrite breaks upload/auth/edit flows | High | Preserve handlers and data flow; change one route at a time and commit each verified slice. |
| Reference landing patterns do not map directly to a photo editor | Medium | Copy visual grammar, not irrelevant content; use a product-specific editor preview and dashboard shell. |
| Mobile editor loses usable workspace | High | Treat editor mobile layout as a separate acceptance state at 320px and 390px. |
| Dark mode drifts from the reference | Medium | Maintain paired tokens and run visual QA after every shared-token change. |
| Substantial reference code is adapted without attribution | Medium | Include the MIT notice in `THIRD_PARTY_NOTICES.md`. |

## Open questions

- None blocking. Default assumption: redesign all existing user-facing routes, preserve current English/Russian copy as-is unless a phrase must be shortened to fit the reference composition, and do not add pricing/testimonials/team sections that are irrelevant to PhotoAI.
