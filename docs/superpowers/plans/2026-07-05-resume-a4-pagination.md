# Resume A4 Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the resume preview as automatically paginated A4 pages in the web UI, with PDF export matching the preview boundaries.

**Architecture:** Keep the app as a static single-page `index.html`. Refactor resume rendering into reusable block-building functions, measure blocks in a hidden A4 page, then distribute them across visible `.paper` pages. PDF export reuses the paginated preview markup and hides visual page labels during print.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, browser DOM measurement, browser print API.

---

## File Structure

- Modify: `index.html`
  - Add paginated preview containers.
  - Add hidden measuring area.
  - Add page-label and print CSS.
  - Replace single-paper rendering with block-based rendering and pagination.
  - Update Word/PDF export to use paginated markup.
- Create: `tests/pagination-structure.test.mjs`
  - Lightweight Node test that checks the static page contains the required pagination hooks and no longer relies on a single visible `#resumePreview` paper.

## Task 1: Add Static Pagination Structure Test

**Files:**
- Create: `tests/pagination-structure.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tests/pagination-structure.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /id="resumePreview"/, "preview page list should keep the resumePreview id");
assert.match(html, /id="resumeMeasure"/, "hidden measurement container should exist");
assert.match(html, /function buildResumeBlocks\(/, "resume blocks should be built before pagination");
assert.match(html, /function paginateResume\(/, "pagination function should exist");
assert.match(html, /function createPreviewPage\(/, "page factory should exist");
assert.match(html, /class="page-label"/, "visible preview pages should include page labels");
assert.doesNotMatch(
  html,
  /<article class="paper" id="resumePreview"><\/article>/,
  "the visible preview should no longer be a single paper article"
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/pagination-structure.test.mjs`

Expected: FAIL with a message such as `hidden measurement container should exist`.

- [ ] **Step 3: Commit the failing test only if the team wants test commits separated**

Skip this commit in this small repo unless requested; keep the test staged with the implementation commit.

## Task 2: Add Page List, Measurement Container, And A4 CSS

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the visible preview markup**

Change:

```html
<div class="resume-wrap">
  <article class="paper" id="resumePreview"></article>
</div>
```

To:

```html
<div class="resume-wrap" id="resumePreview" aria-live="polite"></div>
<div class="resume-measure" id="resumeMeasure" aria-hidden="true"></div>
```

- [ ] **Step 2: Add page-list CSS near the existing `.resume-wrap` and `.paper` rules**

Add:

```css
.resume-wrap {
  max-width: 940px;
  margin: 0 auto;
  display: grid;
  gap: 26px;
}

.resume-page {
  display: grid;
  gap: 8px;
}

.page-label {
  justify-self: end;
  color: var(--muted);
  font-size: 12px;
}

.paper {
  width: 794px;
  min-height: 1123px;
  padding: 58px 66px;
  background: white;
  box-shadow: var(--shadow);
}

.resume-measure {
  position: absolute;
  left: -99999px;
  top: 0;
  width: 794px;
  visibility: hidden;
  pointer-events: none;
}
```

Update the existing `.paper` rule instead of duplicating it.

- [ ] **Step 3: Add mobile and print adjustments**

Inside the existing mobile media query, keep `.resume-wrap` full-width and let `.paper` scale:

```css
.resume-wrap {
  max-width: 100%;
}

.paper {
  width: 100%;
}
```

Inside `@media print`, hide labels and remove preview spacing:

```css
.resume-wrap {
  display: block;
  max-width: none;
  margin: 0;
}

.resume-page {
  display: block;
  page-break-after: always;
}

.resume-page:last-child {
  page-break-after: auto;
}

.page-label,
.resume-measure {
  display: none;
}
```

## Task 3: Refactor Resume Rendering Into Blocks

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add a reusable block builder**

Replace the body of `renderResume()` with calls to new helper functions. Add this function before `renderResume()`:

```javascript
function buildResumeBlocks() {
  const contact = [data.phone, data.email, data.city, data.website]
    .filter(Boolean)
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("");

  const skills = String(data.skills || "")
    .split(/[,，、]/)
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((skill) => `<span class="skill-pill">${escapeHtml(skill)}</span>`)
    .join("");

  const education = data.education.map((item) => `
    <div class="resume-item">
      <div class="row"><strong>${escapeHtml(item.school || "学校名称")}</strong><span class="meta">${escapeHtml(item.time)}</span></div>
      <p class="subline">${escapeHtml(item.major)}</p>
      ${linesToList(item.detail)}
    </div>
  `).join("");

  const work = data.work.map((item) => `
    <div class="resume-item">
      <div class="row"><strong>${escapeHtml(item.company || "公司名称")}</strong><span class="meta">${escapeHtml(item.time)}</span></div>
      <p class="subline">${escapeHtml(item.role)}</p>
      ${linesToList(item.detail)}
    </div>
  `).join("");

  const project = data.project.map((item) => `
    <div class="resume-item">
      <div class="row"><strong>${escapeHtml(item.name || "项目名称")}</strong><span class="meta">${escapeHtml(item.time)}</span></div>
      <p class="subline">${escapeHtml(item.role)}</p>
      ${linesToList(item.detail)}
    </div>
  `).join("");

  const achievement = data.achievement.map((item) => `
    <div class="resume-item">
      <div class="row"><strong>${escapeHtml(item.name || "成果名称")}</strong><span class="meta">${escapeHtml(item.time)}</span></div>
      ${linesToList(item.detail)}
    </div>
  `).join("");

  return {
    header: `
      <header class="resume-header">
        <div>
          <h2>${escapeHtml(data.name || "你的姓名")}</h2>
          <p class="target-role">${escapeHtml(data.title || "目标职位")}</p>
        </div>
        <div class="contact">${contact || "<span>填写联系方式后会显示在这里</span>"}</div>
      </header>
    `,
    sections: [
      sectionHtml("个人优势", data.summary ? `<p class="summary">${escapeHtml(data.summary)}</p>` : `<p class="empty-hint">填写个人优势后会显示在这里。</p>`),
      sectionHtml("技能关键词", skills ? `<div class="skills-line">${skills}</div>` : ""),
      sectionHtml("教育经历", education),
      sectionHtml("工作经历", work),
      sectionHtml("项目经历", project),
      sectionHtml("取得成果", achievement)
    ].filter(Boolean)
  };
}
```

- [ ] **Step 2: Add a page factory**

Add:

```javascript
function createPreviewPage(pageNumber, blocks) {
  return `
    <div class="resume-page">
      <div class="page-label">第 ${pageNumber} 页</div>
      <article class="paper" data-template="${data.template}">
        ${blocks.join("")}
      </article>
    </div>
  `;
}
```

## Task 4: Implement Browser Pagination

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add measurement helpers before `renderResume()`**

Add:

```javascript
function createMeasurePaper() {
  const measure = document.getElementById("resumeMeasure");
  measure.innerHTML = `<article class="paper" data-template="${data.template}"></article>`;
  return measure.querySelector(".paper");
}

function canFitBlock(paper, block, maxHeight) {
  const marker = document.createElement("div");
  marker.innerHTML = block;
  const element = marker.firstElementChild;
  paper.appendChild(element);
  const fits = paper.scrollHeight <= maxHeight;
  element.remove();
  return fits;
}

function getPageContentHeight(paper) {
  const styles = window.getComputedStyle(paper);
  const paddingTop = Number.parseFloat(styles.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(styles.paddingBottom) || 0;
  return paper.clientHeight - paddingTop - paddingBottom;
}
```

- [ ] **Step 2: Add `paginateResume()`**

Add:

```javascript
function paginateResume(blocks) {
  const measurePaper = createMeasurePaper();
  const pageHeight = getPageContentHeight(measurePaper);
  const pages = [];
  let currentBlocks = [blocks.header];

  measurePaper.innerHTML = currentBlocks.join("");

  blocks.sections.forEach((section) => {
    if (canFitBlock(measurePaper, section, pageHeight) || currentBlocks.length === 0) {
      currentBlocks.push(section);
      measurePaper.innerHTML = currentBlocks.join("");
      return;
    }

    pages.push(currentBlocks);
    currentBlocks = [section];
    measurePaper.innerHTML = currentBlocks.join("");
  });

  if (currentBlocks.length) {
    pages.push(currentBlocks);
  }

  return pages.length ? pages : [[blocks.header]];
}
```

- [ ] **Step 3: Replace `renderResume()`**

Use:

```javascript
function renderResume() {
  const preview = document.getElementById("resumePreview");
  const blocks = buildResumeBlocks();
  const pages = paginateResume(blocks);

  preview.innerHTML = pages
    .map((pageBlocks, index) => createPreviewPage(index + 1, pageBlocks))
    .join("");
}
```

- [ ] **Step 4: Run the structure test**

Run: `node tests/pagination-structure.test.mjs`

Expected: PASS.

## Task 5: Update Export To Use Paginated Preview

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add a preview export helper**

Add before `downloadWord()`:

```javascript
function getResumeExportHtml() {
  return document.getElementById("resumePreview").innerHTML;
}
```

- [ ] **Step 2: Update Word export content**

Change:

```javascript
const content = document.getElementById("resumePreview").outerHTML;
```

To:

```javascript
const content = getResumeExportHtml();
```

And keep:

```html
<div class="resume-wrap">${content}</div>
```

- [ ] **Step 3: Update PDF export content**

Change the same content line in `exportPdf()` to:

```javascript
const content = getResumeExportHtml();
```

Keep the existing `.pdf-export .resume-wrap` wrapper. Add CSS in the print window style so labels do not print:

```css
.pdf-export .page-label {
  display: none;
}

.pdf-export .resume-page {
  page-break-after: always;
}

.pdf-export .resume-page:last-child {
  page-break-after: auto;
}
```

## Task 6: Manual Verification And Commit

**Files:**
- Modify: `index.html`
- Create: `tests/pagination-structure.test.mjs`

- [ ] **Step 1: Run the automated structure test**

Run: `node tests/pagination-structure.test.mjs`

Expected: PASS.

- [ ] **Step 2: Start a static server for browser verification**

Run: `python3 -m http.server 4173`

Open: `http://localhost:4173/index.html`

Expected:
- The right preview shows at least one page with `第 1 页`.
- Adding enough work/project text creates `第 2 页`.
- Switching templates keeps pages visible.
- PDF export opens the print flow using page-sized preview content.

- [ ] **Step 3: Check git diff**

Run: `git diff -- index.html tests/pagination-structure.test.mjs`

Expected:
- Pagination structure and helpers are present.
- Existing editor and template controls remain.
- `.superpowers/` is not staged.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add index.html tests/pagination-structure.test.mjs
git commit -m "实现简历 A4 分页预览"
```
