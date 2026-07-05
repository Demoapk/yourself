import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /id="resumePreview"/, "preview page list should keep the resumePreview id");
assert.match(html, /id="resumeMeasure"/, "hidden measurement container should exist");
assert.match(html, /function buildResumeBlocks\(/, "resume blocks should be built before pagination");
assert.match(html, /function paginateResume\(/, "pagination function should exist");
assert.match(html, /function createPreviewPage\(/, "page factory should exist");
assert.match(html, /function getResumeExportHtml\(/, "export helper should use paginated preview markup");
assert.match(html, /class="page-label"/, "visible preview pages should include page labels");
assert.match(html, /data-page-index="\$\{pageIndex\}"/, "preview pages should expose their page index");
assert.match(html, /data-continuation="\$\{isContinuation\}"/, "preview pages should mark continuation pages");
assert.match(html, /createMeasurePaper\(isContinuation\)/, "measurement should use the same continuation state as rendered pages");
assert.match(html, /\.paper\[data-template="sidebar"\]\[data-continuation="false"\]/, "sidebar template should have first-page-specific rules");
assert.match(html, /\.paper\[data-template="sidebar"\]\[data-continuation="true"\]/, "sidebar template should have continuation-page rules");
assert.match(html, /\.paper\[data-template="portfolio"\]\[data-continuation="true"\]/, "portfolio template should have continuation-page rules");
assert.match(html, /querySelectorAll\("\.page-label"\)[\s\S]*label\.remove\(\)/, "export helper should remove preview-only page labels");
assert.doesNotMatch(
  html,
  /<article class="paper" id="resumePreview"><\/article>/,
  "the visible preview should no longer be a single paper article"
);
