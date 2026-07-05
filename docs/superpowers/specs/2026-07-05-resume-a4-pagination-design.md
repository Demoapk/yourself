# Resume A4 Pagination Preview Design

## Goal

Make the web preview behave like a PDF preview: the resume should render as a list of A4-like pages instead of one long paper. When content exceeds one page, the preview should show page 2, page 3, and so on, with clear spacing and page labels.

## Current State

The project is a single static `index.html` app. It stores resume data in `localStorage`, renders editor fields on the left, and renders one `.paper#resumePreview` on the right. PDF export currently opens a print window using the same rendered resume HTML.

## Chosen Approach

Use automatic multi-page preview.

The preview area will become a page list. Each page will be a fixed A4-sized `.paper` container with the selected template applied. The app will render resume sections into an offscreen measuring area, then distribute those sections across visible pages according to the available page height.

## Pagination Behavior

- The right preview shows multiple A4 pages stacked vertically.
- Each page has a small page label such as `第 1 页`.
- Pagination recalculates whenever resume content or template changes.
- The algorithm prefers breaking between resume sections and resume items.
- Header content stays on page 1.
- If a single item is taller than the available space on an empty page, it is allowed to remain on that page rather than being split into unreadable fragments.
- The five templates continue to work with the paginated preview.

## Data Flow

1. User edits resume fields.
2. Existing data model updates and saves to `localStorage`.
3. Resume HTML is generated as reusable blocks.
4. Blocks are measured in a hidden preview container using the selected template.
5. Blocks are assigned to page containers.
6. Visible preview updates with page labels.

## Export Behavior

PDF export should use the paginated preview structure where possible so the printed result matches the on-screen preview. Word export can continue exporting the resume HTML with the current styles, adjusted only as needed to avoid breaking existing export behavior.

## Constraints

- Keep the project as a static front-end app.
- Do not introduce a backend or build step.
- Keep changes scoped to the current single-file architecture unless extraction becomes necessary for clarity.
- Preserve existing editor fields, templates, local saving, Word export, and PDF export actions.

## Acceptance Criteria

- Long resume content visibly flows into page 2 and beyond in the web preview.
- Page labels are visible in the preview but do not appear as resume content inside exported documents.
- Editing any field updates pagination automatically.
- Switching templates recalculates pagination.
- PDF print preview is visually aligned with the web preview's page boundaries.
- Short resumes still show a single page.
